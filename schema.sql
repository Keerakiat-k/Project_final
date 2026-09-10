-- ========================================================
-- Database Schema for CorpHub Enterprise Management System
-- Clean DDL (Schema Only - No Data Included)
-- ========================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- --------------------------------------------------------
-- Table structure for table announcement_types
-- --------------------------------------------------------
DROP TABLE IF EXISTS announcement_types;
CREATE TABLE `announcement_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table announcements
-- --------------------------------------------------------
DROP TABLE IF EXISTS announcements;
CREATE TABLE `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `type` varchar(100) DEFAULT 'ทั่วไป',
  `cover_image` varchar(255) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table asset_licenses
-- --------------------------------------------------------
DROP TABLE IF EXISTS asset_licenses;
CREATE TABLE `asset_licenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `asset_id` int(11) NOT NULL,
  `software_type` varchar(50) DEFAULT NULL,
  `software_name` varchar(150) DEFAULT NULL,
  `license_key` varchar(255) DEFAULT NULL,
  `login_email` varchar(255) DEFAULT NULL,
  `login_password` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `asset_id` (`asset_id`),
  CONSTRAINT `asset_licenses_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table asset_maintenance_logs
-- --------------------------------------------------------
DROP TABLE IF EXISTS asset_maintenance_logs;
CREATE TABLE `asset_maintenance_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `asset_id` int(11) NOT NULL,
  `action_type` varchar(100) NOT NULL DEFAULT 'Maintenance',
  `description` text NOT NULL,
  `cost` decimal(10,2) DEFAULT 0.00,
  `technician` varchar(255) DEFAULT NULL,
  `service_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `asset_id` (`asset_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table asset_transfer_logs
-- --------------------------------------------------------
DROP TABLE IF EXISTS asset_transfer_logs;
CREATE TABLE `asset_transfer_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `asset_id` int(11) NOT NULL,
  `transfer_type` enum('Transfer','Loan') NOT NULL DEFAULT 'Transfer',
  `from_company` varchar(100) DEFAULT NULL,
  `from_department` varchar(100) DEFAULT NULL,
  `from_location` varchar(100) DEFAULT NULL,
  `from_user` varchar(255) DEFAULT NULL,
  `to_company` varchar(100) DEFAULT NULL,
  `to_department` varchar(100) DEFAULT NULL,
  `to_location` varchar(100) DEFAULT NULL,
  `to_user` varchar(255) DEFAULT NULL,
  `return_due_date` date DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `action_by` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `asset_id` (`asset_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table assets
-- --------------------------------------------------------
DROP TABLE IF EXISTS assets;
CREATE TABLE `assets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `asset_code` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `po_number` varchar(100) DEFAULT NULL,
  `warranty_period` varchar(100) DEFAULT NULL,
  `warranty_expire_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Available',
  `assigned_to` int(11) DEFAULT NULL,
  `parent_asset_id` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `company` varchar(50) DEFAULT NULL,
  `owner_company` varchar(100) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `model` varchar(150) DEFAULT NULL,
  `serial_number` varchar(150) DEFAULT NULL,
  `cpu` varchar(100) DEFAULT NULL,
  `ram` varchar(50) DEFAULT NULL,
  `storage` varchar(50) DEFAULT NULL,
  `display_size` varchar(50) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `os_license` varchar(150) DEFAULT NULL,
  `office_license` varchar(150) DEFAULT NULL,
  `os_license_key` varchar(255) DEFAULT NULL,
  `office_license_key` varchar(255) DEFAULT NULL,
  `extra_software` varchar(255) DEFAULT NULL,
  `extra_software_key` varchar(255) DEFAULT NULL,
  `software_login_email` varchar(255) DEFAULT NULL,
  `software_login_password` varchar(255) DEFAULT NULL,
  `software_notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `asset_code` (`asset_code`),
  KEY `assigned_to` (`assigned_to`),
  CONSTRAINT `assets_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table attendance_logs
-- --------------------------------------------------------
DROP TABLE IF EXISTS attendance_logs;
CREATE TABLE `attendance_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) DEFAULT NULL,
  `employee_code` varchar(50) DEFAULT NULL,
  `employee_name` varchar(150) DEFAULT NULL,
  `device_user_id` varchar(50) NOT NULL,
  `punch_time` datetime NOT NULL,
  `punch_type` varchar(30) DEFAULT 'CheckIn',
  `verify_type` varchar(30) DEFAULT 'Fingerprint/Face',
  `device_name` varchar(100) DEFAULT 'SpeedFace-V3L Soi-10',
  `device_ip` varchar(45) DEFAULT '192.168.99.7',
  `raw_data` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_device_log` (`device_user_id`,`punch_time`),
  KEY `idx_punch_time` (`punch_time`),
  KEY `idx_device_user` (`device_user_id`),
  KEY `idx_employee_code` (`employee_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table audit_logs
-- --------------------------------------------------------
DROP TABLE IF EXISTS audit_logs;
CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `user_name` varchar(100) DEFAULT NULL,
  `device_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `reason` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table bcc_groups
-- --------------------------------------------------------
DROP TABLE IF EXISTS bcc_groups;
CREATE TABLE `bcc_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `label` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table companies
-- --------------------------------------------------------
DROP TABLE IF EXISTS companies;
CREATE TABLE `companies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prefix` varchar(10) NOT NULL,
  `name` varchar(150) NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `prefix` (`prefix`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table departments
-- --------------------------------------------------------
DROP TABLE IF EXISTS departments;
CREATE TABLE `departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table device_user_mappings
-- --------------------------------------------------------
DROP TABLE IF EXISTS device_user_mappings;
CREATE TABLE `device_user_mappings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device_user_id` varchar(50) NOT NULL,
  `device_name_display` varchar(150) DEFAULT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `employee_code` varchar(50) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `device_user_id` (`device_user_id`),
  KEY `idx_dev_user` (`device_user_id`),
  KEY `idx_emp_id` (`employee_id`),
  KEY `idx_emp_code` (`employee_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table email_settings
-- --------------------------------------------------------
DROP TABLE IF EXISTS email_settings;
CREATE TABLE `email_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `smtp_host` varchar(255) DEFAULT NULL,
  `smtp_port` int(11) DEFAULT NULL,
  `smtp_user` varchar(255) DEFAULT NULL,
  `smtp_pass` varchar(255) DEFAULT NULL,
  `smtp_secure` tinyint(1) DEFAULT 0,
  `from_email` varchar(255) DEFAULT NULL,
  `from_name` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `additional_emails` text DEFAULT NULL,
  `cc_emails` text DEFAULT NULL,
  `bcc_emails` text DEFAULT NULL,
  `ticket_emails` text DEFAULT NULL,
  `to_emails` text DEFAULT NULL,
  `type` varchar(10) DEFAULT 'IT',
  `welcome_template` text DEFAULT NULL,
  `announcement_template` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table employee_credentials
-- --------------------------------------------------------
DROP TABLE IF EXISTS employee_credentials;
CREATE TABLE `employee_credentials` (
  `employee_id` int(11) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`employee_id`),
  CONSTRAINT `employee_credentials_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table employees
-- --------------------------------------------------------
DROP TABLE IF EXISTS employees;
CREATE TABLE `employees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_prefix` varchar(10) DEFAULT NULL,
  `employee_code` varchar(20) DEFAULT NULL,
  `title_th` varchar(20) DEFAULT 'นาย',
  `first_name_th` varchar(100) DEFAULT NULL,
  `last_name_th` varchar(100) DEFAULT NULL,
  `title_en` varchar(20) DEFAULT NULL,
  `first_name_en` varchar(100) DEFAULT NULL,
  `last_name_en` varchar(100) DEFAULT NULL,
  `nickname` varchar(50) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `role_id` int(11) NOT NULL DEFAULT 3,
  `status` enum('Active','Inactive','Resigned') DEFAULT 'Active',
  `resignation_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `use_domain` tinyint(1) DEFAULT 0,
  `access_revoked` tinyint(1) DEFAULT 0,
  `access_granted` tinyint(1) DEFAULT 0,
  `is_system_account` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_code` (`employee_code`),
  KEY `idx_company` (`company_prefix`),
  KEY `idx_department` (`department_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table hostings
-- --------------------------------------------------------
DROP TABLE IF EXISTS hostings;
CREATE TABLE `hostings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `domain_name` varchar(255) NOT NULL,
  `website_url` varchar(255) DEFAULT NULL,
  `website_username` varchar(255) DEFAULT NULL,
  `website_password` varchar(255) DEFAULT NULL,
  `email_provider` varchar(255) DEFAULT NULL,
  `email_username` varchar(255) DEFAULT NULL,
  `email_password` varchar(255) DEFAULT NULL,
  `registration_date` date DEFAULT NULL,
  `expiration_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Active',
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table it_categories
-- --------------------------------------------------------
DROP TABLE IF EXISTS it_categories;
CREATE TABLE `it_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table it_health_check_items
-- --------------------------------------------------------
DROP TABLE IF EXISTS it_health_check_items;
CREATE TABLE `it_health_check_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `check_id` int(11) NOT NULL,
  `item_order` int(11) DEFAULT 0,
  `category` varchar(100) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'N',
  `status_text` varchar(100) DEFAULT 'ปกติ',
  `remarks` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `check_id` (`check_id`),
  CONSTRAINT `it_health_check_items_ibfk_1` FOREIGN KEY (`check_id`) REFERENCES `it_health_checks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table it_health_checks
-- --------------------------------------------------------
DROP TABLE IF EXISTS it_health_checks;
CREATE TABLE `it_health_checks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `check_date` date NOT NULL,
  `branch_code` varchar(50) NOT NULL,
  `branch_name` varchar(100) NOT NULL,
  `reporter_name` varchar(100) DEFAULT 'นาย ธนกฤต กิจสมฝัน',
  `reporter_role` varchar(100) DEFAULT 'IT Supports',
  `general_notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_date_branch` (`check_date`,`branch_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table it_supports
-- --------------------------------------------------------
DROP TABLE IF EXISTS it_supports;
CREATE TABLE `it_supports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_no` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `department` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL,
  `urgency` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'รอรับเรื่อง',
  `assigned_to` varchar(100) DEFAULT NULL,
  `admin_note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table leave_balances
-- --------------------------------------------------------
DROP TABLE IF EXISTS leave_balances;
CREATE TABLE `leave_balances` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) NOT NULL,
  `leave_type_id` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `total_days` float NOT NULL DEFAULT 0,
  `used_days` float NOT NULL DEFAULT 0,
  `pending_days` float NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `emp_leave_year` (`employee_id`,`leave_type_id`,`year`),
  KEY `leave_type_id` (`leave_type_id`),
  CONSTRAINT `leave_balances_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leave_balances_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table leave_requests
-- --------------------------------------------------------
DROP TABLE IF EXISTS leave_requests;
CREATE TABLE `leave_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) NOT NULL,
  `leave_type_id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `duration_type` enum('Full Day','Morning','Afternoon') DEFAULT 'Full Day',
  `total_days` float NOT NULL,
  `reason` text DEFAULT NULL,
  `attachment` varchar(255) DEFAULT NULL,
  `status` enum('Pending Manager','Pending HR','Approved','Rejected','Cancelled') DEFAULT 'Pending Manager',
  `manager_id` int(11) DEFAULT NULL,
  `hr_id` int(11) DEFAULT NULL,
  `reject_reason` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `leave_type_id` (`leave_type_id`),
  CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leave_requests_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table leave_types
-- --------------------------------------------------------
DROP TABLE IF EXISTS leave_types;
CREATE TABLE `leave_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `default_days` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table network_devices
-- --------------------------------------------------------
DROP TABLE IF EXISTS network_devices;
CREATE TABLE `network_devices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) NOT NULL COMMENT 'หมายเลข IP Address',
  `device_name` varchar(255) NOT NULL COMMENT 'ชื่ออุปกรณ์/หน้าที่',
  `brand_name` varchar(100) DEFAULT NULL COMMENT 'ยี่ห้ออุปกรณ์',
  `model` varchar(100) DEFAULT NULL COMMENT 'รุ่นอุปกรณ์',
  `login_user` varchar(100) DEFAULT NULL COMMENT 'Username ผู้ดูแลระบบ',
  `login_password` varchar(255) DEFAULT NULL COMMENT 'รหัสผ่านผู้ดูแลระบบ',
  `manage_program` varchar(255) DEFAULT NULL COMMENT 'โปรแกรม/ช่องทางบริหารจัดการ',
  `login_ssid` varchar(255) DEFAULT NULL COMMENT 'Login Account หรือ Wi-Fi SSID',
  `access_key` varchar(255) DEFAULT NULL COMMENT 'Wi-Fi Key / Serial Number / Access Key',
  `purchase_date` date DEFAULT NULL COMMENT 'วันที่จัดซื้อ',
  `category` enum('Server','Network & Security','Access Point','Printer','VoIP & Time Access','CCTV','Other') NOT NULL DEFAULT 'Other' COMMENT 'หมวดหมู่อุปกรณ์',
  `branch_name` varchar(100) NOT NULL DEFAULT 'ASCG HQ' COMMENT 'ชื่อสาขา',
  `remark` text DEFAULT NULL COMMENT 'หมายเหตุเพิ่มเติม',
  `status` enum('active','inactive','maintenance') NOT NULL DEFAULT 'active' COMMENT 'สถานะอุปกรณ์',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_network_devices_ip` (`ip_address`),
  KEY `idx_network_devices_category` (`category`),
  KEY `idx_network_devices_status` (`status`),
  KEY `idx_network_devices_brand` (`brand_name`),
  KEY `idx_network_devices_branch` (`branch_name`),
  FULLTEXT KEY `idx_network_devices_search` (`device_name`,`brand_name`,`model`,`remark`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางเก็บข้อมูลอุปกรณ์เครือข่ายและเซิร์ฟเวอร์';

-- --------------------------------------------------------
-- Table structure for table permissions
-- --------------------------------------------------------
DROP TABLE IF EXISTS permissions;
CREATE TABLE `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key_name` varchar(50) NOT NULL,
  `label` varchar(100) NOT NULL,
  `module` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `key_name` (`key_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table positions
-- --------------------------------------------------------
DROP TABLE IF EXISTS positions;
CREATE TABLE `positions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `level` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table role_permissions
-- --------------------------------------------------------
DROP TABLE IF EXISTS role_permissions;
CREATE TABLE `role_permissions` (
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table roles
-- --------------------------------------------------------
DROP TABLE IF EXISTS roles;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
