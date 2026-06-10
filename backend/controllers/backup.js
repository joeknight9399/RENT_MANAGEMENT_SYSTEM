const db = require('../config/db'); // Path to your db pool

// ====================================================================
// 1. MAINTENANCE & TICKETING MODULE
// ====================================================================

// Fetch all maintenance tickets with unit room numbers
const getMaintenanceTickets = async (req, res) => {
    try {
        const [tickets] = await db.query(`
            SELECT t.*, u.room_number 
            FROM maintenance_tickets t
            JOIN units u ON t.unit_id = u.id
            ORDER BY t.created_at DESC
        `);

        return res.status(200).json({
            status: 'Success',
            data: tickets
        });
    } catch (error) {
        console.error('[CARETAKER_TICKETS_ERROR]:', error);
        return res.status(500).json({
            status: 'Fail',
            message: 'Internal server error while fetching tickets.'
        });
    }
};

// Update ticket status
const updateTicketStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'In_Progress', 'Resolved'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            status: 'Fail',
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
    }

    try {
        const [result] = await db.execute(
            'UPDATE maintenance_tickets SET status = ? WHERE id = ?',
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'Fail',
                message: 'Maintenance ticket not found.'
            });
        }

        return res.status(200).json({
            status: 'Success',
            message: `Ticket status updated to ${status}.`
        });
    } catch (error) {
        console.error('[UPDATE_TICKET_ERROR]:', error);
        return res.status(500).json({
            status: 'Fail',
            message: 'Internal server error while updating ticket status.'
        });
    }
};

// ====================================================================
// 2. RECONSTRUCTED LEASE-DRIVEN UTILITY MODULE
// ====================================================================

const getActiveLeaseUnits = async (req, res) => {
    try {
        // Broadened query to find ALL leases so we can see what's wrong
        const query = `
            SELECT 
                l.id AS lease_id, 
                u.room_number, 
                u.id AS unit_id, 
                u.status AS actual_unit_status,
                u.water_billing_flow,
                u.electricity_billing_flow
            FROM leases l
            JOIN units u ON l.unit_id = u.id
        `;

        const [activeLeases] = await db.query(query);

        console.log("=== 🕵️‍♂️ ALL LEASES FOUND ===");
        console.dir(activeLeases, { depth: null });

        return res.status(200).json({
            status: 'Success',
            data: activeLeases
        });
    } catch (error) {
        console.error('[GET_ACTIVE_LEASES_ERROR]:', error);
        return res.status(500).json({
            status: 'Fail',
            message: 'Failed to fetch units.'
        });
    }
};

// Fetch the most recent reading for a unit, checking its structural arrangement first
const getLatestReading = async (req, res) => {
    const { lease_id, utility_type } = req.query;

    if (!lease_id || !utility_type) {
        return res.status(400).json({
            status: 'Fail',
            message: 'lease_id and utility_type are required query parameters.'
        });
    }

    try {
        // 1. Inspect the contract rule layer first by joining units (where billing rules reside)
        const [leases] = await db.query(`
            SELECT u.water_billing_flow, u.electricity_billing_flow 
            FROM leases l
            JOIN units u ON l.unit_id = u.id
            WHERE l.id = ? LIMIT 1
        `, [lease_id]);

        if (leases.length === 0) {
            return res.status(404).json({
                status: 'Fail',
                message: 'Active lease arrangement record not found.'
            });
        }

        const lease = leases[0];
        let billingFlow = 'None';

        // Match utility variants safely
        if (utility_type.toLowerCase() === 'water') {
            billingFlow = lease.water_billing_flow;
        } else if (utility_type.toLowerCase() === 'electricity') {
            billingFlow = lease.electricity_billing_flow;
        } else if (utility_type.toLowerCase() === 'garbage') {
            billingFlow = 'Flat';
        }

        // 2. Intercept non-metered structures immediately to prevent invalid client UI states
        if (billingFlow !== 'Metered') {
            return res.status(200).json({
                status: 'Success',
                is_metered: false,
                billing_flow: billingFlow,
                previous_reading: 0.00,
                message: `This unit relies on a ${billingFlow} configuration for ${utility_type}.`
            });
        }

        // 3. Fallback to isolate consumption baselines for traditional metered flows
        const [readings] = await db.query(`
            SELECT current_reading 
            FROM utility_readings 
            WHERE lease_id = ? AND utility_type = ? 
            ORDER BY reading_date DESC, created_at DESC 
            LIMIT 1
        `, [lease_id, utility_type]);

        const previousReading = readings.length > 0 ? readings[0].current_reading : 0.00;

        return res.status(200).json({
            status: 'Success',
            is_metered: true,
            billing_flow: 'Metered',
            previous_reading: previousReading
        });
    } catch (error) {
        console.error('[GET_LATEST_READING_ERROR]:', error);
        return res.status(500).json({
            status: 'Fail',
            message: 'Failed to safely retrieve baseline utility constraints.'
        });
    }
};

// Submit a completely new utility reading row with multi-tier validation guards
const recordUtilityReading = async (req, res) => {
    const {
        lease_id,
        utility_type,
        previous_reading,
        current_reading,
        rate_per_unit,
        reading_date,
        recorded_by: bodyRecordedBy
    } = req.body;

    const recorded_by = req.user?.id || bodyRecordedBy || '00000000-0000-0000-0000-000000000000';

    if (!lease_id || !utility_type || current_reading === undefined || !rate_per_unit || !reading_date) {
        return res.status(400).json({
            status: 'Fail',
            message: 'Please provide all required fields.'
        });
    }

    try {
        // 1. Fetch the corresponding unit_id and flow types from the database
        const [leases] = await db.query(`
            SELECT u.id AS unit_id, u.water_billing_flow, u.electricity_billing_flow 
            FROM leases l
            JOIN units u ON l.unit_id = u.id
            WHERE l.id = ? LIMIT 1
        `, [lease_id]);

        if (leases.length === 0) {
            return res.status(404).json({
                status: 'Fail',
                message: 'Lease configuration not found.'
            });
        }

        const lease = leases[0];
        const unit_id = lease.unit_id; // Saved to prevent database structural constraint errors

        let billingFlow = 'None';
        if (utility_type.toLowerCase() === 'water') billingFlow = lease.water_billing_flow;
        if (utility_type.toLowerCase() === 'electricity') billingFlow = lease.electricity_billing_flow;

        if (billingFlow !== 'Metered' && utility_type.toLowerCase() !== 'garbage') {
            return res.status(400).json({
                status: 'Fail',
                message: `Action rejected. This active contract uses a ${billingFlow} setup for ${utility_type}.`
            });
        }

        // 2. Anti-fraud math rule checks
        if (parseFloat(current_reading) < parseFloat(previous_reading)) {
            return res.status(400).json({
                status: 'Fail',
                message: 'Current reading cannot be lower than the previous reading.'
            });
        }

        // 3. Complete safe save operation including the required unit_id value
        await db.execute(`
            INSERT INTO utility_readings 
            (lease_id, unit_id, utility_type, previous_reading, current_reading, rate_per_unit, reading_date, recorded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [lease_id, unit_id, utility_type, previous_reading, current_reading, rate_per_unit, reading_date, recorded_by]);

        return res.status(201).json({
            status: 'Success',
            message: `${utility_type} reading successfully logged.`
        });
    } catch (error) {
        console.error('[RECORD_READING_ERROR]:', error);
        return res.status(500).json({
            status: 'Fail',
            message: 'Internal server error while saving utility reading.'
        });
    }
};

// ====================================================================
// 3. ANNOUNCEMENTS & EXPENSES CORE MODULES
// ====================================================================

// Fetch properties managed by the system for the dropdown selection
const getProperties = async (req, res) => {
    try {
        const [properties] = await db.query('SELECT id, name FROM properties ORDER BY name ASC');
        return res.status(200).json({
            status: 'Success',
            data: properties
        });
    } catch (error) {
        console.error('[GET_PROPERTIES_ERROR]:', error);
        return res.status(500).json({
            status: 'Fail',
            message: 'Failed to retrieve properties.'
        });
    }
};

// Fetch all announcements for a property
const getAnnouncements = async (req, res) => {
    const { property_id } = req.query;

    try {
        const [rows] = await db.execute(`
            SELECT a.*, u.full_name AS author_name 
            FROM announcements a
            JOIN users u ON a.created_by = u.id
            WHERE a.property_id = ?
            ORDER BY a.created_at DESC
        `, [property_id]);

        return res.status(200).json({
            status: 'Success',
            data: rows
        });
    } catch (error) {
        console.error('[GET_ANNOUNCEMENTS_ERROR]:', error);
        return res.status(500).json({
            status: 'Fail',
            message: 'Internal server error while fetching announcements.'
        });
    }
};

// Submit a completely new announcement
const createAnnouncement = async (req, res) => {
    const {
        property_id,
        title,
        message,
        created_by: bodyCreatedBy,
        // 🟢 NEW: Destructure the optional scheduling parameters from the form body
        event_date,
        start_time,
        end_time
    } = req.body;

    const created_by = req.user?.id || bodyCreatedBy;

    if (!property_id) return res.status(400).json({ status: 'Fail', message: 'Missing field: property_id' });
    if (!title) return res.status(400).json({ status: 'Fail', message: 'Missing field: title' });
    if (!message) return res.status(400).json({ status: 'Fail', message: 'Missing field: message' });
    if (!created_by) return res.status(400).json({ status: 'Fail', message: 'Missing field: created_by (author ID)' });

    try {
        // 🟢 UPDATED: Included columns and placeholders for scheduling variables
        await db.execute(`
            INSERT INTO announcements (
                property_id, 
                title, 
                message, 
                created_by,
                event_date,
                start_time,
                end_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            property_id,
            title,
            message,
            created_by,
            event_date || null,
            start_time || null,
            end_time || null
        ]);

        return res.status(201).json({
            status: 'Success',
            message: 'Announcement successfully broadcasted.'
        });
    } catch (error) {
        console.error('[CREATE_ANNOUNCEMENT_ERROR]:', error);
        return res.status(500).json({
            status: 'Fail',
            message: 'Internal server error while saving announcement.'
        });
    }
};

// Fetch historical expenses logged for a specific property
const getExpenses = async (req, res) => {
    const { property_id } = req.query;

    if (!property_id) {
        return res.status(400).json({
            status: 'Fail',
            message: 'Property ID is required to fetch expenses.'
        });
    }

    try {
        const [expenses] = await db.query(`
            SELECT e.*, u.full_name AS logger_name 
            FROM expenses e
            JOIN users u ON e.recorded_by = u.id
            WHERE e.property_id = ?
            ORDER BY e.expense_date DESC, e.created_at DESC
        `, [property_id]);

        return res.status(200).json({
            status: 'Success',
            data: expenses
        });
    } catch (error) {
        console.error('[GET_EXPENSES_ERROR]:', error);
        return res.status(500).json({
            status: 'Fail',
            message: 'Failed to retrieve expense logs.'
        });
    }
};

// Log a brand new maintenance expense entry
const recordExpense = async (req, res) => {
    const { property_id, description, amount, category, expense_date, recorded_by: bodyRecordedBy } = req.body;
    const recorded_by = req.user?.id || bodyRecordedBy || '00000000-0000-0000-0000-000000000000';

    if (!property_id || !description || !amount || !category || !expense_date || !recorded_by) {
        return res.status(400).json({
            status: 'Fail',
            message: 'All fields are required to log an expense, including who recorded it.'
        });
    }

    try {
        await db.execute(`
            INSERT INTO expenses (property_id, description, amount, category, expense_date, recorded_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [property_id, description, amount, category, expense_date, recorded_by]);

        return res.status(201).json({
            status: 'Success',
            message: 'Expense item successfully logged.'
        });
    } catch (error) {
        console.error('[RECORD_EXPENSE_ERROR]:', error);
        return res.status(500).json({
            status: 'Fail',
            message: 'Internal server error while logging expense.'
        });
    }
};

// ====================================================================
// 4. TENANT LIFECYCLE (CHECK-IN / TRANSACTION MOVE-OUT) MANAGEMENT
// ====================================================================

// Process Tenant Move-Out / Terminate Lease safely using a MySQL Transaction
const terminateLease = async (req, res) => {
    const { lease_id } = req.params;

    if (!lease_id) {
        return res.status(400).json({
            status: 'Fail',
            message: 'Lease ID is required to process move-out.'
        });
    }

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [leaseRows] = await conn.execute(
            'SELECT unit_id FROM leases WHERE id = ? LIMIT 1',
            [lease_id]
        );

        if (leaseRows.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                status: 'Fail',
                message: 'Lease record not found.'
            });
        }

        const unit_id = leaseRows[0].unit_id;

        await conn.execute(
            'UPDATE leases SET end_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY) WHERE id = ?',
            [lease_id]
        );

        await conn.execute(
            "UPDATE units SET status = 'Vacant' WHERE id = ?",
            [unit_id]
        );

        await conn.commit();

        return res.status(200).json({
            status: 'Success',
            message: 'Tenant successfully checked out. Unit status is now Vacant.'
        });

    } catch (error) {
        await conn.rollback();
        console.error('[LEASE_TERMINATION_TRANSACTION_ERROR]:', error);
        return res.status(500).json({
            status: 'Fail',
            message: 'Transaction failed. Move-out process aborted safely.'
        });
    } finally {
        conn.release();
    }
};

// Fetch all tenants registered via Token who are pending physical arrival
const getPendingMoveIns = async (req, res) => {
    try {
        const query = `
            SELECT 
                l.id AS lease_id, 
                u.room_number, 
                u.category, 
                u.base_rent,
                usr.full_name, 
                usr.phone_number,
                usr.email
            FROM leases l
            JOIN units u ON l.unit_id = u.id
            JOIN users usr ON l.tenant_id = usr.id
            WHERE u.status = 'Vacant'
              AND usr.status = 'Pending'
              AND l.is_active = 1
            ORDER BY l.created_at ASC
        `;

        const [pendingArrivals] = await db.query(query);

        return res.status(200).json({
            status: 'Success',
            data: pendingArrivals
        });
    } catch (error) {
        console.error('[GET_PENDING_MOVE_INS_ERROR]:', error);
        return res.status(500).json({
            status: 'Fail',
            message: 'Failed to retrieve pending arrival lists.'
        });
    }
};

// Confirm Tenant Move-In / Check-In safely using an upgraded MySQL Transaction
const confirmMoveIn = async (req, res) => {
    const { lease_id } = req.params;

    if (!lease_id) {
        return res.status(400).json({
            status: 'Fail',
            message: 'Lease ID is required to process move-in.'
        });
    }

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [leaseRows] = await conn.execute(
            'SELECT unit_id, tenant_id, start_date FROM leases WHERE id = ? LIMIT 1',
            [lease_id]
        );

        if (leaseRows.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                status: 'Fail',
                message: 'Lease record not found.'
            });
        }

        const { unit_id, tenant_id, start_date } = leaseRows[0];

        const today = new Date();
        const leaseStart = new Date(start_date);
        if (today < leaseStart) {
            await conn.rollback();
            return res.status(400).json({
                status: 'Fail',
                message: 'Cannot process check-in before the official lease start date.'
            });
        }

        await conn.execute(
            "UPDATE units SET status = 'Occupied' WHERE id = ?",
            [unit_id]
        );

        await conn.execute(
            "UPDATE users SET status = 'Active' WHERE id = ?",
            [tenant_id]
        );

        await conn.commit();

        return res.status(200).json({
            status: 'Success',
            message: 'Tenant move-in confirmed successfully. Unit is now Occupied and Tenant profile is Active.'
        });

    } catch (error) {
        await conn.rollback();
        console.error('[LEASE_MOVE_IN_TRANSACTION_ERROR]:', error);
        return res.status(500).json({
            status: 'Fail',
            message: 'Transaction failed. Move-in process aborted safely.'
        });
    } finally {
        conn.release();
    }
};

const getUtilityHistory = async (req, res) => {
    try {
        const [logs] = await db.execute(`
            SELECT 
                ur.*, 
                u.room_number AS unit_name, 
                ur.current_reading AS reading_value 
            FROM utility_readings ur
            JOIN units u ON ur.unit_id = u.id
            ORDER BY ur.created_at DESC 
            LIMIT 50
        `);

        res.status(200).json({
            status: 'Success',
            data: logs
        });
    } catch (err) {
        console.error("Error in getUtilityHistory:", err);
        res.status(500).json({ status: 'Error', message: 'Failed to retrieve history' });
    }
};

module.exports = {
    getMaintenanceTickets,
    updateTicketStatus,
    confirmMoveIn,
    getActiveLeaseUnits,
    getLatestReading,
    recordUtilityReading,
    getProperties,
    getAnnouncements,
    createAnnouncement,
    getExpenses,
    recordExpense,
    terminateLease,
    getPendingMoveIns,
    getUtilityHistory
};