const db = require('../config/db');

// ====================================================================
// 1. RECORD UTILITY METER READING (Caretaker Action)
// ====================================================================
exports.logUtilityReading = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { lease_id, utility_type, current_reading, reading_date } = req.body;
        const recorded_by = req.user.id;

        // NOTICE: rate_per_unit has been removed from the client request body destructurer.
        if (!lease_id || !utility_type || current_reading === undefined || !reading_date) {
            return res.status(400).json({ status: 'Fail', message: 'All utility tracking fields are required.' });
        }

        await conn.beginTransaction();

        // HARDENING: Fetch the system's authoritative utility tariff rate directly from the database configuration
        const [rateRule] = await conn.execute(
            'SELECT rate_value FROM utility_rates WHERE utility_type = ? LIMIT 1',
            [utility_type]
        );

        if (rateRule.length === 0) {
            await conn.rollback();
            return res.status(400).json({
                status: 'Fail',
                message: `No active system tariff rate is configured for utility type: ${utility_type}.`
            });
        }

        const systemRatePerUnit = parseFloat(rateRule[0].rate_value);

        // Fetch the last confirmed entry to prevent backwards rolling meters (using row locking)
        const [lastReading] = await conn.execute(
            'SELECT current_reading FROM utility_readings WHERE lease_id = ? AND utility_type = ? ORDER BY reading_date DESC LIMIT 1 FOR UPDATE',
            [lease_id, utility_type]
        );

        const previous_reading = lastReading.length > 0 ? parseFloat(lastReading[0].current_reading) : 0.00;

        if (parseFloat(current_reading) < previous_reading) {
            await conn.rollback();
            return res.status(400).json({
                status: 'Fail',
                message: `Invalid reading. Current reading (${current_reading}) cannot be less than previous (${previous_reading}).`
            });
        }

        // Calculate the consumption delta
        const consumption = parseFloat(current_reading) - previous_reading;
        const total_cost = consumption * systemRatePerUnit;

        // Insert the secure, server-calculated data metrics
        await conn.execute(
            `INSERT INTO utility_readings (lease_id, utility_type, previous_reading, current_reading, rate_per_unit, total_cost, reading_date, recorded_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [lease_id, utility_type, previous_reading, current_reading, systemRatePerUnit, total_cost, reading_date, recorded_by]
        );

        await conn.commit();
        return res.status(201).json({
            status: 'Success',
            message: `${utility_type} reading logged accurately. Consumption cost set at KES ${total_cost.toFixed(2)}.`
        });

    } catch (error) {
        await conn.rollback();
        console.error('[UTILITY_LOG_ERROR]:', error);
        return res.status(500).json({ status: 'Error', message: 'Server error while logging utility metrics.' });
    } finally {
        conn.release();
    }
};

// ====================================================================
// 2. GET BILLING PREVIEW FOR CONSOLIDATION (Admin Action)
// ====================================================================
exports.getBillingPreview = async (req, res) => {
    const { month } = req.query; // Expects "YYYY-MM"

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ status: 'Fail', message: 'A valid target month parameter (YYYY-MM) is required.' });
    }

    try {
        // Performance Fix: Replaced performance-killing DATE_FORMAT join with high-efficiency index ranges
        const [rows] = await db.query(`
            SELECT 
                l.id AS lease_id,
                u.room_number,
                u.base_rent,
                usr.full_name AS tenant_name,
                ur.id AS reading_id,
                ur.utility_type,
                ur.previous_reading,
                ur.current_reading,
                ur.total_cost AS utility_cost
            FROM leases l
            JOIN units u ON l.unit_id = u.id
            JOIN users usr ON l.tenant_id = usr.id
            LEFT JOIN utility_readings ur ON l.id = ur.lease_id 
                AND ur.invoice_id IS NULL 
                AND ur.reading_date >= STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d')
                AND ur.reading_date < DATE_ADD(STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d'), INTERVAL 1 MONTH)
        `, [month, month]);

        const invoiceMap = {};

        rows.forEach(row => {
            const { lease_id, room_number, base_rent, tenant_name, reading_id, utility_type, utility_cost } = row;

            if (!invoiceMap[lease_id]) {
                invoiceMap[lease_id] = {
                    lease_id,
                    room_number,
                    tenant_name,
                    rent_amount: parseFloat(base_rent),
                    utilities_amount: 0.00,
                    utilities_list: []
                };
            }

            if (utility_type) {
                const cost = parseFloat(utility_cost) || 0.00;
                invoiceMap[lease_id].utilities_amount += cost;
                invoiceMap[lease_id].utilities_list.push({
                    reading_id,
                    utility_type,
                    cost
                });
            }
        });

        const previewData = Object.values(invoiceMap).map(invoice => ({
            ...invoice,
            total_amount: invoice.rent_amount + invoice.utilities_amount
        }));

        return res.status(200).json({ status: 'Success', data: previewData });
    } catch (error) {
        console.error('[BILLING_PREVIEW_ERROR]:', error);
        return res.status(500).json({ status: 'Fail', message: 'Error compiling invoice previews.' });
    }
};

// ====================================================================
// 3. SECURE INVOICE GENERATION ENGINE (Admin Action)
// ====================================================================
exports.generateInvoice = async (req, res) => {
    const { lease_id, billing_period, due_date, reading_ids } = req.body;

    // Notice we completely removed financial body params to enforce Zero-Trust calculations
    if (!lease_id || !billing_period || !due_date) {
        return res.status(400).json({ status: 'Fail', message: 'Missing structural mapping parameters.' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Double-billing duplication guard
        const [existing] = await conn.execute(
            'SELECT id FROM invoices WHERE lease_id = ? AND billing_period = ? LIMIT 1',
            [lease_id, billing_period]
        );

        if (existing.length > 0) {
            await conn.rollback();
            return res.status(400).json({ status: 'Fail', message: 'An invoice already exists for this cycle.' });
        }

        // 2. Fetch reliable rent values straight from core database tables
        const [leaseProfile] = await conn.execute(`
            SELECT u.base_rent FROM leases l
            JOIN units u ON l.unit_id = u.id
            WHERE l.id = ? LIMIT 1
        `, [lease_id]);

        if (leaseProfile.length === 0) {
            await conn.rollback();
            return res.status(404).json({ status: 'Fail', message: 'Target lease arrangement does not exist.' });
        }

        const systemRentAmount = parseFloat(leaseProfile[0].base_rent);
        let systemUtilitiesAmount = 0.00;

        // 3. Verify and compile outstanding utility logs internally
        if (reading_ids && reading_ids.length > 0) {
            const placeholders = reading_ids.map(() => '?').join(',');

            const [utilitiesQuery] = await conn.execute(`
                SELECT id, total_cost FROM utility_readings 
                WHERE id IN (${placeholders}) AND lease_id = ? AND invoice_id IS NULL FOR UPDATE
            `, [...reading_ids, lease_id]);

            if (utilitiesQuery.length !== reading_ids.length) {
                await conn.rollback();
                return res.status(400).json({
                    status: 'Fail',
                    message: 'One or more utility readings are invalid, already processed, or mismatched.'
                });
            }

            systemUtilitiesAmount = utilitiesQuery.reduce((sum, item) => sum + parseFloat(item.total_cost || 0), 0);
        }

        const systemTotalAmount = systemRentAmount + systemUtilitiesAmount;

        // 4. Generate system native UUID 
        const [uuidRow] = await conn.query('SELECT UUID() AS id');
        const invoiceId = uuidRow[0].id;

        // 5. Save the server-validated statement ledger entry
        await conn.execute(`
            INSERT INTO invoices (id, lease_id, rent_amount, utilities_amount, total_amount, status, due_date, billing_period) 
            VALUES (?, ?, ?, ?, ?, 'Unpaid', ?, ?)
        `, [invoiceId, lease_id, systemRentAmount, systemUtilitiesAmount, systemTotalAmount, due_date, billing_period]);

        // 6. Performance Optimization: Lock readings using a performant batch command rather than an N+1 loop
        if (reading_ids && reading_ids.length > 0) {
            const placeholders = reading_ids.map(() => '?').join(',');
            await conn.execute(`
                UPDATE utility_readings 
                SET invoice_id = ? 
                WHERE id IN (${placeholders}) AND lease_id = ? AND invoice_id IS NULL
            `, [invoiceId, ...reading_ids, lease_id]);
        }

        await conn.commit();
        return res.status(201).json({ status: 'Success', message: 'Invoice generated securely. Financial records locked.' });
    } catch (error) {
        await conn.rollback();
        console.error('[GENERATE_INVOICE_ERROR]:', error);
        return res.status(500).json({ status: 'Fail', message: 'Transaction failed. Invoice aborted safely.' });
    } finally {
        conn.release();
    }
};

// ====================================================================
// 4. FETCH TENANT BILLING LEDGER HISTORY (Tenant Action)
// ====================================================================
exports.getTenantBillingLedger = async (req, res) => {
    try {
        const tenant_id = req.user.id;
        const query = `
            SELECT 
                i.id AS invoice_id,
                i.billing_period,
                i.due_date,
                i.rent_amount,
                i.utilities_amount,
                i.total_amount,
                i.status AS invoice_status,
                u.room_number,
                COALESCE(
                    (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'payment_id', p.id,
                                'amount_paid', CAST(p.amount_paid AS DOUBLE),
                                'method', p.payment_method,
                                'receipt', p.mpesa_receipt_number,
                                'paid_at', p.paid_at
                            )
                        )
                        FROM payments p
                        WHERE p.invoice_id = i.id AND p.status = 'Completed'
                    ), 
                    JSON_ARRAY()
                ) AS payment_history
            FROM invoices i
            JOIN leases l ON i.lease_id = l.id
            JOIN units u ON l.unit_id = u.id
            WHERE l.tenant_id = ?
            ORDER BY i.created_at DESC;
        `;

        const [rows] = await db.execute(query, [tenant_id]);

        const ledger = rows.map(row => ({
            ...row,
            payment_history: typeof row.payment_history === 'string'
                ? JSON.parse(row.payment_history)
                : row.payment_history
        }));

        return res.status(200).json({
            status: 'Success',
            count: ledger.length,
            data: ledger
        });

    } catch (error) {
        console.error('[GET_BILLING_LEDGER_ERROR]:', error);
        return res.status(500).json({ status: 'Error', message: 'Server error while compiling billing history.' });
    }
};

// ====================================================================
// 5. FETCH ALL INVOICES FOR ADMIN MANAGEMENT DIRECTORY (Admin Action)
// ====================================================================
exports.getAdminInvoiceDirectory = async (req, res) => {
    try {
        // Performance Optimization: Replaced repeated correlated subqueries with a single grouped left join
        const query = `
            SELECT 
                i.id AS invoice_id,
                u.full_name AS tenant_name,
                un.room_number,
                i.billing_period,
                i.due_date,
                i.rent_amount,
                i.utilities_amount,
                i.total_amount AS original_bill,
                IFNULL(pm.total_paid, 0.00) AS total_paid_so_far,
                (i.total_amount - IFNULL(pm.total_paid, 0.00)) AS balance_remaining,
                i.status AS invoice_status,
                i.created_at
            FROM invoices i
            INNER JOIN leases l ON i.lease_id = l.id
            INNER JOIN users u ON l.tenant_id = u.id
            LEFT JOIN units un ON l.unit_id = un.id
            LEFT JOIN (
                SELECT invoice_id, SUM(amount_paid) AS total_paid
                FROM payments 
                WHERE status = 'Completed'
                GROUP BY invoice_id
            ) pm ON pm.invoice_id = i.id
            ORDER BY i.created_at DESC;
        `;

        const [rows] = await db.execute(query);

        return res.status(200).json({
            status: 'Success',
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error('[ADMIN_GET_INVOICES_ERROR]:', error);
        return res.status(500).json({ status: 'Error', message: 'Server error compiling admin directory.' });
    }
};