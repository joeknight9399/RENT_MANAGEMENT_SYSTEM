// 📁 controllers/financeController.js
// TODO: Adjust this import path to match where your MySQL database connection/pool lives
const db = require('../config/db');

/**
 * @desc    Get high-level financial summary metrics for dashboard cards
 * @route   GET /api/v1/finance/summary?month=2026-06
 * @access  Private/Admin
 */
const getFinancialSummary = async (req, res) => {
    try {
        // Default to current month if none provided (Format: YYYY-MM)
        const targetMonth = req.query.month || new Date().toISOString().slice(0, 7);
        // Normalize to match your billing_period date format (YYYY-MM-01)
        const billingPeriod = `${targetMonth}-01`;

        // 1. Fetch count and total value grouped by invoice enum status
        const summaryQuery = `
            SELECT 
                status,
                COUNT(*) AS total_count,
                SUM(total_amount) AS total_monetary_value
            FROM invoices
            WHERE billing_period = ?
            GROUP BY status;
        `;

        // 2. Fetch actual cash collected from successfully completed payments for this billing period
        const actualCollectedQuery = `
            SELECT COALESCE(SUM(p.amount_paid), 0) AS actual_cash_collected
            FROM payments p
            JOIN invoices i ON p.invoice_id = i.id
            WHERE i.billing_period = ? AND p.status = 'Completed';
        `;

        const [summaryRows] = await db.query(summaryQuery, [billingPeriod]);
        const [collectedRows] = await db.query(actualCollectedQuery, [billingPeriod]);

        // Format summary array into a clean key-value object for the frontend widgets
        const stats = {
            Paid: { count: 0, value: 0 },
            Unpaid: { count: 0, value: 0 },
            Partially_Paid: { count: 0, value: 0 },
            Overdue: { count: 0, value: 0 },
            Pending: { count: 0, value: 0 }
        };

        let expectedRevenue = 0;

        summaryRows.forEach(row => {
            if (stats[row.status]) {
                stats[row.status].count = row.total_count;
                stats[row.status].value = parseFloat(row.total_monetary_value) || 0;
            }
            expectedRevenue += parseFloat(row.total_monetary_value) || 0;
        });

        const actualCashCollected = parseFloat(collectedRows[0]?.actual_cash_collected) || 0;
        const totalOutstandingBalance = expectedRevenue - actualCashCollected;

        return res.status(200).json({
            status: 'Success',
            data: {
                billing_period: billingPeriod,
                revenue_metrics: {
                    expected_total_revenue: expectedRevenue,
                    actual_cash_collected: actualCashCollected,
                    total_outstanding_balance: totalOutstandingBalance
                },
                status_breakdown: stats
            }
        });

    } catch (error) {
        console.error('Error fetching financial summary:', error);
        return res.status(500).json({
            status: 'Error',
            message: 'Server failed to process financial summary metrics'
        });
    }
};

/**
 * @desc    Get detailed list of members/rooms with active invoices, paid values, and balances
 * @route   GET /api/v1/finance/ledger?month=2026-06&status=Unpaid
 * @access  Private/Admin
 */
const getInvoiceLedger = async (req, res) => {
    try {
        const targetMonth = req.query.month || new Date().toISOString().slice(0, 7);
        const billingPeriod = `${targetMonth}-01`;
        const filterStatus = req.query.status; // Optional filter: Paid, Unpaid, Partially_Paid

        // Base workhorse query calculating balances on the fly via LEFT JOIN
        let ledgerQuery = `
            SELECT 
                i.id AS invoice_id,
                un.room_number,
                u.full_name AS tenant_name,
                u.phone_number AS tenant_phone,
                i.total_amount AS total_owed,
                COALESCE(SUM(CASE WHEN p.status = 'Completed' THEN p.amount_paid ELSE 0 END), 0) AS total_paid,
                (i.total_amount - COALESCE(SUM(CASE WHEN p.status = 'Completed' THEN p.amount_paid ELSE 0 END), 0)) AS remaining_balance,
                i.status AS invoice_status,
                i.due_date
            FROM invoices i
            JOIN leases l ON i.lease_id = l.id
            JOIN users u ON l.tenant_id = u.id
            JOIN units un ON l.unit_id = un.id
            LEFT JOIN payments p ON i.id = p.invoice_id
            WHERE i.billing_period = ?
        `;

        const queryParams = [billingPeriod];

        // If the admin clicks a specific tab (e.g., "Partially Paid"), filter the SQL results directly
        if (filterStatus) {
            ledgerQuery += ` AND i.status = ?`;
            queryParams.push(filterStatus);
        }

        ledgerQuery += `
            GROUP BY i.id, un.room_number, u.full_name, u.phone_number, i.total_amount, i.status, i.due_date
            ORDER BY un.room_number ASC;
        `;

        const [ledgerRows] = await db.query(ledgerQuery, queryParams);

        return res.status(200).json({
            status: 'Success',
            count: ledgerRows.length,
            data: ledgerRows
        });

    } catch (error) {
        console.error('Error fetching financial ledger:', error);
        return res.status(500).json({
            status: 'Error',
            message: 'Server failed to process detailed financial ledger'
        });
    }
};

module.exports = {
    getFinancialSummary,
    getInvoiceLedger
};