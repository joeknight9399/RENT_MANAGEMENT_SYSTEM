const db = require('../config/db');
const { sendApprovalStatusEmail } = require('../utils/emailService');
const crypto = require('crypto');

// ====================================================================
// 1. FETCH ALL PENDING REGISTRATION REQUESTS
// ====================================================================
const getPendingUsers = async (req, res) => {
    try {
        const [pendingUsers] = await db.execute(
            'SELECT id, full_name, email, phone_number, national_id, role, unit_id, created_at FROM users WHERE status = "Pending" ORDER BY created_at DESC'
        );

        return res.status(200).json({
            status: 'Success',
            results: pendingUsers.length,
            data: { users: pendingUsers }
        });
    } catch (error) {
        console.error('[ADMIN_FETCH_PENDING_ERROR]:', error);
        return res.status(500).json({ status: 'Error', message: 'Failed to retrieve pending approval queue.' });
    }
};

// ====================================================================
// 2. FETCH ALL USERS (FOR USER MANAGEMENT DASHBOARD)
// ====================================================================
const getAllUsers = async (req, res) => {
    try {
        const [users] = await db.execute(`
            SELECT u.id, u.full_name, u.email, u.phone_number, u.role, u.status, u.unit_id, 
                   un.room_number 
            FROM users u
            LEFT JOIN units un ON u.unit_id = un.id
            ORDER BY u.created_at DESC
        `);

        return res.status(200).json({
            status: 'Success',
            results: users.length,
            data: { users }
        });
    } catch (error) {
        console.error('[ADMIN_GET_ALL_USERS_ERROR]:', error);
        return res.status(500).json({ status: 'Error', message: 'Failed to retrieve user directory.' });
    }
};

// ====================================================================
// 3. ADMINISTRATIVE ACCOUNT DECISION ENGINE (Approve / Reject)
// ====================================================================
const manageUserStatus = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { userId } = req.params;
        const { action } = req.body;

        if (!['Approve', 'Reject'].includes(action)) {
            return res.status(400).json({ status: 'Fail', message: 'Invalid administrative action request.' });
        }

        await conn.beginTransaction();

        // Safe Row Lock on targeted profile to guarantee processing state consistency
        const [users] = await conn.execute(
            'SELECT full_name, email, role, unit_id, status FROM users WHERE id = ? FOR UPDATE',
            [userId]
        );
        const user = users[0];

        if (!user) {
            await conn.rollback();
            return res.status(404).json({ status: 'Fail', message: 'Target account profile not found.' });
        }

        if (user.status !== 'Pending') {
            await conn.rollback();
            return res.status(400).json({ status: 'Fail', message: 'Account status has already been decided.' });
        }

        const targetStatus = action === 'Approve' ? 'Active' : 'Rejected';

        if (user.role === 'Tenant' && user.unit_id) {
            if (action === 'Approve') {
                await conn.execute("UPDATE units SET status = 'Occupied' WHERE id = ?", [user.unit_id]);
            } else if (action === 'Reject') {
                await conn.execute("UPDATE units SET status = 'Vacant' WHERE id = ?", [user.unit_id]);
                await conn.execute("UPDATE users SET unit_id = NULL WHERE id = ?", [userId]);
            }
        }

        await conn.execute('UPDATE users SET status = ? WHERE id = ?', [targetStatus, userId]);

        await conn.commit();

        // Fire side-effect automated communications securely post-commit
        try {
            await sendApprovalStatusEmail(user.email, user.full_name, targetStatus);
        } catch (emailErr) {
            console.error('[EMAIL_NOTIFY_ERROR]:', emailErr);
        }

        return res.status(200).json({
            status: 'Success',
            message: `Account for ${user.full_name} has been successfully ${action === 'Approve' ? 'approved' : 'rejected'}.`
        });

    } catch (error) {
        await conn.rollback();
        console.error('[ADMIN_MANAGE_STATUS_ERROR]:', error);
        return res.status(500).json({ status: 'Error', message: 'Internal transaction sequencing error.' });
    } finally {
        conn.release();
    }
};

// ====================================================================
// 4. CREATE A NEW PROPERTY (BUILDING)
// ====================================================================
const createProperty = async (req, res) => {
    try {
        const { name, location } = req.body;
        if (!name || !location) {
            return res.status(400).json({ status: 'Fail', message: 'Property name and location are required.' });
        }

        const propertyId = crypto.randomUUID();
        await db.execute(
            'INSERT INTO properties (id, name, location) VALUES (?, ?, ?)',
            [propertyId, name, location]
        );

        return res.status(201).json({
            status: 'Success',
            message: 'Property created successfully.',
            data: { propertyId }
        });
    } catch (error) {
        console.error('[CREATE_PROPERTY_ERROR]:', error);
        return res.status(500).json({ status: 'Error', message: 'Server error while creating property.' });
    }
};

// ====================================================================
// 5. ADD A UNIT (ROOM) TO A PROPERTY
// ====================================================================
const addUnit = async (req, res) => {
    try {
        const { property_id, room_number, category, base_rent, deposit_amount } = req.body;

        if (!property_id || !room_number || !category || base_rent === undefined || deposit_amount === undefined) {
            return res.status(400).json({ status: 'Fail', message: 'All unit fields are required.' });
        }

        const unitId = crypto.randomUUID();
        await db.execute(
            'INSERT INTO units (id, property_id, room_number, category, base_rent, deposit_amount) VALUES (?, ?, ?, ?, ?, ?)',
            [unitId, property_id, room_number, category, base_rent, deposit_amount]
        );

        return res.status(201).json({
            status: 'Success',
            message: `Unit ${room_number} added.`,
            data: { unitId }
        });
    } catch (error) {
        if (error.errno === 1062) {
            return res.status(400).json({ status: 'Fail', message: 'Room number already exists in this building.' });
        }
        console.error('[ADD_UNIT_ERROR]:', error);
        return res.status(500).json({ status: 'Error', message: 'Server error while registering unit.' });
    }
};

// ====================================================================
// 6. EVICT TENANT AND VACATE UNIT (REPAIRED & ATOMIC)
// ====================================================================
const deleteTenant = async (req, res) => {
    const { userId } = req.params;
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // HARDENING: Fetch current active unit reference directly from DB records instead of trusting req.body
        const [activeLeases] = await conn.execute(
            'SELECT unit_id FROM leases WHERE tenant_id = ? AND is_active = 1 LIMIT 1 FOR UPDATE',
            [userId]
        );

        // 1. Mark User as 'Evicted'
        await conn.execute('UPDATE users SET status = ? WHERE id = ?', ['Evicted', userId]);

        // 2. Terminate the active lease safely
        await conn.execute(
            'UPDATE leases SET is_active = 0, end_date = CURDATE() WHERE tenant_id = ? AND is_active = 1',
            [userId]
        );

        // 3. Vacate the accurately located unit reference securely
        if (activeLeases.length > 0) {
            const trueUnitId = activeLeases[0].unit_id;
            await conn.execute(
                "UPDATE units SET status = 'Vacant' WHERE id = ?",
                [trueUnitId]
            );
        }

        await conn.commit();
        return res.status(200).json({
            status: 'Success',
            message: 'Tenant successfully evicted and lease terminated safely.'
        });
    } catch (error) {
        await conn.rollback();
        console.error("Eviction Error:", error);
        return res.status(500).json({ status: 'Error', message: 'Failed to safely evict tenant.' });
    } finally {
        conn.release();
    }
};

// ====================================================================
// 7. GENERIC USER STATUS MANAGEMENT (Directory usage)
// ====================================================================
const updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;

        if (!['Active', 'Inactive', 'Suspended', 'Pending'].includes(status)) {
            return res.status(400).json({ status: 'Fail', message: 'Invalid status provided.' });
        }

        const [result] = await db.execute(
            'UPDATE users SET status = ? WHERE id = ?',
            [status, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'Fail', message: 'User not found.' });
        }

        return res.status(200).json({
            status: 'Success',
            message: `User status updated to ${status}.`
        });

    } catch (error) {
        console.error('[UPDATE_USER_STATUS_ERROR]:', error);
        return res.status(500).json({ status: 'Error', message: 'Failed to update user status.' });
    }
};

module.exports = {
    getPendingUsers,
    getAllUsers,
    manageUserStatus,
    createProperty,
    addUnit,
    updateUserStatus,
    deleteTenant
};