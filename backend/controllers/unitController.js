const db = require('../config/db');

exports.getAllUnits = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM units ORDER BY room_number ASC');
        res.status(200).json({ data: { units: rows } });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ message: "Failed to fetch units." });
    }
};

exports.updateUnitStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await db.query('UPDATE units SET status = ? WHERE id = ?', [status, id]);
        res.status(200).json({ message: "Status updated successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to update unit status." });
    }
};