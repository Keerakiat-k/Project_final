import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Server, ShieldCheck, ShieldAlert, Wifi, Printer, Clock, Video, Box, Globe, 
  Plus, Search, Edit, Trash2, Eye, EyeOff, RotateCcw, ExternalLink, 
  Lock, X, Check, User, AlertTriangle, Calendar, FileText,
  ArrowDown, ArrowUp, ArrowUpDown, RefreshCw
} from 'lucide-react';
import Swal from 'sweetalert2';
import { TableSkeleton, MobileCardSkeleton } from '../components/common/Skeleton';

// 🌟 รายชื่อสาขาทั้งหมด (5 สาขาหลักตามโครงสร้างองค์กร) 🌟
const BRANCH_LIST = ['ซอย 10', 'ซอย 74', 'ซอย 21', 'ตึก15', 'ระยอง'];

const INITIAL_DEVICES = [
  // ASCG HQ (5 items)
  {
    id: 1,
    ip_address: '192.168.99.1',
    device_name: 'DC Server / DNS',
    brand_name: 'DELL',
    model: 'PowerEdgeR310',
    login_user: 'Root',
    login_password: '@QAZxsw3',
    manage_program: 'https://192.168.99.1:8333',
    login_ssid: 'ASCGGROUP\\Administrator',
    access_key: 'isit@dm%n',
    purchase_date: '',
    category: 'Server',
    branch_name: 'ASCG HQ',
    remark: 'Virtual Server on R310',
    status: 'active'
  },
  {
    id: 2,
    ip_address: '192.168.99.2',
    device_name: 'DNS2/Sharefiles',
    brand_name: 'DELL',
    model: 'PowerEdgeT140',
    login_user: 'ascg_admin',
    login_password: '@QAZxsw3',
    manage_program: 'Win2012R2 /Sharefile/ExpressA',
    login_ssid: 'Administrator',
    access_key: '@dminFS',
    purchase_date: '',
    category: 'Server',
    branch_name: 'ASCG HQ',
    remark: 'ASCGGROUP\\Administrator',
    status: 'active'
  },
  {
    id: 8,
    ip_address: '192.168.99.22',
    device_name: 'CCTV HQ Recorder',
    brand_name: 'HiKvision',
    model: 'DS-7332HQHI-K4',
    login_user: 'admin',
    login_password: 'admin1234',
    manage_program: '9-Dot Pattern (S / เลข 5)',
    login_ssid: 'S/N: DS-7332HQHI-K43220210817CCWRG55450628WCVU',
    access_key: '',
    purchase_date: '2021-11-10',
    category: 'CCTV',
    branch_name: 'ASCG HQ',
    remark: '32-Channel NVR System',
    status: 'active'
  },
  {
    id: 10,
    ip_address: '192.168.99.241',
    device_name: 'Access Point A-F1',
    brand_name: 'TP-Link',
    model: 'EAP610',
    login_user: 'admin',
    login_password: 'isit@dm%n',
    manage_program: 'Unifi Manage',
    login_ssid: 'AIA-WiFi ,Guest ,Multi-SSID',
    access_key: 'ASCGInterpro',
    purchase_date: '2023-06-08',
    category: 'Access Point',
    branch_name: 'ASCG HQ',
    remark: 'POD2300433 (AIA ชั้น 1)',
    status: 'active'
  },
  {
    id: 11,
    ip_address: '192.168.99.254',
    device_name: 'Core Firewall FGT-60E',
    brand_name: 'Fortigate',
    model: 'FGT-60E',
    login_user: 'admin / ascg_admin',
    login_password: 'isit@dm%n',
    manage_program: 'https://forticloud.com',
    login_ssid: 'itd@ascggroup.com',
    access_key: 'P@ssw0rdITD',
    purchase_date: '2022-01-15',
    category: 'Network & Security',
    branch_name: 'ASCG HQ',
    remark: 'Forticloud Primary Gateway',
    status: 'active'
  },

  // BD7 (8 items)
  {
    id: 3,
    ip_address: '192.168.99.4',
    device_name: 'iDRAC Remote Management',
    brand_name: 'DELL',
    model: 'PowerEdgeT140',
    login_user: 'root',
    login_password: 'isit@dm%n',
    manage_program: 'https://192.168.99.4',
    login_ssid: '',
    access_key: '',
    purchase_date: '',
    category: 'Server',
    branch_name: 'BD7',
    remark: 'Default Password หลังเครื่อง',
    status: 'active'
  },
  {
    id: 9,
    ip_address: '192.168.99.23',
    device_name: 'Backup Router',
    brand_name: 'TRENDnet',
    model: 'TEW-432BRP',
    login_user: 'admin',
    login_password: 'isit@dm%n',
    manage_program: 'http://192.168.1.1',
    login_ssid: '',
    access_key: '',
    purchase_date: '',
    category: 'Network & Security',
    branch_name: 'BD7',
    remark: 'Default admin/admin',
    status: 'active'
  },
  {
    id: 12,
    ip_address: '192.168.7.17',
    device_name: 'Time / Finger Access F1 BD7',
    brand_name: 'ZKTeco',
    model: 'F18',
    login_user: 'admin',
    login_password: 'adminpassword',
    manage_program: 'ZKTime 5.0 Program Manage',
    login_ssid: '',
    access_key: '',
    purchase_date: '',
    category: 'VoIP & Time Access',
    branch_name: 'BD7',
    remark: 'Time Access Scan BD7',
    status: 'active'
  },
  {
    id: 13,
    ip_address: '192.168.1.1',
    device_name: '3BB Fiber Modem BD7',
    brand_name: '3BB / Huawei',
    model: 'HG8145X6',
    login_user: 'admin',
    login_password: '3bbpass123',
    manage_program: '192.168.1.1',
    category: 'Network & Security',
    branch_name: 'BD7',
    remark: 'Internet 3BB Fiber FTTX BD7',
    status: 'active'
  },
  {
    id: 14,
    ip_address: '192.168.1.7',
    device_name: 'NEC VoIP BD7 (Port 5060)',
    brand_name: 'NEC',
    model: 'SL1000',
    login_user: 'tech',
    login_password: 'necpass123',
    manage_program: 'WebPro SL1000',
    category: 'VoIP & Time Access',
    branch_name: 'BD7',
    remark: 'SIP Port 5060',
    status: 'active'
  },
  {
    id: 15,
    ip_address: '192.168.1.8',
    device_name: 'NEC VoIP BD7 (Port 10020)',
    brand_name: 'NEC',
    model: 'SL1000',
    login_user: 'tech',
    login_password: 'necpass123',
    manage_program: 'WebPro SL1000',
    category: 'VoIP & Time Access',
    branch_name: 'BD7',
    remark: 'RTP Port 10020',
    status: 'active'
  },
  {
    id: 16,
    ip_address: '192.168.1.16',
    device_name: 'CCTV DVR BD7',
    brand_name: 'T-Gard',
    model: 'PS-7908MI',
    login_user: 'admin',
    login_password: '12345',
    category: 'CCTV',
    branch_name: 'BD7',
    remark: 'CCTV Recorder BD7',
    status: 'active'
  },
  {
    id: 17,
    ip_address: '192.168.7.16',
    device_name: 'CCTV NVR ตึก 7',
    brand_name: 'HiKvision',
    model: 'DS-7608NI-K1',
    login_user: 'admin',
    login_password: '19911991',
    category: 'CCTV',
    branch_name: 'BD7',
    remark: 'Port 8000, HTTP 8080',
    status: 'active'
  },

  // BD8 (23 items)
  {
    id: 4,
    ip_address: '192.168.99.5',
    device_name: 'NAS Storage BD8',
    brand_name: 'QNAP',
    model: 'TS-435A',
    login_user: 'ascg_admin',
    login_password: '1sitAdmin',
    manage_program: 'https://helpdesk.qnap.com',
    login_ssid: 'User Thanakrit.k@ascggroup.com',
    access_key: '',
    purchase_date: '',
    category: 'Server',
    branch_name: 'BD8',
    remark: 'MyQNAPCloud Access',
    status: 'active'
  },
  {
    id: 18,
    ip_address: '192.168.8.1',
    device_name: 'Rack 27U BD8',
    brand_name: 'Germany Export',
    model: '27U',
    category: 'Other',
    branch_name: 'BD8',
    purchase_date: '2014-07-01',
    remark: 'Rack 27U 19" Germany Export Location 8-BD',
    status: 'active'
  },
  {
    id: 19,
    ip_address: '192.168.8.2',
    device_name: 'ASCG-SERV01 (DC, CRM, ExpressI, ShareFile)',
    brand_name: 'HP',
    model: 'DL320e Gen8',
    login_user: 'Administrator',
    login_password: 'P@ssw0rdServ01',
    access_key: '2008 R2 Std.',
    category: 'Server',
    branch_name: 'BD8',
    purchase_date: '2014-07-01',
    remark: 'Xeon 4GB 1TB Blade Server',
    status: 'active'
  },
  {
    id: 20,
    ip_address: '192.168.8.3',
    device_name: 'ASC-SERVER01 (ExpressA)',
    brand_name: 'HP',
    model: 'ML310e Gen8',
    login_user: 'Administrator',
    login_password: 'P@ssw0rdServ01',
    access_key: '2003 R2 Ent.',
    category: 'Server',
    branch_name: 'BD8',
    remark: 'PC Server ExpressA Location 8-BD',
    status: 'active'
  },
  {
    id: 21,
    ip_address: '192.168.8.4',
    device_name: 'NAV-SERVER (Dynamic NAV)',
    brand_name: 'Lenovo',
    model: 'x3650',
    login_user: 'Administrator',
    login_password: 'P@ssw0rdNavServer',
    access_key: '2012 R2 Std. / 2016 20 User',
    category: 'Server',
    branch_name: 'BD8',
    remark: 'Blade Server RDP 5 User',
    status: 'active'
  },
  {
    id: 22,
    ip_address: '192.168.8.5',
    device_name: 'Modem Router Internet 3BB Fiber BD8',
    brand_name: 'Huawei',
    model: 'HG8245H',
    login_user: 'admin',
    login_password: '3bbpass123',
    category: 'Network & Security',
    branch_name: 'BD8',
    remark: '3BB Fiber Internet Modem Router',
    status: 'active'
  },
  {
    id: 23,
    ip_address: '192.168.8.6',
    device_name: 'Firewall Fortigate FGT90D BD8',
    brand_name: 'Fortigate',
    model: 'FGT90D',
    login_user: 'admin',
    login_password: 'isit@dm%n',
    category: 'Network & Security',
    branch_name: 'BD8',
    purchase_date: '2014-07-01',
    remark: 'Core Firewall BD8',
    status: 'active'
  },
  {
    id: 24,
    ip_address: '192.168.8.7',
    device_name: 'LOG Analyzer IDR1000 BD8',
    brand_name: 'Nullsoft',
    model: 'IDR1000',
    login_user: 'admin',
    login_password: 'logpass123',
    category: 'Network & Security',
    branch_name: 'BD8',
    purchase_date: '2014-07-01',
    remark: 'ส่ง Log ไปเก็บที่อุปกรณ์ FLZ-200 ซอย 10',
    status: 'active'
  },
  {
    id: 25,
    ip_address: '192.168.8.8',
    device_name: 'Switch Hub HP 1810-24 #1 BD8',
    brand_name: 'HP',
    model: '1810-24',
    login_user: 'admin',
    login_password: 'hppassword',
    category: 'Network & Security',
    branch_name: 'BD8',
    purchase_date: '2014-07-01',
    remark: 'Internal Managed Switch 24 Port',
    status: 'active'
  },
  {
    id: 26,
    ip_address: '192.168.8.9',
    device_name: 'Switch Hub HP 1810-24 #2 BD8',
    brand_name: 'HP',
    model: '1810-24',
    login_user: 'admin',
    login_password: 'hppassword',
    category: 'Network & Security',
    branch_name: 'BD8',
    purchase_date: '2014-07-01',
    remark: 'Internal Managed Switch 24 Port',
    status: 'active'
  },
  {
    id: 27,
    ip_address: '192.168.8.10',
    device_name: 'UPS LEONIC USV-1500 #1 BD8',
    brand_name: 'LEONIC',
    model: 'USV-1500',
    category: 'Other',
    branch_name: 'BD8',
    purchase_date: '2014-07-01',
    remark: '1500VA UPS Power Supply',
    status: 'active'
  },
  {
    id: 28,
    ip_address: '192.168.8.11',
    device_name: 'UPS LEONIC USV-1500 #2 BD8',
    brand_name: 'LEONIC',
    model: 'USV-1500',
    category: 'Other',
    branch_name: 'BD8',
    remark: '1500VA UPS Power Supply',
    status: 'active'
  },
  {
    id: 29,
    ip_address: '192.168.8.12',
    device_name: 'Access Point UBiQUiTi UniFi F1 BD8',
    brand_name: 'UBiQUiTi',
    model: 'UniFi AP',
    login_user: 'admin',
    login_password: 'unifipassword',
    category: 'Access Point',
    branch_name: 'BD8',
    remark: 'Access Point F1 8-BD',
    status: 'active'
  },
  {
    id: 30,
    ip_address: '192.168.8.13',
    device_name: 'Access Point UBiQUiTi UniFi F2 BD8',
    brand_name: 'UBiQUiTi',
    model: 'UniFi AP',
    login_user: 'admin',
    login_password: 'unifipassword',
    category: 'Access Point',
    branch_name: 'BD8',
    remark: 'Access Point F2 8-BD',
    status: 'active'
  },
  {
    id: 31,
    ip_address: '192.168.8.14',
    device_name: 'Access Point UBiQUiTi UniFi F3 BD8',
    brand_name: 'UBiQUiTi',
    model: 'UniFi AP',
    login_user: 'admin',
    login_password: 'unifipassword',
    category: 'Access Point',
    branch_name: 'BD8',
    remark: 'Access Point F3 8-BD',
    status: 'active'
  },
  {
    id: 32,
    ip_address: '192.168.8.15',
    device_name: 'Time / Door Access ZKT F18 F1 BD8',
    brand_name: 'ZKT',
    model: 'F18',
    login_user: 'admin',
    login_password: 'adminpassword',
    category: 'VoIP & Time Access',
    branch_name: 'BD8',
    remark: 'Time / Door Access F1 8-BD',
    status: 'active'
  },
  {
    id: 33,
    ip_address: '192.168.8.16',
    device_name: 'Door Access ZKT F18 F2 BD8',
    brand_name: 'ZKT',
    model: 'F18',
    login_user: 'admin',
    login_password: 'adminpassword',
    category: 'VoIP & Time Access',
    branch_name: 'BD8',
    remark: 'Door Access F2 8-BD',
    status: 'active'
  },
  {
    id: 34,
    ip_address: '192.168.8.17',
    device_name: 'Door Access ZKT F18 F3 BD8',
    brand_name: 'ZKT',
    model: 'F18',
    login_user: 'admin',
    login_password: 'adminpassword',
    category: 'VoIP & Time Access',
    branch_name: 'BD8',
    remark: 'Door Access F3 8-BD',
    status: 'active'
  },
  {
    id: 35,
    ip_address: '192.168.8.18',
    device_name: 'PABX NEC SL1000 BD8',
    brand_name: 'NEC',
    model: 'SL1000',
    login_user: 'tech',
    login_password: 'necpass123',
    category: 'VoIP & Time Access',
    branch_name: 'BD8',
    remark: 'PABX Telephone 8co/32ext 8-BD',
    status: 'active'
  },
  {
    id: 36,
    ip_address: '192.168.8.19',
    device_name: 'Printer Samsung C9201 BD8',
    brand_name: 'Samsung',
    model: 'C9201',
    login_user: 'admin',
    login_password: 'samsungpass',
    category: 'Printer',
    branch_name: 'BD8',
    remark: 'Printer ISD 8-BD',
    status: 'active'
  },
  {
    id: 37,
    ip_address: '192.168.8.20',
    device_name: 'DVR CCTV T-Grad PS-7908MI BD8',
    brand_name: 'T-Grad',
    model: 'PS-7908MI',
    login_user: 'admin',
    login_password: '12345',
    category: 'CCTV',
    branch_name: 'BD8',
    remark: 'DVR CCTV Recorder 8-BD',
    status: 'active'
  },
  {
    id: 38,
    ip_address: '192.168.8.21',
    device_name: 'Printer HP MFP MP125a Site BangJak BD8',
    brand_name: 'HP',
    model: 'MFP MP125a',
    login_user: 'admin',
    login_password: 'hppassword',
    access_key: 'CNB6HDKCNR',
    category: 'Printer',
    branch_name: 'BD8',
    purchase_date: '2024-07-24',
    remark: 'Printer ISD Site BangJak',
    status: 'active'
  },
  {
    id: 39,
    ip_address: '192.168.8.22',
    device_name: 'AirCard ZTE MF65M Site BangJak BD8',
    brand_name: 'ZTE',
    model: 'MF65M',
    login_user: 'admin',
    login_password: 'ztepassword',
    category: 'Network & Security',
    branch_name: 'BD8',
    purchase_date: '2024-07-24',
    remark: 'Phone 095-6756354 Site BangJak',
    status: 'active'
  },

  // BD15 (28 items)
  {
    id: 5,
    ip_address: '192.168.99.7',
    device_name: 'Time Access Scan BD15',
    brand_name: 'ZKTeco',
    model: 'V3L',
    login_user: 'admin',
    login_password: 'adminpassword',
    manage_program: 'ZKBioAccess Web',
    login_ssid: '',
    access_key: '',
    purchase_date: '',
    category: 'VoIP & Time Access',
    branch_name: 'BD15',
    remark: 'WiFi .76',
    status: 'active'
  },
  {
    id: 40,
    ip_address: '192.168.7.18',
    device_name: 'Time / Finger Access F1 BD15',
    brand_name: 'ZKTeco',
    model: 'F18',
    login_user: 'admin',
    login_password: 'adminpassword',
    manage_program: 'ZKTime 5.0 Program Manage',
    category: 'VoIP & Time Access',
    branch_name: 'BD15',
    remark: 'Time Access Scan BD15',
    status: 'active'
  },
  {
    id: 41,
    ip_address: '192.168.7.9',
    device_name: 'PABX NEC SL1000 BD15',
    brand_name: 'NEC',
    model: 'SL1000',
    login_user: 'tech',
    login_password: '19911991',
    manage_program: 'WebManage 192.168.1.234',
    category: 'VoIP & Time Access',
    branch_name: 'BD15',
    remark: 'PABX Telephone System BD15 / ย้ายมาจาก Soi-10',
    status: 'active'
  },
  {
    id: 42,
    ip_address: '203.151.54.109',
    device_name: 'Express Cloud',
    brand_name: 'Express',
    model: 'Express on Cloud',
    login_user: 'W10E073762-01',
    login_password: 'CST@acc01',
    manage_program: 'http://203.151.54.109',
    purchase_date: '2023-11-07',
    category: 'Server',
    branch_name: 'BD15',
    remark: 'ExpressI On Cloud of CST, S/N: W-10E-073762 (Lek)',
    status: 'active'
  },
  {
    id: 43,
    ip_address: '192.168.1.9',
    device_name: 'NEC VoIP BD15 (Port 5060)',
    brand_name: 'NEC',
    model: 'SL1000',
    login_user: 'tech',
    login_password: '19911991',
    category: 'VoIP & Time Access',
    branch_name: 'BD15',
    remark: 'SIP Port 5060',
    status: 'active'
  },
  {
    id: 44,
    ip_address: '192.168.1.10',
    device_name: 'NEC VoIP BD15 (Port 10020)',
    brand_name: 'NEC',
    model: 'SL1000',
    login_user: 'tech',
    login_password: '19911991',
    category: 'VoIP & Time Access',
    branch_name: 'BD15',
    remark: 'RTP Port 10020',
    status: 'active'
  },
  {
    id: 45,
    ip_address: '192.168.1.15',
    device_name: 'CCTV DVR BD15',
    brand_name: 'T-Gard',
    model: 'PS-7908MI',
    login_user: 'admin',
    login_password: '12345',
    category: 'CCTV',
    branch_name: 'BD15',
    remark: 'CCTV Recorder BD15',
    status: 'active'
  },
  {
    id: 46,
    ip_address: '192.168.1.241',
    device_name: 'Printer Epson L6190 BD15',
    brand_name: 'Epson',
    model: 'L6190',
    login_user: 'admin',
    login_password: 'epsonpassword',
    category: 'Printer',
    branch_name: 'BD15',
    remark: 'Epson InkTank Printer BD15',
    status: 'active'
  },
  {
    id: 47,
    ip_address: '192.168.1.242',
    device_name: 'Printer HP 130-134Fn BD15',
    brand_name: 'HP',
    model: 'LaserJet 130-134Fn',
    login_user: 'admin',
    login_password: 'hppassword',
    category: 'Printer',
    branch_name: 'BD15',
    remark: 'HP LaserJet Printer BD15',
    status: 'active'
  },
  {
    id: 48,
    ip_address: '192.168.1.244',
    device_name: 'Access Point F1 BD-15',
    brand_name: 'TP-Link',
    model: 'EAP620HD',
    login_user: 'admin',
    login_password: 'isit@dm%n',
    login_ssid: 'CST-WiFi / CSTIntergroup',
    category: 'Access Point',
    branch_name: 'BD15',
    remark: 'PO2300222 (19/09/2566)',
    status: 'active'
  },
  {
    id: 49,
    ip_address: '192.168.1.245',
    device_name: 'Access Point F2 BD-15',
    brand_name: 'TP-Link',
    model: 'EAP620HD',
    login_user: 'admin',
    login_password: 'isit@dm%n',
    login_ssid: 'CST-WiFi / CSTIntergroup',
    category: 'Access Point',
    branch_name: 'BD15',
    remark: 'PO2300222 (19/09/2566)',
    status: 'active'
  },
  {
    id: 50,
    ip_address: '192.168.1.246',
    device_name: 'Access Point F3 BD-15',
    brand_name: 'TP-Link',
    model: 'EAP620HD',
    login_user: 'admin',
    login_password: 'isit@dm%n',
    login_ssid: 'CST-WiFi / CSTIntergroup',
    category: 'Access Point',
    branch_name: 'BD15',
    remark: 'PO2300222 (19/09/2566)',
    status: 'active'
  },
  {
    id: 51,
    ip_address: '192.168.7.15',
    device_name: 'CCTV NVR ตึก 15',
    brand_name: 'HiKvision',
    model: 'DS-7616NI-K2',
    login_user: 'admin',
    login_password: '19911991',
    category: 'CCTV',
    branch_name: 'BD15',
    remark: 'Port 8100, HTTP 8181',
    status: 'active'
  },
  {
    id: 52,
    ip_address: '49.0.69.34',
    device_name: 'AIS Fiber Router BD15',
    brand_name: 'AIS',
    model: 'ZTE H198A',
    login_user: 'admin',
    login_password: 'aispassword',
    category: 'Network & Security',
    branch_name: 'BD15',
    remark: 'FixIP: 49.0.69.34, Account: 8804998142, Subnet 192.168.1.1',
    status: 'active'
  },
  {
    id: 53,
    ip_address: '192.168.15.1',
    device_name: 'Rack 9U BD15',
    brand_name: 'Germany Export',
    model: '9U',
    category: 'Other',
    branch_name: 'BD15',
    remark: 'Rack 9U 15-BD-F2',
    status: 'active'
  },
  {
    id: 54,
    ip_address: '192.168.15.2',
    device_name: 'FiberBox Receiver BD15',
    brand_name: 'Media Converter',
    model: 'MC200CM',
    category: 'Network & Security',
    branch_name: 'BD15',
    remark: 'FiberBox Receiver 15-BD-F2',
    status: 'active'
  },
  {
    id: 55,
    ip_address: '192.168.15.3',
    device_name: 'Cisco Switch Hub #1 BD15',
    brand_name: 'Cisco',
    model: 'SG350-28',
    login_user: 'cisco_admin',
    login_password: 'ciscopassword',
    category: 'Network & Security',
    branch_name: 'BD15',
    remark: 'Cisco Switch 1 (or Autoby SW) 15-BD-F2',
    status: 'active'
  },
  {
    id: 56,
    ip_address: '192.168.15.4',
    device_name: 'Cisco Switch Hub #2 BD15',
    brand_name: 'Cisco',
    model: 'SG350-28',
    login_user: 'cisco_admin',
    login_password: 'ciscopassword',
    category: 'Network & Security',
    branch_name: 'BD15',
    remark: 'Cisco Switch 2 (or Autoby SW) 15-BD-F2',
    status: 'active'
  },
  {
    id: 57,
    ip_address: '192.168.15.5',
    device_name: 'UPS BD15',
    brand_name: 'APC',
    model: 'Smart-UPS 1500VA',
    category: 'Other',
    branch_name: 'BD15',
    remark: 'UPS Power Supply 15-BD-F2',
    status: 'active'
  },
  {
    id: 58,
    ip_address: '192.168.15.6',
    device_name: 'NAS Storage QNAP TS-569L BD15',
    brand_name: 'QNAP',
    model: 'TS-569L',
    login_user: 'admin',
    login_password: 'qnapadminpass',
    category: 'Server',
    branch_name: 'BD15',
    remark: 'NAS Storage 5-Bay 15-BD-F2',
    status: 'active'
  },
  {
    id: 59,
    ip_address: '192.168.15.7',
    device_name: 'Printer Kyocera 3500i BD15',
    brand_name: 'Kyocera',
    model: '3500i',
    login_user: 'admin',
    login_password: 'kyocerapassword',
    category: 'Printer',
    branch_name: 'BD15',
    remark: 'Kyocera Multi-function Printer 15-BD',
    status: 'active'
  },
  {
    id: 60,
    ip_address: '192.168.15.8',
    device_name: 'Printer Samsung SL-C-480FW BD15',
    brand_name: 'Samsung',
    model: 'SL-C-480FW',
    login_user: 'admin',
    login_password: 'samsungpass',
    category: 'Printer',
    branch_name: 'BD15',
    purchase_date: '2024-03-01',
    remark: 'Samsung Color Laser Printer Q-Air 15-BD',
    status: 'active'
  },
  {
    id: 61,
    ip_address: '192.168.15.9',
    device_name: 'Printer HP MFP-227-231fdw BD15',
    brand_name: 'HP',
    model: 'MFP-227-231fdw',
    login_user: 'admin',
    login_password: 'hppassword',
    category: 'Printer',
    branch_name: 'BD15',
    remark: 'HP LaserJet Printer ACC 15-BD',
    status: 'active'
  },
  {
    id: 62,
    ip_address: '192.168.15.10',
    device_name: 'Access Point Cisco WAP300N #1 BD15',
    brand_name: 'Cisco',
    model: 'WAP300N',
    login_user: 'cisco_admin',
    login_password: 'ciscopassword',
    category: 'Access Point',
    branch_name: 'BD15',
    remark: 'Access Point AIA 15-BD',
    status: 'active'
  },
  {
    id: 63,
    ip_address: '192.168.15.11',
    device_name: 'Access Point Cisco WAP300N #2 BD15',
    brand_name: 'Cisco',
    model: 'WAP300N',
    login_user: 'cisco_admin',
    login_password: 'ciscopassword',
    category: 'Access Point',
    branch_name: 'BD15',
    remark: 'Access Point AIA 15-BD',
    status: 'active'
  },
  {
    id: 64,
    ip_address: '192.168.15.12',
    device_name: 'Access Point Cisco WAP300N #3 BD15',
    brand_name: 'Cisco',
    model: 'WAP300N',
    login_user: 'cisco_admin',
    login_password: 'ciscopassword',
    category: 'Access Point',
    branch_name: 'BD15',
    remark: 'Access Point AIA 15-BD',
    status: 'active'
  },
  {
    id: 65,
    ip_address: '192.168.15.13',
    device_name: 'Time / Door Access ZKT F18 F1 BD15',
    brand_name: 'ZKT',
    model: 'F18',
    login_user: 'admin',
    login_password: 'adminpassword',
    category: 'VoIP & Time Access',
    branch_name: 'BD15',
    remark: 'Time / Door Access F1 AIA 15-BD',
    status: 'active'
  },
  {
    id: 66,
    ip_address: '192.168.15.14',
    device_name: 'DVR CCTV T-Grad PS-7908MI BD15',
    brand_name: 'T-Grad',
    model: 'PS-7908MI',
    login_user: 'admin',
    login_password: '12345',
    category: 'CCTV',
    branch_name: 'BD15',
    remark: 'DVR CCTV Recorder 15-BD',
    status: 'active'
  },
  {
    id: 67,
    ip_address: '192.168.15.15',
    device_name: 'Printer Brother MFC-L2715DW BD15',
    brand_name: 'Brother',
    model: 'MFC-L2715DW',
    login_user: 'admin',
    login_password: 'brotherpass',
    access_key: 'E78114L2N916057',
    category: 'Printer',
    branch_name: 'BD15',
    purchase_date: '2024-03-01',
    remark: 'Brother Multi-function Printer ACC POD2300639',
    status: 'active'
  },

  // Other branches (2 items)
  {
    id: 6,
    ip_address: '192.168.99.9',
    device_name: 'NEC VoIP System',
    brand_name: 'NEC',
    model: 'SL1000',
    login_user: 'tech',
    login_password: 'necpass123',
    manage_program: 'WebPro SL1000',
    login_ssid: '',
    access_key: '',
    purchase_date: '',
    category: 'VoIP & Time Access',
    branch_name: 'ซอย 10',
    remark: 'isacc เอ็นจิเนียริ่ง / ไอแซค มาเก็ตติ้ง',
    status: 'active'
  },
  {
    id: 7,
    ip_address: '192.168.99.18',
    device_name: 'Printer Laser HQ',
    brand_name: 'HP',
    model: 'LaserJet Pro M130FN',
    login_user: 'admin',
    login_password: 'hppassword',
    manage_program: 'ASPD Corporation',
    login_ssid: '',
    access_key: '',
    purchase_date: '2019-04-10',
    category: 'Printer',
    branch_name: 'ระยอง',
    remark: 'ประจำแผนกบัญชี',
    status: 'active'
  }
];

// 🎨 Palette สีกำหนดตาม Design Spec Section 1.3 🎨
const CATEGORY_SPECS = {
  'Server': {
    label: 'เครื่องเซิร์ฟเวอร์ & Storage',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    pillActive: 'bg-indigo-600 text-white shadow-sm font-semibold border-indigo-600',
    pillInactive: 'bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 border-slate-200',
    icon: Server
  },
  'Network & Security': {
    label: 'อุปกรณ์เครือข่าย & Firewall',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    pillActive: 'bg-blue-600 text-white shadow-sm font-semibold border-blue-600',
    pillInactive: 'bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-600 border-slate-200',
    icon: ShieldCheck
  },
  'Access Point': {
    label: 'จุดเชื่อมต่อไร้สาย (Wi-Fi AP)',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pillActive: 'bg-emerald-600 text-white shadow-sm font-semibold border-emerald-600',
    pillInactive: 'bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 border-slate-200',
    icon: Wifi
  },
  'Printer': {
    label: 'เครื่องพิมพ์เอกสาร',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    pillActive: 'bg-amber-600 text-white shadow-sm font-semibold border-amber-600',
    pillInactive: 'bg-white text-slate-700 hover:bg-amber-50 hover:text-amber-600 border-slate-200',
    icon: Printer
  },
  'VoIP & Time Access': {
    label: 'ระบบบันทึกเวลา & โทรศัพท์',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
    pillActive: 'bg-teal-600 text-white shadow-sm font-semibold border-teal-600',
    pillInactive: 'bg-white text-slate-700 hover:bg-teal-50 hover:text-teal-600 border-slate-200',
    icon: Clock
  },
  'CCTV': {
    label: 'กล้องวงจรปิด',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    pillActive: 'bg-purple-600 text-white shadow-sm font-semibold border-purple-600',
    pillInactive: 'bg-white text-slate-700 hover:bg-purple-50 hover:text-purple-600 border-slate-200',
    icon: Video
  },
  'Other': {
    label: 'อุปกรณ์อื่นๆ / สำรอง',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    pillActive: 'bg-slate-700 text-white shadow-sm font-semibold border-slate-700',
    pillInactive: 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200',
    icon: Box
  }
};

export default function NetworkAdminPage() {
  const navigate = useNavigate();

  // 👤 RBAC Access Control Checklist
  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
  const mockRole = localStorage.getItem('mockRole');
  const userRole = userInfo.role || (mockRole === '1' ? 'Admin' : mockRole === '4' ? 'IT Support' : 'Employee');
  const isAdmin = userRole === 'Admin' || String(userInfo.role_id) === '1' || mockRole === '1';
  const isITSupport = userRole === 'IT Support' || String(userInfo.role_id) === '4' || mockRole === '4';
  const canAccess = isAdmin || isITSupport;

  // 🔄 Redirect if restricted role (Employee, Manager, HR)
  useEffect(() => {
    if (!canAccess) {
      Swal.fire({
        icon: 'error',
        title: '403 Forbidden',
        text: 'คุณไม่มีสิทธิ์เข้าถึงระบบจัดการเครือข่ายและเซิร์ฟเวอร์',
        confirmButtonColor: '#f89919'
      }).then(() => {
        navigate('/dashboard');
      });
    }
  }, [canAccess, navigate]);

  // 📦 Data State
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 🔍 Filter & Search State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState('ทั้งหมด');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // 🔄 Sorting State
  const [sortField, setSortField] = useState('ip'); // 'ip' | 'name' | 'branch' | 'category'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' (192.168.x.1 first) | 'desc'

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // 📄 Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 🔐 Password Reveal State & Timers ({ [deviceId]: { revealed: bool, secondsLeft: 60 } })
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const timerRefs = useRef({});

  // 📋 Audit Log Modal State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');

  const fetchAuditLogs = async () => {
    setIsAuditLoading(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const res = await fetch(`${getApiBase()}/api/network-devices/audit-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resJson = await res.json();
      if (res.ok && resJson.data) {
        setAuditLogs(resJson.data);
      }
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    } finally {
      setIsAuditLoading(false);
    }
  };

  // 📝 Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    category: 'Access Point',
    branch_name: 'ซอย 10',
    ip_address: '',
    device_name: '',
    brand_name: '',
    model: '',
    login_user: '',
    login_password: '',
    login_ssid: '',
    access_key: '',
    manage_program: '',
    purchase_date: '',
    status: 'active',
    remark: ''
  });

  // Modal Password Eye Visibility Toggles
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [showModalKey, setShowModalKey] = useState(false);

  // Real-time IP Conflict Warning State
  const [ipConflict, setIpConflict] = useState(null);

  const getApiBase = () => {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl && envUrl.trim() !== '') return envUrl.trim().replace(/\/$/, '');
    if (typeof window !== 'undefined' && window.location) {
      const { hostname, protocol } = window.location;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.')) {
        return '';
      }
      return `${protocol}//${hostname}:5000`;
    }
    return '';
  };

  // -------------------------------------------------------------
  // 🌐 API Fetch (รองรับการแนบ branch query parameter)
  // -------------------------------------------------------------
  const fetchDevices = async (branch = selectedBranch) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const branchParam = branch && branch !== 'ทั้งหมด' ? `?branch=${encodeURIComponent(branch)}` : '';
      const response = await fetch(getApiBase() + '/api/network-devices' + branchParam, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok && result.success && Array.isArray(result.data)) {
        setDevices(result.data);
      }
    } catch (error) {
      console.warn('API connection offline or unavailable, using initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices(selectedBranch);
  }, [selectedBranch]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedBranch, searchTerm, statusFilter]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timerRefs.current).forEach(clearInterval);
    };
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // -------------------------------------------------------------
  // 🔑 Show/Hide Password Toggle (with Audit Log Modal & 60s Auto Re-mask)
  // -------------------------------------------------------------
  const handleTogglePasswordReveal = (device) => {
    const isCurrentlyRevealed = revealedPasswords[device.id]?.revealed;

    if (isCurrentlyRevealed) {
      // 🔒 Manual Hide
      if (timerRefs.current[device.id]) {
        clearInterval(timerRefs.current[device.id]);
      }
      setRevealedPasswords(prev => ({
        ...prev,
        [device.id]: { revealed: false, secondsLeft: 0 }
      }));
      return;
    }

    // 🔑 Modal ยืนยันการขอเปิดดูรหัสผ่านพร้อมบันทึก Audit Log
    Swal.fire({
      title: '🔑 ยืนยันการขอเปิดดูรหัสผ่าน (Audit Log Notice)',
      html: `
        <div class="text-left text-sm text-slate-600 mb-3">
          <p class="font-semibold text-slate-800">อุปกรณ์: <span class="text-[#f89919]">${device.device_name}</span> (${device.ip_address})</p>
          <p class="mt-1 text-xs text-slate-500">การเข้าถึงรหัสผ่านจะถูกบันทึกในระบบ Audit Trail เพื่อความปลอดภัย</p>
        </div>
        <div class="text-left">
          <label class="block text-xs font-bold text-slate-700 mb-1">กรุณาระบุเหตุผลการเข้าถึงรหัสผ่าน <span class="text-rose-500">*</span></label>
          <input id="swal-reveal-reason" class="swal2-input !m-0 !w-full text-sm" placeholder="เช่น ต้องการเข้าปรับตั้งค่าพอร์ต Router ใหม่..." />
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#f89919',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ยืนยันเปิดดูรหัสผ่าน',
      cancelButtonText: 'ยกเลิก',
      preConfirm: () => {
        const reason = document.getElementById('swal-reveal-reason')?.value?.trim();
        if (!reason) {
          Swal.showValidationMessage('กรุณาระบุเหตุผลการเข้าถึงรหัสผ่าน');
          return false;
        }
        return reason;
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const reason = result.value;
        try {
          const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
          const response = await fetch(`${getApiBase()}/api/network-devices/${device.id}/reveal-passwords`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ reason })
          }).catch(err => console.log('Audit log API sent or simulated locally:', err));

          if (response && response.ok) {
            const resJson = await response.json();
            if (resJson && resJson.success && resJson.data) {
              setDevices(prev => prev.map(d => d.id === device.id ? { ...d, login_password: resJson.data.login_password, access_key: resJson.data.access_key } : d));
            }
          }

          // Set Revealed state & start 60s countdown
          let seconds = 60;
          setRevealedPasswords(prev => ({
            ...prev,
            [device.id]: { revealed: true, secondsLeft: seconds }
          }));

          if (timerRefs.current[device.id]) {
            clearInterval(timerRefs.current[device.id]);
          }

          timerRefs.current[device.id] = setInterval(() => {
            seconds -= 1;
            if (seconds <= 0) {
              clearInterval(timerRefs.current[device.id]);
              setRevealedPasswords(prev => ({
                ...prev,
                [device.id]: { revealed: false, secondsLeft: 0 }
              }));
            } else {
              setRevealedPasswords(prev => ({
                ...prev,
                [device.id]: { revealed: true, secondsLeft: seconds }
              }));
            }
          }, 1000);

        } catch (error) {
          Swal.fire('ผิดพลาด', 'ไม่สามารถขอเปิดรหัสผ่านได้', 'error');
        }
      }
    });
  };

  // -------------------------------------------------------------
  // 🔍 Filter & Search Logic
  // -------------------------------------------------------------
  const filteredDevices = devices.filter(item => {
    // 0. Branch Filter
    const matchesBranch = selectedBranch === 'ทั้งหมด' || item.branch_name === selectedBranch;

    // 1. Category Filter
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    
    // 2. Search Query (IP Address, device_name, brand_name, model, branch_name, remark)
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || 
      item.ip_address?.toLowerCase().includes(query) ||
      item.device_name?.toLowerCase().includes(query) ||
      item.brand_name?.toLowerCase().includes(query) ||
      item.model?.toLowerCase().includes(query) ||
      item.branch_name?.toLowerCase().includes(query) ||
      item.remark?.toLowerCase().includes(query);

    // 3. Status Filter
    const matchesStatus = !statusFilter || item.status === statusFilter;

    return matchesBranch && matchesCategory && matchesSearch && matchesStatus;
  });

  // 🔄 Sort Devices by selected column
  const sortedDevices = [...filteredDevices].sort((a, b) => {
    if (sortField === 'ip') {
      const ipA = (a.ip_address || '').toString();
      const ipB = (b.ip_address || '').toString();
      return sortOrder === 'asc'
        ? ipA.localeCompare(ipB, undefined, { numeric: true, sensitivity: 'base' })
        : ipB.localeCompare(ipA, undefined, { numeric: true, sensitivity: 'base' });
    }
    if (sortField === 'name') {
      const nameA = (a.device_name || '').toString();
      const nameB = (b.device_name || '').toString();
      return sortOrder === 'asc' ? nameA.localeCompare(nameB, 'th') : nameB.localeCompare(nameA, 'th');
    }
    if (sortField === 'branch') {
      const brA = (a.branch_name || '').toString();
      const brB = (b.branch_name || '').toString();
      return sortOrder === 'asc' ? brA.localeCompare(brB, 'th') : brB.localeCompare(brA, 'th');
    }
    if (sortField === 'category') {
      const catA = (a.category || '').toString();
      const catB = (b.category || '').toString();
      return sortOrder === 'asc' ? catA.localeCompare(catB, 'th') : catB.localeCompare(catA, 'th');
    }
    return 0;
  });

  // Category counts calculation for pills
  const getCategoryCount = (catKey) => {
    if (catKey === 'All') return devices.length;
    return devices.filter(d => d.category === catKey).length;
  };

  // Metric card summary stats
  const totalCount = devices.length;
  const activeCount = devices.filter(d => d.status === 'active').length;
  const serverCount = devices.filter(d => d.category === 'Server').length;
  const apCount = devices.filter(d => d.category === 'Access Point').length;
  const printerCount = devices.filter(d => d.category === 'Printer').length;

  // Pagination bounds
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDevices = sortedDevices.slice(startIndex, startIndex + itemsPerPage);

  // -------------------------------------------------------------
  // 📝 Real-time IP Conflict Check
  // -------------------------------------------------------------
  const handleIPChange = (ipVal) => {
    setFormData(prev => ({ ...prev, ip_address: ipVal }));
    const trimmedIP = ipVal.trim();
    if (!trimmedIP) {
      setIpConflict(null);
      return;
    }

    const existing = devices.find(d => 
      d.ip_address?.toLowerCase() === trimmedIP.toLowerCase() && d.id !== editingId
    );

    if (existing) {
      setIpConflict(existing);
    } else {
      setIpConflict(null);
    }
  };

  // Form Input Change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'ip_address') {
      handleIPChange(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Modal Control Actions
  const openNewModal = () => {
    setEditingId(null);
    setFormData({
      category: 'Access Point',
      branch_name: 'ซอย 10',
      ip_address: '',
      device_name: '',
      brand_name: '',
      model: '',
      login_user: '',
      login_password: '',
      login_ssid: '',
      access_key: '',
      manage_program: '',
      purchase_date: '',
      status: 'active',
      remark: ''
    });
    setIpConflict(null);
    setShowModalPassword(false);
    setShowModalKey(false);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      category: item.category || 'Access Point',
      branch_name: item.branch_name || 'ซอย 10',
      ip_address: item.ip_address || '',
      device_name: item.device_name || '',
      brand_name: item.brand_name || '',
      model: item.model || '',
      login_user: item.login_user || '',
      login_password: '', // ป้องกัน Bypass: ไม่โหลดรหัสผ่านจริงลงฟอร์มตรงๆ
      login_ssid: item.login_ssid || '',
      access_key: '', // ป้องกัน Bypass: ไม่โหลดคีย์จริงลงฟอร์มตรงๆ
      manage_program: item.manage_program || '',
      purchase_date: item.purchase_date ? item.purchase_date.split('T')[0] : '',
      status: item.status || 'active',
      remark: item.remark || ''
    });
    setIpConflict(null);
    setShowModalPassword(false);
    setShowModalKey(false);
    setIsModalOpen(true);
  };

  // 🔑 ปลดล็อกดูรหัสผ่านเดิมในหน้า Modal แก้ไข (ต้องผ่าน Audit Log เช่นกัน)
  const handleModalRevealPassword = async (field = 'login_password') => {
    // ถ้าผู้ใช้พิมพ์รหัสผ่านใหม่อยู่ในฟอร์มแล้ว ให้สลับดู/ซ่อนได้ทันที
    if (formData[field] && formData[field].trim() !== '') {
      if (field === 'login_password') setShowModalPassword(prev => !prev);
      if (field === 'access_key') setShowModalKey(prev => !prev);
      return;
    }

    // ถ้าเป็นการแก้ไขอุปกรณ์เดิม และต้องการดูรหัสผ่านปัจจุบัน ต้องระบุเหตุผลบันทึก Audit Log
    if (editingId) {
      const currentDevice = devices.find(d => d.id === editingId) || { id: editingId, device_name: formData.device_name, ip_address: formData.ip_address };

      Swal.fire({
        title: '🔑 ยืนยันการขอเปิดดูรหัสผ่าน (Audit Log Notice)',
        html: `
          <div class="text-left text-sm text-slate-600 mb-3">
            <p class="font-semibold text-slate-800">อุปกรณ์: <span class="text-[#f89919]">${currentDevice.device_name}</span> (${currentDevice.ip_address})</p>
            <p class="mt-1 text-xs text-slate-500">การเข้าถึงรหัสผ่านในฟอร์มแก้ไขจะถูกบันทึกในระบบ Audit Trail เพื่อความปลอดภัย</p>
          </div>
          <div class="text-left">
            <label class="block text-xs font-bold text-slate-700 mb-1">กรุณาระบุเหตุผลการเข้าถึงรหัสผ่าน <span class="text-rose-500">*</span></label>
            <input id="swal-modal-reason" class="swal2-input !m-0 !w-full text-sm" placeholder="เช่น ต้องการตรวจสอบรหัสผ่านเดิม..." />
          </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#f89919',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'ยืนยันเปิดดูรหัสผ่าน',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
          const reason = document.getElementById('swal-modal-reason')?.value?.trim();
          if (!reason) {
            Swal.showValidationMessage('กรุณาระบุเหตุผลการเข้าถึงรหัสผ่าน');
            return false;
          }
          return reason;
        }
      }).then(async (result) => {
        if (result.isConfirmed && result.value) {
          const reason = result.value;
          try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
            const response = await fetch(`${getApiBase()}/api/network-devices/${editingId}/reveal-passwords`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ reason })
            });

            if (response && response.ok) {
              const resJson = await response.json();
              if (resJson && resJson.success && resJson.data) {
                const fetchedPass = resJson.data.login_password || '';
                const fetchedKey = resJson.data.access_key || '';
                setFormData(prev => ({
                  ...prev,
                  login_password: fetchedPass,
                  access_key: fetchedKey
                }));
                if (field === 'login_password') setShowModalPassword(true);
                if (field === 'access_key') setShowModalKey(true);
              }
            }
          } catch (e) {
            console.error('Failed to reveal password in modal:', e);
          }
        }
      });
    } else {
      if (field === 'login_password') setShowModalPassword(prev => !prev);
      if (field === 'access_key') setShowModalKey(prev => !prev);
    }
  };

  const handleDelete = (id, name, ip) => {
    if (!isAdmin) {
      Swal.fire('ไม่มีสิทธิ์', 'เฉพาะผู้ใช้งานสิทธิ์ Admin เท่านั้นที่สามารถลบอุปกรณ์ได้', 'warning');
      return;
    }

    Swal.fire({
      title: 'ยืนยันการลบอุปกรณ์?',
      text: `คุณต้องการลบข้อมูลอุปกรณ์ "${name}" (IP: ${ip}) ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ลบข้อมูล',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
          const response = await fetch(`${getApiBase()}/api/network-devices/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            Swal.fire('ลบแล้ว!', 'ลบข้อมูลอุปกรณ์เรียบร้อยแล้ว', 'success');
            setDevices(prev => prev.filter(d => d.id !== id));
          } else {
            // Local state fallback if API is mock
            setDevices(prev => prev.filter(d => d.id !== id));
            Swal.fire('ลบแล้ว!', 'ลบข้อมูลอุปกรณ์สำเร็จ', 'success');
          }
        } catch (error) {
          // Local fallback delete
          setDevices(prev => prev.filter(d => d.id !== id));
          Swal.fire('ลบแล้ว!', 'ลบข้อมูลอุปกรณ์สำเร็จ', 'success');
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category || !formData.ip_address || !formData.device_name) {
      Swal.fire('แจ้งเตือน', 'กรุณากรอกข้อมูลที่จำเป็น (* Category, IP Address, Device Name) ให้ครบถ้วน', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const url = editingId 
        ? `${getApiBase()}/api/network-devices/${editingId}`
        : getApiBase() + '/api/network-devices';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const resData = await response.json().catch(() => ({}));

      if (response.ok && resData.success) {
        Swal.fire('สำเร็จ', editingId ? 'อัปเดตข้อมูลอุปกรณ์เรียบร้อยแล้ว' : 'เพิ่มอุปกรณ์ใหม่เรียบร้อยแล้ว', 'success');
        setIsModalOpen(false);
        fetchDevices();
      } else {
        // Fallback for standalone frontend demonstration
        if (editingId) {
          setDevices(prev => prev.map(item => item.id === editingId ? { ...item, ...formData } : item));
        } else {
          const newItem = {
            id: Date.now(),
            ...formData
          };
          setDevices(prev => [newItem, ...prev]);
        }
        Swal.fire('สำเร็จ', editingId ? 'อัปเดตข้อมูลอุปกรณ์เรียบร้อยแล้ว' : 'เพิ่มอุปกรณ์ใหม่เรียบร้อยแล้ว', 'success');
        setIsModalOpen(false);
      }
    } catch (error) {
      // Local fallback
      if (editingId) {
        setDevices(prev => prev.map(item => item.id === editingId ? { ...item, ...formData } : item));
      } else {
        const newItem = {
          id: Date.now(),
          ...formData
        };
        setDevices(prev => [newItem, ...prev]);
      }
      Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
      setIsModalOpen(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedBranch('ทั้งหมด');
    setSearchTerm('');
    setStatusFilter('');
  };

  // Link Formatter for Manage Program
  const renderManageProgram = (programStr) => {
    if (!programStr) return <span className="text-slate-400 font-mono text-xs">-</span>;
    const isUrl = programStr.toLowerCase().startsWith('http://') || programStr.toLowerCase().startsWith('https://');
    
    if (isUrl) {
      return (
        <a 
          href={programStr} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline gap-1 max-w-[180px] truncate"
          title={programStr}
        >
          {programStr.replace(/^https?:\/\//, '')}
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
      );
    }

    return <span className="text-xs text-slate-700 font-medium truncate block max-w-[180px]">{programStr}</span>;
  };

  if (!canAccess) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1e2430] p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
      
      {/* ------------------------------------------------------------- */}
      {/* 📌 SECTION 1: HEADER & METRIC SUMMARY CARDS                   */}
      {/* ------------------------------------------------------------- */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Server className="w-7 h-7 text-[#f89919]" />
            ระบบจัดการเครือข่ายและเซิร์ฟเวอร์ (Network & Infrastructure Management)
          </h1>
          <p className="text-sm text-[#ae8a68] dark:text-amber-200/80 mt-1">
            จัดการฐานข้อมูลอุปกรณ์ไอที IP Address และรหัสผ่านผู้ดูแลระบบในองค์กร
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* 🏢 Header Branch Selector Dropdown */}
          <div className="flex items-center gap-2 bg-white dark:bg-[#262f3f] border border-slate-200 dark:border-[#364356] rounded-xl px-3.5 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[#f89919]">
            <span className="text-[#f89919] font-bold text-sm">🏢</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">สาขา:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="text-xs font-bold text-slate-900 dark:text-slate-100 bg-transparent border-none focus:outline-none cursor-pointer pr-1"
            >
              <option value="ทั้งหมด" className="dark:bg-[#1c232f]">ทั้งหมด</option>
              {BRANCH_LIST.map(b => (
                <option key={b} value={b} className="dark:bg-[#1c232f]">{b}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => { setIsAuditModalOpen(true); fetchAuditLogs(); }}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white dark:bg-[#262f3f] hover:bg-slate-100 dark:hover:bg-[#303b4e] text-slate-800 dark:text-slate-100 font-semibold text-sm rounded-xl border border-slate-200 dark:border-[#364356] shadow-2xs transition-all cursor-pointer"
            title="ดูประวัติการเข้าถึงรหัสผ่านและเหตุผล (Audit Log Trail)"
          >
            <ShieldAlert className="w-4 h-4 text-[#f89919]" />
            <span>ประวัติ Audit Log</span>
          </button>

          <button
            onClick={openNewModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f89919] hover:bg-[#d97c08] text-white font-semibold text-sm rounded-xl shadow-md shadow-[#f89919]/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มอุปกรณ์ใหม่</span>
          </button>
        </div>
      </div>

      {/* Metric Cards (4 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Card 1: Total Devices */}
        <div className="bg-white dark:bg-[#262f3f] rounded-2xl p-4 border border-slate-200 dark:border-[#364356] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">🌐 อุปกรณ์ทั้งหมด</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{totalCount} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">รายการ</span></div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">Active: {activeCount} รายการ</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Globe className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Server */}
        <div className="bg-white dark:bg-[#262f3f] rounded-2xl p-4 border border-slate-200 dark:border-[#364356] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">🖥️ เครื่องเซิร์ฟเวอร์</div>
            <div className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400 mt-1">{serverCount} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">เครื่อง</span></div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">DC, DNS, NAS QNAP</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Server className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Access Point */}
        <div className="bg-white dark:bg-[#262f3f] rounded-2xl p-4 border border-slate-200 dark:border-[#364356] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">📶 Access Point</div>
            <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">{apCount} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">จุดบริการ</span></div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">TP-Link, Cisco, D-Link</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Wifi className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Printer */}
        <div className="bg-white dark:bg-[#262f3f] rounded-2xl p-4 border border-slate-200 dark:border-[#364356] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">🖨️ เครื่องพิมพ์เอกสาร</div>
            <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">{printerCount} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">เครื่อง</span></div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">HP, Brother, Canon</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Printer className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 🏷️ SECTION 2: CATEGORY FILTER PILLS & SEARCH BAR              */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#262f3f] rounded-2xl p-4 border border-slate-200 dark:border-[#364356] shadow-sm mb-6 space-y-4">
        
        {/* Filter Pills 7 หมวดหมู่ (Spec Section 3.1) */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          
          {/* Pill "ทั้งหมด" (All) */}
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs border transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-[#f89919] text-white shadow-sm font-semibold border-[#f89919]'
                : 'bg-white dark:bg-[#1c232f] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#303b4e] border-slate-200 dark:border-[#364356]'
            }`}
          >
            <span>ทั้งหมด</span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
              selectedCategory === 'All' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-[#262f3f] text-slate-600 dark:text-slate-300'
            }`}>
              {getCategoryCount('All')}
            </span>
          </button>

          {/* 7 Category Pills */}
          {Object.entries(CATEGORY_SPECS).map(([catKey, spec]) => {
            const IconComp = spec.icon;
            const isSelected = selectedCategory === catKey;
            const count = getCategoryCount(catKey);

            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3.5 py-1.5 rounded-xl text-xs border transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isSelected ? spec.pillActive : spec.pillInactive
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{catKey}</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-[#1c232f] text-slate-600 dark:text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}

        </div>

            {/* Global Search Input & Secondary Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              
              {/* Search Input */}
              <div className="relative flex-1 w-full">
                <Search className="text-slate-400 w-4 h-4 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาตาม IP Address (เช่น 192.168.99.1), ชื่ออุปกรณ์, ยี่ห้อ, รุ่น..."
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f89919] focus:bg-white dark:focus:bg-[#1c232f] transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full"
                    title="ล้างคำค้นหา"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Dropdown */}
              <div className="w-full sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#f89919] focus:bg-white dark:focus:bg-[#1c232f] transition-all"
                >
                  <option value="" className="dark:bg-[#1c232f]">สถานะทั้งหมด</option>
                  <option value="active" className="dark:bg-[#1c232f]">🟢 Active (เปิดใช้งาน)</option>
                  <option value="maintenance" className="dark:bg-[#1c232f]">🟡 Maintenance (ซ่อมบำรุง)</option>
                  <option value="inactive" className="dark:bg-[#1c232f]">🔴 Inactive (ยกเลิก)</option>
                </select>
              </div>

              {/* Reset Filters Button */}
              {(selectedCategory !== 'All' || selectedBranch !== 'ทั้งหมด' || searchTerm || statusFilter) && (
                <button
                  onClick={handleResetFilters}
                  className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#f89919] bg-slate-100 dark:bg-[#1c232f] hover:bg-amber-50 dark:hover:bg-[#303b4e] border border-slate-200 dark:border-[#364356] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>รีเซ็ตตัวกรอง</span>
                </button>
              )}

            </div>

          </div>

          {/* ------------------------------------------------------------- */}
          {/* 📊 SECTION 3: NETWORK DEVICE DATA TABLE & MOBILE CARDS        */}
          {/* ------------------------------------------------------------- */}
          <div className="bg-white dark:bg-[#262f3f] rounded-2xl border border-slate-200 dark:border-[#364356] shadow-sm overflow-hidden mb-6">
            
            {/* 💻 Desktop Table View (md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse" role="table">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-[#1c232f] border-b border-slate-200 dark:border-[#364356] text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider select-none">
                    <th 
                      onClick={() => handleSort('ip')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-slate-200/70 transition-colors"
                      title="คลิกเพื่อสลับการเรียงตาม IP Address"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>IP Address</span>
                        <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-xs ${sortField === 'ip' ? 'text-orange-600 font-bold' : 'text-slate-400'}`}>
                          {sortField === 'ip' ? (sortOrder === 'asc' ? <ArrowUp size={13} className="stroke-[2.5]" /> : <ArrowDown size={13} className="stroke-[2.5]" />) : <ArrowUpDown size={13} />}
                        </span>
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('name')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-slate-200/70 transition-colors"
                      title="คลิกเพื่อสลับการเรียงตามชื่ออุปกรณ์"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>ข้อมูลอุปกรณ์ / รุ่น</span>
                        <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-xs ${sortField === 'name' ? 'text-orange-600 font-bold' : 'text-slate-400'}`}>
                          {sortField === 'name' ? (sortOrder === 'asc' ? <ArrowUp size={13} className="stroke-[2.5]" /> : <ArrowDown size={13} className="stroke-[2.5]" />) : <ArrowUpDown size={13} />}
                        </span>
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('category')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-slate-200/70 transition-colors"
                      title="คลิกเพื่อสลับการเรียงตามหมวดหมู่"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>หมวดหมู่</span>
                        <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-xs ${sortField === 'category' ? 'text-orange-600 font-bold' : 'text-slate-400'}`}>
                          {sortField === 'category' ? (sortOrder === 'asc' ? <ArrowUp size={13} className="stroke-[2.5]" /> : <ArrowDown size={13} className="stroke-[2.5]" />) : <ArrowUpDown size={13} />}
                        </span>
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('branch')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-slate-200/70 transition-colors"
                      title="คลิกเพื่อสลับการเรียงตามสาขา"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>สาขา</span>
                        <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-xs ${sortField === 'branch' ? 'text-orange-600 font-bold' : 'text-slate-400'}`}>
                          {sortField === 'branch' ? (sortOrder === 'asc' ? <ArrowUp size={13} className="stroke-[2.5]" /> : <ArrowDown size={13} className="stroke-[2.5]" />) : <ArrowUpDown size={13} />}
                        </span>
                      </div>
                    </th>
                    <th className="py-3.5 px-4">บัญชี / SSID</th>
                    <th className="py-3.5 px-4">รหัสผ่าน / Access Key</th>
                    <th className="py-3.5 px-4">ช่องทางจัดการ</th>
                    <th className="py-3.5 px-4">สถานะ</th>
                    <th className="py-3.5 px-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#364356] text-sm">
                  {isLoading ? (
                    <TableSkeleton rows={6} cols={9} />
                  ) : currentDevices.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Box className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                          <span className="font-medium text-slate-600 dark:text-slate-300">ไม่พบรายการอุปกรณ์เครือข่ายที่ตรงตามเงื่อนไข</span>
                          <button 
                            onClick={handleResetFilters}
                            className="text-xs text-[#f89919] hover:underline font-semibold mt-1"
                          >
                            ล้างตัวกรองและค้นใหม่
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentDevices.map((item) => {
                      const catSpec = CATEGORY_SPECS[item.category] || CATEGORY_SPECS['Other'];
                      const revealState = revealedPasswords[item.id] || { revealed: false, secondsLeft: 0 };

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-[#2e394b]/40 transition-colors">
                          
                          {/* 1. IP Address */}
                          <td className="py-3.5 px-4 align-top whitespace-nowrap">
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm bg-slate-100 dark:bg-[#1c232f] px-2 py-0.5 rounded border border-slate-200 dark:border-[#364356]">
                              {item.ip_address}
                            </span>
                          </td>

                          {/* 2. Device Name & Brand/Model */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.device_name}</div>
                            {(item.brand_name || item.model) && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                {item.brand_name} {item.model ? `- ${item.model}` : ''}
                              </div>
                            )}
                            {item.remark && (
                              <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]" title={item.remark}>
                                💬 {item.remark}
                              </div>
                            )}
                          </td>

                          {/* 3. Category Badge */}
                          <td className="py-3.5 px-4 align-top whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border ${catSpec.badge}`}>
                              <catSpec.icon className="w-3.5 h-3.5" />
                              <span>{item.category}</span>
                            </span>
                          </td>

                          {/* 3.5. Branch Badge */}
                          <td className="py-3.5 px-4 align-top whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                              🏢 {item.branch_name || 'ASCG HQ'}
                            </span>
                          </td>

                          {/* 4. Login / SSID */}
                          <td className="py-3.5 px-4 align-top text-xs space-y-1">
                            {item.login_user && (
                              <div className="flex items-center gap-1 text-slate-800 font-semibold">
                                <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span className="truncate max-w-[150px]">{item.login_user}</span>
                              </div>
                            )}
                            {item.login_ssid && (
                              <div className="flex items-center gap-1 text-slate-500 font-medium">
                                <Wifi className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                                <span className="truncate max-w-[150px]">{item.login_ssid}</span>
                              </div>
                            )}
                            {!item.login_user && !item.login_ssid && (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* 5. Password & Access Key (Show/Hide Toggle) */}
                          <td className="py-3.5 px-4 align-top text-xs whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col">
                                {revealState.revealed ? (
                                  <div className="space-y-0.5 animate-in fade-in duration-200">
                                    <div className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                      {item.login_password || 'ไม่มีรหัสผ่าน (-)'}
                                    </div>
                                    {item.access_key && (
                                      <div className="font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[11px]">
                                        Key: {item.access_key}
                                      </div>
                                    )}
                                    <div className="text-[10px] text-rose-500 font-medium mt-0.5">
                                      ซ่อนใน {revealState.secondsLeft}s
                                    </div>
                                  </div>
                                ) : (
                                  <span className="font-mono tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                    ••••••••
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() => handleTogglePasswordReveal(item)}
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                  revealState.revealed 
                                    ? 'bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200' 
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-[#f89919]'
                                }`}
                                title={revealState.revealed ? 'กดเพื่อซ่อนรหัสผ่าน' : 'กดเพื่อขอเปิดดูรหัสผ่าน ( Audit Log )'}
                                aria-label={`สลับแสดงรหัสผ่านสำหรับ ${item.device_name}`}
                              >
                                {revealState.revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>

                          {/* 6. Manage Program */}
                          <td className="py-3.5 px-4 align-top">
                            {renderManageProgram(item.manage_program)}
                          </td>

                          {/* 7. Status Badge */}
                          <td className="py-3.5 px-4 align-top whitespace-nowrap">
                            {item.status === 'active' && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Active
                              </span>
                            )}
                            {item.status === 'maintenance' && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Maintenance
                              </span>
                            )}
                            {item.status === 'inactive' && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-300">
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* 8. Action Buttons */}
                          <td className="py-3.5 px-4 align-top text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-1.5 text-slate-600 hover:text-white hover:bg-[#f89919] rounded-lg transition-colors cursor-pointer"
                                title="แก้ไขข้อมูล"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDelete(item.id, item.device_name, item.ip_address)}
                                disabled={!isAdmin}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isAdmin 
                                    ? 'text-rose-600 hover:text-white hover:bg-rose-600 cursor-pointer' 
                                    : 'text-slate-300 cursor-not-allowed opacity-50'
                                }`}
                                title={isAdmin ? 'ลบข้อมูล' : 'เฉพาะสิทธิ์ Admin เท่านั้นที่สามารถลบได้'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* 📱 Mobile Card View (md:hidden) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {isLoading ? (
                <MobileCardSkeleton count={4} />
              ) : currentDevices.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">ไม่พบอุปกรณ์เครือข่าย</div>
              ) : (
                currentDevices.map((item) => {
                  const catSpec = CATEGORY_SPECS[item.category] || CATEGORY_SPECS['Other'];
                  const revealState = revealedPasswords[item.id] || { revealed: false, secondsLeft: 0 };

                  return (
                    <div key={item.id} className="p-4 space-y-3 hover:bg-slate-50 transition-colors">
                      
                      {/* Top: IP Badge + Branch + Category */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {item.ip_address}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            🏢 {item.branch_name || 'ASCG HQ'}
                          </span>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${catSpec.badge}`}>
                          <catSpec.icon className="w-3 h-3" />
                          <span>{item.category}</span>
                        </span>
                      </div>

                      {/* Device Name & Brand/Model */}
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{item.device_name}</div>
                        {(item.brand_name || item.model) && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            {item.brand_name} {item.model ? `• ${item.model}` : ''}
                          </div>
                        )}
                        {item.remark && (
                          <div className="text-[11px] text-slate-400 mt-0.5">💬 {item.remark}</div>
                        )}
                      </div>

                      {/* Credentials Card */}
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[10.5px]">User / SSID:</span>
                          <span className="font-mono font-semibold text-slate-800">{item.login_user || item.login_ssid || '-'}</span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                          <span className="text-slate-400 text-[10.5px]">Password / Key:</span>
                          <div className="flex items-center gap-1.5">
                            {revealState.revealed ? (
                              <span className="font-mono font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                {item.login_password || item.access_key || '-'}
                              </span>
                            ) : (
                              <span className="font-mono tracking-widest text-slate-400 text-xs">••••••••</span>
                            )}
                            <button
                              onClick={() => handleTogglePasswordReveal(item)}
                              className={`p-1 rounded-lg border transition-all ${
                                revealState.revealed 
                                  ? 'bg-rose-100 text-rose-700 border-rose-300' 
                                  : 'bg-white text-slate-600 border-slate-200'
                              }`}
                              title="เปิด/ซ่อนรหัสผ่าน"
                            >
                              {revealState.revealed ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </div>
                        </div>

                        {revealState.revealed && (
                          <div className="text-[10px] text-rose-600 font-bold text-right">
                            จะซ่อนอัตโนมัติใน {revealState.secondsLeft}s
                          </div>
                        )}
                      </div>

                      {/* Mobile Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-xs">
                          {item.status === 'active' ? (
                            <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                            </span>
                          ) : (
                            <span className="text-slate-500 font-semibold text-[11px]">{item.status}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="px-2.5 py-1 text-xs text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors flex items-center gap-1 border border-orange-200"
                          >
                            <Edit size={13} /> แก้ไข
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.device_name, item.ip_address)}
                            disabled={!isAdmin}
                            className={`px-2.5 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 ${
                              isAdmin 
                                ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200' 
                                : 'text-slate-300 opacity-40 cursor-not-allowed'
                            }`}
                          >
                            <Trash2 size={13} /> ลบ
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

        {/* ------------------------------------------------------------- */}
        {/* 📄 SECTION 4: PAGINATION & FOOTER                              */}
        {/* ------------------------------------------------------------- */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-[#1c232f] border-t border-slate-200 dark:border-[#364356] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div>
            แสดง <span className="font-semibold text-slate-900 dark:text-slate-100">{filteredDevices.length > 0 ? startIndex + 1 : 0}</span> ถึง{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{Math.min(startIndex + itemsPerPage, filteredDevices.length)}</span> จาก{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{filteredDevices.length}</span> รายการ
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-white dark:bg-[#262f3f] border border-slate-200 dark:border-[#364356] rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#303b4e] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              &lt; ก่อนหน้า
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  currentPage === pageNum
                    ? 'bg-[#f89919] text-white shadow-sm'
                    : 'bg-white dark:bg-[#262f3f] border border-slate-200 dark:border-[#364356] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#303b4e]'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 bg-white dark:bg-[#262f3f] border border-slate-200 dark:border-[#364356] rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#303b4e] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              ถัดไป &gt;
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 📝 MODAL FORM: ADD / EDIT DEVICE (2-Column Responsive Layout)  */}
      {/* ------------------------------------------------------------- */}
      {isModalOpen && (
        <div 
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#262f3f] rounded-2xl border border-slate-200 dark:border-[#364356] shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-[#364356] bg-slate-50 dark:bg-[#1c232f] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-[#f89919]" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {editingId ? '✏️ แก้ไขข้อมูลอุปกรณ์เครือข่าย' : '🖥️ เพิ่มอุปกรณ์เครือข่ายใหม่'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 bg-white dark:bg-[#262f3f]">
              
              {/* Category & Branch Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    หมวดหมู่อุปกรณ์ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#f89919] focus:bg-white dark:focus:bg-[#1c232f] outline-none"
                  >
                    {Object.keys(CATEGORY_SPECS).map(catKey => (
                      <option key={catKey} value={catKey} className="dark:bg-[#1c232f]">{catKey} ({CATEGORY_SPECS[catKey].label})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    สาขา (Branch) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="branch_name"
                    value={formData.branch_name}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#f89919] focus:bg-white dark:focus:bg-[#1c232f] outline-none"
                  >
                    {BRANCH_LIST.map(b => (
                      <option key={b} value={b} className="dark:bg-[#1c232f]">{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2-Column Grid Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* IP Address Field & Conflict Check */}
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    หมายเลข IP Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="ip_address"
                    value={formData.ip_address}
                    onChange={handleFormChange}
                    placeholder="เช่น 192.168.99.50"
                    required
                    className={`w-full px-3 py-2 border font-mono font-bold rounded-xl text-sm outline-none transition-all ${
                      ipConflict 
                        ? 'border-amber-400 bg-amber-50 text-amber-900 focus:ring-2 focus:ring-amber-500' 
                        : 'border-slate-200 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-[#f89919] focus:bg-white'
                    }`}
                  />
                  {/* IP Conflict Warning Banner (Design Spec Section 5.2) */}
                  {ipConflict ? (
                    <div className="mt-2 p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-800 flex items-start gap-2 animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">⚠️ คำเตือน IP ซ้ำ:</span> หมายเลข <span className="font-mono font-bold">{formData.ip_address}</span> ถูกใช้งานแล้วโดยอุปกรณ์ <span className="font-semibold">{ipConflict.device_name}</span> ({ipConflict.category})
                      </div>
                    </div>
                  ) : formData.ip_address.trim() ? (
                    <div className="mt-1 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>IP Address นี้ว่างอยู่ (สามารถใช้งานได้)</span>
                    </div>
                  ) : null}
                </div>

                {/* Device Name */}
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    ชื่ออุปกรณ์ / หน้าที่การทำงาน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="device_name"
                    value={formData.device_name}
                    onChange={handleFormChange}
                    placeholder="เช่น Access Point Office ชั้น 2"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#f89919] focus:bg-white outline-none"
                  />
                </div>

                {/* Brand Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    ยี่ห้อ (Brand)
                  </label>
                  <input
                    type="text"
                    name="brand_name"
                    value={formData.brand_name}
                    onChange={handleFormChange}
                    placeholder="เช่น TP-Link, DELL, HP"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#f89919] focus:bg-white outline-none"
                  />
                </div>

                {/* Model */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    รุ่น (Model)
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleFormChange}
                    placeholder="เช่น EAP610, PowerEdgeR310"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#f89919] focus:bg-white outline-none"
                  />
                </div>

                {/* Login User */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    บัญชีผู้ดูแลระบบ (Login Admin)
                  </label>
                  <input
                    type="text"
                    name="login_user"
                    value={formData.login_user}
                    onChange={handleFormChange}
                    placeholder="เช่น admin, root"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#f89919] focus:bg-white outline-none"
                  />
                </div>

                {/* Login Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>รหัสผ่านผู้ดูแลระบบ (Login Password)</span>
                    {editingId && <span className="text-[10px] text-slate-400 font-normal lowercase">(เว้นว่างไว้หากไม่เปลี่ยน)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showModalPassword ? 'text' : 'password'}
                      name="login_password"
                      value={formData.login_password}
                      onChange={handleFormChange}
                      placeholder={editingId ? '•••••••• (กรอกเมื่อต้องการเปลี่ยนรหัส)' : '••••••••'}
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#f89919] focus:bg-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleModalRevealPassword('login_password')}
                      title={showModalPassword ? 'ซ่อนรหัสผ่าน' : (editingId && !formData.login_password ? 'ขอเปิดดูรหัสผ่านเดิม (Audit Log)' : 'แสดงรหัสผ่าน')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showModalPassword ? <EyeOff className="w-4 h-4 text-[#f89919]" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Login / SSID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    ชื่อสัญญาณ Wi-Fi (SSID) / Account
                  </label>
                  <input
                    type="text"
                    name="login_ssid"
                    value={formData.login_ssid}
                    onChange={handleFormChange}
                    placeholder="เช่น AIA-WiFi, ASCG-Guest"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#f89919] focus:bg-white outline-none"
                  />
                </div>

                {/* Access Key */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>รหัส Wi-Fi Key / Access Key</span>
                    {editingId && <span className="text-[10px] text-slate-400 font-normal lowercase">(เว้นว่างไว้หากไม่เปลี่ยน)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showModalKey ? 'text' : 'password'}
                      name="access_key"
                      value={formData.access_key}
                      onChange={handleFormChange}
                      placeholder={editingId ? '•••••••• (กรอกเมื่อต้องการเปลี่ยนคีย์)' : '••••••••'}
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#f89919] focus:bg-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleModalRevealPassword('access_key')}
                      title={showModalKey ? 'ซ่อนคีย์' : (editingId && !formData.access_key ? 'ขอเปิดดูคีย์เดิม (Audit Log)' : 'แสดงคีย์')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showModalKey ? <EyeOff className="w-4 h-4 text-[#f89919]" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Manage Program / URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    โปรแกรม / ช่องทางบริหารจัดการ
                  </label>
                  <input
                    type="text"
                    name="manage_program"
                    value={formData.manage_program}
                    onChange={handleFormChange}
                    placeholder="เช่น https://192.168.99.1 หรือ Web Portal"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#f89919] focus:bg-white outline-none"
                  />
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    วันที่จัดซื้อ (Purchase Date)
                  </label>
                  <input
                    type="date"
                    name="purchase_date"
                    value={formData.purchase_date}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#f89919] focus:bg-white outline-none"
                  />
                </div>

              </div>

              {/* Status Radio Group */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  สถานะอุปกรณ์ <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-800">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formData.status === 'active'}
                      onChange={handleFormChange}
                      className="accent-[#f89919]"
                    />
                    <span>🟢 Active (เปิดใช้งานปกติ)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-800">
                    <input
                      type="radio"
                      name="status"
                      value="maintenance"
                      checked={formData.status === 'maintenance'}
                      onChange={handleFormChange}
                      className="accent-amber-500"
                    />
                    <span>🟡 Maintenance (ซ่อมบำรุง)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-800">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={formData.status === 'inactive'}
                      onChange={handleFormChange}
                      className="accent-slate-500"
                    />
                    <span>🔴 Inactive (ยกเลิก)</span>
                  </label>
                </div>
              </div>

              {/* Remark */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  หมายเหตุเพิ่มเติม (Remark)
                </label>
                <textarea
                  name="remark"
                  rows="2"
                  value={formData.remark}
                  onChange={handleFormChange}
                  placeholder="เช่น ติดตั้งบริเวณชั้น 2 โซนบัญชี..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#f89919] focus:bg-white outline-none"
                />
              </div>

              {/* Modal Actions Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-[#364356] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-[#364356] rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c232f] font-semibold text-sm transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#f89919] hover:bg-[#d97c08] text-white font-semibold text-sm rounded-xl shadow-md shadow-[#f89919]/20 transition-all cursor-pointer"
                >
                  💾 บันทึกข้อมูล
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 📋 MODAL: AUDIT LOG HISTORY (ประวัติการเปิดดูรหัสผ่าน)       */}
      {/* ------------------------------------------------------------- */}
      {isAuditModalOpen && (
        <div 
          onClick={() => setIsAuditModalOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#262f3f] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] border border-slate-200 dark:border-[#364356] animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-[#364356] flex items-center justify-between bg-slate-50 dark:bg-[#1c232f]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-[#f89919]">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    ประวัติการขอเปิดดูรหัสผ่าน (Password Access Audit Logs)
                    <span className="text-xs bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                      {auditLogs.length} รายการ
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    บันทึกประวัติการเข้าถึงรหัสผ่านและเหตุผลตามมาตรฐาน IT Security Audit Trail
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAuditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter / Search Bar */}
            <div className="p-4 bg-slate-50/50 dark:bg-[#202735] border-b border-slate-100 dark:border-[#364356] flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="ค้นหาตามชื่อผู้ใช้, ชื่ออุปกรณ์, IP, หรือเหตุผล..."
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f89919]"
                />
              </div>
              <button
                onClick={fetchAuditLogs}
                className="px-3 py-2 bg-white dark:bg-[#1c232f] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold border border-slate-200 dark:border-[#364356] flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAuditLoading ? 'animate-spin' : ''}`} />
                <span>รีเฟรช</span>
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {isAuditLoading ? (
                <div className="py-16 text-center text-slate-400 text-xs">กำลังโหลดข้อมูล Audit Logs...</div>
              ) : (
                (() => {
                  const filtered = auditLogs.filter(log => {
                    const q = auditSearch.toLowerCase();
                    return (
                      (log.user_name || '').toLowerCase().includes(q) ||
                      (log.device_name || '').toLowerCase().includes(q) ||
                      (log.device_ip || '').toLowerCase().includes(q) ||
                      (log.client_ip || '').toLowerCase().includes(q) ||
                      (log.reason || '').toLowerCase().includes(q)
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs">
                        ไม่พบประวัติการเข้าถึงรหัสผ่าน
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto border border-slate-200 dark:border-[#364356] rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-[#1c232f] border-b border-slate-200 dark:border-[#364356] text-slate-600 dark:text-slate-300 font-bold">
                            <th className="py-2.5 px-3">วัน-เวลา</th>
                            <th className="py-2.5 px-3">ผู้เข้าถึง</th>
                            <th className="py-2.5 px-3">อุปกรณ์ / IP ปลายทาง</th>
                            <th className="py-2.5 px-3">เหตุผลการขอเข้าถึง</th>
                            <th className="py-2.5 px-3 text-right">IP ต้นทาง</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#364356] text-slate-700 dark:text-slate-200">
                          {filtered.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-[#202836] transition-colors">
                              <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                {log.created_at ? new Date(log.created_at).toLocaleString('th-TH') : '-'}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-slate-900 dark:text-slate-100">{log.user_name || 'System User'}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900 dark:text-slate-100">{log.device_name || `Device #${log.device_id}`}</div>
                                <div className="font-mono text-[11px] text-[#f89919]">{log.device_ip || '-'}</div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="p-1.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/60 rounded-lg text-amber-900 dark:text-amber-200 text-[11.5px] leading-relaxed">
                                  {log.reason || '-'}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-400">
                                {log.client_ip || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-[#364356] flex justify-end bg-slate-50 dark:bg-[#1c232f]">
              <button 
                type="button" 
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-[#303b4e] hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
