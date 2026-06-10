const db = require('../config/db');
const crypto = require('crypto');

/**
 * @desc    Fetch the single most recent historical resource reading for a unit asset
 * @route   GET /api/v1/utility/units/:unit_id/types/:utility_type/latest
 * @access  Private (Caretaker/Admin)
 */
exports.getLatestReading = async (req, res) => {
    try {
        const { unit_id, utility_type } = req.params;

        // 1. Structural Parameter Sanity Validation
        const normalizedType = utility_type ? utility_type.trim() : '';
        const allowedTypes = ['Water', 'Electricity'];

        if (!unit_id || !allowedTypes.includes(normalizedType)) {
            return res.status(400).json({
                status: 'Fail',
                message: `Invalid tracking scope parameters. Permitted utility types: ${allowedTypes.join(', ')}`
            });
        }

        // Standardize on compiled execution queries
        const [rows] = await db.execute(
            `SELECT current_reading, reading_date 
             FROM utility_readings 
             WHERE unit_id = ? AND utility_type = ? 
             ORDER BY reading_date DESC, created_at DESC 
             LIMIT 1`,
            [unit_id, normalizedType]
        );

        const latestReading = rows.length > 0 ? parseFloat(rows[0].current_reading) : 0.00;

        return res.status(200).json({
            status: 'Success',
            data: {
                unit_id,
                utility_type: normalizedType,
                latest_reading: latestReading,
                recorded_at: rows.length > 0 ? rows[0].reading_date : null
            }
        });

    } catch (error) {
        console.error('[GET_LATEST_READING_ERROR]:', error);
        return res.status(500).json({
            status: 'Error',
            message: 'Internal data gateway failure retrieving historical metrics.'
        });
    }
};

/**
 * @desc    Validate consumption data parameters and append meter entries to history log
 * @route   POST /api/v1/utility/readings
 * @access  Private (Caretaker/Admin)
 */
exports.logUtilityReading = async (req, res) => {
    try {
        const { lease_id, unit_id, utility_type, current_reading, reading_date } = req.body;

        // Safe access safeguard prevents system middleware crashes
        const recorded_by = req.user?.id;
        if (!recorded_by) {
            return res.status(401).json({
                status: 'Fail',
                message: 'Unverified request context identity token tracking reference.'
            });
        }

        // 1. Dynamic Payload Integrity Validation
        const normalizedType = utility_type ? utility_type.trim() : '';
        const allowedTypes = ['Water', 'Electricity'];

        if (!lease_id || !unit_id || !allowedTypes.includes(normalizedType) || current_reading === undefined || !reading_date) {
            return res.status(400).json({
                status: 'Fail',
                message: 'Missing or corrupted required payload metrics metadata fields.'
            });
        }

        const numericCurrentReading = parseFloat(current_reading);
        if (isNaN(numericCurrentReading) || numericCurrentReading < 0) {
            return res.status(400).json({
                status: 'Fail',
                message: 'Meter value configurations must be defined as positive decimal coordinates.'
            });
        }

        // 2. Fetch Bound Unit Asset Constraints
        const [unitConfig] = await db.execute(
            "SELECT water_rate_per_unit, electricity_rate_per_unit FROM units WHERE id = ? LIMIT 1",
            [unit_id]
        );

        if (unitConfig.length === 0) {
            return res.status(404).json({ status: 'Fail', message: 'Target property inventory unit asset not found.' });
        }

        // Explicit structural billing assignment matching strict type rules
        const ratePerUnit = normalizedType === 'Water'
            ? parseFloat(unitConfig[0].water_rate_per_unit)
            : parseFloat(unitConfig[0].electricity_rate_per_unit);

        // 3. Mathematical Consistency Gate (Prevent Negative Differentials)
        const [lastRecord] = await db.execute(
            `SELECT current_reading 
             FROM utility_readings 
             WHERE unit_id = ? AND utility_type = ? 
             ORDER BY reading_date DESC, created_at DESC 
             LIMIT 1`,
            [unit_id, normalizedType]
        );

        const previousReading = lastRecord.length > 0 ? parseFloat(lastRecord[0].current_reading) : 0.00;

        if (numericCurrentReading < previousReading) {
            return res.status(400).json({
                status: 'Fail',
                message: `Mathematical exception. Incoming current reading (${numericCurrentReading}) cannot be less than the historic baseline (${previousReading}).`
            });
        }

        // 4. Atomic Structural Appending (Unifying Programmatic UUID Keys across elements)
        const readingId = crypto.randomUUID();
        await db.execute(
            `INSERT INTO utility_readings 
                (id, lease_id, unit_id, utility_type, previous_reading, current_reading, rate_per_unit, reading_date, recorded_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                readingId,
                lease_id,
                unit_id,
                normalizedType,
                previousReading,
                numericCurrentReading,
                ratePerUnit,
                reading_date,
                recorded_by
            ]
        );

        return res.status(201).json({
            status: 'Success',
            message: `${normalizedType} transaction usage log successfully calculated and preserved.`,
            data: { id: readingId }
        });

    } catch (error) {
        console.error('[LOG_UTILITY_READING_ERROR]:', error);
        // Hardening: Return generic status messages to hide server implementation mechanics
        return res.status(500).json({
            status: 'Error',
            message: 'Internal data transaction fault recording current asset utility parameters.'
        });
    }
};