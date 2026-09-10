const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Helper: Get settings from DB by type
const getSmtpSettings = async (type = 'IT') => {
  const [rows] = await pool.query('SELECT * FROM email_settings WHERE type = ? LIMIT 1', [type]);
  return rows[0] || null;
};

// Helper: Create transporter
const createTransporter = (settings) => {
  return nodemailer.createTransport({
    host: settings.smtp_host,
    port: settings.smtp_port,
    secure: settings.smtp_secure === 1 || settings.smtp_secure === true, // true for 465, false for other ports
    auth: {
      user: settings.smtp_user,
      pass: settings.smtp_pass,
    },
  });
};

exports.getSmtpSettings = getSmtpSettings;
exports.createTransporter = createTransporter;

exports.getSettings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM email_settings');
    // Group by type for the frontend
    const settings = {
      IT: rows.find(r => r.type === 'IT') || null,
      HR: rows.find(r => r.type === 'HR') || null,
    };
    res.json({ status: 'success', data: settings });
  } catch (error) {
    console.error('Error fetching email settings:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { type, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure, from_email, from_name, to_emails, cc_emails, bcc_emails, ticket_emails, welcome_template, announcement_template } = req.body;
    
    if (!type) {
      return res.status(400).json({ status: 'error', message: 'Missing type (IT or HR)' });
    }

    // Check if row exists for this type
    const [existing] = await pool.query('SELECT id FROM email_settings WHERE type = ? LIMIT 1', [type]);
    
    if (existing.length > 0) {
      await pool.query(
        `UPDATE email_settings SET 
          smtp_host = ?, smtp_port = ?, smtp_user = ?, smtp_pass = ?, 
          smtp_secure = ?, from_email = ?, from_name = ?, to_emails = ?, cc_emails = ?, bcc_emails = ?, ticket_emails = ?, welcome_template = ?, announcement_template = ?
         WHERE id = ?`,
        [smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure ? 1 : 0, from_email, from_name, to_emails || '', cc_emails || '', bcc_emails || '', ticket_emails || '', welcome_template || '', announcement_template || '', existing[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO email_settings (type, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure, from_email, from_name, to_emails, cc_emails, bcc_emails, ticket_emails, welcome_template, announcement_template) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [type, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure ? 1 : 0, from_email, from_name, to_emails || '', cc_emails || '', bcc_emails || '', ticket_emails || '', welcome_template || '', announcement_template || '']
      );
    }
    
    res.json({ status: 'success', message: 'บันทึกการตั้งค่าอีเมลเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error updating email settings:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

exports.testEmail = async (req, res) => {
  try {
    const settings = req.body;
    const transporter = createTransporter(settings);

    const info = await transporter.sendMail({
      from: `"${settings.from_name}" <${settings.from_email}>`,
      to: settings.smtp_user, // send to self as a test
      subject: "Test Email from ASCG System ✔",
      text: "This is a test email to verify SMTP configuration.",
      html: "<b>This is a test email to verify SMTP configuration.</b>",
    });

    res.json({ status: 'success', message: 'ส่งอีเมลทดสอบสำเร็จ! (เช็ค Inbox ของคุณ)', info: info.messageId });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ status: 'error', message: 'ส่งอีเมลไม่สำเร็จ: ' + error.message });
  }
};

exports.sendAnnouncement = async (req, res) => {
  try {
    const { id } = req.params; // announcement id
    const { senderType = 'IT', selectedBccList = [] } = req.body;

    // 1. Get Announcement details
    const [announcements] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);
    if (announcements.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบประกาศนี้' });
    }
    const announcement = announcements[0];

    // 2. Fetch configured emails from settings
    let toEmails = [];
    let ccEmails = [];
    let bccEmails = [...selectedBccList]; // Start with the predefined lists selected by user

    const settings = await getSmtpSettings(senderType);
    if (!settings || !settings.smtp_host || !settings.smtp_user) {
      return res.status(400).json({ status: 'error', message: `กรุณาตั้งค่า SMTP สำหรับ ${senderType} ก่อนส่งอีเมล` });
    }

    if (settings.to_emails) {
      toEmails = settings.to_emails.split(',').map(e => e.trim()).filter(e => e);
    }
    if (settings.cc_emails) {
      ccEmails = settings.cc_emails.split(',').map(e => e.trim()).filter(e => e);
    }
    if (settings.bcc_emails) {
      bccEmails = settings.bcc_emails.split(',').map(e => e.trim()).filter(e => e);
    }

    // Remove duplicates
    toEmails = [...new Set(toEmails)];
    ccEmails = [...new Set(ccEmails)];
    bccEmails = [...new Set(bccEmails)];

    if (toEmails.length === 0 && ccEmails.length === 0 && bccEmails.length === 0) {
      return res.json({ status: 'warning', message: 'ไม่พบอีเมลผู้รับที่ตั้งค่าไว้ในหน้า "ตั้งค่าระบบองค์กร" (To, CC หรือ BCC)' });
    }

    const transporter = createTransporter(settings);

    // HTML Template
    const defaultHtmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">📢 ประกาศองค์กร (ASCG)</h2>
        </div>
        <div style="padding: 20px;">
          <h3 style="color: #1e293b; margin-top: 0;">{{title}}</h3>
          <p style="color: #475569; font-size: 13px;">วันที่ประกาศ: {{created_at}}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
          <div style="color: #334155; line-height: 1.6; white-space: pre-wrap;">
            {{content}}
          </div>
        </div>
        <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
          <p style="margin: 0;">นี่คืออีเมลอัตโนมัติจากระบบ ASCG กรุณาอย่าตอบกลับ</p>
        </div>
      </div>
    `;

    let htmlContent = settings.announcement_template || defaultHtmlContent;
    
    // เตรียม HTML สำหรับรูปภาพ
    const attachments = [];
    let imageHtml = '';
    
    if (announcement.cover_image) {
        const path = require('path');
        const fs = require('fs');
        const imagePath = path.join(__dirname, '../uploads/announcements', announcement.cover_image);
        
        if (fs.existsSync(imagePath)) {
            attachments.push({
                filename: announcement.cover_image,
                path: imagePath,
                cid: 'cover_image_cid'
            });
            // ใช้ cid: เพื่อให้ Outlook / Gmail / Webmail โหลดรูปฝังในอีเมลทันทีโดยไม่ถูก Block รูปภาพ
            imageHtml = `<div style="text-align: center; margin: 20px 0;"><img src="cid:cover_image_cid" alt="Announcement Image" width="600" style="width: 100%; max-width: 600px; height: auto; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; display: block; margin: 0 auto;" /></div>`;
        } else {
            const imageUrl = `https://portal.ascgglobalgroup.com/uploads/announcements/${encodeURIComponent(announcement.cover_image)}`;
            imageHtml = `<div style="text-align: center; margin: 20px 0;"><img src="${imageUrl}" alt="Announcement Image" width="600" style="width: 100%; max-width: 600px; height: auto; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; display: block; margin: 0 auto;" /></div>`;
        }
    }

    // Replace placeholders
    htmlContent = htmlContent
        .replace(/{{title}}/g, announcement.title || '')
        .replace(/{{content}}/g, (announcement.content || '').replace(/\n/g, '<br/>'))
        .replace(/{{cover_image}}/g, imageHtml)
        .replace(/{{created_at}}/g, announcement.created_at ? new Date(announcement.created_at).toLocaleDateString('th-TH') : '');

    // 4. Send emails
    const mailOptions = {
      from: `"${settings.from_name}" <${settings.from_email}>`,
      subject: `[ประกาศ] ${announcement.title}`,
      html: htmlContent,
      attachments: attachments
    };
    
    if (toEmails.length > 0) mailOptions.to = toEmails.join(', ');
    if (ccEmails.length > 0) mailOptions.cc = ccEmails.join(', ');
    if (bccEmails.length > 0) mailOptions.bcc = bccEmails.join(', ');

    await transporter.sendMail(mailOptions);

    res.json({ 
      status: 'success', 
      message: `ส่งอีเมลแจ้งประกาศสำเร็จ (To: ${toEmails.length}, CC: ${ccEmails.length}, BCC: ${bccEmails.length})`,
      sentCount: toEmails.length + ccEmails.length + bccEmails.length
    });

  } catch (error) {
    console.error('Send announcement error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการส่งประกาศ: ' + error.message });
  }
};
