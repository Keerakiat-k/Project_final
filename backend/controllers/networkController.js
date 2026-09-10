const pool = require('../config/db');

// Helper to mask sensitive strings
const maskValue = (val) => (val && String(val).trim() !== '' ? '••••••••' : null);

// 1. GET /api/network-devices (Get list with search, filter, pagination, category summary, multi-branch support)
exports.getAllDevices = async (req, res) => {
  try {
    const { category, ip_address, search, status, branch, page = 1, limit = 500 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 500;
    const offset = (pageNum - 1) * limitNum;

    let whereClauses = [];
    let queryParams = [];

    if (category && category !== 'All' && category !== 'all') {
      whereClauses.push('category = ?');
      queryParams.push(category);
    }

    if (branch && branch !== 'All' && branch !== 'all' && branch !== 'ทั้งหมด') {
      whereClauses.push('branch_name = ?');
      queryParams.push(branch);
    }

    if (status) {
      whereClauses.push('status = ?');
      queryParams.push(status);
    }

    if (ip_address) {
      whereClauses.push('ip_address LIKE ?');
      queryParams.push(`%${ip_address}%`);
    }

    if (search) {
      const searchPattern = `%${search}%`;
      whereClauses.push('(device_name LIKE ? OR brand_name LIKE ? OR model LIKE ? OR remark LIKE ? OR ip_address LIKE ? OR branch_name LIKE ?)');
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total Count Query
    const countQuery = `SELECT COUNT(*) as total FROM network_devices ${whereSQL}`;
    const [countRows] = await pool.query(countQuery, queryParams);
    const total = countRows[0]?.total || 0;

    // Data Query
    const dataQuery = `
      SELECT * FROM network_devices 
      ${whereSQL} 
      ORDER BY id ASC 
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(dataQuery, [...queryParams, limitNum, offset]);

    // Mask passwords for list view
    const maskedRows = rows.map(device => {
      const copy = { ...device };
      copy.login_password_masked = maskValue(copy.login_password);
      copy.access_key_masked = maskValue(copy.access_key);
      delete copy.login_password;
      delete copy.access_key;
      return copy;
    });

    // Summary count by category (filtered by branch if branch filter is applied)
    let summaryWhereClauses = [];
    let summaryQueryParams = [];
    if (branch && branch !== 'All' && branch !== 'all' && branch !== 'ทั้งหมด') {
      summaryWhereClauses.push('branch_name = ?');
      summaryQueryParams.push(branch);
    }
    const summaryWhereSQL = summaryWhereClauses.length > 0 ? `WHERE ${summaryWhereClauses.join(' AND ')}` : '';

    const [summaryRows] = await pool.query(`
      SELECT category, COUNT(*) as count FROM network_devices ${summaryWhereSQL} GROUP BY category
    `, summaryQueryParams);

    const summary_by_category = {
      Server: 0,
      'Network & Security': 0,
      'Access Point': 0,
      Printer: 0,
      'VoIP & Time Access': 0,
      CCTV: 0,
      Other: 0
    };

    summaryRows.forEach(r => {
      summary_by_category[r.category] = r.count;
    });

    return res.status(200).json({
      success: true,
      message: 'ดึงข้อมูลรายการอุปกรณ์เครือข่ายสำเร็จ',
      data: maskedRows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(total / limitNum) || 1
      },
      summary_by_category
    });

  } catch (error) {
    console.error('Error fetching network devices:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลอุปกรณ์เครือข่าย' });
  }
};

// 2. GET /api/network-devices/:id (Get single device detail)
exports.getDeviceById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM network_devices WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลอุปกรณ์เครือข่ายตาม ID ที่ระบุ' });
    }

    const device = { ...rows[0] };
    device.login_password_masked = maskValue(device.login_password);
    device.access_key_masked = maskValue(device.access_key);
    delete device.login_password;
    delete device.access_key;

    return res.status(200).json({ success: true, data: device });
  } catch (error) {
    console.error('Error fetching network device by ID:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

// 3. POST /api/network-devices (Create new device with IP duplication check and branch_name)
exports.createDevice = async (req, res) => {
  const {
    ip_address,
    device_name,
    brand_name,
    model,
    login_user,
    login_password,
    manage_program,
    login_ssid,
    access_key,
    purchase_date,
    category,
    branch_name,
    remark,
    status
  } = req.body;

  if (!ip_address || !device_name) {
    return res.status(400).json({
      success: false,
      message: 'กรุณากรอก IP Address และชื่ออุปกรณ์'
    });
  }

  try {
    // Check for IP duplication
    const [existing] = await pool.query('SELECT id, device_name FROM network_devices WHERE ip_address = ?', [ip_address.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `IP Address ${ip_address} ถูกใช้งานแล้วโดยอุปกรณ์ "${existing[0].device_name}"`
      });
    }

    const deviceCategory = category || 'Other';
    const deviceBranch = branch_name ? branch_name.trim() : 'ASCG HQ';
    const deviceStatus = status || 'active';

    const [result] = await pool.query(
      `INSERT INTO network_devices (
        ip_address, device_name, brand_name, model, login_user, login_password,
        manage_program, login_ssid, access_key, purchase_date, category, branch_name, remark, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ip_address.trim(),
        device_name.trim(),
        brand_name ? brand_name.trim() : null,
        model ? model.trim() : null,
        login_user ? login_user.trim() : null,
        login_password ? login_password.trim() : null,
        manage_program ? manage_program.trim() : null,
        login_ssid ? login_ssid.trim() : null,
        access_key ? access_key.trim() : null,
        purchase_date || null,
        deviceCategory,
        deviceBranch,
        remark ? remark.trim() : null,
        deviceStatus
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'เพิ่มข้อมูลอุปกรณ์เครือข่ายเรียบร้อยแล้ว',
      data: {
        id: result.insertId,
        ip_address: ip_address.trim(),
        device_name: device_name.trim(),
        category: deviceCategory,
        branch_name: deviceBranch,
        status: deviceStatus,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error creating network device:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลอุปกรณ์' });
  }
};

// 4. PUT /api/network-devices/:id (Update device)
exports.updateDevice = async (req, res) => {
  const { id } = req.params;
  const {
    ip_address,
    device_name,
    brand_name,
    model,
    login_user,
    login_password,
    manage_program,
    login_ssid,
    access_key,
    purchase_date,
    category,
    branch_name,
    remark,
    status
  } = req.body;

  try {
    const [existing] = await pool.query('SELECT * FROM network_devices WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลอุปกรณ์เครือข่ายตาม ID ที่ระบุ' });
    }

    // Check IP duplicate if IP is updated
    if (ip_address && ip_address.trim() !== existing[0].ip_address) {
      const [dup] = await pool.query('SELECT id, device_name FROM network_devices WHERE ip_address = ? AND id != ?', [ip_address.trim(), id]);
      if (dup.length > 0) {
        return res.status(400).json({
          success: false,
          message: `IP Address ${ip_address} ถูกใช้งานแล้วโดยอุปกรณ์ "${dup[0].device_name}"`
        });
      }
    }

    const updatedIp = ip_address !== undefined ? (ip_address ? ip_address.trim() : null) : existing[0].ip_address;
    const updatedDeviceName = device_name !== undefined ? (device_name ? device_name.trim() : null) : existing[0].device_name;
    const updatedBrand = brand_name !== undefined ? (brand_name ? brand_name.trim() : null) : existing[0].brand_name;
    const updatedModel = model !== undefined ? (model ? model.trim() : null) : existing[0].model;
    const updatedUser = login_user !== undefined ? (login_user ? login_user.trim() : null) : existing[0].login_user;
    const updatedPassword = (login_password !== undefined && login_password !== null && String(login_password).trim() !== '') ? login_password.trim() : existing[0].login_password;
    const updatedManage = manage_program !== undefined ? (manage_program ? manage_program.trim() : null) : existing[0].manage_program;
    const updatedSsid = login_ssid !== undefined ? (login_ssid ? login_ssid.trim() : null) : existing[0].login_ssid;
    const updatedAccessKey = (access_key !== undefined && access_key !== null && String(access_key).trim() !== '') ? access_key.trim() : existing[0].access_key;
    const updatedPurDate = purchase_date !== undefined ? (purchase_date || null) : existing[0].purchase_date;
    const updatedCategory = category !== undefined ? category : existing[0].category;
    const updatedBranch = branch_name !== undefined ? (branch_name ? branch_name.trim() : 'ASCG HQ') : existing[0].branch_name;
    const updatedRemark = remark !== undefined ? (remark ? remark.trim() : null) : existing[0].remark;
    const updatedStatus = status !== undefined ? status : existing[0].status;

    await pool.query(
      `UPDATE network_devices SET
        ip_address = ?, device_name = ?, brand_name = ?, model = ?, login_user = ?, login_password = ?,
        manage_program = ?, login_ssid = ?, access_key = ?, purchase_date = ?, category = ?, branch_name = ?, remark = ?, status = ?
       WHERE id = ?`,
      [
        updatedIp,
        updatedDeviceName,
        updatedBrand,
        updatedModel,
        updatedUser,
        updatedPassword,
        updatedManage,
        updatedSsid,
        updatedAccessKey,
        updatedPurDate,
        updatedCategory,
        updatedBranch,
        updatedRemark,
        updatedStatus,
        id
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'อัปเดตข้อมูลอุปกรณ์เครือข่ายสำเร็จ'
    });
  } catch (error) {
    console.error('Error updating network device:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลอุปกรณ์เครือข่าย' });
  }
};

// 5. DELETE /api/network-devices/:id (Delete network device)
exports.deleteDevice = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM network_devices WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลอุปกรณ์เครือข่ายตาม ID ที่ระบุ' });
    }
    return res.status(200).json({ success: true, message: 'ลบข้อมูลอุปกรณ์เครือข่ายสำเร็จ' });
  } catch (error) {
    console.error('Error deleting network device:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบข้อมูลอุปกรณ์เครือข่าย' });
  }
};

// 6. POST /api/network-devices/:id/reveal-passwords (Reveal real passwords with Audit Log)
exports.revealPasswords = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const [rows] = await pool.query('SELECT id, login_password, access_key FROM network_devices WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลอุปกรณ์เครือข่ายตาม ID ที่ระบุ' });
    }

    const device = rows[0];

    // Record Audit Log
    const userId = req.user ? req.user.id : null;
    const userName = req.user ? (req.user.name || req.user.email || req.user.role) : 'Unknown User';
    const clientIp = (req.headers && req.headers['x-forwarded-for']) || (req.socket && req.socket.remoteAddress) || req.ip || null;

    try {
      await pool.query(
        `INSERT INTO audit_logs (user_id, user_name, device_id, action, reason, ip_address) VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, userName, Number(id), 'REVEAL_PASSWORD', reason || 'Request password reveal', clientIp]
      );
    } catch (auditErr) {
      console.warn('Failed to insert audit log:', auditErr.message);
    }

    return res.status(200).json({
      success: true,
      data: {
        id: Number(id),
        login_password: device.login_password || '',
        access_key: device.access_key || ''
      },
      audit_logged: true
    });
  } catch (error) {
    console.error('Error revealing passwords for device:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการถอดรหัสรหัสผ่าน' });
  }
};

// 7. GET /api/network-devices/audit-logs (Get Network Password Reveal Audit Logs)
exports.getAuditLogs = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        a.id,
        a.user_id,
        a.user_name,
        a.device_id,
        a.action,
        a.reason,
        a.ip_address AS client_ip,
        a.created_at,
        d.device_name,
        d.ip_address AS device_ip,
        d.category AS device_category,
        d.brand_name,
        d.model
      FROM audit_logs a
      LEFT JOIN network_devices d ON a.device_id = d.id
      WHERE a.action = 'REVEAL_PASSWORD'
      ORDER BY a.created_at DESC
      LIMIT 300
    `);

    return res.status(200).json({
      success: true,
      message: 'ดึงข้อมูล Audit Logs สำเร็จ',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Audit Logs' });
  }
};
