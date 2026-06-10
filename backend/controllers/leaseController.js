const db = require('../config/db');
const crypto = require('crypto');

// ====================================================================
// START A NEW LEASE & AUTOMATICALLY TRIGGER INITIAL BILLING
// ====================================================================
exports.startLease = async (req, res) => {
    const { tenant_id, unit_id, start_date, end_date } = req.body;

    if (!tenant_id || !unit_id || !start_date) {
        return res.status(400).json({
            status: 'Fail',
            message: 'Tenant ID, Unit ID, and Start Date are required.'
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Structural Guard: Verify user account role and status requirements safely
        const [userCheck] = await connection.execute(
            'SELECT role, status FROM users WHERE id = ? FOR UPDATE',
            [tenant_id]
        );

        if (userCheck.length === 0) {
            await connection.rollback();
            return res.status(404).json({ status: 'Fail', message: 'The targeted tenant user account does not exist.' });
        }

        if (userCheck[0].role !== 'Tenant' || userCheck[0].status !== 'Active') {
            await connection.rollback();
            return res.status(400).json({
                status: 'Fail',
                message: 'Leases can only be assigned to accounts that are verified and hold an Active Tenant role.'
            });
        }

        // 2. HARDENING: Fixed room schema identifier column name to room_number & added row-level locking
        const [unitCheck] = await connection.execute(
            'SELECT status, base_rent, room_number FROM units WHERE id = ? FOR UPDATE',
            [unit_id]
        );

        if (unitCheck.length === 0) {
            await connection.rollback();
            return res.status(404).json({ status: 'Fail', message: 'The specified rental unit does not exist.' });
        }

        if (unitCheck[0].status !== 'Vacant') {
            await connection.rollback();
            return res.status(400).json({ status: 'Fail', message: 'This unit is already occupied or unavailable.' });
        }

        const baseRent = parseFloat(unitCheck[0].base_rent) || 16000.00;
        const roomNumber = unitCheck[0].room_number;

        // 3. Persist Active Lease Record
        const leaseId = crypto.randomUUID();
        await connection.execute(
            `INSERT INTO leases (id, tenant_id, unit_id, start_date, end_date, rent_amount, status, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, 'Active', TRUE)`,
            [leaseId, tenant_id, unit_id, start_date, end_date || null, baseRent]
        );

        // 4. Update Unit Occupancy State
        await connection.execute(
            'UPDATE units SET status = "Occupied" WHERE id = ?',
            [unit_id]
        );

        // 5. HARDENING: Synchronized the billing_period format to corporate YYYY-MM-01 standard
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        const normalizedBillingPeriod = `${currentYear}-${currentMonth}-01`;

        const invoiceId = crypto.randomUUID();
        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${roomNumber}`;

        await connection.execute(
            `INSERT INTO invoices (id, lease_id, tenant_id, invoice_number, rent_amount, utilities_amount, total_amount, amount_due, balance_due, status, due_date, billing_period, created_at) 
             VALUES (?, ?, ?, ?, ?, 0.00, ?, ?, ?, 'Unpaid', LAST_DAY(CURDATE()), ?, NOW())`,
            [
                invoiceId,
                leaseId,
                tenant_id,
                invoiceNumber,
                baseRent,
                baseRent, // total_amount
                baseRent, // amount_due
                baseRent, // balance_due
                normalizedBillingPeriod
            ]
        );

        await connection.commit();

        return res.status(201).json({
            status: 'Success',
            message: `Lease executed successfully for Unit ${roomNumber}. First invoice ${invoiceNumber} generated for KES ${baseRent}.`
        });

    } catch (error) {
        // Only run rollback if a transaction context is initialized on this active connection channel
        if (connection) await connection.rollback();
        console.error('[LEASE_TRANSACTION_ERROR]:', error);
        return res.status(500).json({ status: 'Error', message: 'Server error during lease onboarding transaction.' });
    } finally {
        if (connection) connection.release();
    }
};

// ====================================================================
// FETCH LOGGED-IN TENANT LEASE & ISOLATED BILLING STATUS
// ====================================================================
exports.getTenantDashboardData = async (req, res) => {
    try {
        const tenantId = req.user.id;

        // 1. HARDENING: Re-aligned u.room_number and p.name schema structural names
        const [leaseDetails] = await db.execute(`
            SELECT 
                l.id AS lease_id, 
                l.start_date, 
                l.end_date, 
                l.rent_amount,
                u.room_number, 
                p.name AS property_name, 
                p.location
            FROM leases l
            INNER JOIN units u ON l.unit_id = u.id
            INNER JOIN properties p ON u.property_id = p.id
            WHERE l.tenant_id = ? AND l.status = 'Active' AND l.is_active = TRUE
            LIMIT 1
        `, [tenantId]);

        if (leaseDetails.length === 0) {
            return res.status(200).json({
                status: 'Success',
                message: 'No active lease profile linked to this account.',
                data: { lease: null, pending_invoices: [], statement_history: [] }
            });
        }

        const activeLeaseId = leaseDetails[0].lease_id;

        // 2. HARDENING: Aligned enum string lookup parameter to 'Partially_Paid'
        const [pendingInvoices] = await db.execute(`
            SELECT id AS invoice_id, invoice_number, total_amount, balance_due, due_date, status, billing_period 
            FROM invoices 
            WHERE lease_id = ? AND tenant_id = ? AND status IN ('Unpaid', 'Partially_Paid')
            ORDER BY due_date ASC
        `, [activeLeaseId, tenantId]);

        // 3. Securely Fetch Complete Invoicing Statement Ledgers
        const [statementHistory] = await db.execute(`
            SELECT id AS invoice_id, billing_period, due_date, total_amount, status 
            FROM invoices 
            WHERE lease_id = ? AND tenant_id = ?
            ORDER BY due_date DESC
        `, [activeLeaseId, tenantId]);

        return res.status(200).json({
            status: 'Success',
            data: {
                lease: leaseDetails[0],
                pending_invoices: pendingInvoices,
                statement_history: statementHistory
            }
        });

    } catch (error) {
        console.error('[TENANT_DASHBOARD_FETCH_ERROR]:', error);
        return res.status(500).json({ status: 'Error', message: 'Failed to extract isolated portal data parameters.' });
    }
};