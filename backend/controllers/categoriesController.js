const pool = require('../config/db');

// ==========================================
// IT Categories
// ==========================================
exports.getITCategories = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM it_categories ORDER BY name ASC');
    res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.createITCategory = async (req, res) => {
  const { name, status } = req.body;
  if (!name) return res.status(400).json({ status: 'error', message: 'กรุณากรอกชื่อหมวดหมู่' });
  try {
    await pool.query('INSERT INTO it_categories (name, status) VALUES (?, ?)', [name, status || 'Active']);
    res.status(201).json({ status: 'success', message: 'เพิ่มหมวดหมู่สำเร็จ' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ status: 'error', message: 'หมวดหมู่นี้มีอยู่ในระบบแล้ว' });
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updateITCategory = async (req, res) => {
  const { id } = req.params;
  const { name, status } = req.body;
  try {
    await pool.query('UPDATE it_categories SET name = ?, status = ? WHERE id = ?', [name, status, id]);
    res.status(200).json({ status: 'success', message: 'แก้ไขข้อมูลหมวดหมู่สำเร็จ' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ status: 'error', message: 'หมวดหมู่นี้ถูกใช้งานแล้ว' });
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.deleteITCategory = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM it_categories WHERE id = ?', [id]);
    res.status(200).json({ status: 'success', message: 'ลบหมวดหมู่สำเร็จ' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ==========================================
// Announcement Types
// ==========================================
exports.getAnnouncementTypes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM announcement_types ORDER BY name ASC');
    res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.createAnnouncementType = async (req, res) => {
  const { name, status } = req.body;
  if (!name) return res.status(400).json({ status: 'error', message: 'กรุณากรอกชื่อประเภท' });
  try {
    await pool.query('INSERT INTO announcement_types (name, status) VALUES (?, ?)', [name, status || 'Active']);
    res.status(201).json({ status: 'success', message: 'เพิ่มประเภทสำเร็จ' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ status: 'error', message: 'ประเภทนี้มีอยู่ในระบบแล้ว' });
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updateAnnouncementType = async (req, res) => {
  const { id } = req.params;
  const { name, status } = req.body;
  try {
    await pool.query('UPDATE announcement_types SET name = ?, status = ? WHERE id = ?', [name, status, id]);
    res.status(200).json({ status: 'success', message: 'แก้ไขข้อมูลประเภทสำเร็จ' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ status: 'error', message: 'ประเภทนี้ถูกใช้งานแล้ว' });
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.deleteAnnouncementType = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM announcement_types WHERE id = ?', [id]);
    res.status(200).json({ status: 'success', message: 'ลบประเภทสำเร็จ' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
