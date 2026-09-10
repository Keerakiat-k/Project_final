const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');

// Leave Types
router.get('/types', leaveController.getLeaveTypes);
router.post('/types', leaveController.createLeaveType);
router.put('/types/:id', leaveController.updateLeaveType);

// Employee Leaves
router.get('/my-balances', leaveController.getMyBalances);
router.get('/my-requests', leaveController.getMyRequests);
router.get('/employee/:id/balances', leaveController.getEmployeeBalances);
router.put('/employee/:id/balances', leaveController.updateEmployeeBalances);
const uploadLeave = require('../middleware/uploadLeave');
router.post('/requests', uploadLeave.single('attachment'), leaveController.createLeaveRequest);

// Approvals
router.get('/approvals', leaveController.getLeaveApprovals);
router.put('/requests/:id/status', leaveController.updateLeaveStatus);
router.delete('/requests/:id', leaveController.deleteLeaveRequest);

module.exports = router;
