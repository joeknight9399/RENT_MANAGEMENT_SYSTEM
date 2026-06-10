const express = require('express');
const router = express.Router();

const {
    getMaintenanceTickets,
    updateTicketStatus,
    getActiveLeaseUnits,
    getLatestReading,
    recordUtilityReading,
    getProperties,
    getAnnouncements,
    createAnnouncement,
    getExpenses,
    recordExpense,
    terminateLease,
    confirmMoveIn,
    getPendingMoveIns,
    getUtilityHistory
} = require('../controllers/caretakerController');

// Maintenance & Utilities
router.get('/tickets', getMaintenanceTickets);
router.patch('/tickets/:id', updateTicketStatus);
router.get('/active-leases', getActiveLeaseUnits);
router.get('/latest-reading', getLatestReading);
router.post('/utilities', recordUtilityReading);
router.get('/utility-history', getUtilityHistory); // This route now has the function defined

router.patch('/leases/:lease_id/terminate', terminateLease);
router.patch('/leases/:lease_id/confirm-move-in', confirmMoveIn);
router.get('/pending-move-ins', getPendingMoveIns);

// Announcements
router.get('/properties', getProperties);
router.get('/announcements', getAnnouncements);
router.post('/announcements', createAnnouncement);

// 💰 Expense Tracking Routes
router.get('/expenses', getExpenses);
router.post('/expenses', recordExpense);

module.exports = router;