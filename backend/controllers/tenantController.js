const db = require('../config/db');
const crypto = require('crypto');

// Feature #1: Fetch Live Tenant Overview Metrics (DYNAMICALLY CALCULATING OUTSTANDING BALANCE)
exports.getTenantOverview = async (req, res) => {
    try {
        const tenantId = req.user.id;

        const query = `
    SELECT 
        u.full_name AS tenant_name,
        u.email,
        u.phone_number,
        u.status AS account_status,
        un.room_number,
        un.category AS unit_category,
        un.base_rent,
        p.name AS property_name,
        p.location AS property_location,
        l.start_date AS lease_start,
        l.end_date AS lease_end,
        (
            SELECT SUM(i.total_amount - IFNULL(ps.total_paid, 0))
            FROM invoices i
            LEFT JOIN (
                SELECT invoice_id, SUM(amount_paid) as total_paid 
                FROM payments 
                WHERE status = 'Completed' 
                GROUP BY invoice_id
            ) ps ON i.id = ps.invoice_id
            WHERE i.lease_id = l.id AND i.status IN ('Unpaid', 'Partially_Paid', 'Overdue')
        ) AS live_balance_due
    FROM users u
    LEFT JOIN units un ON u.unit_id = un.id
    LEFT JOIN properties p ON un.property_id = p.id
    LEFT JOIN leases l ON u.id = l.tenant_id AND l.is_active = 1
    WHERE u.id = ? AND u.role = 'Tenant'
`;

        const [rows] = await db.execute(query, [tenantId]);

        if (rows.length === 0) {
            return res.status(404).json({
                status: 'Error',
                message: 'Tenant identity profile or unit allocation record not found.'
            });
        }

        const tenantProfile = rows[0];

        return res.status(200).json({
            status: 'Success',
            data: {
                profile: {
                    name: tenantProfile.tenant_name,
                    email: tenantProfile.email,
                    phone: tenantProfile.phone_number,
                    status: tenantProfile.account_status
                },
                allocation: {
                    room_number: tenantProfile.room_number || 'Not Assigned',
                    category: tenantProfile.unit_category || 'N/A',
                    base_rent: parseFloat(tenantProfile.base_rent) || 0.00,
                    property: tenantProfile.property_name || 'Unassigned Property',
                    location: tenantProfile.property_location || 'Unknown Location'
                },
                text_lease: {
                    start_date: tenantProfile.lease_start,
                    end_date: tenantProfile.lease_end
                },
                lease: {
                    start_date: tenantProfile.lease_start,
                    end_date: tenantProfile.lease_end
                },
                balanceDue: parseFloat(tenantProfile.live_balance_due) || 0.00
            }
        });

    } catch (error) {
        console.error("Database Engine Exception:", error);
        return res.status(500).json({
            status: 'Error',
            message: 'Internal data gateway error while fetching tenancy profile.'
        });
    }
};

// Feature #2: Get All Tickets for Logged-In Tenant
exports.getMaintenanceTickets = async (req, res) => {
    const tenantId = req.user.id;

    const query = `
        SELECT id, title, description, category, status, created_at 
        FROM maintenance_tickets 
        WHERE reported_by = ? 
        ORDER BY created_at DESC
    `;

    try {
        const [tickets] = await db.query(query, [tenantId]);
        return res.status(200).json({
            status: 'Success',
            data: tickets
        });
    } catch (error) {
        console.error('Error fetching maintenance logs:', error);
        return res.status(500).json({ status: 'Error', message: 'Database engine sync failure.' });
    }
};

// Feature #3: Create a New Maintenance Ticket
exports.createMaintenanceTicket = async (req, res) => {
    const tenantId = req.user.id;
    const { title, description, category } = req.body;

    if (!title || !description) {
        return res.status(400).json({
            status: 'Error',
            message: 'Title and Description fields are mandatory execution parameters.'
        });
    }

    try {
        const [userRow] = await db.query(
            `SELECT unit_id FROM users WHERE id = ? LIMIT 1`,
            [tenantId]
        );

        if (userRow.length === 0 || !userRow[0].unit_id) {
            return res.status(404).json({
                status: 'Error',
                message: 'No active unit allocation profile detected for this account.'
            });
        }

        const unitId = userRow[0].unit_id;

        const insertQuery = `
            INSERT INTO maintenance_tickets (unit_id, reported_by, title, description, category, status)
            VALUES (?, ?, ?, ?, ?, 'Pending')
        `;

        await db.query(insertQuery, [unitId, tenantId, title, description, category || 'General']);

        return res.status(201).json({
            status: 'Success',
            message: 'Maintenance ticket successfully synchronized and registered.'
        });

    } catch (error) {
        console.error('Error processing maintenance ticket:', error);
        return res.status(500).json({ status: 'Error', message: 'Internal pipeline insertion failure.' });
    }
};

// Feature #4: Fetch Tenant Billing & Invoice Statement History
exports.getBillingHistory = async (req, res) => {
    const tenantId = req.user.id;

    const query = `
        SELECT 
            i.id, 
            i.total_amount AS amount,
            i.rent_amount,
            i.utilities_amount,
            i.status, 
            i.due_date, 
            i.created_at,
            CONCAT('Billing Period: ', DATE_FORMAT(i.billing_period, '%b %Y')) AS description
        FROM invoices i
        INNER JOIN leases l ON i.lease_id = l.id
        WHERE l.tenant_id = ? 
        ORDER BY i.created_at DESC
    `;

    try {
        const [statements] = await db.query(query, [tenantId]);
        return res.status(200).json({
            status: 'Success',
            data: statements
        });
    } catch (error) {
        console.error('Error fetching billing statement history:', error);
        return res.status(500).json({
            status: 'Error',
            message: 'Database ledger synchronization failure.'
        });
    }
};

exports.verifyAndLeaseTenant = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { tenantId } = req.params;

        if (!tenantId) {
            return res.status(400).json({ status: 'Fail', message: 'Tenant ID parameter is required.' });
        }

        await connection.beginTransaction();

        // 🟢 FIX 1: Added u.role to the SELECT statement
        const [userCheck] = await connection.execute(
            `SELECT u.unit_id, u.status, u.role, un.base_rent 
             FROM users u
             LEFT JOIN units un ON u.unit_id = un.id
             WHERE u.id = ?`,
            [tenantId]
        );

        if (userCheck.length === 0) {
            await connection.rollback();
            return res.status(404).json({ status: 'Fail', message: 'User account not found.' });
        }

        const tenantData = userCheck[0];

        if (tenantData.status !== 'Pending') {
            await connection.rollback();
            return res.status(400).json({
                status: 'Fail',
                message: `Cannot verify. Account status is '${tenantData.status}', not 'Pending'.`
            });
        }

        // 🟢 FIX 2: Create a wrapper to isolate all Tenant-only business logic
        if (tenantData.role === 'Tenant') {

            // Check for unit assignment
            if (!tenantData.unit_id) {
                throw new Error('Tenant cannot be approved without a bound unit allocation.');
            }

            // Check for rent
            const baseRent = parseFloat(tenantData.base_rent) || 0.00;
            if (baseRent <= 0) {
                throw new Error('Invalid unit configuration. Base rent must be greater than 0.');
            }

            // Execute Lease and Invoices
            const sharedLeaseId = crypto.randomUUID();

            await connection.execute(
                'INSERT INTO leases (id, tenant_id, unit_id, start_date) VALUES (?, ?, ?, CURDATE())',
                [sharedLeaseId, tenantId, tenantData.unit_id]
            );

            await connection.execute(
                `INSERT INTO invoices (lease_id, rent_amount, utilities_amount, total_amount, status, due_date, billing_period) 
                 VALUES (?, ?, 0.00, ?, 'Unpaid', DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_FORMAT(CURDATE(), '%Y-%m-01'))`,
                [sharedLeaseId, baseRent, baseRent]
            );

            // Update unit status to occupied
            await connection.execute(
                "UPDATE units SET status = 'Occupied' WHERE id = ?",
                [tenantData.unit_id]
            );
        }

        // 🟢 FIX 3: Update user status to 'Active' (Happens for EVERYONE: Tenants and Caretakers)
        await connection.execute(
            "UPDATE users SET status = 'Active' WHERE id = ?",
            [tenantId]
        );

        await connection.commit();

        return res.status(200).json({
            status: 'Success',
            message: `Account activated successfully for ${tenantData.role}.`
        });

    } catch (error) {
        await connection.rollback();
        console.error('[TENANT_VERIFICATION_TRANSACTION_ERROR]:', error);
        return res.status(500).json({ status: 'Error', message: error.message });
    } finally {
        connection.release();
    }
};

// Feature #6: Fetch Caretaker Broadcasts for Logged-In Tenant
exports.getTenantAnnouncements = async (req, res) => {
    const tenant_id = req.user?.id;

    if (!tenant_id) {
        return res.status(401).json({ status: 'Fail', message: 'Authentication required.' });
    }

    try {
        // Corrected Query: Joins users to units to find the correct property_id dynamically
        const [tenantProfile] = await db.execute(`
            SELECT un.property_id 
            FROM users u
            INNER JOIN units un ON u.unit_id = un.id 
            WHERE u.id = ? LIMIT 1
        `, [tenant_id]);

        if (tenantProfile.length === 0 || !tenantProfile[0].property_id) {
            return res.status(444).json({ status: 'Fail', message: 'No active property assignment found for this tenant.' });
        }

        const property_id = tenantProfile[0].property_id;


        const [announcements] = await db.execute(`
            SELECT 
                id, 
                title, 
                message AS content, 
                event_date AS eventDate,
                start_time AS startTime,
                end_time AS endTime,
                created_at AS createdAt 
            FROM announcements 
            WHERE property_id = ? 
              AND (
                event_date IS NULL 
                OR CONCAT(event_date, ' ', COALESCE(end_time, '23:59:59')) >= NOW()
              )
            ORDER BY created_at DESC
        `, [property_id]);

        return res.status(200).json({ status: 'Success', data: announcements });

    } catch (error) {
        console.error('[GET_TENANT_ANNOUNCEMENTS_ERROR]:', error);
        return res.status(500).json({ status: 'Fail', message: 'Server error fetching announcements.' });
    }
};