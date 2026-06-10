const db = require('../config/db');
const crypto = require('crypto');
const { sendApprovalStatusEmail } = require('../utils/emailService');

/**
 * @desc    Process status modifications for pending user validation queues
 * @route   PATCH /api/v1/admin/users/:userId/status
 * @access  Private (Admin Only)
 */
exports.updateUserStatus = async (req, res) => {
    // Acquire connection handle outside the block to ensure scope visibility within finally clause
    const connection = await db.getConnection();

    try {
        const { userId } = req.params;
        const { status } = req.body;

        // 1. INPUT VALIDATION GUARD
        const validStatuses = ['Active', 'Rejected', 'Pending'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ status: 'Fail', message: 'Invalid status update value provided.' });
        }

        const [users] = await connection.execute(
            'SELECT full_name, email, role, status, unit_id FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ status: 'Fail', message: 'Targeted user profile registration not found.' });
        }

        const targetUser = users[0];

        // 2. SECURITY GUARD: Protect administrative level baseline records
        if (targetUser.role === 'Admin') {
            return res.status(403).json({ status: 'Fail', message: 'Administrative root accounts cannot be altered via this endpoint.' });
        }

        if (targetUser.status === status) {
            return res.status(400).json({ status: 'Fail', message: `Target profile status state is already set to ${status}.` });
        }

        // 3. STATE MACHINE GUARD: Prevent data poisoning by forcing evaluation exclusively on Pending rows
        if (targetUser.status !== 'Pending') {
            return res.status(400).json({
                status: 'Fail',
                message: `Transaction rejected. Account lifecycle state is currently '${targetUser.status}'. Only accounts awaiting 'Pending' validation can be altered.`
            });
        }

        // Initialize Atomic Database Transaction Block
        await connection.beginTransaction();

        // 4. TENANT APPROVAL LOGIC PATHWAY
        if (targetUser.role === 'Tenant' && status === 'Active') {
            if (!targetUser.unit_id) {
                throw new Error('Tenant cannot be approved without a bound unit allocation.');
            }

            // Enforce safe row reading with read locks inside transaction execution scope
            const [units] = await connection.execute(
                'SELECT base_rent, deposit_amount, status FROM units WHERE id = ? FOR UPDATE',
                [targetUser.unit_id]
            );

            if (units.length === 0) {
                throw new Error('The architectural unit bound to this tenant profile no longer exists.');
            }

            if (units[0].status !== 'Vacant') {
                throw new Error(`Unit container allocation conflict. Target room status is currently: ${units[0].status}`);
            }

            // Transition physical unit state to Occupied
            await connection.execute("UPDATE units SET status = 'Occupied' WHERE id = ?", [targetUser.unit_id]);

            // Append Secure Lease Agreement Entity
            const leaseId = crypto.randomUUID();
            await connection.execute(
                `INSERT INTO leases (id, tenant_id, unit_id, start_date, is_active) VALUES (?, ?, ?, CURDATE(), 1)`,
                [leaseId, userId, targetUser.unit_id]
            );

            const baseRent = parseFloat(units[0].base_rent) || 0.00;
            const depositAmount = parseFloat(units[0].deposit_amount) || 0.00;
            const totalAmount = baseRent + depositAmount;

            // Append Initialized System Invoice Ledger entry with programmatic UUID initialization
            await connection.execute(
                `INSERT INTO invoices (id, lease_id, rent_amount, utilities_amount, total_amount, status, due_date, billing_period) 
                 VALUES (?, ?, ?, 0.00, ?, 'Unpaid', DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_FORMAT(CURDATE(), '%Y-%m-01'))`,
                [crypto.randomUUID(), leaseId, baseRent, totalAmount]
            );
        }

        // 5. TENANT REJECTION LOGIC PATHWAY
        else if (targetUser.role === 'Tenant' && status === 'Rejected') {
            if (targetUser.unit_id) {
                // Free up the room reservation hold, reverting state cleanly back to Vacant
                await connection.execute("UPDATE units SET status = 'Vacant' WHERE id = ?", [targetUser.unit_id]);
            }
        }

        // 6. ABSTRACTED FINAL PROFILE STATE COMMITTAL (Applies to Tenants and Caretakers safely)
        await connection.execute('UPDATE users SET status = ? WHERE id = ?', [status, userId]);

        // Finalize transaction boundaries safely to disk storage engines
        await connection.commit();

        // Asynchronous non-blocking message broker dispatch out of execution stream
        sendApprovalStatusEmail(targetUser.email, targetUser.full_name, status);

        return res.status(200).json({ status: 'Success', message: `Profile registration state updated to ${status} successfully.` });

    } catch (error) {
        // Safe operational fallback catching transaction faults
        await connection.rollback();
        console.error('[USER_STATUS_UPDATE_TRANSACTION_ERROR]:', error);

        // HARDENING: Clean sanitized error mapping layer hides engine details
        return res.status(500).json({
            status: 'Error',
            message: 'Internal transactional data gateway failure processing application lifecycle changes.'
        });
    } finally {
        // GUARANTEED CLEANUP: Structural finally intercept block guarantees thread returns to pool allocation
        connection.release();
    }
};

/**
 * @desc    Fetch all pending accounts awaiting manager validation assessments
 * @route   GET /api/v1/admin/users/pending
 * @access  Private (Admin Only)
 */
exports.getPendingUsers = async (req, res) => {
    try {
        const [pendingUsers] = await db.execute(
            'SELECT id, full_name, email, phone_number, role, created_at FROM users WHERE status = "Pending" ORDER BY created_at ASC'
        );

        return res.status(200).json({
            status: 'Success',
            results: pendingUsers.length,
            data: { users: pendingUsers }
        });
    } catch (error) {
        console.error('[GET_PENDING_USERS_ERROR]:', error);
        return res.status(500).json({ status: 'Error', message: 'Failed to safely retrieve pending approval workflows.' });
    }
};

/**
 * @desc    Manufacture single-use secure invite hashes for staff registry steps
 * @route   POST /api/v1/admin/caretaker/invite
 * @access  Private (Admin Only)
 */
exports.generateCaretakerInvite = async (req, res) => {
    try {
        // Generate uniform 8-character cryptographic token sequences safely
        const rawToken = crypto.randomBytes(4).toString('hex').toUpperCase();
        const inviteCode = `INV-${rawToken}`;

        await db.execute(
            'INSERT INTO caretaker_invites (id, invite_code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))',
            [crypto.randomUUID(), inviteCode]
        );

        return res.status(201).json({
            status: 'Success',
            message: 'Secure Staff Caretaker registration code successfully initialized.',
            data: {
                invite_code: inviteCode,
                expires_in: '24 Hours'
            }
        });

    } catch (error) {
        console.error('[GENERATE_INVITE_ERROR]:', error);
        return res.status(500).json({ status: 'Error', message: 'Failed to manufacture secure staff invite verification code tokens.' });
    }
};