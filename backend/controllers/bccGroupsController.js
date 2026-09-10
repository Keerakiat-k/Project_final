const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM bcc_groups ORDER BY id ASC');
    res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error('Error fetching BCC groups:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const { label, email } = req.body;
    if (!label || !email) {
      return res.status(400).json({ status: 'error', message: 'Label and email are required' });
    }
    const [result] = await pool.query('INSERT INTO bcc_groups (label, email) VALUES (?, ?)', [label, email]);
    res.status(201).json({ status: 'success', message: 'เพิ่มกลุ่ม BCC สำเร็จ', data: { id: result.insertId, label, email } });
  } catch (error) {
    console.error('Error creating BCC group:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, email } = req.body;
    if (!label || !email) {
      return res.status(400).json({ status: 'error', message: 'Label and email are required' });
    }
    await pool.query('UPDATE bcc_groups SET label = ?, email = ? WHERE id = ?', [label, email, id]);
    res.json({ status: 'success', message: 'แก้ไขกลุ่ม BCC สำเร็จ' });
  } catch (error) {
    console.error('Error updating BCC group:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM bcc_groups WHERE id = ?', [id]);
    res.json({ status: 'success', message: 'ลบกลุ่ม BCC สำเร็จ' });
  } catch (error) {
    console.error('Error deleting BCC group:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
