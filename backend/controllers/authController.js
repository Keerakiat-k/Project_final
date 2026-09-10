const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        // 1. Validation
        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Please provide email and password' });
        }

        // 2. ค้นหาพนักงานจากอีเมล, Employee Code หรือ Username
        const inputIdentifier = email.trim();
        const [users] = await db.execute(`
            SELECT e.id, e.email, e.status, e.profile_image, e.employee_code, e.role_id, r.name as role_name 
            FROM employees e
            JOIN roles r ON e.role_id = r.id
            WHERE e.email = ? 
               OR e.employee_code = ?
               OR e.email LIKE ?
            ORDER BY (e.email = ?) DESC, (e.employee_code = ?) DESC
            LIMIT 1
        `, [
          inputIdentifier,
          inputIdentifier,
          inputIdentifier.includes('@') ? inputIdentifier : `${inputIdentifier}@%`,
          inputIdentifier,
          inputIdentifier
        ]);

        if (users.length === 0) {
            return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
        }

        const user = users[0];

        // 3. ตรวจสอบสถานะพนักงาน
        if (user.status !== 'Active') {
            return res.status(403).json({ status: 'error', message: 'Account is disabled or suspended' });
        }

        // 4. ดึงข้อมูลรหัสผ่านที่ถูก Hash ไว้
        const [credentials] = await db.execute(
            `SELECT password_hash FROM employee_credentials WHERE employee_id = ?`, 
            [user.id]
        );

        if (credentials.length === 0) {
            return res.status(401).json({ status: 'error', message: 'Credentials not found for this user' });
        }

        // 5. เปรียบเทียบรหัสผ่าน
        const isMatch = await bcrypt.compare(password, credentials[0].password_hash);
        
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
        }

        // 6. อัปเดตเวลา Login ล่าสุด
        await db.execute(`UPDATE employee_credentials SET last_login = NOW() WHERE employee_id = ?`, [user.id]);

        // 6.5. Fetch Permissions for this Role
        const [permissionsRows] = await db.execute(`
            SELECT p.key_name 
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            WHERE rp.role_id = (SELECT role_id FROM employees WHERE id = ?)
        `, [user.id]);
        
        const permissions = permissionsRows.map(row => row.key_name);

        // 7. สร้าง JWT Token (Payload ห้ามใส่ Password เด็ดขาด)
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role_name,
            role_id: user.role_id,
            profile_image: user.profile_image,
            permissions: permissions // เพิ่ม permissions เข้าไปใน token
        };

        const tokenExpires = rememberMe ? '30d' : (process.env.JWT_EXPIRES_IN || '30d');
        const token = jwt.sign(payload, process.env.JWT_SECRET, { 
            expiresIn: tokenExpires 
        });

        // 8. ส่งผลลัพธ์กลับไปยัง Client
        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            token: token,
            user: payload
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

module.exports = { login };