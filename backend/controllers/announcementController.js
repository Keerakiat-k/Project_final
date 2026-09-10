const pool = require('../config/db');

exports.getAllAnnouncements = async (req, res) => {
  try {
    const { all } = req.query;
    let query = "SELECT * FROM announcements WHERE status = 'Active' ORDER BY created_at DESC";
    
    if (all === 'true') {
        query = "SELECT * FROM announcements ORDER BY created_at DESC";
    }

    const [rows] = await pool.query(query);
    res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงข้อมูลประกาศได้' });
  }
};

exports.getAnnouncementById = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM announcements WHERE id = ?", [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบประกาศ' });
    }
    res.status(200).json({ status: 'success', data: rows[0] });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงข้อมูลประกาศได้' });
  }
};

exports.createAnnouncement = async (req, res) => {
  const { title, content, type } = req.body;
  if (!title || !content) {
    return res.status(400).json({ status: 'error', message: 'กรุณากรอกหัวข้อและเนื้อหา' });
  }

  // รับชื่อไฟล์ถ้ามีการอัปโหลดมา
  const coverImage = req.file ? req.file.filename : null;

  try {
    const [result] = await pool.query(
      "INSERT INTO announcements (title, content, type, cover_image, status) VALUES (?, ?, ?, ?, 'Active')",
      [title, content, type || 'ข่าวสาร', coverImage]
    );
    res.status(201).json({ status: 'success', message: 'เพิ่มประกาศสำเร็จ', insertId: result.insertId });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถเพิ่มประกาศได้' });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, status } = req.body;
    const coverImage = req.file ? req.file.filename : null;

    let query = "UPDATE announcements SET title = ?, content = ?, type = ?, status = ? WHERE id = ?";
    let params = [title, content, type, status, id];

    if (coverImage) {
      query = "UPDATE announcements SET title = ?, content = ?, type = ?, status = ?, cover_image = ? WHERE id = ?";
      params = [title, content, type, status, coverImage, id];
    }

    await pool.execute(query, params);
    res.status(200).json({ status: 'success', message: 'อัปเดตประกาศสำเร็จ' });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถอัปเดตประกาศได้' });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute("DELETE FROM announcements WHERE id = ?", [id]);
    res.status(200).json({ status: 'success', message: 'ลบประกาศสำเร็จ' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถลบประกาศได้' });
  }
};