const db = require('../config/db');

// ====================================================================
// 1. GET BILLING PREVIEW FOR CONSOLIDATION
// ====================================================================
const getBillingPreview = async (req, res) => {
    const { month } = req.query; // Expects a string like "2026-06"

    // Strict input validation using regular expressions to prevent weird parameters
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({
            status: 'Fail',
            message: 'Please provide a valid target month parameter in YYYY-MM format.'
        });
    }

    try {
        // Optimized with a sargable date range query to maintain high index efficiency
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
            const {
                lease_id, room_number, base_rent, tenant_name,
                reading_id, utility_type, previous_reading, current_reading, utility_cost
            } = row;

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
                    previous_reading: parseFloat(previous_reading),
                    current_reading: parseFloat(current_reading),
                    cost
                });
            }
        });

        const previewData = Object.values(invoiceMap).map(invoice => {
            return {
                ...invoice,
                total_amount: invoice.rent_amount + invoice.utilities_amount
            };
        });

        return res.status(200).json({
            status: 'Success',
            data: previewData
        });

    } catch (error) {
        console.error('[BILLING_PREVIEW_ERROR]:', error);
        return res.status(500).json({
            status: 'Fail',
            message: 'Internal server error while compiling invoice previews.'
        });
    }
};

// ====================================================================
// 2. SECURE SINGLE INVOICE GENERATION ENGINE
// ====================================================================
const generateInvoice = async (req, res) => {
    const {
        lease_id,
        billing_period,    // Expecting "YYYY-MM-01"
        due_date,          // Expecting a valid date string
        reading_ids        // Array of reading IDs bundled into this invoice
    } = req.body;

    // Notice we dropped rent_amount, utilities_amount, and total_amount from the request body destructuring.

    if (!lease_id || !billing_period || !due_date) {
        return res.status(400).json({
            status: 'Fail',
            message: 'Missing vital structural mapping parameters.'
        });
    }

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Anti-Double-Billing Check
        const [existing] = await conn.execute(`
            SELECT id FROM invoices 
            WHERE lease_id = ? AND billing_period = ? 
            LIMIT 1
        `, [lease_id, billing_period]);

        if (existing.length > 0) {
            await conn.rollback();
            return res.status(400).json({
                status: 'Fail',
                message: 'An invoice has already been finalized for this unit for this billing cycle.'
            });
        }

        // 2. HARDENING STATE: Pull authoritative rent figure directly from core database map
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

        // 3. HARDENING STATE: Verify and add up utility reading identifiers on the secure side
        if (reading_ids && reading_ids.length > 0) {
            // Generate standard dynamic parameters placeholder array
            const placeholders = reading_ids.map(() => '?').join(',');

            // Query total cost straight from database data records
            const [utilitiesQuery] = await conn.execute(`
                SELECT id, total_cost FROM utility_readings 
                WHERE id IN (${placeholders}) AND lease_id = ? AND invoice_id IS NULL
            `, [...reading_ids, lease_id]);

            // Guard: Make sure all sent reading IDs are valid, unassigned, and belong to this specific tenant
            if (utilitiesQuery.length !== reading_ids.length) {
                await conn.rollback();
                return res.status(400).json({
                    status: 'Fail',
                    message: 'One or more utility readings are invalid, already invoiced, or mismatched.'
                });
            }

            // Sum up the trusted values safely
            systemUtilitiesAmount = utilitiesQuery.reduce((acc, curr) => acc + parseFloat(curr.total_cost || 0), 0);
        }

        // Compute the final total amount strictly using your secure variables
        const systemTotalAmount = systemRentAmount + systemUtilitiesAmount;

        // 4. Fetch native UUID
        const [uuidRow] = await conn.query('SELECT UUID() AS id');
        const invoiceId = uuidRow[0].id;

        // 5. Write the trusted, server-calculated statement ledger entries
        await conn.execute(`
            INSERT INTO invoices (
                id, lease_id, rent_amount, utilities_amount, total_amount, status, due_date, billing_period
            ) VALUES (?, ?, ?, ?, ?, 'Unpaid', ?, ?)
        `, [
            invoiceId,
            lease_id,
            systemRentAmount,
            systemUtilitiesAmount,
            systemTotalAmount,
            due_date,
            billing_period
        ]);

        // 6. Lock utility records to prevent multi-billing processing loops
        if (reading_ids && reading_ids.length > 0) {
            const placeholders = reading_ids.map(() => '?').join(',');
            await conn.execute(`
                UPDATE utility_readings 
                SET invoice_id = ? 
                WHERE id IN (${placeholders}) AND lease_id = ? AND invoice_id IS NULL
            `, [invoiceId, ...reading_ids, lease_id]);
        }

        await conn.commit();

        return res.status(201).json({
            status: 'Success',
            message: 'Invoice generated securely. Financial data locked.'
        });

    } catch (error) {
        await conn.rollback();
        console.error('[SECURE_GENERATE_INVOICE_TRANSACTION_ERROR]:', error);
        return res.status(500).json({
            status: 'Fail',
            message: 'Database ledger processing failed. Execution aborted safely.'
        });
    } finally {
        conn.release();
    }
};

module.exports = {
    getBillingPreview,
    generateInvoice
};