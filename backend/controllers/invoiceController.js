const crypto = require('crypto');
const db = require('../config/db'); // Adjust this path to your pool

const createManualInvoice = async (req, res) => {
    // Expecting billing_period as "YYYY-MM" (e.g., "2026-06")
    const { lease_id, billing_period, due_date } = req.body;

    // 1. Structural Guard Clause
    if (!lease_id || !billing_period || !due_date) {
        return res.status(400).json({
            status: 'Fail',
            message: 'Missing required parameters: lease_id, billing_period, and due_date are mandatory.'
        });
    }

    // Normalize billing period to match table's "YYYY-MM-01" date format standard
    const normalizedBillingPeriod = `${billing_period}-01`;

    // High-performance index-friendly range parameters for utility logging evaluation
    const startRangeDate = `${billing_period}-01`;
    const endRangeDate = new Date(normalizedBillingPeriod);
    endRangeDate.setMonth(endRangeDate.getMonth() + 1);
    const endRangeStr = endRangeDate.toISOString().slice(0, 10); // Outputs exactly "YYYY-MM-01" for next month

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // 2. IDEMPOTENCY GUARD: Block accidental double-billing executions
        const [duplicateCheck] = await conn.execute(`
            SELECT id FROM invoices 
            WHERE lease_id = ? AND billing_period = ? 
            LIMIT 1 FOR UPDATE`,
            [lease_id, normalizedBillingPeriod]
        );

        if (duplicateCheck.length > 0) {
            await conn.rollback();
            return res.status(409).json({
                status: 'Fail',
                message: `An invoice has already been compiled for this lease for the billing period: ${billing_period}.`
            });
        }

        // 3. Fetch Lease and Unit specifications securely via INNER JOIN
        const [leaseData] = await conn.execute(`
            SELECT 
                u.base_rent, 
                u.water_billing_flow, 
                u.electricity_billing_flow, 
                IFNULL(u.garbage_fee, 0.00) AS garbage_fee,
                IFNULL(u.water_flat_rate, 0.00) AS water_flat_rate
            FROM leases l
            INNER JOIN units u ON l.unit_id = u.id
            WHERE l.id = ? AND l.is_active = 1
            LIMIT 1 FOR UPDATE
        `, [lease_id]);

        if (leaseData.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                status: 'Fail',
                message: 'No active lease contract found matching the provided ID.'
            });
        }

        const details = leaseData[0];
        const baseRent = parseFloat(details.base_rent);
        const garbageFee = parseFloat(details.garbage_fee);

        let waterCharge = 0.00;
        let electricityCharge = 0.00;

        // 4. Process Water Charges (Optimized SARGable Range Query)
        if (details.water_billing_flow === 'Metered') {
            const [waterLogs] = await conn.execute(`
                SELECT total_cost 
                FROM utility_readings 
                WHERE lease_id = ? 
                  AND utility_type = 'Water'
                  AND reading_date >= ? 
                  AND reading_date < ?
                LIMIT 1
            `, [lease_id, startRangeDate, endRangeStr]);

            if (waterLogs.length > 0) {
                waterCharge = parseFloat(waterLogs[0].total_cost);
            }
        } else if (details.water_billing_flow === 'Flat') {
            waterCharge = parseFloat(details.water_flat_rate);
        }

        // 5. Process Electricity Charges (Optimized SARGable Range Query)
        if (details.electricity_billing_flow === 'Metered') {
            const [electricityLogs] = await conn.execute(`
                SELECT total_cost 
                FROM utility_readings 
                WHERE lease_id = ? 
                  AND utility_type = 'Electricity'
                  AND reading_date >= ? 
                  AND reading_date < ?
                LIMIT 1
            `, [lease_id, startRangeDate, endRangeStr]);

            if (electricityLogs.length > 0) {
                electricityCharge = parseFloat(electricityLogs[0].total_cost);
            }
        }

        // 6. Aggregate Totals
        const totalUtilities = waterCharge + electricityCharge + garbageFee;
        const totalInvoiceAmount = baseRent + totalUtilities;

        // 7. Architectural Sync: Generate unique primary key in the application runtime layer
        const invoiceId = crypto.randomUUID();

        // 8. Persist Invoice using highly optimized execution structures
        await conn.execute(`
            INSERT INTO invoices 
                (id, lease_id, rent_amount, utilities_amount, total_amount, status, due_date, billing_period, created_at)
            VALUES 
                (?, ?, ?, ?, ?, 'Unpaid', ?, ?, NOW())
        `, [
            invoiceId,
            lease_id,
            baseRent,
            totalUtilities,
            totalInvoiceAmount,
            due_date,
            normalizedBillingPeriod
        ]);

        await conn.commit();

        // 9. Dispatch Comprehensive Success Payload Response
        return res.status(201).json({
            status: 'Success',
            message: 'Manual invoice compiled and generated successfully.',
            data: {
                invoice_id: invoiceId, // Exposed cleanly now
                billing_period: billing_period,
                breakdown: {
                    base_rent: baseRent,
                    water: waterCharge,
                    electricity: electricityCharge,
                    garbage: garbageFee,
                    total_calculated: totalInvoiceAmount
                }
            }
        });

    } catch (error) {
        await conn.rollback();
        console.error('[INVOICE_ENGINE_TRANSACTION_ERROR]:', error);
        return res.status(500).json({
            status: 'Fail',
            message: 'An internal error occurred while calculating or saving the invoice records.'
        });
    } finally {
        conn.release();
    }
};

module.exports = {
    createManualInvoice
};