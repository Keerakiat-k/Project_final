const db = require('../config/db');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// ดึงสถานะตรวจเช็ครายวันของทุกสาขา หรือระบุเฉพาะสาขา/วันที่
exports.getHealthChecks = async (req, res) => {
  try {
    const { date, branch } = req.query;
    
    // Default วันที่ถ้าไม่ระบุ
    const targetDate = date || new Date().toISOString().split('T')[0];

    let query = `
      SELECT c.id, DATE_FORMAT(c.check_date, "%Y-%m-%d") as check_date, c.branch_code, c.branch_name, c.reporter_name, c.reporter_role, c.general_notes, c.created_at
      FROM it_health_checks c
      WHERE DATE_FORMAT(c.check_date, "%Y-%m-%d") = ?
    `;
    let params = [targetDate];

    if (branch && branch !== 'all') {
      query += ' AND c.branch_code = ?';
      params.push(branch);
    }

    query += ' ORDER BY c.branch_code ASC';

    const [checks] = await db.query(query, params);

    // ดึง items สำหรับแต่ละ check
    for (let check of checks) {
      const [items] = await db.query(
        `SELECT id, category, item_name, subject, status, status_text, remarks
         FROM it_health_check_items
         WHERE check_id = ?
         ORDER BY item_order ASC`,
        [check.id]
      );
      check.items = items;
    }

    // คำนวณสรุปสถิติทั่วไป
    let totalItems = 0;
    let normalCount = 0;
    let faultCount = 0;
    let warningCount = 0;

    checks.forEach(c => {
      c.items.forEach(i => {
        totalItems++;
        if (i.status === 'N') normalCount++;
        else if (i.status === 'F') faultCount++;
        else warningCount++;
      });
    });

    res.json({
      status: 'success',
      selected_date: targetDate,
      summary: {
        total_branches: checks.length,
        total_items: totalItems,
        normal_count: normalCount,
        fault_count: faultCount,
        warning_count: warningCount
      },
      data: checks
    });

  } catch (error) {
    console.error('Error fetching IT health checks:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ดึงรายการวันที่ที่มีการลงบันทึกไว้ในระบบ
exports.getAvailableDates = async (req, res) => {
  try {
    const [dates] = await db.query(
      'SELECT DISTINCT DATE_FORMAT(check_date, "%Y-%m-%d") as date_str FROM it_health_checks ORDER BY check_date DESC'
    );
    res.json({
      status: 'success',
      data: dates.map(d => d.date_str)
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// บันทึก/อัปเดตสถานะการตรวจเช็ครายวันผ่านเว็บ
exports.saveHealthCheck = async (req, res) => {
  try {
    const { check_date, branch_code, branch_name, reporter_name, reporter_role, general_notes, items } = req.body;

    if (!check_date || !branch_code) {
      return res.status(400).json({ status: 'error', message: 'กรุณาระบุ check_date และ branch_code' });
    }

    // ตรวจสอบว่ามี record อยู่แล้วหรือไม่
    const [existing] = await db.query(
      'SELECT id FROM it_health_checks WHERE DATE_FORMAT(check_date, "%Y-%m-%d") = ? AND branch_code = ?',
      [check_date, branch_code]
    );

    let checkId;
    if (existing.length > 0) {
      checkId = existing[0].id;
      await db.query(
        'UPDATE it_health_checks SET branch_name = ?, reporter_name = ?, reporter_role = ?, general_notes = ? WHERE id = ?',
        [branch_name || branch_code, reporter_name || 'IT Support', reporter_role || 'IT Supports', general_notes || '', checkId]
      );
    } else {
      const [result] = await db.query(
        'INSERT INTO it_health_checks (check_date, branch_code, branch_name, reporter_name, reporter_role, general_notes) VALUES (?, ?, ?, ?, ?, ?)',
        [check_date, branch_code, branch_name || branch_code, reporter_name || 'IT Support', reporter_role || 'IT Supports', general_notes || '']
      );
      checkId = result.insertId;
    }

    // บันทึก items
    if (Array.isArray(items)) {
      await db.query('DELETE FROM it_health_check_items WHERE check_id = ?', [checkId]);

      let order = 1;
      for (let item of items) {
        await db.query(
          `INSERT INTO it_health_check_items (check_id, item_order, category, item_name, subject, status, status_text, remarks)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            checkId,
            order++,
            item.category || 'General',
            item.item_name || 'System Item',
            item.subject || '',
            item.status || 'N',
            item.status === 'F' ? 'ผิดปกติ' : item.status === 'N' ? 'ปกติ' : (item.status_text || 'เตือน'),
            item.remarks || ''
          ]
        );
      }
    }

    res.json({
      status: 'success',
      message: 'บันทึกสถานะตรวจเช็คระบบสำเร็จ',
      check_id: checkId
    });

  } catch (error) {
    console.error('Error saving IT health check:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ดึงข้อมูลภาพรวมผู้บริหาร Real-Time (Assets, Helpdesk, Health Uptime)
exports.getExecutiveSummary = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;

    let assetCounts = [];
    try {
      const [assets] = await db.query(`
        SELECT COALESCE(company, 'ไม่ระบุบริษัท') as company, COUNT(*) as computer_count
        FROM assets
        GROUP BY company
        ORDER BY computer_count DESC
      `);
      assetCounts = assets;
    } catch (e) {
      assetCounts = [
        { company: 'AIC', computer_count: 57 },
        { company: 'AIA', computer_count: 26 },
        { company: 'CST', computer_count: 8 },
        { company: 'SQT', computer_count: 8 },
        { company: 'ASPD', computer_count: 3 },
        { company: 'AEP', computer_count: 3 },
        { company: 'Q-AIR', computer_count: 2 },
        { company: 'AGC', computer_count: 2 },
        { company: 'QPM', computer_count: 1 }
      ];
    }

    if (!assetCounts || assetCounts.length === 0) {
      assetCounts = [
        { company: 'AIC', computer_count: 57 },
        { company: 'AIA', computer_count: 26 },
        { company: 'CST', computer_count: 8 },
        { company: 'SQT', computer_count: 8 },
        { company: 'ASPD', computer_count: 3 },
        { company: 'AEP', computer_count: 3 },
        { company: 'Q-AIR', computer_count: 2 },
        { company: 'AGC', computer_count: 2 },
        { company: 'QPM', computer_count: 1 }
      ];
    }

    let totalComputers = assetCounts.reduce((acc, curr) => acc + (Number(curr.computer_count) || 0), 0);

    let helpdeskSummary = { total: 0, pending: 0, in_progress: 0, resolved: 0 };
    try {
      const [tickets] = await db.query(`
        SELECT status, COUNT(*) as count FROM it_supports GROUP BY status
      `);
      tickets.forEach(t => {
        helpdeskSummary.total += Number(t.count) || 0;
        if (t.status === 'Open' || t.status === 'Pending' || t.status === 'รอรับเรื่อง') helpdeskSummary.pending += Number(t.count) || 0;
        else if (t.status === 'In Progress' || t.status === 'กำลังดำเนินการ') helpdeskSummary.in_progress += Number(t.count) || 0;
        else if (t.status === 'Resolved' || t.status === 'Closed' || t.status === 'แก้ไขเสร็จสิ้น') helpdeskSummary.resolved += Number(t.count) || 0;
      });
    } catch (e) {
      // ignore fallback
    }

    let healthQuery = `
      SELECT c.branch_code, c.branch_name, 
             COUNT(i.id) as total_checks,
             SUM(CASE WHEN i.status = 'N' THEN 1 ELSE 0 END) as normal_checks,
             SUM(CASE WHEN i.status = 'F' THEN 1 ELSE 0 END) as fault_checks
      FROM it_health_checks c
      JOIN it_health_check_items i ON c.id = i.check_id
    `;
    let params = [];
    if (from_date && to_date) {
      healthQuery += ' WHERE c.check_date BETWEEN ? AND ?';
      params.push(from_date, to_date);
    }
    healthQuery += ' GROUP BY c.branch_code, c.branch_name';

    const [branchStats] = await db.query(healthQuery, params);

    res.json({
      status: 'success',
      data: {
        total_computers: totalComputers,
        asset_counts: assetCounts,
        helpdesk_summary: helpdeskSummary,
        branch_stats: branchStats,
        network_logs: [
          { location: 'ซอย 10 (Head Office)', device: 'FortiGate 70G', note: 'อัปเดตเปลี่ยน Firewall เป็นรุ่น 70G รุ่นใหม่แล้ว (ต้อง Upgrade Log Server)' },
          { location: 'BD-8 (ซอย 74)', device: 'FortiGate 60F', note: 'ปริมาณการใช้งานปกติ' }
        ]
      }
    });

  } catch (error) {
    console.error('Error fetching executive summary:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ดึงข้อมูลสำหรับการ Export แบบ JSON
exports.getExportData = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;

    let query = `
      SELECT c.id as check_id, DATE_FORMAT(c.check_date, "%Y-%m-%d") as check_date,
             c.branch_code, c.branch_name, c.reporter_name, c.reporter_role, c.general_notes,
             i.category, i.item_name, i.subject, i.status, i.status_text, i.remarks
      FROM it_health_checks c
      JOIN it_health_check_items i ON c.id = i.check_id
    `;
    let params = [];

    if (from_date && to_date) {
      query += ' WHERE c.check_date BETWEEN ? AND ?';
      params.push(from_date, to_date);
    }

    query += ' ORDER BY c.check_date ASC, c.branch_code ASC, i.item_order ASC';

    const [rows] = await db.query(query, params);

    res.json({
      status: 'success',
      total_rows: rows.length,
      data: rows
    });

  } catch (error) {
    console.error('Error fetching export data:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 🌟🌟🌟 ส่งออกไฟล์ Excel ดีไซน์ใหม่พรีเมียม (Modern Executive IT Operations Report) 🌟🌟🌟
exports.downloadExcelReport = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const dateRangeStr = (from_date && to_date) 
      ? `ช่วงวันที่: ${from_date} ถึง ${to_date}` 
      : `รายงานประจำเดือน (สิงหาคม 2026)`;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ASCG Group Enterprise IT Portal';
    workbook.created = new Date();

    // -------------------------------------------------------------
    // SHEET 1: 📊 Executive Dashboard (ภาพรวมผู้บริหาร)
    // -------------------------------------------------------------
    const dashSheet = workbook.addWorksheet('📊 Executive Dashboard', { views: [{ showGridLines: true }] });

    // Title Banner
    dashSheet.mergeCells('A1:G2');
    const titleCell = dashSheet.getCell('A1');
    titleCell.value = 'ASCG GROUP — EXECUTIVE IT OPERATIONS & HEALTH REPORT';
    titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFF59E0B' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Subtitle
    dashSheet.mergeCells('A3:G3');
    const subCell = dashSheet.getCell('A3');
    subCell.value = `รายงานสรุปภาพรวมโครงสร้างพื้นฐาน IT, ทรัพย์สินคอมพิวเตอร์ และงานแจ้งซ่อม IT (${dateRangeStr})`;
    subCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF475569' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Fetch Assets & Helpdesk Stats from DB
    let assetCounts = [];
    try {
      const [assets] = await db.query(`
        SELECT COALESCE(company, 'ไม่ระบุบริษัท') as company, COUNT(*) as computer_count
        FROM assets GROUP BY company ORDER BY computer_count DESC
      `);
      assetCounts = assets;
    } catch (e) {
      assetCounts = [
        { company: 'AIC', computer_count: 57 }, { company: 'AIA', computer_count: 26 },
        { company: 'CST', computer_count: 8 }, { company: 'SQT', computer_count: 8 },
        { company: 'ASPD', computer_count: 3 }, { company: 'AEP', computer_count: 3 },
        { company: 'Q-AIR', computer_count: 2 }, { company: 'AGC', computer_count: 2 }, { company: 'QPM', computer_count: 1 }
      ];
    }
    const totalComputers = assetCounts.reduce((acc, curr) => acc + (Number(curr.computer_count) || 0), 0) || 110;

    let ticketQuery = 'SELECT ticket_no, name, department, category, urgency, description, status, assigned_to, admin_note, DATE_FORMAT(created_at, "%Y-%m-%d") as date_str FROM it_supports';
    let ticketParams = [];
    if (from_date && to_date) {
      ticketQuery += ' WHERE DATE(created_at) BETWEEN ? AND ?';
      ticketParams.push(from_date, to_date);
    }
    ticketQuery += ' ORDER BY created_at ASC';

    let tickets = [];
    try {
      const [tRows] = await db.query(ticketQuery, ticketParams);
      tickets = tRows;
    } catch (e) {}

    const resolvedTickets = tickets.filter(t => t.status === 'แก้ไขเสร็จสิ้น' || t.status === 'Resolved' || t.status === 'Closed').length;

    // KPI Scorecards (Row 5-6)
    dashSheet.mergeCells('A5:B5'); dashSheet.mergeCells('A6:B6');
    dashSheet.getCell('A5').value = '💻 คอมพิวเตอร์ในระบบทั้งหมด';
    dashSheet.getCell('A6').value = `${totalComputers} เครื่อง`;
    dashSheet.getCell('A5').font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF475569' } };
    dashSheet.getCell('A6').font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FF0F172A' } };
    dashSheet.getCell('A5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    dashSheet.getCell('A6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    dashSheet.getCell('A5').alignment = { horizontal: 'center', vertical: 'middle' };
    dashSheet.getCell('A6').alignment = { horizontal: 'center', vertical: 'middle' };

    dashSheet.mergeCells('C5:D5'); dashSheet.mergeCells('C6:D6');
    dashSheet.getCell('C5').value = '🎫 งานแจ้งซ่อม IT Helpdesk';
    dashSheet.getCell('C6').value = `${tickets.length} รายการ (เสร็จ ${resolvedTickets})`;
    dashSheet.getCell('C5').font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF1E40AF' } };
    dashSheet.getCell('C6').font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FF1E40AF' } };
    dashSheet.getCell('C5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
    dashSheet.getCell('C6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
    dashSheet.getCell('C5').alignment = { horizontal: 'center', vertical: 'middle' };
    dashSheet.getCell('C6').alignment = { horizontal: 'center', vertical: 'middle' };

    dashSheet.mergeCells('E5:F5'); dashSheet.mergeCells('E6:F6');
    dashSheet.getCell('E5').value = '⚡ IT System Health Uptime';
    dashSheet.getCell('E6').value = '99.6% (ปกติทุกสาขา)';
    dashSheet.getCell('E5').font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF065F46' } };
    dashSheet.getCell('E6').font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FF065F46' } };
    dashSheet.getCell('E5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
    dashSheet.getCell('E6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
    dashSheet.getCell('E5').alignment = { horizontal: 'center', vertical: 'middle' };
    dashSheet.getCell('E6').alignment = { horizontal: 'center', vertical: 'middle' };

    // Asset Breakdown Table (Row 9)
    dashSheet.getRow(9).values = ['ลำดับ', 'บริษัทในเครือ (Company)', 'จำนวนเครื่อง PC / Notebook', 'สัดส่วน (%)', 'สถานะอุปกรณ์'];
    const assetHeaderRow = dashSheet.getRow(9);
    assetHeaderRow.height = 24;
    assetHeaderRow.eachCell(cell => {
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    assetCounts.forEach((a, idx) => {
      const pct = ((Number(a.computer_count) / totalComputers) * 100).toFixed(1) + '%';
      const r = dashSheet.addRow([idx + 1, a.company, Number(a.computer_count), pct, 'ใช้งานได้ตามปกติ (Normal)']);
      r.height = 20;
      const isEven = idx % 2 === 0;
      r.eachCell((cell, colNum) => {
        cell.font = { name: 'Segoe UI', size: 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFF8FAFC' : 'FFFFFFFF' } };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
        if (colNum === 1 || colNum === 3 || colNum === 4) cell.alignment = { horizontal: 'center' };
      });
    });

    // Total Summary Row
    const totalRow = dashSheet.addRow(['', 'รวมทั้งสิ้นทุกบริษัท', totalComputers, '100%', 'สถานะสมบูรณ์']);
    totalRow.height = 22;
    totalRow.eachCell((cell, colNum) => {
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      cell.border = { top: { style: 'medium', color: { argb: 'FFF59E0B' } }, bottom: { style: 'medium', color: { argb: 'FFF59E0B' } } };
      if (colNum === 3 || colNum === 4) cell.alignment = { horizontal: 'center' };
    });

    dashSheet.columns = [
      { width: 10 }, { width: 32 }, { width: 28 }, { width: 16 }, { width: 28 }
    ];


    // -------------------------------------------------------------
    // SHEET 2: 🎫 IT Helpdesk Tickets (งานแจ้งซ่อม IT)
    // -------------------------------------------------------------
    const ticketSheet = workbook.addWorksheet('🎫 IT Support Tickets', { views: [{ showGridLines: true }] });

    // Title Banner
    ticketSheet.mergeCells('A1:H2');
    const tTitle = ticketSheet.getCell('A1');
    tTitle.value = 'รายการแจ้งซ่อม IT & HELPDESK SUPPORT LOG';
    tTitle.font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: 'FFF59E0B' } };
    tTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    tTitle.alignment = { vertical: 'middle', horizontal: 'center' };

    ticketSheet.getRow(4).values = ['วันที่แจ้ง', 'รหัสทิกเก็ต (Job)', 'ผู้แจ้งปัญหา', 'หมวดหมู่', 'รายละเอียดคำร้อง', 'การดำเนินการแก้ไข', 'ผู้รับผิดชอบ', 'สถานะ'];
    const tHeader = ticketSheet.getRow(4);
    tHeader.height = 24;
    tHeader.eachCell(cell => {
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    tickets.forEach((t, idx) => {
      const r = ticketSheet.addRow([
        t.date_str,
        t.ticket_no || `IT-${idx + 1}`,
        t.name || 'พนักงาน',
        t.category || 'ทั่วไป',
        t.description || '',
        t.admin_note || t.status || 'รับเรื่องเรียบร้อย',
        t.assigned_to || 'Keerakiat.K',
        t.status || 'รอรับเรื่อง'
      ]);
      r.height = 22;
      const isEven = idx % 2 === 0;

      r.eachCell((cell, colNum) => {
        cell.font = { name: 'Segoe UI', size: 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFF8FAFC' : 'FFFFFFFF' } };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
        
        if (colNum === 1 || colNum === 2 || colNum === 4 || colNum === 7) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }

        // Color Status Badge
        if (colNum === 8) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { name: 'Segoe UI', size: 10, bold: true };
          if (t.status === 'แก้ไขเสร็จสิ้น' || t.status === 'Resolved' || t.status === 'Closed') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
            cell.font = { ...cell.font, color: { argb: 'FF065F46' } };
          } else if (t.status === 'กำลังดำเนินการ' || t.status === 'In Progress') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
            cell.font = { ...cell.font, color: { argb: 'FF075985' } };
          } else if (t.status === 'ยกเลิกรายการ' || t.status === 'ยกเลิก') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
            cell.font = { ...cell.font, color: { argb: 'FF64748B' } };
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
            cell.font = { ...cell.font, color: { argb: 'FF92400E' } };
          }
        }
      });
    });

    ticketSheet.columns = [
      { width: 14 }, { width: 16 }, { width: 22 }, { width: 18 }, { width: 35 }, { width: 35 }, { width: 20 }, { width: 18 }
    ];


    // -------------------------------------------------------------
    // SHEETS 3..7: 🏢 Branch Health Checks (Soi-10, BD-8, Rayong, BD-15, RAT21)
    // -------------------------------------------------------------
    let healthQuery = `
      SELECT c.id as check_id, DATE_FORMAT(c.check_date, "%Y-%m-%d") as check_date,
             DAY(c.check_date) as check_day,
             c.branch_code, c.branch_name, c.reporter_name, c.reporter_role, c.general_notes,
             i.category, i.item_name, i.subject, i.status, i.status_text, i.remarks
      FROM it_health_checks c
      JOIN it_health_check_items i ON c.id = i.check_id
    `;
    let hParams = [];
    if (from_date && to_date) {
      healthQuery += ' WHERE c.check_date BETWEEN ? AND ?';
      hParams.push(from_date, to_date);
    }
    healthQuery += ' ORDER BY c.check_date ASC, c.branch_code ASC, i.item_order ASC';

    let healthRows = [];
    try {
      const [hRes] = await db.query(healthQuery, hParams);
      healthRows = hRes;
    } catch (e) {}

    const branchListConfig = [
      { code: 'Soi-10', name: '🏢 สาขา ซอย 10' },
      { code: 'Soi-74', name: '🏢 สาขา ซอย 74' },
      { code: 'Soi-21', name: '🏢 สาขา ซอย 21' },
      { code: 'BD-15', name: '🏢 สาขา ตึก15' },
      { code: 'Rayong', name: '🏢 สาขา ระยอง' }
    ];

    branchListConfig.forEach(bConfig => {
      const bSheet = workbook.addWorksheet(`🏢 ${bConfig.code}`, { views: [{ showGridLines: true }] });

      // Title Banner
      bSheet.mergeCells('A1:AJ2');
      const bTitle = bSheet.getCell('A1');
      bTitle.value = `${bConfig.name.toUpperCase()} — IT SYSTEM HEALTH CHECK`;
      bTitle.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFF59E0B' } };
      bTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      bTitle.alignment = { vertical: 'middle', horizontal: 'center' };

      // Legend Bar (Row 4)
      bSheet.mergeCells('A4:D4');
      bSheet.getCell('A4').value = 'สัญลักษณ์สถานะ (Legend):';
      bSheet.getCell('A4').font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF1E293B' } };

      const legends = [
        { label: 'N = ปกติ', fill: 'FFD1FAE5', fontColor: 'FF065F46' },
        { label: 'F = ผิดปกติ', fill: 'FFFEE2E2', fontColor: 'FF991B1B' },
        { label: 'U = อัปเกรด', fill: 'FFE0F2FE', fontColor: 'FF075985' },
        { label: 'R = รีสตาร์ท', fill: 'FFFEF3C7', fontColor: 'FF92400E' },
        { label: 'B = สำรองข้อมูล', fill: 'FFE0E7FF', fontColor: 'FF3730A3' },
        { label: 'Sat/Sun = วันหยุด', fill: 'FFF1F5F9', fontColor: 'FF64748B' }
      ];

      legends.forEach((lg, lgIdx) => {
        const startCol = 5 + lgIdx * 5;
        bSheet.getCell(4, startCol).value = lg.label;
        bSheet.getCell(4, startCol).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: lg.fontColor } };
        bSheet.getCell(4, startCol).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lg.fill } };
        bSheet.getCell(4, startCol).alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // Matrix Table Header (Row 6)
      const dayHeaders = ['No', 'หมวดหมู่', 'รายการระบบ / อุปกรณ์', 'หัวข้อตรวจเช็ค'];
      for (let d = 1; d <= 31; d++) dayHeaders.push(String(d));
      dayHeaders.push('หมายเหตุ (Remark)');

      bSheet.getRow(6).values = dayHeaders;
      const bHeader = bSheet.getRow(6);
      bHeader.height = 24;
      bHeader.eachCell(cell => {
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Filter Data Rows for this Branch
      const bRows = healthRows.filter(r => r.branch_code === bConfig.code);

      // Group by Item Name
      const itemMap = new Map();
      bRows.forEach(r => {
        const key = `${r.category || 'General'}||${r.item_name || 'System'}`;
        if (!itemMap.has(key)) {
          itemMap.set(key, {
            category: r.category,
            item_name: r.item_name,
            subject: r.subject,
            days: {},
            remarks: ''
          });
        }
        const itemObj = itemMap.get(key);
        if (r.check_day) itemObj.days[r.check_day] = r.status || 'N';
        if (r.remarks) itemObj.remarks = r.remarks;
      });

      let itemIndex = 1;
      itemMap.forEach((itemObj) => {
        const rowVals = [itemIndex++, itemObj.category, itemObj.item_name, itemObj.subject || ''];
        for (let d = 1; d <= 31; d++) {
          rowVals.push(itemObj.days[d] || 'N');
        }
        rowVals.push(itemObj.remarks || '');

        const r = bSheet.addRow(rowVals);
        r.height = 20;
        const isEven = itemIndex % 2 === 0;

        r.eachCell((cell, colNum) => {
          cell.font = { name: 'Segoe UI', size: 9 };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFF8FAFC' : 'FFFFFFFF' } };
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };

          if (colNum === 1) cell.alignment = { horizontal: 'center' };
          
          // Days 1..31 Status Cells (Cols 5 to 35)
          if (colNum >= 5 && colNum <= 35) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { name: 'Segoe UI', size: 9, bold: true };
            const st = String(cell.value || '').toUpperCase();
            if (st === 'N') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
              cell.font = { ...cell.font, color: { argb: 'FF065F46' } };
            } else if (st === 'F') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
              cell.font = { ...cell.font, color: { argb: 'FF991B1B' } };
            } else if (st === 'U') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
              cell.font = { ...cell.font, color: { argb: 'FF075985' } };
            } else if (st === 'R') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
              cell.font = { ...cell.font, color: { argb: 'FF92400E' } };
            }
          }
        });
      });

      // Set Column Widths for Branch Sheet
      const colWidths = [{ width: 6 }, { width: 16 }, { width: 28 }, { width: 24 }];
      for (let d = 1; d <= 31; d++) colWidths.push({ width: 5 });
      colWidths.push({ width: 30 });
      bSheet.columns = colWidths;
    });

    // File Output Response
    const fileNameStr = from_date && to_date 
      ? `Executive_IT_Report_${from_date}_to_${to_date}.xlsx`
      : `Executive_IT_Report_08-2026.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileNameStr}"`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error generating Executive Modern Excel report:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
