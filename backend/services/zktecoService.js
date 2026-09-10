const ZKLib = require('node-zklib');
const pool = require('../config/db');

const DEFAULT_IP = '192.168.99.7';
const DEFAULT_PORT = 4370;

class ZKTecoService {
  constructor(ip = DEFAULT_IP, port = DEFAULT_PORT) {
    this.ip = ip;
    this.port = port;
  }

  // สร้าง Socket เชื่อมต่อ
  async createConnection(timeout = 5000) {
    const zk = new ZKLib(this.ip, this.port, timeout, 4000);
    await zk.createSocket();
    return zk;
  }

  // 1. ตรวจสอบสถานะเครื่อง
  async getStatus() {
    let zk = null;
    try {
      zk = await this.createConnection(4000);
      const info = await zk.getInfo();
      await zk.disconnect();
      return {
        online: true,
        ip: this.ip,
        port: this.port,
        userCounts: info.userCounts || 0,
        logCounts: info.logCounts || 0,
        logCapacity: info.logCapacity || 200000,
        deviceName: 'SpeedFace-V3L (Soi-10)'
      };
    } catch (err) {
      if (zk) {
        try { await zk.disconnect(); } catch (e) {}
      }
      return {
        online: false,
        ip: this.ip,
        port: this.port,
        error: err.message,
        deviceName: 'SpeedFace-V3L (Soi-10)'
      };
    }
  }

  // 2. ดึงรายชื่อผู้ใช้จากเครื่อง
  async getUsers() {
    let zk = null;
    try {
      zk = await this.createConnection(5000);
      const usersData = await zk.getUsers();
      await zk.disconnect();
      return usersData?.data || [];
    } catch (err) {
      if (zk) {
        try { await zk.disconnect(); } catch (e) {}
      }
      throw err;
    }
  }

  // 3. ดึงประวัติการลงเวลาดิบจากเครื่อง
  async getRawAttendances() {
    let zk = null;
    try {
      zk = await this.createConnection(10000);
      const logsData = await zk.getAttendances();
      await zk.disconnect();
      return logsData?.data || [];
    } catch (err) {
      if (zk) {
        try { await zk.disconnect(); } catch (e) {}
      }
      throw err;
    }
  }

  // 4. สั่งลบผู้ใช้ออกจากเครื่อง
  async deleteUser(uid) {
    let zk = null;
    try {
      zk = await this.createConnection(5000);
      const uidInt = parseInt(uid, 10);
      const dataBuf = Buffer.alloc(2);
      dataBuf.writeUInt16LE(uidInt, 0);
      await zk.executeCmd(18, dataBuf); // CMD_DELETE_USER
      await zk.executeCmd(1013, Buffer.alloc(0)); // CMD_REFRESHDATA
      await zk.disconnect();
      return { success: true, message: `Deleted user uid: ${uid}` };
    } catch (err) {
      if (zk) {
        try { await zk.disconnect(); } catch (e) {}
      }
      throw err;
    }
  }

  // 5. ซิงค์เวลาลงฐานข้อมูล MySQL
  async syncAttendancesToDatabase() {
    let zk = null;
    try {
      zk = await this.createConnection(15000);
      const logsData = await zk.getAttendances();
      await zk.disconnect();
      zk = null;

      const logs = logsData?.data || [];
      if (logs.length === 0) {
        return { totalDeviceLogs: 0, newSyncedLogs: 0 };
      }

      // 1. ดึงรายชื่อผู้ใช้จากเครื่องสแกนเพื่อเอาชื่อที่ผูกกับ User ID แต่ละคน
      let deviceUsers = [];
      try {
        const uZk = await this.createConnection(6000);
        const uData = await uZk.getUsers();
        await uZk.disconnect();
        deviceUsers = uData?.data || [];
      } catch (uErr) {
        console.warn('Could not fetch device users during sync:', uErr.message);
      }

      // 2. ดึงรายชื่อพนักงานทั้งหมดในฐานข้อมูล Portal
      const [employees] = await pool.query(`
        SELECT id, employee_code, first_name_th, last_name_th, first_name_en, last_name_en 
        FROM employees
      `);

      // 3. สร้าง Map จับคู่ระหว่าง deviceUserId กับ employee ในระบบ
      const userMapping = {};

      for (const d of deviceUsers) {
        const dUserId = String(d.userId || '').trim();
        const dName = (d.name || '').trim();
        if (!dUserId || !dName) continue;

        const dClean = dName.toLowerCase().replace(/\s+/g, ' ');
        const dParts = dClean.split(' ');
        const dFirst = dParts[0];
        const dLast = dParts.slice(1).join(' ');

        let matchedEmp = null;

        // 3.1 เทียบชื่อ-นามสกุล EN เต็มตรงกัน
        for (const e of employees) {
          const eFull = `${e.first_name_en || ''} ${e.last_name_en || ''}`.toLowerCase().replace(/\s+/g, ' ').trim();
          if (eFull && (eFull === dClean || dClean === eFull)) {
            matchedEmp = e;
            break;
          }
        }

        // 3.2 เทียบชื่อต้น และนามสกุลย่อ/ชื่อเต็ม
        if (!matchedEmp) {
          for (const e of employees) {
            const eFirst = (e.first_name_en || '').toLowerCase().replace(/\./g, ' ').trim().split(' ')[0];
            if (eFirst && dFirst && eFirst.length >= 4 && (dFirst.startsWith(eFirst) || eFirst.startsWith(dFirst))) {
              const eShortLast = (e.first_name_en || '').includes('.') ? (e.first_name_en.split('.')[1] || '').trim().toLowerCase() : '';
              if (!eShortLast || (dLast && dLast.startsWith(eShortLast))) {
                matchedEmp = e;
                break;
              }
            }
          }
        }

        // 3.3 เทียบรหัสพนักงาน
        if (!matchedEmp) {
          for (const e of employees) {
            if (e.employee_code && (dName.toLowerCase().includes(e.employee_code.toLowerCase()) || dUserId === e.employee_code.toLowerCase())) {
              matchedEmp = e;
              break;
            }
          }
        }

        if (matchedEmp) {
          userMapping[dUserId] = {
            id: matchedEmp.id,
            code: matchedEmp.employee_code,
            name: `${matchedEmp.first_name_th || ''} ${matchedEmp.last_name_th || ''}`.trim() || `${matchedEmp.first_name_en || ''} ${matchedEmp.last_name_en || ''}`.trim()
          };
        }
      }

      let newCount = 0;
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        for (const item of logs) {
          const deviceUserId = String(item.deviceUserId || '').trim();
          if (!deviceUserId) continue;

          const recordDate = new Date(item.recordTime);
          if (isNaN(recordDate.getTime())) continue;
          
          const pad = n => String(n).padStart(2, '0');
          const mysqlDatetime = `${recordDate.getFullYear()}-${pad(recordDate.getMonth() + 1)}-${pad(recordDate.getDate())} ${pad(recordDate.getHours())}:${pad(recordDate.getMinutes())}:${pad(recordDate.getSeconds())}`;

          let matchedEmp = userMapping[deviceUserId] || null;

          const employeeId = matchedEmp ? matchedEmp.id : null;
          const employeeCode = matchedEmp ? matchedEmp.code : null;
          const employeeName = matchedEmp ? matchedEmp.name : null;

          const hours = recordDate.getHours();
          let punchType = 'CheckIn';
          if (hours >= 12 && hours < 14) {
            punchType = 'Lunch';
          } else if (hours >= 15) {
            punchType = 'CheckOut';
          }

          const rawData = JSON.stringify(item);

          const [result] = await connection.query(`
            INSERT INTO attendance_logs (
              employee_id, employee_code, employee_name,
              device_user_id, punch_time, punch_type, verify_type,
              device_name, device_ip, raw_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
              employee_id = VALUES(employee_id),
              employee_code = VALUES(employee_code),
              employee_name = VALUES(employee_name)
          `, [
            employeeId, employeeCode, employeeName,
            deviceUserId, mysqlDatetime, punchType, 'Fingerprint/Face',
            'SpeedFace-V3L Soi-10', this.ip, rawData
          ]);

          if (result.affectedRows === 1) {
            newCount++;
          }
        }

        await connection.commit();
        return {
          totalDeviceLogs: logs.length,
          newSyncedLogs: newCount
        };
      } catch (dbErr) {
        await connection.rollback();
        throw dbErr;
      } finally {
        connection.release();
      }
    } catch (err) {
      if (zk) {
        try { await zk.disconnect(); } catch (e) {}
      }
      throw err;
    }
  }
}

module.exports = new ZKTecoService();
