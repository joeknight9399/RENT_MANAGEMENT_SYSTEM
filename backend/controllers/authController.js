const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendPendingApprovalEmail } = require('../utils/emailService');

// ====================================================================
// 1. USER REGISTRATION INTERFACE (With Multi-Tier Transaction Guards)
// ====================================================================
exports.registerUser = async (req, res) => {
    // Acquire a single dedicated thread from the MySQL connection pool
    const connection = await db.getConnection();

    try {
        const { full_name, email, phone_number, national_id, password, role, invite_code } = req.body;

        if (!full_name || !email || !phone_number || !national_id || !password) {
            return res.status(400).json({ status: 'Fail', message: 'All standard fields are required.' });
        }

        const allowedPublicRoles = ['Caretaker', 'Tenant'];
        let finalRole = allowedPublicRoles.includes(role) ? role : 'Tenant';

        // Emergency Admin Provisioning Guard
        if (role === 'Admin') {
            const systemMasterKey = req.headers['x-system-master-key'];
            if (systemMasterKey && systemMasterKey === process.env.SYSTEM_MASTER_KEY) {
                finalRole = 'Admin';
            } else {
                return res.status(403).json({ status: 'Fail', message: 'Unauthorized role assignment attempt.' });
            }
        }

        // Clean and normalize the invitation token consistently across roles
        const cleanInviteCode = invite_code ? invite_code.toUpperCase().trim() : null;

        // Start atomic execution sequence
        await connection.beginTransaction();

        // 1. Check for pre-existing account records using row-level parameters
        const [existingUser] = await connection.execute(
            'SELECT id FROM users WHERE email = ? OR phone_number = ? OR national_id = ?',
            [email, phone_number, national_id]
        );

        if (existingUser.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                status: 'Fail',
                message: 'Registration data invalid. Please check your details and try again.'
            });
        }

        let assignedUnitId = null;

        // 2. Process and Lock Role-Specific Invitation Tokens
        if (finalRole === 'Caretaker') {
            if (!cleanInviteCode) {
                await connection.rollback();
                return res.status(400).json({ status: 'Fail', message: 'An active Invitation Code is required for Caretaker setup.' });
            }

            // Using FOR UPDATE locks the token row to prevent matching concurrent requests from overlapping
            const [invite] = await connection.execute(
                'SELECT id FROM caretaker_invites WHERE invite_code = ? AND is_used = FALSE AND expires_at > NOW() FOR UPDATE',
                [cleanInviteCode]
            );

            if (invite.length === 0) {
                await connection.rollback();
                return res.status(400).json({ status: 'Fail', message: 'Invalid, expired, or already used invitation token.' });
            }
        }

        if (finalRole === 'Tenant') {
            if (!cleanInviteCode) {
                await connection.rollback();
                return res.status(400).json({ status: 'Fail', message: 'A valid Unit Allocation Token is required for Tenant setup.' });
            }

            // Lock row to prevent dual-allocation race conditions
            const [tenantInvite] = await connection.execute(
                'SELECT unit_id FROM tenant_invites WHERE invite_code = ? AND is_used = FALSE AND expires_at > NOW() FOR UPDATE',
                [cleanInviteCode]
            );

            if (tenantInvite.length === 0) {
                await connection.rollback();
                return res.status(400).json({ status: 'Fail', message: 'Invalid, expired, or already used Unit Allocation Token.' });
            }

            assignedUnitId = tenantInvite[0].unit_id;
        }

        // 3. Encrypt the password credential securely
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        // 4. Insert the new account record explicitly setting status to 'Pending'
        await connection.execute(
            'INSERT INTO users (full_name, email, phone_number, national_id, password_hash, role, unit_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [full_name, email, phone_number, national_id, passwordHash, finalRole, assignedUnitId, 'Pending']
        );

        // 5. Burn tokens and alter asset states inside the transaction lock
        if (finalRole === 'Caretaker') {
            await connection.execute(
                'UPDATE caretaker_invites SET is_used = TRUE WHERE invite_code = ?',
                [cleanInviteCode]
            );
        }

        if (finalRole === 'Tenant') {
            await connection.execute(
                'UPDATE tenant_invites SET is_used = TRUE WHERE invite_code = ?',
                [cleanInviteCode]
            );

            await connection.execute(
                "UPDATE units SET status = 'Reserved' WHERE id = ?",
                [assignedUnitId]
            );
        }

        // Commit all related entries safely to disk
        await connection.commit();

        // Fire outbound email asynchronously without locking the HTTP cycle
        sendPendingApprovalEmail(email, full_name);

        return res.status(201).json({
            status: 'Success',
            message: `Registration successful as ${finalRole}! Your account status is currently pending approval by the Landlord.`
        });

    } catch (error) {
        await connection.rollback();
        console.error('[REGISTRATION_TRANSACTION_ERROR]:', error);
        return res.status(500).json({ status: 'Error', message: 'Internal transaction tracking error during registry setup.' });
    } finally {
        connection.release();
    }
};

// ====================================================================
// 2. USER LOGIN / SESSION INITIALIZATION
// ====================================================================
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'Fail', message: 'Please provide both email and password.' });
        }

        // Fetch user matching email credentials
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        // DEFENSIVE GUARD: Use matching failure returns to stop timing enumeration attacks
        if (!user) {
            return res.status(401).json({ status: 'Fail', message: 'Incorrect email or password.' });
        }

        // FIX: Verify password validity FIRST before leaking or evaluating account authorization status
        const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordCorrect) {
            return res.status(401).json({ status: 'Fail', message: 'Incorrect email or password.' });
        }

        // FIX: Now that ownership is verified, parse operational status flags safely
        if (user.status !== 'Active') {
            if (user.status === 'Rejected') {
                return res.status(403).json({ status: 'Fail', message: 'Your registration request was rejected.' });
            }
            return res.status(403).json({
                status: 'Fail',
                message: `Account access denied. Your current status is: ${user.status}. Please contact support.`
            });
        }

        // Issue JWT session claims token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        delete user.password_hash;

        return res.status(200).json({
            status: 'Success',
            token,
            data: { user }
        });

    } catch (error) {
        console.error('[LOGIN_ERROR]:', error);
        return res.status(500).json({ status: 'Error', message: 'Server error during session verification sequence.' });
    }
};

// ====================================================================
// 3. CREDENTIAL UPDATE ENGINE
// ====================================================================
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                status: "Fail",
                message: "Both current and new password fields are mandatory parameters."
            });
        }

        const [users] = await db.execute('SELECT password_hash FROM users WHERE id = ?', [userId]);
        const user = users[0];

        // FIX: Restructured to standard 404 response
        if (!user) {
            return res.status(404).json({
                status: "Fail",
                message: "Account record parameters not found in system directory maps."
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                status: "Fail",
                message: "The current password provided does not match our records."
            });
        }

        const saltRounds = 12; // Upped to matching 12 for systemic hashing strength parity
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, userId]);

        return res.status(200).json({
            status: "Success",
            message: "Account authorization credentials updated seamlessly."
        });

    } catch (error) {
        console.error("❌ SECURITY EXCEPTION CAUGHT:", error);
        return res.status(500).json({
            status: "Fail",
            message: "Internal system error handling cryptographic token encryption sequence."
        });
    }
};