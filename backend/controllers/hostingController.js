const pool = require('../config/db');

exports.getAllHostings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hostings ORDER BY id ASC');
    res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('Error fetching hostings:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

exports.getHostingById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM hostings WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Hosting not found' });
    }
    res.status(200).json({ status: 'success', data: rows[0] });
  } catch (error) {
    console.error('Error fetching hosting:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

exports.createHosting = async (req, res) => {
  const {
    domain_name, website_url, website_username, website_password,
    email_provider, email_username, email_password,
    registration_date, expiration_date, status, note
  } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO hostings (
        domain_name, website_url, website_username, website_password,
        email_provider, email_username, email_password,
        registration_date, expiration_date, status, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        domain_name, website_url || null, website_username || null, website_password || null,
        email_provider || null, email_username || null, email_password || null,
        registration_date || null, expiration_date || null, status || 'Active', note || null
      ]
    );
    res.status(201).json({ status: 'success', message: 'Hosting created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating hosting:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

exports.updateHosting = async (req, res) => {
  const { id } = req.params;
  const {
    domain_name, website_url, website_username, website_password,
    email_provider, email_username, email_password,
    registration_date, expiration_date, status, note
  } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE hostings SET 
        domain_name = ?, website_url = ?, website_username = ?, website_password = ?,
        email_provider = ?, email_username = ?, email_password = ?,
        registration_date = ?, expiration_date = ?, status = ?, note = ?
       WHERE id = ?`,
      [
        domain_name, website_url || null, website_username || null, website_password || null,
        email_provider || null, email_username || null, email_password || null,
        registration_date || null, expiration_date || null, status || 'Active', note || null,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Hosting not found' });
    }

    res.status(200).json({ status: 'success', message: 'Hosting updated successfully' });
  } catch (error) {
    console.error('Error updating hosting:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

exports.deleteHosting = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM hostings WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Hosting not found' });
    }
    res.status(200).json({ status: 'success', message: 'Hosting deleted successfully' });
  } catch (error) {
    console.error('Error deleting hosting:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
