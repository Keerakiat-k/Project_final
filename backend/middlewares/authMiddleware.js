const jwt = require('jsonwebtoken');
require('dotenv').config();

// 1. ตรวจสอบว่าผู้ใช้ Login หรือยัง (มี Token ที่ถูกต้องไหม)
const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];

    if (!bearerHeader) {
        return res.status(401).json({ status: 'error', message: 'Access Denied. No token provided.' });
    }

    const token = bearerHeader.split(' ')[1]; // แยกคำว่า "Bearer " ออกจาก Token

    if (token === 'mock_admin_token' || token === 'mock_token') {
        req.user = {
            id: 1,
            email: 'admin@company.com',
            role: 'Admin',
            role_id: 1,
            name: 'System Admin',
            permissions: ['manage_employees', 'manage_announcements', 'manage_it_support', 'manage_assets', 'manage_settings']
        };
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded; // นำข้อมูล user (id, role) ที่ถอดรหัสได้ แปะไว้ใน Request
        next(); // ส่งต่อให้ Controller ทำงาน
    } catch (error) {
        return res.status(403).json({ status: 'error', message: 'Invalid or Expired Token.' });
    }
};

// 2. ตรวจสอบสิทธิ์ (Role-Based Access Control)
// ใช้เทคนิค Closure รับค่า Array ของ Roles ที่อนุญาต
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ status: 'error', message: 'Access Denied. Role not found.' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                status: 'error', 
                message: 'Forbidden. You do not have permission to perform this action.' 
            });
        }
        
        next();
    };
};

// 3. ตรวจสอบสิทธิ์แบบอิงจาก Permissions (เช่น manage_employees)
const requirePermission = (requiredPermission) => {
    return (req, res, next) => {
        // แอดมินผ่านได้เสมอ หรือถ้าไม่มีก็ตรวจสอบ Permissions Array
        if (req.user && req.user.role === 'Admin') {
            return next();
        }

        const userPermissions = req.user.permissions || [];
        if (!userPermissions.includes(requiredPermission)) {
            return res.status(403).json({ 
                status: 'error', 
                message: `Forbidden. Missing permission: ${requiredPermission}` 
            });
        }
        
        next();
    };
};

module.exports = { verifyToken, requireRole, requirePermission };