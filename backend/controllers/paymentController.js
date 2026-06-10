const db = require('../config/db');
const crypto = require('crypto');

/**
 * @desc    SECURE MPESA OAUTH MIDDLEWARE
 * Fetches short-lived access tokens securely from Daraja Gateway
 */
exports.generateMpesaToken = async (req, res, next) => {
    if (process.env.MPESA_MOCK_MODE === 'true') {
        return next();
    }

    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

    if (!consumerKey || !consumerSecret) {
        return res.status(500).json({
            status: 'Error',
            message: "Safaricom authentication keys are missing from the server configuration."
        });
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    try {
        const response = await fetch(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            {
                method: 'GET',
                headers: { 'Authorization': `Basic ${auth}` }
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Safaricom Token Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        req.mpesaToken = data.access_token;
        next();

    } catch (error) {
        console.error("[SECURITY_ALERT] Failed to generate M-Pesa access token:", error.message);
        return res.status(500).json({
            status: 'Error',
            message: "Payment gateway authentication failed."
        });
    }
};

/**
 * @desc    INITIATE PAYMENT STK PUSH HANDSHAKE
 * Locks rows and initiates tracked transaction records safely
 */
exports.initiatePayment = async (req, res) => {
    const { invoiceId, phoneNumber, amount } = req.body;
    const tenantId = req.user.id;

    if (!invoiceId || !phoneNumber) {
        return res.status(400).json({ status: 'Error', message: 'Missing mandatory tracking parameters.' });
    }

    let formattedPhone = phoneNumber.trim().replace('+', '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // HARDENING: Added explicit row isolation row locking (FOR UPDATE) to block race hazards
        const [invoiceCheck] = await connection.execute(`
            SELECT i.id, i.total_amount, i.status 
            FROM invoices i
            INNER JOIN leases l ON i.lease_id = l.id
            WHERE i.id = ? AND l.tenant_id = ?
            FOR UPDATE
        `, [invoiceId, tenantId]);

        if (invoiceCheck.length === 0) {
            await connection.rollback();
            return res.status(404).json({ status: 'Error', message: 'Target invoice verification mismatch.' });
        }

        if (invoiceCheck[0].status === 'Paid') {
            await connection.rollback();
            return res.status(400).json({ status: 'Error', message: 'Invoice is already fully settled.' });
        }

        const invoiceTotal = parseFloat(invoiceCheck[0].total_amount);

        const [collectedRows] = await connection.execute(
            "SELECT SUM(amount_paid) AS total_collected FROM payments WHERE invoice_id = ? AND status = 'Completed' FOR UPDATE",
            [invoiceId]
        );
        const totalCollectedSoFar = parseFloat(collectedRows[0].total_collected) || 0.00;
        const remainingBalance = invoiceTotal - totalCollectedSoFar;

        let paymentAmount = amount ? parseFloat(amount) : remainingBalance;

        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            await connection.rollback();
            return res.status(400).json({ status: 'Error', message: 'Provide a valid payment metric greater than 0.' });
        }

        if (paymentAmount > remainingBalance) {
            await connection.rollback();
            return res.status(400).json({
                status: 'Error',
                message: `Payment exceeds total outstanding liability. Remaining balance: KES ${remainingBalance.toFixed(2)}.`
            });
        }

        let checkoutId;
        const trackingPaymentId = crypto.randomUUID(); // HARDENING: Uniform application identity allocation

        if (process.env.MPESA_MOCK_MODE === 'true') {
            // HARDENING: Cleaned sandbox token creation structure
            checkoutId = `ws_CO_SIM_${crypto.randomBytes(8).toString('hex')}`;

            await connection.execute(`
                INSERT INTO payments (id, invoice_id, tenant_id, amount_paid, payment_method, mpesa_checkout_id, status)
                VALUES (?, ?, ?, ?, 'M-Pesa', ?, 'Pending')
            `, [trackingPaymentId, invoiceId, tenantId, paymentAmount, checkoutId]);

            await connection.execute(`UPDATE invoices SET status = 'Pending' WHERE id = ?`, [invoiceId]);
            await connection.commit();

            // HARDENING: Removed the hazardous automated timeout loop. The system will now stay strictly
            // 'Pending' until a simulated confirmation PIN action hits your development webhook routing.
            return res.status(200).json({
                status: 'Success',
                message: 'Simulation initialization processed cleanly. Awaiting interactive testing webhook confirmation.',
                checkoutRequestID: checkoutId
            });

        } else {
            const shortcode = process.env.MPESA_BUSINESS_SHORTCODE || '174379';
            const passkey = process.env.MPESA_PASSKEY;
            const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
            const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

            const mpesaResponse = await fetch(
                'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${req.mpesaToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        BusinessShortCode: shortcode,
                        Password: password,
                        Timestamp: timestamp,
                        TransactionType: 'CustomerPayBillOnline',
                        Amount: Math.round(paymentAmount),
                        PartyA: formattedPhone,
                        PartyB: shortcode,
                        PhoneNumber: formattedPhone,
                        CallBackURL: process.env.MPESA_CALLBACK_URL,
                        AccountReference: `Invoice_${invoiceCheck[0].id.substring(0, 8)}`,
                        TransactionDesc: 'Secure Rent Payment'
                    })
                }
            );

            const mpesaData = await mpesaResponse.json();

            if (mpesaData.ResponseCode === '0') {
                checkoutId = mpesaData.CheckoutRequestID;

                await connection.execute(`
                    INSERT INTO payments (id, invoice_id, tenant_id, amount_paid, payment_method, mpesa_checkout_id, status)
                    VALUES (?, ?, ?, ?, 'M-Pesa', ?, 'Pending')
                `, [trackingPaymentId, invoiceId, tenantId, paymentAmount, checkoutId]);

                await connection.execute(`UPDATE invoices SET status = 'Pending' WHERE id = ?`, [invoiceId]);
                await connection.commit();

                return res.status(200).json({
                    status: 'Success',
                    message: 'STK Push sent successfully. Please complete execution by entering your PIN on your mobile device.'
                });
            } else {
                await connection.rollback();
                console.error("[SAFARICOM_REJECTION]", mpesaData);
                return res.status(400).json({
                    status: 'Error',
                    message: mpesaData.ResponseDescription || 'The gateway authority rejected this connection transaction.'
                });
            }
        }
    } catch (error) {
        await connection.rollback();
        console.error("[SYSTEM_PAYMENT_INIT_ERROR]", error);
        return res.status(500).json({ status: 'Error', message: 'Internal transaction coordination fault.' });
    } finally {
        connection.release();
    }
};

/**
 * @desc    AUTHENTIC SAFARICOM WEBHOOK CALLBACK PIPELINE
 * Calculates and updates status AND remaining balance values transactionally
 */
exports.mpesaCallback = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { Body } = req.body;

        if (!Body || !Body.stkCallback) {
            console.warn("[SECURITY_ALERT] Invalid callback payload structure received.");
            return res.status(400).json({ status: "Rejected", message: "Invalid payload format" });
        }

        const callbackData = Body.stkCallback;
        const checkoutId = callbackData.CheckoutRequestID;
        const resultCode = callbackData.ResultCode;

        await connection.beginTransaction();

        // 1. Fetch record with row-level lock allocation
        const [paymentRecord] = await connection.execute(
            `SELECT id, invoice_id, amount_paid FROM payments WHERE mpesa_checkout_id = ? FOR UPDATE`,
            [checkoutId]
        );

        if (paymentRecord.length === 0) {
            await connection.rollback();
            console.error(`[SYSTEM_FAULT] Unknown checkout ID returned from Safaricom: ${checkoutId}`);
            return res.status(404).json({ status: "Error", message: "Record reference mismatch" });
        }

        const invoiceId = paymentRecord[0].invoice_id;

        // ResultCode 0 confirms the user entered their PIN and authenticated the transmission
        if (resultCode === 0) {
            const metadataItems = callbackData.CallbackMetadata.Item;
            const mpesaReceipt = metadataItems.find(item => item.Name === 'MpesaReceiptNumber')?.Value;

            // Commit step A: Close transaction log row
            await connection.execute(`
                UPDATE payments 
                SET mpesa_receipt_number = ?, status = 'Completed', paid_at = NOW() 
                WHERE mpesa_checkout_id = ?
            `, [mpesaReceipt, checkoutId]);

            // Commit step B: Collect totals with strict isolation parameters
            const [invoiceRows] = await connection.execute(
                "SELECT total_amount FROM invoices WHERE id = ? FOR UPDATE",
                [invoiceId]
            );
            const [collectedRows] = await connection.execute(
                "SELECT SUM(amount_paid) AS total_collected FROM payments WHERE invoice_id = ? AND status = 'Completed'",
                [invoiceId]
            );

            const invoiceTotalAmount = parseFloat(invoiceRows[0].total_amount);
            const totalCollectedSoFar = parseFloat(collectedRows[0].total_collected) || 0.00;

            // HARDENING: Properly compute and adjust remaining balance parameters
            const updatedBalanceDue = Math.max(0, invoiceTotalAmount - totalCollectedSoFar);

            let dynamicInvoiceStatus = 'Partially_Paid';
            if (totalCollectedSoFar >= invoiceTotalAmount) {
                dynamicInvoiceStatus = 'Paid';
            }

            // HARDENING: Synchronized balance_due column adjustments securely
            await connection.execute(
                `UPDATE invoices SET status = ?, balance_due = ? WHERE id = ?`,
                [dynamicInvoiceStatus, updatedBalanceDue, invoiceId]
            );

            await connection.commit();
            console.log(`[PAYMENT_SUCCESS] Processed Invoice ${invoiceId}. Status: ${dynamicInvoiceStatus}, Balance Remaining: KES ${updatedBalanceDue}`);
        } else {
            console.warn(`[PAYMENT_DECLINED] Transaction failed or aborted by client user. Result Code: ${resultCode}`);

            await connection.execute(`UPDATE payments SET status = 'Failed' WHERE mpesa_checkout_id = ?`, [checkoutId]);

            const [collectedRows] = await connection.execute(
                "SELECT SUM(amount_paid) AS total_collected FROM payments WHERE invoice_id = ? AND status = 'Completed'",
                [invoiceId]
            );
            const pastCollections = parseFloat(collectedRows[0].total_collected) || 0.00;
            const rollBackStatus = pastCollections > 0 ? 'Partially_Paid' : 'Unpaid';

            const [invoiceRows] = await connection.execute("SELECT total_amount FROM invoices WHERE id = ?", [invoiceId]);
            const invoiceTotalAmount = parseFloat(invoiceRows[0].total_amount);
            const currentBalanceDue = invoiceTotalAmount - pastCollections;

            await connection.execute(
                `UPDATE invoices SET status = ?, balance_due = ? WHERE id = ?`,
                [rollBackStatus, currentBalanceDue, invoiceId]
            );

            await connection.commit();
        }

        return res.status(200).json({ ResponseCode: "0", ResponseDesc: "Callback processed successfully." });

    } catch (error) {
        await connection.rollback();
        console.error("[CRITICAL_CALLBACK_FAULT]", error);
        return res.status(500).json({ ResponseCode: "1", ResponseDesc: "Internal database orchestration failure." });
    } finally {
        connection.release();
    }
};

/**
 * @desc    INTERACTIVE MANUAL WEBHOOK SIMULATION TRIGGER
 * Used for testing sandbox hooks instead of automated time loops
 */
exports.executeMockCallbackTrigger = async (req, res) => {
    const { checkoutRequestID, simulateSuccess } = req.body;

    if (!checkoutRequestID) {
        return res.status(400).json({ status: 'Fail', message: 'Missing target checkoutRequestID identifier.' });
    }

    try {
        const [payment] = await db.execute(`SELECT id, amount_paid FROM payments WHERE mpesa_checkout_id = ?`, [checkoutRequestID]);
        if (payment.length === 0) {
            return res.status(404).json({ status: 'Fail', message: 'Mock target reference lookup mismatch.' });
        }

        // Construct a realistic Daraja Callback wrapper structure payload
        const mockWebhookPayload = {
            Body: {
                stkCallback: {
                    CheckoutRequestID: checkoutRequestID,
                    ResultCode: simulateSuccess === true ? 0 : 1032, // 1032 maps to a manual user cancel action
                    ResultDesc: simulateSuccess === true ? "The service request processed successfully." : "Request cancelled by user.",
                    CallbackMetadata: simulateSuccess === true ? {
                        Item: [
                            { Name: "Amount", Value: payment[0].amount_paid },
                            { Name: "MpesaReceiptNumber", Value: `MOCK${crypto.randomBytes(4).toString('hex').toUpperCase()}` },
                            { Name: "TransactionDate", Value: Date.now() },
                            { Name: "PhoneNumber", Value: "254700000000" }
                        ]
                    } : null
                }
            }
        };

        // Execute processing pipeline explicitly simulating user manual interaction loop rules
        req.body = mockWebhookPayload;
        return exports.mpesaCallback(req, res);

    } catch (error) {
        console.error("[MOCK_TRIGGER_FAULT]", error);
        return res.status(500).json({ status: 'Error', message: 'Failed to process manual sandbox hook execution.' });
    }
};