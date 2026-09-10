const express = require('express');
const router = express.Router();
const timeAttendanceController = require('../controllers/timeAttendanceController');
const { verifyToken } = require('../middlewares/authMiddleware');

// สถานะการเชื่อมต่อเครื่องสแกน
router.get('/status', verifyToken, timeAttendanceController.getDeviceStatus);

// ซิงค์เวลาจากเครื่องสแกน
router.post('/sync', verifyToken, timeAttendanceController.syncLogs);

// ดึงประวัติการลงเวลา
router.get('/logs', verifyToken, timeAttendanceController.getAttendanceLogs);

// ดึงรายชื่อผู้ใช้จากเครื่องสแกน
router.get('/device-users', verifyToken, timeAttendanceController.getDeviceUsers);

// ลบผู้ใช้ออกจากเครื่องสแกน
router.delete('/device-user/:uid', verifyToken, timeAttendanceController.deleteDeviceUser);

module.exports = router;
