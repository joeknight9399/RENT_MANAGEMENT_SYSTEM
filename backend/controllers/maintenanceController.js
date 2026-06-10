const crypto = require('crypto');
const db = require('../config/db');

/**
 * @desc    Fetch all maintenance tickets opened by the logged-in tenant with asset context
 * @route   GET /api/v1/tickets
 * @access  Private (Tenant)
 */
exports.getTickets = async (req, res) => {
    try {
        const tenantId = req.user.id;

        // HARDENING: Added INNER JOIN to expose human-readable room numbers to the UI payload
        const [rows] = await db.execute(`
            SELECT 
                t.id AS ticket_id,
                t.title,
                t.category,
                t.description,
                t.status,
                t.created_at,
                u.room_number
            FROM maintenance_tickets t
            INNER JOIN units u ON t.unit_id = u.id
            WHERE t.reported_by = ? 
            ORDER BY t.created_at DESC
        `, [tenantId]);

        return res.status(200).json({
            status: 'Success',
            results: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('[GET_TICKETS_ERROR]:', error);
        return res.status(500).json({
            status: 'Error',
            message: 'Failed to retrieve maintenance records.'
        });
    }
};

/**
 * @desc    Log a new maintenance request linked explicitly to an active lease lifecycle
 * @route   POST /api/v1/tickets
 * @access  Private (Tenant)
 */
exports.createTicket = async (req, res) => {
    try {
        const { title, category, description } = req.body;
        const tenantId = req.user.id;

        // 1. Structural Validation Guard Clauses
        if (!title || !category || !description) {
            return res.status(400).json({
                status: 'Fail',
                message: 'Please provide all required fields: title, category, and description are mandatory.'
            });
        }

        // 2. Input Hardening: Enforce strict categorical enums to protect dashboard analytics
        const authorizedCategories = ['Plumbing', 'Electrical', 'Structural', 'Appliance', 'Other'];
        if (!authorizedCategories.includes(category)) {
            return res.status(400).json({
                status: 'Fail',
                message: `Invalid ticket category. Must be one of: ${authorizedCategories.join(', ')}`
            });
        }

        // 3. Relational Guard: Verify occupancy from an active lease instead of desynchronized profile columns
        const [activeLease] = await db.execute(`
            SELECT unit_id FROM leases 
            WHERE tenant_id = ? AND status = 'Active' AND is_active = TRUE 
            LIMIT 1
        `, [tenantId]);

        if (activeLease.length === 0) {
            return res.status(403).json({
                status: 'Fail',
                message: 'Ticket execution blocked. No active contract or rental authorization found linked to this account.'
            });
        }

        const unitId = activeLease[0].unit_id;

        // 4. Architectural Sync: Generate application-layer identity hash token
        const ticketId = crypto.randomUUID();

        // 5. Persist Ticket using secure binary prepared statements
        await db.execute(`
            INSERT INTO maintenance_tickets 
                (id, unit_id, reported_by, title, category, description, status, created_at) 
            VALUES 
                (?, ?, ?, ?, ?, ?, 'Pending', NOW())
        `, [ticketId, unitId, tenantId, title, category, description]);

        return res.status(201).json({
            status: 'Success',
            message: 'Maintenance ticket successfully cataloged and routed to facility operations.',
            data: {
                ticket_id: ticketId
            }
        });
    } catch (error) {
        console.error('[CREATE_TICKET_ERROR]:', error);
        return res.status(500).json({
            status: 'Error',
            message: 'An internal server error occurred while logging the facility ticket.'
        });
    }
};