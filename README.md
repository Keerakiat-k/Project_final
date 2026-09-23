# CorpHub - Enterprise Resource & Management Portal

[![Node.js Version](https://img.shields.io/badge/Node.js-18%2B%20%7C%2020%2B%20LTS-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![Vite Version](https://img.shields.io/badge/Vite-8.1-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC.svg)](https://tailwindcss.com/)
[![Database](https://img.shields.io/badge/Database-MySQL%20%7C%20File%20DB-orange.svg)](https://www.mysql.com/)
[![Biometric](https://img.shields.io/badge/Biometric-ZKTeco%20SpeedFace--V3L-red.svg)](https://www.zkteco.com/)

**CorpHub** คือระบบเว็บพอร์ทัลศูนย์กลางการบริหารจัดการทรัพยากรบุคคล ทรัพย์สินเทคโนโลยีสารสนเทศ และการบริการงานไอทีภายในองค์กร ออกแบบภายใต้มาตรฐานความปลอดภัยระดับ Enterprise และสถาปัตยกรรมที่ยืดหยุ่น รองรับการรันทั้งแบบแยกพอร์ตสำหรับงานพัฒนา (Development) และแบบ Single-Port Standalone Application สำหรับเซิร์ฟเวอร์จริง (Production)

---

## สารบัญ

- [ฟีเจอร์เด่นของระบบ (Key Features)](#ฟีเจอร์เด่นของระบบ-key-features)
- [เทคโนโลยีและสถาปัตยกรรม (Tech Stack & Architecture)](#เทคโนโลยีและสถาปัตยกรรม-tech-stack--architecture)
- [โครงสร้างโปรเจกต์ (Project Structure)](#โครงสร้างโปรเจกต์-project-structure)
- [เริ่มต้นใช้งานด่วน (Quick Start Guide)](#เริ่มต้นใช้งานด่วน-quick-start-guide)
  - [1. ติดตั้ง Dependencies](#1-ติดตั้ง-dependencies)
  - [2. ตั้งค่าไฟล์สภาพแวดล้อม (.env)](#2-ตั้งค่าไฟล์สภาพแวดล้อม-env)
  - [3. สั่งรันโปรเจกต์](#3-สั่งรันโปรเจกต์)
- [โหมดการทำงานของฐานข้อมูล (Database Modes)](#โหมดการทำงานของฐานข้อมูล-database-modes)
- [การรันแบบ Production Standalone](#การรันแบบ-production-standalone)
- [เอกสารและคู่มือระบบ (Documentation)](#เอกสารและคู่มือระบบ-documentation)
- [ผู้พัฒนาและลิขสิทธิ์ (License & Author)](#ผู้พัฒนาและลิขสิทธิ์-license--author)

---

## ฟีเจอร์เด่นของระบบ (Key Features)

### 👥 1. การบริหารงานบุคคล (HR & Employee Directory)
- จัดการทะเบียนประวัติพนักงาน รูปโปรไฟล์ แผนก ตำแหน่ง และบริษัทในเครือ
- ระบบสร้างรหัสพนักงานอัตโนมัติอิงตาม Prefix บริษัทและปี พ.ศ. (Running Number)
- ระบบจัดการบทบาทและสิทธิ์การใช้งาน (Role-Based Access Control - RBAC)

### 🎫 2. ระบบบริการแจ้งซ่อมไอที (IT Helpdesk & Service Desk)
- ระบบส่งคำร้องแจ้งซ่อมทั้งแบบ Public (พนักงานทั่วไป) และแบบ Protected (ผู้ดูแลระบบ)
- มอบหมายงานแก่ช่างไอที ติดตามสถานะ (Pending, In Progress, Resolved, Closed)
- แจ้งเตือนผ่านอีเมลอัตโนมัติเมื่อมีการเปิด Ticket หรืออัปเดตงาน

### 💻 3. การบริหารทรัพย์สินและอุปกรณ์ไอที (IT Asset & License Management)
- ทะเบียนทรัพย์สิน คอมพิวเตอร์ โน้ตบุ๊ก จอภาพ และอุปกรณ์ต่อพ่วง
- ผูกและบันทึกใบอนุญาตใช้งานซอฟต์แวร์ (Software Licenses & Keys)
- บันทึกประวัติการส่งมอบ/โอนย้ายผู้ถือครอง และประวัติการส่งซ่อมบำรุง

### ⏱️ 4. ระบบลงเวลาและเชื่อมต่อเครื่องสแกนชีวมิติ (Biometric Time Attendance)
- เชื่อมต่อผ่านเครือข่าย Socket กับเครื่องสแกนใบหน้าและลายนิ้วมือ **ZKTeco SpeedFace-V3L**
- ตรวจสอบสถานะ Online/Offline ของเครื่องสแกนแบบ Real-time
- ซิงค์บันทึกเวลาเข้า-ออกงาน (Attendance Punch Logs) เข้าสู่ฐานข้อมูลอัตโนมัติ

### 📢 5. ข่าวสารองค์กรและกลุ่มอีเมล (Announcements & BCC Groups)
- เผยแพร่ข่าวสาร ประชาสัมพันธ์ พร้อมรูปภาพปกและหมวดหมู่ข่าว
- รองรับการตั้งกลุ่มรับข่าวสารทางอีเมล (BCC Groups) เพื่อกระจายอีเมลตามฝ่าย/แผนก

### 🌐 6. การดูแลระบบเครือข่ายและโครงสร้างพื้นฐาน (Network & Web Hosting)
- บันทึกรายละเอียดอุปกรณ์เครือข่าย Switch, Router, Access Point และหมายเลข IP
- ติดตามวันหมดอายุโดเมนเนม สัญญาเช่า Cloud/Web Hosting พร้อมแจ้งเตือน

### 🩺 7. การตรวจสุขภาพระบบไอทีประจำวัน (IT Daily Health Check)
- ฟอร์มตรวจสอบความพร้อมระบบคอมพิวเตอร์และเครือข่ายสาขาประจำวัน
- แดชบอร์ดสรุปภาพรวมสำหรับผู้บริหาร (Executive Summary)
- ส่งออกรายงานการตรวจสุขภาพระบบเป็นไฟล์ Excel (.xlsx)

---

## เทคโนโลยีและสถาปัตยกรรม (Tech Stack & Architecture)

| ส่วนของระบบ | เทคโนโลยีที่เลือกใช้ | รายละเอียด |
| :--- | :--- | :--- |
| **Frontend UI** | **React 19**, **Vite 8** | Single Page Application ประสิทธิภาพสูง โหลดเร็วระดับมิลลิวินาที |
| **Styling** | **Tailwind CSS v4** | สไตล์ตกแต่งแบบ Modern Enterprise Responsive |
| **Icons & Charts** | **Lucide React**, **Recharts** | ไอคอนและกราฟิกสถิติ |
| **Routing** | **React Router v7** | ระบบนำทางฝั่งไคลเอนต์พร้อมระบบป้องกัน Route สิทธิ์ |
| **Backend API** | **Node.js (Express 5)** | RESTful API สถาปัตยกรรม Controller-Route-Service |
| **Authentication** | **JWT**, **bcryptjs** | การยืนยันตัวตนด้วยโทเคนและการเข้ารหัสรหัสผ่าน |
| **File Storage** | **Multer** | จัดเก็บรูปภาพโปรไฟล์ เอกสาร และไฟล์แนบในไดเรกทอรี \`backend/uploads\` |
| **Hardware Driver** | **node-zklib** | สื่อสารกับเครื่องสแกนใบหน้า ZKTeco ผ่าน Socket TCP/UDP 4370 |
| **Email Service** | **nodemailer** | ส่งอีเมลผ่าน SMTP (Gmail, Microsoft 365, Corporate Mail) |
| **Data Engine** | **Dual Engine**: <br>1. File DB Simulator (JSON)<br>2. MySQL 8.0+ / MariaDB 10.4+ | สามารถสลับโหมดได้ผ่านตัวแปรสภาพแวดล้อม \`USE_FILE_DB\` |

---

## โครงสร้างโปรเจกต์ (Project Structure)

```text
corp_hub/
├── backend/            # ระบบเซิร์ฟเวอร์ Express API
│   ├── config/         # คอนฟิกฐานข้อมูล (db.js) รองรับ File DB และ MySQL
│   ├── controllers/    # Business Logic แต่ละโมดูล
│   ├── data/           # ฐานข้อมูลจำลอง JSON (สำหรับ File DB Mode)
│   ├── middlewares/    # การยืนยันสิทธิ์ JWT และการตรวจสอบสิทธิ์
│   ├── routes/         # เส้นทาง API Endpoints
│   ├── services/       # ไดรเวอร์ ZKTeco และบริการภายนอก
│   ├── uploads/        # ไฟล์ที่อัปโหลดเข้าสู่ระบบ
│   ├── .env.example    # ไฟล์ตัวอย่างคอนฟิก Backend
│   ├── package.json    # รายการแพ็กเกจ Backend
│   └── server.js       # เซิร์ฟเวอร์หลัก (รองรับ Standalone Serve)
│
├── frontend/           # ระบบเว็บอินเตอร์เฟซ React Vite
│   ├── dist/           # ผลลัพธ์จากการ Build พร้อมใช้งานบนเซิร์ฟเวอร์จริง
│   ├── public/         # ไฟล์ทรัพยากรคงที่
│   ├── src/            # ซอร์สโค้ด React (Components, Pages, Services)
│   ├── .env.example    # ไฟล์ตัวอย่างคอนฟิก Frontend
│   ├── package.json    # รายการแพ็กเกจ Frontend
│   └── vite.config.js  # การตั้งค่า Vite
│
├── docs/               # คู่มือการติดตั้งและการดูแลระบบอย่างละเอียด
│   └── Setup_and_Connection_Guide.md
├── schema.sql          # สคริปต์โครงสร้างตารางฐานข้อมูลสำหรับ MySQL
└── README.md           # เอกสารแนะนำโปรเจกต์
```

---

## เริ่มต้นใช้งานด่วน (Quick Start Guide)

### 1. ติดตั้ง Dependencies

```bash
# ติดตั้งฝั่ง Backend
cd backend
npm install

# ติดตั้งฝั่ง Frontend
cd ../frontend
npm install
```

### 2. ตั้งค่าไฟล์สภาพแวดล้อม (.env)

สร้างไฟล์ `.env` ในทั้งสองโฟลเดอร์:

**ใน `backend/.env`:**
```env
PORT=5000
USE_FILE_DB=true
JWT_SECRET=CorpHubEnterpriseSecretKey2026!@#$%^
JWT_EXPIRES_IN=30d
ZKTECO_IP=192.168.99.7
ZKTECO_PORT=4370
```
*(ค่าเริ่มต้นตั้งเป็น `USE_FILE_DB=true` ทำให้สามารถรันได้ทันทีโดยไม่ต้องติดตั้ง MySQL)*

**ใน `frontend/.env`:**
```env
VITE_API_BASE_URL=http://localhost:5000
```

### 3. สั่งรันโปรเจกต์

เปิด 2 Terminal ควบคู่กัน:

```bash
# Terminal 1: เริ่มการทำงาน Backend (พอร์ต 5000)
cd backend
npm run dev

# Terminal 2: เริ่มการทำงาน Frontend (พอร์ต 5173)
cd frontend
npm run dev
```

เปิดเบราว์เซอร์ไปที่: **`http://localhost:5173`**

---

## โหมดการทำงานของฐานข้อมูล (Database Modes)

ระบบ CorpHub ถูกออกแบบให้มีความยืดหยุ่นในการจัดเก็บข้อมูล 2 รูปแบบ:

1. **File DB Simulator (`USE_FILE_DB=true`)**:
   - บันทึกและอ่านข้อมูลจากไฟล์ JSON ในไดเรกทอรี `backend/data/`
   - สะดวกที่สุดสำหรับการพัฒนาในเครื่อง (Local Dev) หรือการทดลองใช้งานระบบโดยไม่ต้องตั้งค่า MySQL
2. **MySQL / MariaDB (`USE_FILE_DB=false`)**:
   - เหมาะสำหรับการใช้งานจริงในระดับองค์กร (Production)
   - นำเข้าโครงสร้างตารางด้วยคำสั่ง:
     ```bash
     mysql -u root -p ascg_g_db < schema.sql
     ```
   - ระบุค่า `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` ใน `backend/.env`

---

## การรันแบบ Production Standalone

เซิร์ฟเวอร์ Express ถูกออกแบบให้สามารถ Serve ทั้ง Frontend (React SPA) และ Backend (REST API) **บนพอร์ตเดียว (พอร์ต 5000)** ได้ทันที:

```bash
# 1. Build โค้ด Frontend
cd frontend
npm run build

# 2. เริ่มเซิร์ฟเวอร์ Backend
cd ../backend
npm start
```
เข้าใช้งานผ่าน URL: **`http://localhost:5000`** หรือ **`http://<server-ip>:5000`**

---

## เอกสารและคู่มือระบบ (Documentation)

สำหรับคู่มือและรายละเอียดเชิงลึกทั้งหมด สามารถอ่านต่อได้ในไดเรกทอรี `docs/`:

- 📖 **[คู่มือการติดตั้งและการเชื่อมต่อระบบฉบับสมบูรณ์ (Setup & Connection Guide)](docs/Setup_and_Connection_Guide.md)**
  - ความต้องการของระบบและฮาร์ดแวร์
  - ตารางอธิบายตัวแปรสภาพแวดล้อม `.env` ทุกตัว
  - ขั้นตอนการ Import `schema.sql` และคำอธิบายตาราง
  - การเชื่อมต่อและตั้งค่าเครื่องสแกนใบหน้า ZKTeco SpeedFace-V3L
  - การตั้งค่า Email SMTP (Gmail App Password, Microsoft 365)
  - การตั้งค่า Production Process Manager (PM2 / Windows Service) และ Nginx Reverse Proxy
  - การตรวจสอบและแก้ไขปัญหาที่พบบ่อย (Troubleshooting)

---

## ผู้พัฒนาและลิขสิทธิ์ (License & Author)

- **ผู้พัฒนา**: Keerakiat Kanchanawas
- **สังกัด**: ฝ่ายเทคโนโลยีสารสนเทศ (IT Department)
- **ลิขสิทธิ์**: จัดทำขึ้นสำหรับการใช้งานภายในองค์กร CorpHub Enterprise
