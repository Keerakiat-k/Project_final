const express = require('express');
const router = express.Router();

// นำเข้า Controller
const employeeController = require('../controllers/employeeController');
const { verifyToken, requirePermission } = require('../middlewares/authMiddleware');

// API สำหรับดึงข้อมูล (Read Operations)
router.get('/next-code', employeeController.getNextEmployeeCode);
router.get('/', employeeController.getAllEmployees);
router.get('/departments', employeeController.getAllDepartments);
router.get('/resigned/current-month', employeeController.getResignedEmployeesThisMonth);
router.get('/new/current-month', employeeController.getNewEmployeesThisMonth);
router.get('/stats/turnover', employeeController.getTurnoverStats);
router.get('/stats/recent-activity', employeeController.getRecentActivity);
router.get('/system-accounts', verifyToken, employeeController.getSystemAccounts);
router.get('/system-accounts/available', verifyToken, employeeController.getAvailableEmployeesForSystemAccount);
router.post('/system-accounts', verifyToken, employeeController.addSystemAccount);
router.delete('/system-accounts/:id', verifyToken, employeeController.removeSystemAccount);
router.get('/:id', employeeController.getEmployeeById);
router.get('/:id/assets', employeeController.getEmployeeAssets);

// API สำหรับเขียน/แก้ไขข้อมูล (Write / Mutation Operations)
router.post('/', verifyToken, employeeController.createEmployee);
router.put('/:id', verifyToken, employeeController.updateEmployee);
router.put('/:id/role', verifyToken, employeeController.updateEmployeeRole);
router.put('/:id/reset-password', verifyToken, employeeController.resetEmployeePassword);
router.put('/:id/status', employeeController.updateEmployeeStatus);
router.post('/:id/offboard', employeeController.offboardEmployee);
router.put('/:id/revoke-access', verifyToken, employeeController.revokeEmployeeAccess);
router.put('/:id/grant-access', verifyToken, employeeController.grantEmployeeAccess);
router.post('/clear-notifications', verifyToken, employeeController.clearNotifications);
router.post('/:id/send-welcome-email', verifyToken, employeeController.sendWelcomeEmail);
router.delete('/:id', verifyToken, employeeController.deleteEmployee);

// API สำหรับอัปโหลดรูปโปรไฟล์พนักงาน
const uploadProfile = require('../middleware/uploadProfile');
router.post('/:id/profile-image', verifyToken, uploadProfile.single('profile_image'), employeeController.uploadProfileImage);

module.exports = router;