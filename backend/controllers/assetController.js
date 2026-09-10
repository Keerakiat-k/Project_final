const pool = require('../config/db');

// 1. ดึงรายการทรัพย์สินทั้งหมด (พร้อมรองรับ Multi-filter, Search, และ Parent-Child Attached Assets)
exports.getAllAssets = async (req, res) => {
  try {
    const { company, department, location, status, category, search } = req.query;

    let query = `
      SELECT 
        a.*,
        CONCAT(COALESCE(e.first_name_th, ''), ' ', COALESCE(e.last_name_th, '')) AS assigned_employee_name,
        e.employee_code AS assigned_employee_code,
        d.name AS assigned_employee_dept,
        e.company_prefix AS assigned_employee_company,
        p.asset_code AS parent_asset_code,
        p.name AS parent_asset_name
      FROM assets a
      LEFT JOIN employees e ON a.assigned_to = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN assets p ON a.parent_asset_id = p.id
      WHERE 1=1
    `;

    const params = [];

    if (company && company !== 'All') {
      query += ` AND (a.company = ? OR a.owner_company = ?)`;
      params.push(company, company);
    }

    if (department && department !== 'All') {
      query += ` AND a.department = ?`;
      params.push(department);
    }

    if (location && location !== 'All') {
      query += ` AND a.location = ?`;
      params.push(location);
    }

    if (status && status !== 'All') {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    if (category && category !== 'All') {
      query += ` AND a.category = ?`;
      params.push(category);
    }

    if (search && search.trim() !== '') {
      const s = `%${search.trim()}%`;
      query += ` AND (
        a.asset_code LIKE ? OR 
        a.name LIKE ? OR 
        a.brand LIKE ? OR 
        a.model LIKE ? OR 
        a.serial_number LIKE ? OR 
        a.cpu LIKE ? OR 
        a.ram LIKE ? OR 
        a.storage LIKE ? OR 
        CONCAT(e.first_name_th, ' ', e.last_name_th) LIKE ? OR
        a.company LIKE ? OR
        a.department LIKE ? OR
        a.location LIKE ?
      )`;
      params.push(s, s, s, s, s, s, s, s, s, s, s, s);
    }

    query += ` ORDER BY LENGTH(a.asset_code) DESC, a.asset_code DESC, a.id DESC`;

    const [rows] = await pool.query(query, params);

    // ดึง Attached Children (เช่น จอภาพที่ผูกกับ PC เครื่องนี้)
    const [allChildren] = await pool.query(`
      SELECT id, asset_code, name, category, brand, model, serial_number, parent_asset_id
      FROM assets 
      WHERE parent_asset_id IS NOT NULL
    `);

    // ดึง Software Licenses
    let licenses = [];
    try {
      const [licRows] = await pool.query('SELECT * FROM asset_licenses');
      licenses = licRows;
    } catch (e) {
      licenses = [];
    }

    rows.forEach(asset => {
      asset.licenses = licenses.filter(l => l.asset_id === asset.id);
      asset.attached_devices = allChildren.filter(c => c.parent_asset_id === asset.id);
    });

    res.status(200).json({ status: 'success', data: rows, total: rows.length });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงข้อมูลทรัพย์สินได้' });
  }
};

// 2. ดึงข้อมูลตัวเลือกสำหรับ Filter Dropdown ทั้งหมด (แบบ Dynamic จาก DB)
exports.getFilterOptions = async (req, res) => {
  try {
    const [companies] = await pool.query(`
      SELECT DISTINCT prefix AS company FROM companies WHERE status = 'Active'
      UNION 
      SELECT DISTINCT company FROM assets WHERE company IS NOT NULL AND company != '' 
      UNION 
      SELECT DISTINCT owner_company AS company FROM assets WHERE owner_company IS NOT NULL AND owner_company != ''
      ORDER BY company
    `);

    const [departments] = await pool.query(`
      SELECT DISTINCT department FROM assets WHERE department IS NOT NULL AND department != ''
      UNION
      SELECT DISTINCT name AS department FROM departments WHERE name IS NOT NULL AND name != ''
      ORDER BY department
    `);

    const [locations] = await pool.query(`
      SELECT DISTINCT location FROM assets WHERE location IS NOT NULL AND location != ''
      ORDER BY location
    `);

    const [categories] = await pool.query(`
      SELECT DISTINCT category FROM assets WHERE category IS NOT NULL AND category != ''
      ORDER BY category
    `);

    res.status(200).json({
      status: 'success',
      data: {
        companies: companies.map(c => c.company),
        departments: departments.map(d => d.department),
        locations: locations.map(l => l.location),
        categories: categories.map(c => c.category),
        statuses: ['Available', 'In Use', 'On Loan', 'Maintenance', 'Retired']
      }
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงตัวเลือกตัวกรองได้' });
  }
};

// 3. Auto-Suggest Next Asset Code ตาม Prefix ของบริษัท (เช่น CST -> CST005, อื่นๆ -> ASCG100)
exports.suggestAssetCode = async (req, res) => {
  try {
    const { company } = req.query;
    let prefix = 'ASCG';

    if (company && company.toUpperCase() === 'CST') {
      prefix = 'CST';
    }

    // ค้นหารหัสล่าสุดที่ขึ้นต้นด้วย Prefix นี้
    const [rows] = await pool.query(
      `SELECT asset_code FROM assets WHERE asset_code LIKE ?`,
      [`${prefix}%`]
    );

    let maxNum = 0;
    const regex = new RegExp(`^${prefix}(\\d+)$`, 'i');

    rows.forEach(r => {
      const match = r.asset_code.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });

    const nextNum = maxNum + 1;
    // กำหนดรูปแบบตัวเลข (ถ้าต่ำกว่า 1000 ให้ใส่ 3 หลัก เช่น 001, 002, 099, 100)
    const paddedNum = nextNum < 1000 ? String(nextNum).padStart(3, '0') : String(nextNum);
    const suggestedCode = `${prefix}${paddedNum}`;

    res.status(200).json({
      status: 'success',
      suggested_code: suggestedCode,
      prefix: prefix,
      current_max: maxNum
    });
  } catch (error) {
    console.error('Error suggesting asset code:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถคำนวณรหัสทรัพย์สินถัดไปได้' });
  }
};

// 4. ดึงข้อมูลทรัพย์สินรายตัว พร้อม Timeline ประวัติ
exports.getAssetById = async (req, res) => {
  const { id } = req.params;
  try {
    const [assets] = await pool.query(`
      SELECT 
        a.*,
        CONCAT(COALESCE(e.first_name_th, ''), ' ', COALESCE(e.last_name_th, '')) AS assigned_employee_name,
        e.employee_code AS assigned_employee_code,
        d.name AS assigned_employee_dept,
        e.company_prefix AS assigned_employee_company,
        p.asset_code AS parent_asset_code,
        p.name AS parent_asset_name
      FROM assets a
      LEFT JOIN employees e ON a.assigned_to = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN assets p ON a.parent_asset_id = p.id
      WHERE a.id = ?
    `, [id]);

    if (assets.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบข้อมูลทรัพย์สิน' });
    }

    const asset = assets[0];

    // ดึง Licenses
    try {
      const [licRows] = await pool.query('SELECT * FROM asset_licenses WHERE asset_id = ?', [id]);
      asset.licenses = licRows;
    } catch (e) {
      asset.licenses = [];
    }

    // ดึง Attached Devices (จอมอนิเตอร์/อุปกรณ์เสริม)
    const [children] = await pool.query(`
      SELECT id, asset_code, name, category, brand, model, serial_number
      FROM assets 
      WHERE parent_asset_id = ?
    `, [id]);
    asset.attached_devices = children;

    // ดึง Transfer & Loan Logs
    const [transferLogs] = await pool.query(`
      SELECT * FROM asset_transfer_logs 
      WHERE asset_id = ? 
      ORDER BY created_at DESC
    `, [id]);
    asset.transfer_history = transferLogs;

    // ดึง Maintenance Logs
    const [maintenanceLogs] = await pool.query(`
      SELECT * FROM asset_maintenance_logs 
      WHERE asset_id = ? 
      ORDER BY service_date DESC, created_at DESC
    `, [id]);
    asset.maintenance_history = maintenanceLogs;

    res.status(200).json({ status: 'success', data: asset });
  } catch (error) {
    console.error('Error fetching asset by id:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงข้อมูลทรัพย์สินได้' });
  }
};

// Upload Asset Image
exports.uploadAssetImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'กรุณาเลือกไฟล์รูปภาพ' });
    }
    const imageUrl = `/uploads/assets/${req.file.filename}`;
    res.status(200).json({
      status: 'success',
      message: 'อัปโหลดรูปภาพสำเร็จ',
      data: {
        url: imageUrl,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('Error uploading asset image:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ' });
  }
};

// 5. เพิ่มทรัพย์สินใหม่
exports.createAsset = async (req, res) => {
  const { 
    asset_code, name, category, purchase_date, price, status, assigned_to, notes,
    company, owner_company, department, location, brand, model, serial_number, cpu, ram, storage, display_size,
    parent_asset_id, licenses, po_number, warranty_period, warranty_expire_date, image_url
  } = req.body;
  
  try {
    // ตรวจสอบรหัสซ้ำ
    if (asset_code) {
      const [existing] = await pool.execute('SELECT id FROM assets WHERE asset_code = ?', [asset_code]);
      if (existing.length > 0) {
        return res.status(400).json({ status: 'error', message: `รหัสทรัพย์สิน '${asset_code}' มีอยู่ในระบบแล้ว` });
      }
    }

    // Auto-sync: ถ้าเลือก assigned_to แต่ไม่ได้ระบุ department/location ให้ดึงจากพนักงาน
    let finalDept = department;
    let finalLoc = location;
    let finalCompany = company || owner_company;

    if (assigned_to) {
      const [emps] = await pool.query(`
        SELECT e.company_prefix, d.name AS dept_name, e.home_address 
        FROM employees e 
        LEFT JOIN departments d ON e.department_id = d.id 
        WHERE e.id = ?
      `, [assigned_to]);

      if (emps.length > 0) {
        const emp = emps[0];
        if (!finalDept && emp.dept_name) finalDept = emp.dept_name;
        if (!finalCompany && emp.company_prefix) finalCompany = emp.company_prefix;
      }
    }

    const initialStatus = status || (assigned_to ? 'In Use' : 'Available');

    const [result] = await pool.execute(
      `INSERT INTO assets (
        asset_code, name, category, purchase_date, price, status, assigned_to, notes,
        company, owner_company, department, location, brand, model, serial_number, cpu, ram, storage, display_size, parent_asset_id,
        po_number, warranty_period, warranty_expire_date, image_url
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        asset_code, 
        name, 
        category || 'Computers & Laptops', 
        purchase_date || null, 
        price || null, 
        initialStatus, 
        assigned_to || null, 
        notes || null,
        finalCompany || null, 
        owner_company || finalCompany || null, 
        finalDept || null, 
        finalLoc || null, 
        brand || null, 
        model || null, 
        serial_number || null, 
        cpu || null, 
        ram || null, 
        storage || null, 
        display_size || null,
        parent_asset_id || null,
        po_number || null,
        warranty_period || null,
        warranty_expire_date || null,
        image_url || null
      ]
    );
    
    const assetId = result.insertId;
    
    // บันทึก Licenses
    if (licenses && Array.isArray(licenses)) {
      for (const lic of licenses) {
        if (lic.software_name || lic.license_key) {
          try {
            await pool.execute(
              `INSERT INTO asset_licenses (asset_id, software_type, software_name, license_key, login_email, login_password, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [assetId, lic.software_type || '', lic.software_name || '', lic.license_key || '', lic.login_email || '', lic.login_password || '', lic.notes || '']
            );
          } catch (e) {
            console.error('License insert error:', e);
          }
        }
      }
    }

    res.status(201).json({ status: 'success', message: 'เพิ่มทรัพย์สินสำเร็จ', assetId: assetId });
  } catch (error) {
    console.error('Error creating asset:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ status: 'error', message: 'รหัสทรัพย์สินซ้ำในระบบ' });
    }
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการเพิ่มทรัพย์สิน: ' + error.message });
  }
};

// 6. แก้ไขข้อมูลทรัพย์สิน
exports.updateAsset = async (req, res) => {
  const { id } = req.params;
  const { 
    asset_code, name, category, purchase_date, price, status, assigned_to, notes,
    company, owner_company, department, location, brand, model, serial_number, cpu, ram, storage, display_size,
    parent_asset_id, licenses, po_number, warranty_period, warranty_expire_date, image_url
  } = req.body;

  try {
    // ตรวจสอบรหัสซ้ำกับเครื่องอื่น
    if (asset_code) {
      const [existing] = await pool.execute('SELECT id FROM assets WHERE asset_code = ? AND id != ?', [asset_code, id]);
      if (existing.length > 0) {
        return res.status(400).json({ status: 'error', message: `รหัสทรัพย์สิน '${asset_code}' มีอยู่ในระบบแล้ว` });
      }
    }

    await pool.execute(
      `UPDATE assets 
       SET asset_code = ?, name = ?, category = ?, purchase_date = ?, price = ?, status = ?, assigned_to = ?, notes = ?,
           company = ?, owner_company = ?, department = ?, location = ?, brand = ?, model = ?, serial_number = ?, 
           cpu = ?, ram = ?, storage = ?, display_size = ?, parent_asset_id = ?,
           po_number = ?, warranty_period = ?, warranty_expire_date = ?, image_url = ?
       WHERE id = ?`,
      [
        asset_code, name, category || null, purchase_date || null, price || null, status || 'Available', assigned_to || null, notes || null,
        company || null, owner_company || null, department || null, location || null, brand || null, model || null, serial_number || null, 
        cpu || null, ram || null, storage || null, display_size || null, parent_asset_id || null,
        po_number || null, warranty_period || null, warranty_expire_date || null, image_url || null,
        id
      ]
    );
    
    // อัปเดต Licenses
    if (licenses && Array.isArray(licenses)) {
      try {
        await pool.execute('DELETE FROM asset_licenses WHERE asset_id = ?', [id]);
        for (const lic of licenses) {
          if (lic.software_name || lic.license_key) {
            await pool.execute(
              `INSERT INTO asset_licenses (asset_id, software_type, software_name, license_key, login_email, login_password, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [id, lic.software_type || '', lic.software_name || '', lic.license_key || '', lic.login_email || '', lic.login_password || '', lic.notes || '']
            );
          }
        }
      } catch (e) {
        console.error('License update error:', e);
      }
    }

    res.status(200).json({ status: 'success', message: 'แก้ไขข้อมูลทรัพย์สินสำเร็จ' });
  } catch (error) {
    console.error('Error updating asset:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ status: 'error', message: 'รหัสทรัพย์สินซ้ำในระบบ' });
    }
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการแก้ไขทรัพย์สิน' });
  }
};

// 7. ระบบ ยืม - โอนย้าย ทรัพย์สินข้ามบริษัท/แผนก (Transfer & Loan Workflow)
exports.transferAsset = async (req, res) => {
  const { id } = req.params;
  const {
    transfer_type,        // 'Transfer' (โอนย้ายถาวร) หรือ 'Loan' (ยืมชั่วคราว)
    to_company,
    to_department,
    to_location,
    to_user_id,
    return_due_date,      // วันกำหนดส่งคืน (สำหรับกรณี Loan)
    reason,
    action_by,
    new_asset_code        // หากต้องการเปลี่ยนรหัสตามบริษัทปลายทาง
  } = req.body;

  try {
    // 1. ดึงข้อมูลเครื่องปัจจุบัน
    const [curr] = await pool.query(`
      SELECT a.*, CONCAT(COALESCE(e.first_name_th, ''), ' ', COALESCE(e.last_name_th, '')) as curr_user_name
      FROM assets a
      LEFT JOIN employees e ON a.assigned_to = e.id
      WHERE a.id = ?
    `, [id]);

    if (curr.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบข้อมูลทรัพย์สิน' });
    }

    const currentAsset = curr[0];

    // 2. ดึงชื่อผู้รับมอบปลายทาง (ถ้ามี)
    let toUserName = null;
    if (to_user_id) {
      const [targetUser] = await pool.query(`
        SELECT CONCAT(COALESCE(first_name_th, ''), ' ', COALESCE(last_name_th, '')) as user_name FROM employees WHERE id = ?
      `, [to_user_id]);
      if (targetUser.length > 0) toUserName = targetUser[0].user_name;
    }

    // 3. กำหนดสถานะใหม่
    let newStatus = 'In Use';
    if (transfer_type === 'Loan') {
      newStatus = 'On Loan';
    } else if (!to_user_id) {
      newStatus = 'Available';
    }

    const finalCode = (new_asset_code && new_asset_code.trim() !== '') 
      ? new_asset_code.trim() 
      : currentAsset.asset_code;

    // 4. อัปเดตข้อมูลทรัพย์สิน
    await pool.execute(`
      UPDATE assets 
      SET 
        asset_code = ?,
        company = ?,
        department = ?,
        location = ?,
        assigned_to = ?,
        status = ?
      WHERE id = ?
    `, [
      finalCode,
      to_company || currentAsset.company,
      to_department || currentAsset.department,
      to_location || currentAsset.location,
      to_user_id || null,
      newStatus,
      id
    ]);

    // 5. บันทึกประวัติลง asset_transfer_logs
    await pool.execute(`
      INSERT INTO asset_transfer_logs (
        asset_id, transfer_type, 
        from_company, from_department, from_location, from_user,
        to_company, to_department, to_location, to_user,
        return_due_date, reason, action_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      transfer_type || 'Transfer',
      currentAsset.company,
      currentAsset.department,
      currentAsset.location,
      currentAsset.curr_user_name,
      to_company || currentAsset.company,
      to_department || currentAsset.department,
      to_location || currentAsset.location,
      toUserName,
      return_due_date || null,
      reason || null,
      action_by || 'Admin'
    ]);

    res.status(200).json({
      status: 'success',
      message: transfer_type === 'Loan' ? 'บันทึกการยืมทรัพย์สินเรียบร้อยแล้ว' : 'บันทึกการโอนย้ายทรัพย์สินเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error transferring asset:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการโอนย้ายทรัพย์สิน: ' + error.message });
  }
};

// 8. รับคืนทรัพย์สินกลับเข้าสต็อก (Return to Stock)
exports.returnAsset = async (req, res) => {
  const { id } = req.params;
  const { return_location, return_department, reason, action_by } = req.body;

  try {
    const [curr] = await pool.query(`
      SELECT a.*, CONCAT(COALESCE(e.first_name_th, ''), ' ', COALESCE(e.last_name_th, '')) as curr_user_name
      FROM assets a
      LEFT JOIN employees e ON a.assigned_to = e.id
      WHERE a.id = ?
    `, [id]);

    if (curr.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบข้อมูลทรัพย์สิน' });
    }

    const currentAsset = curr[0];

    // เปลี่ยนสถานะเป็น Available, ปลดผู้ถือครอง และคืนกลับบริษัทเจ้าของกรรมสิทธิ์ (owner_company)
    const targetCompany = currentAsset.owner_company || currentAsset.company;
    const targetLocation = return_location || currentAsset.location;
    const targetDept = return_department || null;

    await pool.execute(`
      UPDATE assets 
      SET 
        status = 'Available',
        assigned_to = NULL,
        company = ?,
        department = ?,
        location = ?
      WHERE id = ?
    `, [targetCompany, targetDept, targetLocation, id]);

    // บันทึกประวัติ Return ลง log
    await pool.execute(`
      INSERT INTO asset_transfer_logs (
        asset_id, transfer_type, 
        from_company, from_department, from_location, from_user,
        to_company, to_department, to_location, to_user,
        reason, action_by
      )
      VALUES (?, 'Transfer', ?, ?, ?, ?, ?, ?, ?, 'คลังส่วนกลาง (Stock)', ?, ?)
    `, [
      id,
      currentAsset.company,
      currentAsset.department,
      currentAsset.location,
      currentAsset.curr_user_name,
      targetCompany,
      targetDept,
      targetLocation,
      reason || 'ส่งคืนเข้าคลัง (Return to Stock)',
      action_by || 'Admin'
    ]);

    res.status(200).json({ status: 'success', message: 'รับคืนทรัพย์สินเข้าคลังเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error returning asset:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการรับคืนทรัพย์สิน' });
  }
};

// 9. บันทึกประวัติการซ่อมบำรุง / อัปเกรดสเปก (Maintenance Log)
exports.addMaintenanceLog = async (req, res) => {
  const { id } = req.params;
  const { action_type, description, cost, technician, service_date, new_ram, new_storage, set_status } = req.body;

  try {
    await pool.execute(`
      INSERT INTO asset_maintenance_logs (asset_id, action_type, description, cost, technician, service_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      id,
      action_type || 'Maintenance',
      description || 'ซ่อมบำรุง/ตรวจเช็คสภาพเครื่อง',
      cost || 0,
      technician || null,
      service_date || new Date().toISOString().split('T')[0]
    ]);

    // ถ้ามีการอัปเกรด RAM หรือ Storage อัปเดตกลับไปที่ตาราง assets ทันที
    const updateFields = [];
    const updateParams = [];

    if (new_ram) {
      updateFields.push('ram = ?');
      updateParams.push(new_ram);
    }
    if (new_storage) {
      updateFields.push('storage = ?');
      updateParams.push(new_storage);
    }
    if (set_status) {
      updateFields.push('status = ?');
      updateParams.push(set_status);
    }

    if (updateFields.length > 0) {
      updateParams.push(id);
      await pool.execute(`UPDATE assets SET ${updateFields.join(', ')} WHERE id = ?`, updateParams);
    }

    res.status(201).json({ status: 'success', message: 'บันทึกประวัติการซ่อมบำรุงสำเร็จ' });
  } catch (error) {
    console.error('Error adding maintenance log:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการบันทึกประวัติซ่อมบำรุง' });
  }
};

// 10. ลบทรัพย์สิน
exports.deleteAsset = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute('DELETE FROM asset_licenses WHERE asset_id = ?', [id]);
    await pool.execute('DELETE FROM asset_transfer_logs WHERE asset_id = ?', [id]);
    await pool.execute('DELETE FROM asset_maintenance_logs WHERE asset_id = ?', [id]);
    await pool.execute('DELETE FROM assets WHERE id = ?', [id]);
    res.status(200).json({ status: 'success', message: 'ลบข้อมูลทรัพย์สินสำเร็จ' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการลบทรัพย์สิน' });
  }
};
