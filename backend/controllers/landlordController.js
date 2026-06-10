const db = require('../config/db');

/**
 * @desc    Fetch comprehensive estate financial intelligence and occupancy metrics
 * @route   GET /api/v1/landlord/dashboard
 * @access  Private (Landlord/Master Admin Only)
 */
exports.getLandlordDashboard = async (req, res) => {
    try {
        // 1. HARDENING: Fixed Outstanding Calculation to account for partial payments accurately
        const financialQuery = `
            SELECT 
                (SELECT COALESCE(SUM(amount_paid), 0) FROM payments WHERE status = 'Completed') AS total_revenue,
                (SELECT COALESCE(SUM(i.total_amount - (
                    SELECT COALESCE(SUM(p.amount_paid), 0) 
                    FROM payments p 
                    WHERE p.invoice_id = i.id AND p.status = 'Completed'
                )), 0) FROM invoices i WHERE i.status IN ('Unpaid', 'Overdue', 'Partially_Paid')) AS total_outstanding,
                (SELECT COALESCE(SUM(amount), 0) FROM expenses) AS total_expenses
        `;

        // 2. Portfolio & Occupancy Health Metrics
        const portfolioQuery = `
            SELECT 
                COUNT(*) AS total_units,
                SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) AS occupied_units,
                SUM(CASE WHEN status = 'Vacant' THEN 1 ELSE 0 END) AS vacant_units,
                SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) AS maintenance_units
            FROM units
        `;

        // 3. Operational Overhead Tracking
        const operationsQuery = `
            SELECT 
                COUNT(*) AS total_tickets,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_tickets,
                SUM(CASE WHEN status = 'In_Progress' THEN 1 ELSE 0 END) AS active_tickets
            FROM maintenance_tickets
        `;

        // 4. Property Performance Analytics
        const propertyBreakdownQuery = `
            SELECT 
                p.id, p.name, p.location,
                COUNT(u.id) AS total_units,
                SUM(CASE WHEN u.status = 'Occupied' THEN 1 ELSE 0 END) AS occupied_count,
                SUM(CASE WHEN u.status = 'Vacant' THEN 1 ELSE 0 END) AS vacant_count
            FROM properties p
            LEFT JOIN units u ON p.id = u.property_id
            GROUP BY p.id, p.name, p.location
        `;

        // 5. HARDENING: Relational Graph Traversal (payments -> invoices -> leases -> users)
        const recentPaymentsQuery = `
            SELECT 
                p.id, p.amount_paid, p.payment_method, p.paid_at,
                u.full_name AS tenant_name,
                un.room_number,
                prop.name AS property_name
            FROM payments p
            INNER JOIN invoices i ON p.invoice_id = i.id
            INNER JOIN leases l ON i.lease_id = l.id
            INNER JOIN users u ON l.tenant_id = u.id
            INNER JOIN units un ON l.unit_id = un.id
            INNER JOIN properties prop ON un.property_id = prop.id
            WHERE p.status = 'Completed'
            ORDER BY p.created_at DESC
            LIMIT 5
        `;

        // Architectural Sync: Uniform high-performance binary prepared statements
        const [
            [financialRows],
            [portfolioRows],
            [operationsRows],
            [propertyRows],
            [paymentRows]
        ] = await Promise.all([
            db.execute(financialQuery),
            db.execute(portfolioQuery),
            db.execute(operationsQuery),
            db.execute(propertyBreakdownQuery),
            db.execute(recentPaymentsQuery)
        ]);

        // Secure extraction handles with fallback initializers
        const financials = financialRows[0] || { total_revenue: 0, total_outstanding: 0, total_expenses: 0 };
        const portfolio = portfolioRows[0] || { total_units: 0, occupied_units: 0, vacant_units: 0, maintenance_units: 0 };
        const operations = operationsRows[0] || { total_tickets: 0, pending_tickets: 0, active_tickets: 0 };

        // Calculate occupancy percentage safely
        const totalUnitsCount = parseInt(portfolio.total_units, 10) || 0;
        const occupiedUnitsCount = parseInt(portfolio.occupied_units, 10) || 0;
        const occupancyRate = totalUnitsCount > 0 ? ((occupiedUnitsCount / totalUnitsCount) * 100).toFixed(1) : "0.0";

        const totalRevenue = parseFloat(financials.total_revenue) || 0;
        const totalExpenses = parseFloat(financials.total_expenses) || 0;
        const totalOutstanding = parseFloat(financials.total_outstanding) || 0;

        return res.status(200).json({
            status: 'Success',
            data: {
                metrics: {
                    totalRevenue,
                    totalOutstanding,
                    totalExpenses,
                    netProfit: totalRevenue - totalExpenses,
                    occupancyRate: parseFloat(occupancyRate),
                    unitBreakdown: portfolio,
                    ticketBreakdown: operations
                },
                properties: propertyRows,
                recentPayments: paymentRows
            }
        });

    } catch (error) {
        console.error('[LANDLORD_DASHBOARD_INTELLIGENCE_ERROR]:', error);
        return res.status(500).json({
            status: 'Error',
            message: 'Failed to process estate infrastructure intelligence summary.'
        });
    }
};