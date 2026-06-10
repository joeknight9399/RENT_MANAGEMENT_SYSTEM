const db = require('../config/db');
const crypto = require('crypto');

/**
 * @desc    Fetch all managed properties
 * @route   GET /api/v1/properties
 * @access  Private (Admin/Caretaker)
 */
exports.getAllProperties = async (req, res) => {
    try {
        const [properties] = await db.execute('SELECT * FROM properties ORDER BY name ASC');

        return res.status(200).json({
            status: 'Success',
            results: properties.length,
            data: { properties }
        });
    } catch (error) {
        console.error('[GET_PROPERTIES_ERROR]:', error);
        return res.status(500).json({ status: 'Error', message: 'Failed to fetch property records.' });
    }
};

/**
 * @desc    Register a new property asset
 * @route   POST /api/v1/properties
 * @access  Private (Admin)
 */
exports.createProperty = async (req, res) => {
    try {
        const { name, location } = req.body;

        if (!name || !location) {
            return res.status(400).json({ status: 'Fail', message: 'Property name and location are required.' });
        }

        const propertyId = crypto.randomUUID();

        await db.execute(
            'INSERT INTO properties (id, name, location) VALUES (?, ?, ?)',
            [propertyId, name.trim(), location.trim()]
        );

        return res.status(201).json({
            status: 'Success',
            message: 'Property asset created successfully.',
            data: { propertyId }
        });
    } catch (error) {
        console.error('[CREATE_PROPERTY_ERROR]:', error);
        return res.status(500).json({ status: 'Error', message: 'Server fault encountered while saving property.' });
    }
};

/**
 * @desc    Add a structured unit room into a verified property container
 * @route   POST /api/v1/units
 * @access  Private (Admin)
 */
exports.addUnit = async (req, res) => {
    try {
        const { property_id, room_number, category, base_rent, deposit_amount } = req.body;

        // Clean up text boundaries safely
        const safeCategory = category ? category.trim() : '';

        if (!property_id || !room_number || !safeCategory || base_rent === undefined || deposit_amount === undefined) {
            return res.status(400).json({ status: 'Fail', message: 'All unit specification fields are mandatory.' });
        }

        // --- OLD HARDCODED VALIDATION ARRAY REMOVED ---

        if (parseFloat(base_rent) < 0 || parseFloat(deposit_amount) < 0) {
            return res.status(400).json({ status: 'Fail', message: 'Financial ledger fields cannot be negative values.' });
        }

        const unitId = crypto.randomUUID();

        // Enforce safe status initialization state natively
        await db.execute(
            `INSERT INTO units (id, property_id, room_number, category, base_rent, deposit_amount, status) 
             VALUES (?, ?, ?, ?, ?, ?, 'Vacant')`,
            [unitId, property_id, room_number.trim(), safeCategory, base_rent, deposit_amount] // Using trimmed safeCategory here
        );

        return res.status(201).json({
            status: 'Success',
            message: `Unit ${room_number} successfully mapped to property.`,
            data: { unitId }
        });

    } catch (error) {
        console.error('[ADD_UNIT_ERROR]:', error);

        // HARDENING: Handle Unique Key Violations (Room already exists in property)
        if (error.errno === 1062) {
            return res.status(400).json({
                status: 'Fail',
                message: 'This room identifier is already registered inside this specific property asset.'
            });
        }

        // HARDENING: Handle Foreign Key Violations (Property container doesn't exist)
        if (error.errno === 1452) {
            return res.status(404).json({
                status: 'Fail',
                message: 'Targeting reference mismatch. The provided property parent ID does not exist.'
            });
        }

        return res.status(500).json({ status: 'Error', message: 'Internal server error while registering inventory unit.' });
    }
};
/**
 * @desc    Get inventory rooms filtered dynamically by status or property parent container
 * @route   GET /api/v1/units
 * @access  Private (Admin/Caretaker)
 */
exports.getUnits = async (req, res) => {
    try {
        console.log("🎯 SUCCESS: Executing hardened query matching inventory routing rules.");

        const { status, property_id } = req.query;

        // HARDENING: Enforce strict categorical constraints on external status query params
        const validStatuses = ['Vacant', 'Occupied', 'Maintenance'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                status: 'Fail',
                message: `Invalid query state parameters. Allowed metrics: ${validStatuses.join(', ')}`
            });
        }

        let query = `
            SELECT u.*, p.name AS property_name, p.location AS property_location 
            FROM units u
            INNER JOIN properties p ON u.property_id = p.id
        `;
        let conditions = [];
        let params = [];

        if (status) {
            conditions.push('u.status = ?');
            params.push(status);
        }

        if (property_id) {
            conditions.push('u.property_id = ?');
            params.push(property_id);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY p.name ASC, u.room_number ASC';

        const [units] = await db.execute(query, params);

        return res.status(200).json({
            status: 'Success',
            results: units.length,
            data: { units }
        });
    } catch (error) {
        console.error('[GET_UNITS_ERROR]:', error);
        return res.status(500).json({ status: 'Error', message: 'Failed to retrieve unit ledger listings.' });
    }
};

/**
 * @desc    Perform isolated dynamic updates on unit utilities without resetting omitted configurations
 * @route   PATCH /api/v1/units/:id/billing
 * @access  Private (Admin)
 */
exports.updateUnitBilling = async (req, res) => {
    try {
        const { id } = req.params;
        const { water_billing_flow, electricity_billing_flow, garbage_fee, water_flat_rate } = req.body;

        const validFlows = ['Metered', 'Flat', 'Prepaid Token'];
        if (water_billing_flow && !validFlows.includes(water_billing_flow)) {
            return res.status(400).json({ status: 'Fail', message: 'Invalid water billing configuration profile.' });
        }
        if (electricity_billing_flow && !validFlows.includes(electricity_billing_flow)) {
            return res.status(400).json({ status: 'Fail', message: 'Invalid electricity billing configuration profile.' });
        }

        if ((garbage_fee !== undefined && garbage_fee < 0) || (water_flat_rate !== undefined && water_flat_rate < 0)) {
            return res.status(400).json({ status: 'Fail', message: 'Utility transactional configurations cannot be negative numbers.' });
        }

        // HARDENING: Construct true partial updates dynamically to prevent historical data corruption
        let updateFields = [];
        let queryParams = [];

        if (water_billing_flow) {
            updateFields.push('water_billing_flow = ?');
            queryParams.push(water_billing_flow);
        }
        if (electricity_billing_flow) {
            updateFields.push('electricity_billing_flow = ?');
            queryParams.push(electricity_billing_flow);
        }
        if (garbage_fee !== undefined) {
            updateFields.push('garbage_fee = ?');
            queryParams.push(garbage_fee);
        }
        if (water_flat_rate !== undefined) {
            updateFields.push('water_flat_rate = ?');
            queryParams.push(water_flat_rate);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ status: 'Fail', message: 'Provide at least one modification attribute parameter.' });
        }

        queryParams.push(id); // Append the primary key target for the final WHERE restriction clause

        const [result] = await db.execute(
            `UPDATE units SET ${updateFields.join(', ')} WHERE id = ?`,
            queryParams
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'Fail', message: 'Target inventory room asset not found.' });
        }

        return res.status(200).json({
            status: 'Success',
            message: 'Utility billing specifications adjusted safely.'
        });

    } catch (error) {
        console.error('[UPDATE_UNIT_BILLING_ERROR]:', error);
        return res.status(500).json({ status: 'Error', message: 'Server fault encountered during structural asset reconfiguration.' });
    }
};