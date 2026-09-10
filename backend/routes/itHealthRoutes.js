const express = require('express');
const router = express.Router();
const itHealthController = require('../controllers/itHealthController');
const { verifyToken, requirePermission } = require('../middlewares/authMiddleware');

// ดึงรายการสถานะตรวจเช็คประจำวัน
router.get('/it-health-check', verifyToken, requirePermission('manage_it_support'), itHealthController.getHealthChecks);

// ดึงรายการวันที่ทั้งหมด
router.get('/it-health-check/dates', verifyToken, requirePermission('manage_it_support'), itHealthController.getAvailableDates);

// ดึงข้อมูลสรุปผู้บริหาร Real-Time (Executive Summary)
router.get('/it-health-check/executive-summary', verifyToken, requirePermission('manage_it_support'), itHealthController.getExecutiveSummary);

// ดึงข้อมูลสำหรับ Export Excel
router.get('/it-health-check/export', verifyToken, requirePermission('manage_it_support'), itHealthController.getExportData);

// 🌟 ดาวน์โหลดไฟล์ Excel โดยอิงจากไฟล์ต้นแบบ IT Report 08-2026.xlsx 100% 🌟
router.get('/it-health-check/download-excel', verifyToken, requirePermission('manage_it_support'), itHealthController.downloadExcelReport);

// บันทึก/อัปเดตสถานะการตรวจเช็ครายวันผ่านเว็บ
router.post('/it-health-check', verifyToken, requirePermission('manage_it_support'), itHealthController.saveHealthCheck);

module.exports = router;
