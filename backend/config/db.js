const fs = require('fs');
const path = require('path');
require('dotenv').config();

const useFileDb = process.env.USE_FILE_DB === 'true';

if (!useFileDb) {
  const mysql = require('mysql2/promise');
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ascg_g_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });

  // Test connection on boot
  pool.getConnection()
    .then(conn => {
      console.log(`[Database] Connected successfully to MySQL (${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'ascg_g_db'})`);
      conn.release();
    })
    .catch(err => {
      console.error(`[Database Error] Failed to connect to MySQL:`, err.message);
    });

  module.exports = pool;
} else {
  console.log('[Database] Running in File DB Mode (Mock JSON in backend/data)');
  const DATA_DIR = path.resolve(__dirname, '../data');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  function getFilePath(collection) {
    return path.join(DATA_DIR, `${collection}.json`);
  }

  function readData(collection) {
    const filePath = getFilePath(collection);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf8');
      return [];
    }
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.error(`Error reading ${collection}.json:`, err.message);
      return [];
    }
  }

  function writeData(collection, data) {
    const filePath = getFilePath(collection);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return data;
  }

  // SQL Query Simulator for basic SELECT / INSERT / UPDATE / DELETE
  async function query(sql, params = []) {
    const trimmed = sql.trim();
    const lower = trimmed.toLowerCase();

    // 1. SELECT
    if (lower.startsWith('select')) {
      // 1.1 SELECT 1
      if (/select\s+1/i.test(trimmed)) {
        return [[{ '1': 1 }]];
      }

      // Identify Table Name
      const fromMatch = trimmed.match(/from\s+([`\w]+)/i);
      if (!fromMatch) return [[]];
      const table = fromMatch[1].replace(/[`]/g, '');

      let rows = readData(table);

      // Filter by ID if simple query like: WHERE id = ?
      if (/where\s+.*id\s*=\s*\?/i.test(trimmed) && params.length > 0) {
        const id = params[params.length - 1];
        rows = rows.filter(r => String(r.id) === String(id));
      }
      // Filter by employee_code / email for login: WHERE employee_code = ? OR email = ?
      else if (/employee_code\s*=\s*\?\s*or\s*email\s*=\s*\?/i.test(lower) && params.length >= 2) {
        const p1 = String(params[0]).toLowerCase();
        const p2 = String(params[1]).toLowerCase();
        rows = rows.filter(r => 
          (r.employee_code && r.employee_code.toLowerCase() === p1) ||
          (r.email && r.email.toLowerCase() === p2)
        );
      }
      // Simple WHERE type = ?
      else if (/where\s+.*type\s*=\s*\?/i.test(lower) && params.length > 0) {
        const type = params[0];
        rows = rows.filter(r => r.type === type);
      }

      return [rows];
    }

    // 2. INSERT
    if (lower.startsWith('insert')) {
      const intoMatch = trimmed.match(/insert\s+into\s+([`\w]+)/i);
      if (!intoMatch) return [{ insertId: Date.now() }];
      const table = intoMatch[1].replace(/[`]/g, '');
      let rows = readData(table);
      const newId = rows.length > 0 ? Math.max(...rows.map(r => Number(r.id) || 0)) + 1 : 1;
      
      // Create new record with mock id
      const newRecord = { id: newId, created_at: new Date().toISOString() };
      rows.push(newRecord);
      writeData(table, rows);
      return [{ insertId: newId, affectedRows: 1 }];
    }

    // 3. UPDATE
    if (lower.startsWith('update')) {
      const updateMatch = trimmed.match(/update\s+([`\w]+)/i);
      if (updateMatch) {
        const table = updateMatch[1].replace(/[`]/g, '');
        const rows = readData(table);
        // update logic if needed
        writeData(table, rows);
      }
      return [{ affectedRows: 1 }];
    }

    // 4. DELETE
    if (lower.startsWith('delete')) {
      const fromMatch = trimmed.match(/from\s+([`\w]+)/i);
      if (fromMatch) {
        const table = fromMatch[1].replace(/[`]/g, '');
        let rows = readData(table);
        if (/where\s+.*id\s*=\s*\?/i.test(trimmed) && params.length > 0) {
          const id = params[params.length - 1];
          rows = rows.filter(r => String(r.id) !== String(id));
          writeData(table, rows);
        }
      }
      return [{ affectedRows: 1 }];
    }

    return [[]];
  }

  module.exports = {
    query,
    execute: query,
    getConnection: async () => ({
      query,
      execute: query,
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {}
    }),
    readData,
    writeData
  };
}
