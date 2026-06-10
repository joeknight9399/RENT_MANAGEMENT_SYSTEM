const crypto = require('crypto');
const db = require('../config/db'); // Path to your db pool

/**
 * @desc    Generate a unique, transaction-locked invite token for a specific rental unit
 * @route   POST /api/v1/admin/invites/tenant
 * @access  Private (Admin/Landlord Only)
 */
exports.generateTenantInvite = async (req, res) => {
    const { unit_id, expiry_days } = req.body;

    // 1. Basic validation
    if (!unit_id) {
        return res.status(400).json({
            status: 'Fail',
            message: 'Please provide a valid unit_id to bind this invitation to.'
        });
    }

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // 2. Lock the room row to eliminate TOCTOU race conditions
        const [unitCheck] = await conn.execute(
            'SELECT room_number, status FROM units WHERE id = ? FOR UPDATE',
            [unit_id]
        );

        if (unitCheck.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                status: 'Fail',
                message: 'The requested unit does not exist.'
            });
        }

        const unit = unitCheck[0];

        if (unit.status !== 'Vacant') {
            await conn.rollback();
            return res.status(400).json({
                status: 'Fail',
                message: `Unit ${unit.room_number} is currently marked as "${unit.status}". You can only generate invite tokens for Vacant units.`
            });
        }

        // 3. Clean up any previous unexpired/unused invitations for this specific unit
        await conn.execute(
            'UPDATE tenant_invites SET is_used = 1 WHERE unit_id = ? AND is_used = 0',
            [unit_id]
        );

        // 4. Generate an 8-character token (TNT + 5 uppercase alphanumeric hex characters)
        // 3 bytes of hex = 6 characters, slice 1 to ensure a perfectly predictable string length of 8 total
        const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);
        const inviteCode = `TNT${randomHex}`;

        // 5. Calculate precise expiration baseline
        const daysToExpiration = expiry_days || 7;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + daysToExpiration);

        // 6. Architectural Sync: Generate UUID within JS layer to match admin controllers
        const inviteId = crypto.randomUUID();

        // 7. Store the allocation token safely
        await conn.execute(
            `INSERT INTO tenant_invites (id, invite_code, unit_id, is_used, expires_at) 
             VALUES (?, ?, ?, 0, ?)`,
            [inviteId, inviteCode, unit_id, expiresAt]
        );

        await conn.commit();

        // 8. Return comprehensive payload containing the newly minted IDs
        return res.status(201).json({
            status: 'Success',
            message: `Invitation token generated successfully for Unit ${unit.room_number}!`,
            data: {
                invite_id: inviteId, // Fully visible and accessible to the app layer now
                invite_code: inviteCode,
                room_number: unit.room_number,
                expires_at: expiresAt
            }
        });

    } catch (error) {
        await conn.rollback();
        console.error('[ADMIN_INVITE_GEN_TRANSACTION_ERROR]:', error);
        return res.status(500).json({
            status: 'Error',
            message: 'Internal server transaction error while processing the unit token.'
        });
    } finally {
        conn.release();
    }
};