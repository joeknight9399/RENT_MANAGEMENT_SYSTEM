const db = require('../config/db');

exports.getEstateOverview = async (req, res) => {
    try {
        // Fetching all stats using highly sargable index-friendly date ranges
        const [stats] = await db.execute(`
            SELECT 
                (SELECT IFNULL(SUM(total_amount), 0) 
                 FROM invoices 
                 WHERE billing_period >= DATE_SUB(CURRENT_DATE(), INTERVAL DAYOFMONTH(CURRENT_DATE())-1 DAY)
                   AND billing_period < DATE_ADD(DATE_SUB(CURRENT_DATE(), INTERVAL DAYOFMONTH(CURRENT_DATE())-1 DAY), INTERVAL 1 MONTH)
                ) as total_expected,
                 
                (SELECT IFNULL(SUM(amount_paid), 0) 
                 FROM payments 
                 WHERE paid_at >= DATE_SUB(CURRENT_DATE(), INTERVAL DAYOFMONTH(CURRENT_DATE())-1 DAY)
                   AND paid_at < DATE_ADD(DATE_SUB(CURRENT_DATE(), INTERVAL DAYOFMONTH(CURRENT_DATE())-1 DAY), INTERVAL 1 MONTH)
                ) as total_collected,
                 
                (SELECT COUNT(*) FROM units WHERE status = 'Vacant') as vacant_units,
                (SELECT COUNT(*) FROM units) as total_units,
                
                /* FIXED: String alignment matches the 'Pending' status from adminController */
                (SELECT COUNT(*) FROM users WHERE status = 'Pending') as pending_approvals,
                
                (SELECT COUNT(*) FROM maintenance_tickets WHERE status != 'Resolved') as active_tickets
        `);

        return res.status(200).json({
            status: 'Success',
            data: stats[0]
        });
    } catch (error) {
        console.error('[ADMIN_DASHBOARD_ERROR]:', error);
        return res.status(500).json({
            status: 'Error',
            message: 'Failed to load estate overview data.'
        });
    }
};