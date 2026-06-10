const db = require('../config/db');

// ====================================================================
// 1. TENANT DASHBOARD METRICS ENGINE
// ====================================================================
const getDashboardData = async (req, res) => {
    try {
        const tenant_id = req.user.id;

        // 1. Fetch Outstanding Dues Balance Safely
        const [balanceRows] = await db.execute(`
            SELECT SUM(i.total_amount - (
                SELECT IFNULL(SUM(p.amount_paid), 0) 
                FROM payments p 
                WHERE p.invoice_id = i.id AND p.status = 'Completed'
            )) as total_due 
            FROM invoices i
            JOIN leases l ON i.lease_id = l.id
            WHERE l.tenant_id = ? AND i.status IN ('Unpaid', 'Partially_Paid')`,
            [tenant_id]
        );
        const outstandingBalance = balanceRows[0]?.total_due || 0;

        // 2. Fetch Recent Invoices (Limit 5)
        const [invoices] = await db.execute(`
            SELECT i.id, i.total_amount, i.status, i.due_date, i.billing_period,
            (i.total_amount - (
                SELECT IFNULL(SUM(p.amount_paid), 0) 
                FROM payments p 
                WHERE p.invoice_id = i.id AND p.status = 'Completed'
            )) as remaining_amount
            FROM invoices i
            JOIN leases l ON i.lease_id = l.id
            WHERE l.tenant_id = ? 
            ORDER BY i.due_date DESC LIMIT 5`,
            [tenant_id]
        );

        // 3. Fetch Active Unresolved Maintenance Ticket Counts
        const [maintenance] = await db.execute(`
            SELECT COUNT(*) as count 
            FROM maintenance_tickets 
            WHERE reported_by = ? AND status != 'Resolved'`,
            [tenant_id]
        );

        return res.status(200).json({
            status: 'Success',
            data: {
                balance: parseFloat(outstandingBalance),
                invoices,
                activeTickets: maintenance[0]?.count || 0
            }
        });
    } catch (err) {
        console.error("[TENANT_DASHBOARD_ERROR]:", err);
        return res.status(500).json({ status: 'Error', message: 'Failed to load tenant dashboard data.' });
    }
};

// ====================================================================
// 2. SYNCHRONIZED TENANT ANNOUNCEMENTS FETCH
// ====================================================================
const getTenantBroadcasts = async (req, res) => {
    try {
        const tenantUserId = req.user.id;

        // HARDENING: Dynamically trace property ID via active lease mappings instead of a ghost 'tenants' table
        const [leaseRows] = await db.execute(`
            SELECT u.property_id 
            FROM leases l
            JOIN units u ON l.unit_id = u.id
            WHERE l.tenant_id = ? AND l.is_active = 1 LIMIT 1`,
            [tenantUserId]
        );

        if (leaseRows.length === 0) {
            return res.status(200).json({ status: 'Success', data: [] });
        }

        const propertyId = leaseRows[0].property_id;

        // HARDENING: Point query to 'announcements' to match caretaker generation tables
        const [announcements] = await db.execute(`
            SELECT id, title, message, event_date, start_time, end_time, created_at 
            FROM announcements 
            WHERE property_id = ? 
            ORDER BY created_at DESC`,
            [propertyId]
        );

        return res.status(200).json({ status: 'Success', data: announcements });
    } catch (error) {
        console.error('[TENANT_BROADCAST_FETCH_ERROR]:', error);
        return res.status(500).json({ status: 'Fail', message: 'Internal server error while retrieving property notices.' });
    }
};

// ====================================================================
// 3. HARMONIZED ADMINISTRATIVE ESTATE OVERVIEW KPI ENGINE
// ====================================================================
const getEstateOverview = async (req, res) => {
    try {
        // HARDENING: Fixed the pending user condition string check to match 'Pending' registration flows
        const [stats] = await db.execute(`
            SELECT 
                (SELECT IFNULL(SUM(total_amount), 0) FROM invoices WHERE billing_period = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')) as total_expected,
                (SELECT COUNT(*) FROM units WHERE status = 'Vacant') as vacant_units,
                (SELECT COUNT(*) FROM users WHERE status = 'Pending') as pending_approvals
        `);

        return res.status(200).json({
            status: 'Success',
            data: stats[0]
        });
    } catch (error) {
        console.error('[ADMIN_ESTATE_OVERVIEW_ERROR]:', error);
        return res.status(500).json({ status: 'Error', message: 'Failed to aggregate master estate metrics summary.' });
    }
};

module.exports = {
    getDashboardData,
    getTenantBroadcasts,
    getEstateOverview
};