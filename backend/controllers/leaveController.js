const pool = require('../config/db');

// =======================
// Leave Types Management
// =======================
exports.getLeaveTypes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM leave_types ORDER BY id');
    res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงข้อมูลประเภทการลาได้' });
  }
};

exports.createLeaveType = async (req, res) => {
  const { name, default_days } = req.body;
  try {
    const [result] = await pool.query('INSERT INTO leave_types (name, default_days) VALUES (?, ?)', [name, default_days]);
    res.json({ status: 'success', data: { id: result.insertId, name, default_days, is_active: 1 } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถเพิ่มประเภทการลาได้' });
  }
};

exports.updateLeaveType = async (req, res) => {
  const { id } = req.params;
  const { name, default_days, is_active } = req.body;
  try {
    await pool.query('UPDATE leave_types SET name=?, default_days=?, is_active=? WHERE id=?', [name, default_days, is_active, id]);
    res.json({ status: 'success' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถอัปเดตประเภทการลาได้' });
  }
};

// =======================
// Leave Balances & Requests (Employee)
// =======================
const initEmployeeLeaveBalances = async (employeeId, year) => {
  const [types] = await pool.query('SELECT * FROM leave_types WHERE is_active = 1');
  for (let type of types) {
    await pool.query(
      'INSERT IGNORE INTO leave_balances (employee_id, leave_type_id, year, total_days) VALUES (?, ?, ?, ?)',
      [employeeId, type.id, year, type.default_days]
    );
  }
};

exports.getMyBalances = async (req, res) => {
  const employeeId = req.user.id; // from auth middleware
  const year = new Date().getFullYear();
  try {
    await initEmployeeLeaveBalances(employeeId, year);
    const [rows] = await pool.query(`
      SELECT b.*, t.name as leave_type_name
      FROM leave_balances b
      JOIN leave_types t ON b.leave_type_id = t.id
      WHERE b.employee_id = ? AND b.year = ?
    `, [employeeId, year]);
    res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงข้อมูลโควต้าการลาได้' });
  }
};

exports.getEmployeeBalances = async (req, res) => {
  const { id: employeeId } = req.params;
  const year = new Date().getFullYear();
  try {
    await initEmployeeLeaveBalances(employeeId, year);
    const [rows] = await pool.query(`
      SELECT b.*, t.name as leave_type_name
      FROM leave_balances b
      JOIN leave_types t ON b.leave_type_id = t.id
      WHERE b.employee_id = ? AND b.year = ?
    `, [employeeId, year]);
    res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงข้อมูลโควต้าการลาของพนักงานได้' });
  }
};

exports.updateEmployeeBalances = async (req, res) => {
  const { id: employeeId } = req.params;
  const { balances } = req.body; // Array of { id, total_days } OR { leave_type_id, total_days }
  const year = new Date().getFullYear();
  
  if (!balances || !Array.isArray(balances)) {
    return res.status(400).json({ status: 'error', message: 'ข้อมูลไม่ถูกต้อง' });
  }

  try {
    await pool.query('START TRANSACTION');
    
    for (let bal of balances) {
      if (bal.id) {
        await pool.query('UPDATE leave_balances SET total_days = ? WHERE id = ? AND employee_id = ?', [bal.total_days, bal.id, employeeId]);
      } else if (bal.leave_type_id) {
        await pool.query('UPDATE leave_balances SET total_days = ? WHERE leave_type_id = ? AND employee_id = ? AND year = ?', [bal.total_days, bal.leave_type_id, employeeId, year]);
      }
    }
    
    await pool.query('COMMIT');
    res.json({ status: 'success', message: 'บันทึกวันลาสำเร็จ' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถอัปเดตโควต้าวันลาได้' });
  }
};

exports.getMyRequests = async (req, res) => {
  const employeeId = req.user.id;
  try {
    const [rows] = await pool.query(`
      SELECT r.*, t.name as leave_type_name
      FROM leave_requests r
      JOIN leave_types t ON r.leave_type_id = t.id
      WHERE r.employee_id = ?
      ORDER BY r.created_at DESC
    `, [employeeId]);
    res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงประวัติการลาได้' });
  }
};

exports.createLeaveRequest = async (req, res) => {
  const employeeId = req.user.id;
  const { leave_type_id, start_date, end_date, duration_type, total_days, reason } = req.body;
  
  // File upload logic can be added later if multer is used, let's assume it's req.file
  const attachment = req.file ? req.file.filename : null;

  try {
    const managerId = null;
    const initialStatus = 'Pending HR';

    const [result] = await pool.query(`
      INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, duration_type, total_days, reason, attachment, status, manager_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [employeeId, leave_type_id, start_date, end_date, duration_type, total_days, reason, attachment, initialStatus, managerId]);

    // Update pending_days in balance
    const year = new Date(start_date).getFullYear();
    await pool.query('UPDATE leave_balances SET pending_days = pending_days + ? WHERE employee_id = ? AND leave_type_id = ? AND year = ?', [total_days, employeeId, leave_type_id, year]);

    res.json({ status: 'success', data: { id: result.insertId } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถยื่นขอลางานได้' });
  }
};

// =======================
// Leave Approvals (Manager / HR)
// =======================
exports.getLeaveApprovals = async (req, res) => {
  const employeeId = req.user.id;
  const userRole = req.user.role; // e.g. 'Admin', 'HR', 'Manager', 'Staff'
  
  try {
    let query = `
      SELECT r.*, t.name as leave_type_name, 
             e.first_name_th as emp_fname, e.last_name_th as emp_lname, e.nickname as emp_nick
      FROM leave_requests r
      JOIN leave_types t ON r.leave_type_id = t.id
      JOIN employees e ON r.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (userRole === 'Admin' || userRole === 'HR') {
      // Admin/HR sees all requests
      // You can add further filtering if they only need to see 'Pending HR' etc.
    } else {
      // Manager sees their subordinates
      query += ' AND r.manager_id = ?';
      params.push(employeeId);
    }
    
    query += ' ORDER BY r.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงข้อมูลคำขออนุมัติได้' });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  const { id } = req.params;
  const { status, reject_reason } = req.body; // status can be 'Approved', 'Rejected', 'Pending HR'
  const approverId = req.user.id;
  
  try {
    // get request details
    const [reqRows] = await pool.query('SELECT * FROM leave_requests WHERE id = ?', [id]);
    if (reqRows.length === 0) return res.status(404).json({status: 'error', message: 'ไม่พบคำขอนี้'});
    const leaveReq = reqRows[0];
    const year = new Date(leaveReq.start_date).getFullYear();

    if (status === 'Pending HR') {
      // Manager approved
      await pool.query('UPDATE leave_requests SET status = "Pending HR" WHERE id = ?', [id]);
    } else if (status === 'Approved') {
      // HR approved
      await pool.query('UPDATE leave_requests SET status = "Approved", hr_id = ? WHERE id = ?', [approverId, id]);
      
      // Deduct from pending and add to used
      await pool.query(`
        UPDATE leave_balances 
        SET pending_days = pending_days - ?, used_days = used_days + ?
        WHERE employee_id = ? AND leave_type_id = ? AND year = ?
      `, [leaveReq.total_days, leaveReq.total_days, leaveReq.employee_id, leaveReq.leave_type_id, year]);
      
    } else if (status === 'Rejected' || status === 'Cancelled') {
      // Manager/HR rejected OR Employee cancelled
      await pool.query('UPDATE leave_requests SET status = ?, reject_reason = ? WHERE id = ?', [status, reject_reason || null, id]);
      
      // Return pending_days back
      if (leaveReq.status !== 'Rejected' && leaveReq.status !== 'Cancelled') {
        await pool.query(`
          UPDATE leave_balances 
          SET pending_days = pending_days - ?
          WHERE employee_id = ? AND leave_type_id = ? AND year = ?
        `, [leaveReq.total_days, leaveReq.employee_id, leaveReq.leave_type_id, year]);
      }
    }

    res.json({ status: 'success' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถอัปเดตสถานะการลาได้' });
  }
};

exports.deleteLeaveRequest = async (req, res) => {
  const { id } = req.params;
  
  try {
    const [reqRows] = await pool.query('SELECT * FROM leave_requests WHERE id = ?', [id]);
    if (reqRows.length === 0) return res.status(404).json({status: 'error', message: 'ไม่พบคำขอนี้'});
    const leaveReq = reqRows[0];
    const year = new Date(leaveReq.start_date).getFullYear();

    // Revert balance based on current status
    if (leaveReq.status === 'Pending HR' || leaveReq.status === 'Pending Manager') {
      await pool.query(`
        UPDATE leave_balances 
        SET pending_days = pending_days - ?
        WHERE employee_id = ? AND leave_type_id = ? AND year = ?
      `, [leaveReq.total_days, leaveReq.employee_id, leaveReq.leave_type_id, year]);
    } else if (leaveReq.status === 'Approved') {
      await pool.query(`
        UPDATE leave_balances 
        SET used_days = used_days - ?
        WHERE employee_id = ? AND leave_type_id = ? AND year = ?
      `, [leaveReq.total_days, leaveReq.employee_id, leaveReq.leave_type_id, year]);
    }
    
    // Delete the request
    await pool.query('DELETE FROM leave_requests WHERE id = ?', [id]);
    
    res.json({ status: 'success', message: 'ลบข้อมูลสำเร็จ' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถลบข้อมูลได้' });
  }
};
