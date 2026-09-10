const pool = require('../config/db');
const nodemailer = require('nodemailer');

// -------------------------------------------------------------
// 📧 Helper: ส่งอีเมลแจ้งเตือนทีม IT เมื่อมีการเปิด Ticket ใหม่
// -------------------------------------------------------------
async function sendTicketNotificationEmail(ticket) {
  try {
    // 1. ดึงการตั้งค่า SMTP สำหรับฝ่าย IT จากตาราง email_settings
    const [rows] = await pool.query('SELECT * FROM email_settings WHERE type = ? LIMIT 1', ['IT']);
    if (!rows || rows.length === 0) {
      console.warn('[IT Notification] ไม่พบการตั้งค่า email_settings (type: IT)');
      return;
    }
    const settings = rows[0];

    if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_pass) {
      console.warn('[IT Notification] ข้อมูล SMTP สำหรับ IT ไม่ครบถ้วน');
      return;
    }

    // 2. รวบรวมรายชื่ออีเมลผู้รับแจ้งเตือนปัญหา IT (Ticket Alert Emails)
    let toEmails = [];
    if (settings.ticket_emails && settings.ticket_emails.trim() !== '') {
      toEmails = settings.ticket_emails.split(',').map(e => e.trim()).filter(Boolean);
    } else if (settings.to_emails && settings.to_emails.trim() !== '') {
      toEmails = settings.to_emails.split(',').map(e => e.trim()).filter(Boolean);
    }
    
    if (toEmails.length === 0 && settings.smtp_user) {
      toEmails = [settings.smtp_user];
    }

    let ccEmails = [];
    if (settings.cc_emails) {
      ccEmails = settings.cc_emails.split(',').map(e => e.trim()).filter(Boolean);
    }

    if (toEmails.length === 0) return;

    // 3. สร้าง Transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.smtp_secure === 1 || settings.smtp_secure === true,
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_pass
      }
    });

    const nowFormatted = new Date().toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // 4. สไตล์ Badge สำหรับระดับความเร่งด่วน
    let urgencyColor = '#2563eb';
    let urgencyBg = '#eff6ff';
    let urgencyBorder = '#bfdbfe';
    let urgencyText = ticket.urgency || 'ปกติ';

    if (ticket.urgency?.includes('สูง') || ticket.urgency?.includes('ด่วนมาก') || ticket.urgency === 'Urgent') {
      urgencyColor = '#dc2626';
      urgencyBg = '#fef2f2';
      urgencyBorder = '#fecaca';
      urgencyText = `🔴 ${ticket.urgency}`;
    } else if (ticket.urgency?.includes('ปานกลาง') || ticket.urgency?.includes('ด่วน') || ticket.urgency === 'High') {
      urgencyColor = '#d97706';
      urgencyBg = '#fffbeb';
      urgencyBorder = '#fde68a';
      urgencyText = `🟡 ${ticket.urgency}`;
    } else if (ticket.urgency?.includes('ต่ำ') || ticket.urgency === 'Low') {
      urgencyColor = '#16a34a';
      urgencyBg = '#f0fdf4';
      urgencyBorder = '#bbf7d0';
      urgencyText = `🟢 ${ticket.urgency}`;
    }

    const urgencyBadge = `<table border="0" cellpadding="0" cellspacing="0" style="display: inline-table;"><tr><td bgcolor="${urgencyBg}" style="background-color: ${urgencyBg}; color: ${urgencyColor}; border: 1px solid ${urgencyBorder}; padding: 3px 10px; border-radius: 6px; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 12.5px; font-weight: bold;">${urgencyText}</td></tr></table>`;

    const formattedDescription = (ticket.description || 'ไม่มีรายละเอียดเพิ่มเติม').replace(/\n/g, '<br/>');

    // 5. Template อีเมลแบบ Outlook-Compatible HTML Table
    const html = `
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f1f5f9" style="background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px 0;">
  <tr>
    <td align="center">
      <table width="620" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #cbd5e1; max-width: 620px; width: 100%;">
        
        <!-- Header Banner -->
        <tr>
          <td bgcolor="#0f172a" style="background-color: #0f172a; padding: 28px 24px 22px; text-align: center; border-bottom: 4px solid #f89919;">
            <div style="color: #ffffff; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 20px; font-weight: bold; margin-bottom: 12px; line-height: 1.3;">
              🚨 มีการแจ้งปัญหา IT ใหม่ (New IT Ticket)
            </div>
            <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
              <tr>
                <td bgcolor="#f89919" style="background-color: #f89919; color: #0f172a; font-family: monospace, 'Segoe UI', Tahoma, sans-serif; font-size: 16px; font-weight: bold; padding: 5px 18px; border-radius: 14px; letter-spacing: 0.5px;">
                  ${ticket.ticket_no}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body Content -->
        <tr>
          <td style="padding: 24px 28px 20px; font-family: 'Segoe UI', Tahoma, Arial, sans-serif;">
            <p style="color: #334155; font-size: 14.5px; margin-top: 0; line-height: 1.6;">
              เรียน <strong>ทีมงาน IT Support / ผู้ดูแลระบบ</strong>,<br/>
              มีรายการแจ้งปัญหาการใช้งานอุปกรณ์คอมพิวเตอร์และระบบสารสนเทศใหม่เข้ามา โดยมีรายละเอียดดังต่อไปนี้:
            </p>

            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 18px 0; border: 1px solid #e2e8f0; font-size: 13.5px;">
              <tr bgcolor="#f8fafc" style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <td width="145" style="padding: 10px 14px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">รหัสคำขอ:</td>
                <td style="padding: 10px 14px; color: #0f172a; font-weight: bold; font-family: monospace; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${ticket.ticket_no}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">ผู้แจ้งปัญหา:</td>
                <td style="padding: 10px 14px; color: #0f172a; font-weight: bold; border-bottom: 1px solid #e2e8f0;">${ticket.name || '-'}</td>
              </tr>
              <tr bgcolor="#f8fafc" style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">แผนก / สังกัด:</td>
                <td style="padding: 10px 14px; color: #0f172a; font-weight: 500; border-bottom: 1px solid #e2e8f0;">${ticket.department || '-'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">หมวดหมู่อุปกรณ์:</td>
                <td style="padding: 10px 14px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${ticket.category || '-'}</td>
              </tr>
              <tr bgcolor="#f8fafc" style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">ระดับความเร่งด่วน:</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">${urgencyBadge}</td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600;">เวลาที่ส่งเรื่อง:</td>
                <td style="padding: 10px 14px; color: #0f172a;">${nowFormatted}</td>
              </tr>
            </table>

            <!-- Description Box -->
            <table width="100%" border="0" cellpadding="14" cellspacing="0" bgcolor="#fffbeb" style="background-color: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f89919; margin: 20px 0 10px;">
              <tr>
                <td style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif;">
                  <div style="color: #92400e; font-weight: bold; font-size: 13px; margin-bottom: 6px;">📝 รายละเอียดอาการ / ปัญหาที่พบ:</div>
                  <div style="color: #0f172a; font-size: 14px; line-height: 1.6;">${formattedDescription}</div>
                </td>
              </tr>
            </table>

            <!-- Action Button -->
            <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 26px auto 10px;">
              <tr>
                <td align="center" bgcolor="#f89919" style="background-color: #f89919; border-radius: 8px;">
                  <a href="https://portal.ascgglobalgroup.com/admin/it-support" target="_blank" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 14px; font-weight: bold; color: #0f172a; text-decoration: none; padding: 13px 30px; display: inline-block;">
                    🔗 เข้าสู่ระบบเพื่อตรวจสอบและรับงาน (Open Ticket)
                  </a>
                </td>
              </tr>
            </table>

            <p style="color: #64748b; font-size: 13px; margin-bottom: 0; margin-top: 25px; line-height: 1.5;">
              แจ้งเตือนจากระบบบริหารจัดการงานไอที (IT Helpdesk System)<br/>
              <strong style="color: #0f172a;">ASCG Global Group</strong>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" bgcolor="#f8fafc" style="background-color: #f8fafc; padding: 16px 20px; border-top: 1px solid #e2e8f0; font-family: 'Segoe UI', Tahoma, Arial, sans-serif;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.5;">
              อีเมลฉบับนี้ส่งโดยระบบอัตโนมัติ ASCG IT Portal (<a href="https://portal.ascgglobalgroup.com/admin/it-support" style="color: #64748b; text-decoration: underline;">https://portal.ascgglobalgroup.com/</a>) • กรุณาอย่าตอบกลับอีเมลนี้<br/>
              &copy; ASCG Global Group Management System
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
    `;

    // 6. ส่งอีเมล
    await transporter.sendMail({
      from: `"${settings.from_name || 'ASCG IT Helpdesk'}" <${settings.from_email || settings.smtp_user}>`,
      to: toEmails.join(', '),
      cc: ccEmails.length > 0 ? ccEmails.join(', ') : undefined,
      subject: `[แจ้งปัญหา IT] ${ticket.ticket_no} - ${ticket.name} (${ticket.category} - ${ticket.urgency || 'ปกติ'})`,
      html: html
    });

    console.log(`[Email Sent] ✅ ส่งแจ้งเตือน IT Ticket ${ticket.ticket_no} ไปยัง: ${toEmails.join(', ')} สำเร็จ`);
  } catch (err) {
    console.error(`[Email Error] ❌ ส่งอีเมลแจ้งเตือน IT Ticket ${ticket.ticket_no} ไม่สำเร็จ:`, err.message);
  }
}

// -------------------------------------------------------------
// 1. รับเรื่องแจ้งปัญหาใหม่จากพนักงาน (POST)
// -------------------------------------------------------------
exports.createTicket = async (req, res) => {
  const { name, department, category, urgency, description } = req.body;

  try {
    // --- 🌟 เริ่มสร้างรหัสแบบ IT-6907001 🌟 ---
    const now = new Date();
    // 1. หาปี พ.ศ. เอาแค่ 2 ตัวท้าย (เช่น 2026 + 543 = 2569 ตัดเหลือ '69')
    const thaiYear = (now.getFullYear() + 543).toString().slice(-2);
    // 2. หาเดือน (บวก 1 เพราะ JS เริ่มเดือน 0) และเติม 0 ข้างหน้าถ้าเป็นเลขหลักเดียว (เช่น '07')
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    // คำนำหน้ารหัสของเดือนนี้ เช่น 'IT-6907'
    const prefix = `IT-${thaiYear}${month}`;

    // 3. ค้นหารหัสล่าสุดในฐานข้อมูลที่ขึ้นต้นด้วย 'IT-6907'
    const [rows] = await pool.query(
      `SELECT ticket_no FROM it_supports WHERE ticket_no LIKE ? ORDER BY ticket_no DESC LIMIT 1`,
      [`${prefix}%`]
    );

    let runningNum = 1;
    if (rows.length > 0) {
      const lastTicket = rows[0].ticket_no; 
      runningNum = parseInt(lastTicket.slice(-3), 10) + 1;
    }

    const runningStr = runningNum.toString().padStart(3, '0');
    const ticketNo = `${prefix}${runningStr}`;
    // --- 🌟 จบการสร้างรหัส 🌟 ---

    // บันทึกลงฐานข้อมูลด้วยรหัสใหม่
    const [result] = await pool.execute(
      `INSERT INTO it_supports (ticket_no, name, department, category, urgency, description, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'รอรับเรื่อง')`,
      [ticketNo, name, department, category, urgency, description]
    );

    // 📧 ส่งอีเมลแจ้งเตือนทีม IT แบบ Asynchronous ทันที
    sendTicketNotificationEmail({
      ticket_no: ticketNo,
      name,
      department,
      category,
      urgency,
      description
    }).catch(e => console.error('Async Ticket Email Error:', e));

    res.status(201).json({ 
      status: 'success', 
      message: 'ส่งแจ้งปัญหาสำเร็จ',
      ticket_no: ticketNo
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  }
};

// -------------------------------------------------------------
// 2. ดึงรายการแจ้งปัญหาทั้งหมดสำหรับ Admin (GET)
// -------------------------------------------------------------
exports.getAllTickets = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM it_supports ORDER BY created_at DESC'
    );
    res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงข้อมูลรายการได้' });
  }
};

// -------------------------------------------------------------
// 3. อัปเดตสถานะและข้อมูลผู้รับผิดชอบโดย Admin (PUT)
// -------------------------------------------------------------
exports.updateTicket = async (req, res) => {
  const { id } = req.params;
  const { status, admin_note, assigned_to } = req.body;

  try {
    await pool.execute(
      `UPDATE it_supports 
       SET status = ?, admin_note = ?, assigned_to = ? 
       WHERE id = ?`,
      [status, admin_note, assigned_to, id]
    );

    res.status(200).json({ status: 'success', message: 'อัปเดตข้อมูลสำเร็จ' });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
  }
};

// -------------------------------------------------------------
// 4. ลบรายการแจ้งปัญหาโดย Admin (DELETE)
// -------------------------------------------------------------
exports.deleteTicket = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.execute(
      'DELETE FROM it_supports WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบรายการที่ต้องการลบ' });
    }

    res.status(200).json({ status: 'success', message: 'ลบรายการแจ้งปัญหาสำเร็จ' });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
  }
};
