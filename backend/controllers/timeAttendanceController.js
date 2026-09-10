const zktecoService = require('../services/zktecoService');
const pool = require('../config/db');

// 1. สถานะการเชื่อมต่อเครื่องสแกน
exports.getDeviceStatus = async (req, res) => {
  try {
    const status = await zktecoService.getStatus();
    res.json({ status: 'success', data: status });
  } catch (error) {
    console.error('Error fetching device status:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 2. สั่งซิงค์เวลาจากเครื่องสแกนลง MySQL
exports.syncLogs = async (req, res) => {
  try {
    const result = await zktecoService.syncAttendancesToDatabase();
    res.json({
      status: 'success',
      message: `ซิงค์เวลาเรียบร้อยแล้ว (${result.totalDeviceLogs} รายการ, บันทึกใหม่ ${result.newSyncedLogs} รายการ)`,
      data: result
    });
  } catch (error) {
    console.error('Error syncing attendance logs:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 3. ดึงประวัติการลงเวลา (ค้นหา / กรอง / แบ่งหน้า)
exports.getAttendanceLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      startDate, 
      endDate, 
      search, 
      department,
      punchType
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    let whereConditions = [];

    if (startDate) {
      whereConditions.push('DATE(a.punch_time) >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereConditions.push('DATE(a.punch_time) <= ?');
      params.push(endDate);
    }
    if (search && search.trim() !== '') {
      whereConditions.push('(a.employee_name LIKE ? OR a.employee_code LIKE ? OR a.device_user_id LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }
    if (department) {
      whereConditions.push('d.name = ?');
      params.push(department);
    }
    if (punchType) {
      whereConditions.push('a.punch_type = ?');
      params.push(punchType);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // นับจำนวนทั้งหมด
    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM attendance_logs a
      LEFT JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereClause}
    `, params);

    const total = countResult[0].total;

    // ดึงข้อมูล
    const queryParams = [...params, parseInt(limit, 10), offset];
    const [rows] = await pool.query(`
      SELECT 
        a.id,
        a.device_user_id,
        a.employee_id,
        COALESCE(a.employee_code, e.employee_code) as employee_code,
        COALESCE(a.employee_name, CONCAT(e.first_name_th, ' ', e.last_name_th)) as employee_name,
        d.name as department_name,
        e.position,
        e.profile_image,
        DATE_FORMAT(a.punch_time, '%Y-%m-%d %H:%i:%s') as punch_time,
        a.punch_type,
        a.verify_type,
        a.device_name,
        a.device_ip,
        a.created_at
      FROM attendance_logs a
      LEFT JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereClause}
      ORDER BY a.punch_time DESC
      LIMIT ? OFFSET ?
    `, queryParams);

    // คำนวณสรุปวันนี้
    const [todayStats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT a.device_user_id) as employees_punched_today,
        COUNT(*) as total_punches_today
      FROM attendance_logs a
      WHERE DATE(a.punch_time) = CURRENT_DATE()
    `);

    res.json({
      status: 'success',
      data: rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      },
      stats: {
        employeesPunchedToday: todayStats[0].employees_punched_today || 0,
        totalPunchesToday: todayStats[0].total_punches_today || 0
      }
    });
  } catch (error) {
    console.error('Error fetching attendance logs:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 4. ดึงรายชื่อผู้ใช้จากเครื่อง เทียบกับระบบ Portal
exports.getDeviceUsers = async (req, res) => {
  try {
    const rawUsers = await zktecoService.getUsers();
    const [employees] = await pool.query(`
      SELECT 
        e.id, e.employee_code, e.first_name_th, e.last_name_th, 
        e.first_name_en, e.last_name_en, d.name as department_name, e.status
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
    `);

    const enrichedUsers = rawUsers.map(u => {
      const dUserId = String(u.userId || '').trim();
      const dName = (u.name || '').trim();
      const dClean = dName.toLowerCase().replace(/\s+/g, ' ');
      const dParts = dClean.split(' ');
      const dFirst = dParts[0] || '';
      const dLast = dParts.slice(1).join(' ') || '';

      let matched = null;

      // 1. Exact EN match
      for (const e of employees) {
        const eFull = `${e.first_name_en || ''} ${e.last_name_en || ''}`.toLowerCase().replace(/\s+/g, ' ').trim();
        if (eFull && (eFull === dClean || dClean === eFull)) {
          matched = e;
          break;
        }
      }

      // 2. Prefix match
      if (!matched) {
        for (const e of employees) {
          const eFirst = (e.first_name_en || '').toLowerCase().replace(/\./g, ' ').trim().split(' ')[0];
          if (eFirst && dFirst && eFirst.length >= 4 && (dFirst.startsWith(eFirst) || eFirst.startsWith(dFirst))) {
            const eShortLast = (e.first_name_en || '').includes('.') ? (e.first_name_en.split('.')[1] || '').trim().toLowerCase() : '';
            if (!eShortLast || (dLast && dLast.startsWith(eShortLast))) {
              matched = e;
              break;
            }
          }
        }
      }

      // 3. Code match
      if (!matched) {
        for (const e of employees) {
          if (e.employee_code && (dName.toLowerCase().includes(e.employee_code.toLowerCase()) || dUserId === e.employee_code.toLowerCase())) {
            matched = e;
            break;
          }
        }
      }

      return {
        ...u,
        matchedEmployee: matched ? {
          id: matched.id,
          employee_code: matched.employee_code,
          full_name: `${matched.first_name_th || ''} ${matched.last_name_th || ''}`.trim() || `${matched.first_name_en || ''} ${matched.last_name_en || ''}`.trim(),
          department: matched.department_name,
          status: matched.status
        } : null
      };
    });

    res.json({ status: 'success', data: enrichedUsers });
  } catch (error) {
    console.error('Error fetching device users:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 5. ลบผู้ใช้ออกจากเครื่องสแกน
exports.deleteDeviceUser = async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) {
      return res.status(400).json({ status: 'error', message: 'กรุณาระบุ UID ของผู้ใช้' });
    }
    const result = await zktecoService.deleteUser(uid);
    res.json({ status: 'success', message: 'ลบผู้ใช้ออกจากเครื่องสแกนเรียบร้อยแล้ว', data: result });
  } catch (error) {
    console.error('Error deleting user from device:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
