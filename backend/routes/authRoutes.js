const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// Route สำหรับ Login (ไม่ต้องใช้ Token)
router.post('/login', authController.login);

// --- ตัวอย่างการใช้งาน Middleware กำหนดสิทธิ์ --- //

// 1. เส้นทางที่ใครๆ ที่ Login แล้วก็เข้าได้ (แค่ตรวจสอบ Token)
router.get('/me', verifyToken, (req, res) => {
    res.status(200).json({ status: 'success', data: req.user });
});

// 2. เส้นทางที่เข้าได้เฉพาะ HR และ Admin เท่านั้น (Authorization)
router.post('/create-employee', verifyToken, requireRole(['HR', 'Admin']), (req, res) => {
    res.status(200).json({ status: 'success', message: 'Employee created successfully' });
});

module.exports = router;