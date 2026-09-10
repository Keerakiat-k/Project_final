const pool = require('../config/db');

// ==========================================
// Companies
// ==========================================
exports.getCompanies = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM companies ORDER BY id ASC');
    res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.createCompany = async (req, res) => {
  const { prefix, name, status } = req.body;
  if (!prefix || !name) return res.status(400).json({ status: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  try {
    const [result] = await pool.query('INSERT INTO companies (prefix, name, status) VALUES (?, ?, ?)', [prefix, name, status || 'Active']);
    res.status(201).json({ status: 'success', message: 'เพิ่มบริษัทสำเร็จ' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ status: 'error', message: 'Prefix นี้มีอยู่ในระบบแล้ว' });
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updateCompany = async (req, res) => {
  const { id } = req.params;
  const { prefix, name, status } = req.body;
  try {
    await pool.query('UPDATE companies SET prefix = ?, name = ?, status = ? WHERE id = ?', [prefix, name, status, id]);
    res.status(200).json({ status: 'success', message: 'แก้ไขข้อมูลบริษัทสำเร็จ' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ status: 'error', message: 'Prefix นี้ถูกใช้งานแล้ว' });
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.deleteCompany = async (req, res) => {
  const { id } = req.params;
  try {
    // Check if any employee uses this company prefix
    const [companyRows] = await pool.query('SELECT prefix FROM companies WHERE id = ?', [id]);
    if (companyRows.length === 0) return res.status(404).json({ status: 'error', message: 'ไม่พบบริษัท' });
    const prefix = companyRows[0].prefix;
    
    const [empRows] = await pool.query('SELECT id FROM employees WHERE company_prefix = ? LIMIT 1', [prefix]);
    if (empRows.length > 0) return res.status(400).json({ status: 'error', message: 'ไม่สามารถลบได้ เนื่องจากยังมีพนักงานสังกัดบริษัทนี้' });

    await pool.query('DELETE FROM companies WHERE id = ?', [id]);
    res.status(200).json({ status: 'success', message: 'ลบบริษัทสำเร็จ' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};


// ==========================================
// Departments
// ==========================================
exports.getDepartments = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM departments ORDER BY id ASC');
    res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.createDepartment = async (req, res) => {
  const { code, name } = req.body;
  if (!code || !name) return res.status(400).json({ status: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  try {
    await pool.query('INSERT INTO departments (code, name) VALUES (?, ?)', [code, name]);
    res.status(201).json({ status: 'success', message: 'เพิ่มแผนกสำเร็จ' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ status: 'error', message: 'รหัสแผนกนี้มีอยู่ในระบบแล้ว' });
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { code, name } = req.body;
  try {
    await pool.query('UPDATE departments SET code = ?, name = ? WHERE id = ?', [code, name, id]);
    res.status(200).json({ status: 'success', message: 'แก้ไขข้อมูลแผนกสำเร็จ' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ status: 'error', message: 'รหัสแผนกนี้ถูกใช้งานแล้ว' });
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  const { id } = req.params;
  try {
    // Check if any employee is in this department
    const [empRows] = await pool.query('SELECT id FROM employees WHERE department_id = ? LIMIT 1', [id]);
    if (empRows.length > 0) return res.status(400).json({ status: 'error', message: 'ไม่สามารถลบได้ เนื่องจากยังมีพนักงานสังกัดแผนกนี้' });

    await pool.query('DELETE FROM departments WHERE id = ?', [id]);
    res.status(200).json({ status: 'success', message: 'ลบแผนกสำเร็จ' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};


// ==========================================
// Roles
// ==========================================
exports.getRoles = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM roles ORDER BY id ASC');
    res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updateRole = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    await pool.query('UPDATE roles SET name = ?, description = ? WHERE id = ?', [name, description, id]);
    res.status(200).json({ status: 'success', message: 'แก้ไขข้อมูลสิทธิ์การใช้งานสำเร็จ' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ status: 'error', message: 'ชื่อสิทธิ์นี้ถูกใช้งานแล้ว' });
    res.status(500).json({ status: 'error', message: error.message });
  }
};


// ==========================================
// Positions
// ==========================================
exports.getPositions = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM positions ORDER BY id ASC');
    res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.createPosition = async (req, res) => {
  const { title, level } = req.body;
  if (!title) return res.status(400).json({ status: 'error', message: 'กรุณากรอกชื่อตำแหน่ง' });
  try {
    await pool.query('INSERT INTO positions (title, level) VALUES (?, ?)', [title, level || 'Staff']);
    res.status(201).json({ status: 'success', message: 'เพิ่มตำแหน่งสำเร็จ' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updatePosition = async (req, res) => {
  const { id } = req.params;
  const { title, level } = req.body;
  try {
    await pool.query('UPDATE positions SET title = ?, level = ? WHERE id = ?', [title, level, id]);
    res.status(200).json({ status: 'success', message: 'แก้ไขตำแหน่งสำเร็จ' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.deletePosition = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM positions WHERE id = ?', [id]);
    res.status(200).json({ status: 'success', message: 'ลบตำแหน่งสำเร็จ' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ==========================================
// 5. จัดการ Permissions แบบ Dynamic
// ==========================================
exports.getPermissions = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM permissions ORDER BY module, id');
    res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getRolePermissions = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT permission_id FROM role_permissions WHERE role_id = ?', [id]);
    res.status(200).json({ status: 'success', data: rows.map(r => r.permission_id) });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updateRolePermissions = async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body; // array of permission_id
  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // ลบสิทธิ์เดิมทั้งหมด
      await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [id]);
      
      // เพิ่มสิทธิ์ใหม่
      if (permissions && permissions.length > 0) {
        const values = permissions.map(permId => [id, permId]);
        await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [values]);
      }
      
      await connection.commit();
      res.status(200).json({ status: 'success', message: 'อัปเดตสิทธิ์สำเร็จ' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
