import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AddEmployeePage from './pages/AddEmployeePage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import EmployeeListPage from './pages/EmployeeListPage';
import EditEmployeePage from './pages/EditEmployeePage';
import AnnouncementPage from './pages/AnnouncementPage';
import AddAnnouncementPage from './pages/AddAnnouncementPage';
import ITSupportPage from './pages/ITSupportPage';
import ITSupportAdminPage from './pages/ITSupportAdminPage';
import ITHealthCheckPage from './pages/ITHealthCheckPage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import EmailTemplatesPage from './pages/EmailTemplatesPage';
import AdminLayout from './components/layout/AdminLayout';
import AnnouncementListPage from './pages/AnnouncementListPage';
import EditAnnouncementPage from './pages/EditAnnouncementPage';
import HostingAdminPage from './pages/HostingAdminPage';
import AssetAdminPage from './pages/AssetAdminPage';
import NetworkAdminPage from './pages/NetworkAdminPage';
import ForbiddenPage from './pages/ForbiddenPage';
import ProfilePage from './pages/ProfilePage';
import TimeAttendanceAdminPage from './pages/TimeAttendanceAdminPage';
import SystemAccountsAdminPage from './pages/SystemAccountsAdminPage';
import GlobalTooltip from './components/common/GlobalTooltip';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <GlobalTooltip />
      <Routes>
        {/* เส้นทางสาธารณะ (Public Routes) */}
        <Route path="/" element={<AnnouncementPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        {/* บริการแจ้งปัญหา IT สาธารณะ (ไม่ต้องเข้าสู่ระบบ) */}
        <Route path="/report-it" element={<ITSupportPage />} />

        {/* Layout หลักสำหรับผู้ใช้ที่เข้าสู่ระบบ (Protected Admin Layout) */}
        <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          
          {/* เมนูทั่วไป (เข้าถึงได้สำหรับผู้ใช้ทุกคนที่ยืนยันตัวตน) */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/it-support" element={<ITSupportPage />} />

          {/* การจัดการข้อมูลพนักงานและการลงเวลา (HR & Employee Management) */}
          <Route path="/employee-list" element={<ProtectedRoute requiredPermission="manage_employees"><EmployeeListPage /></ProtectedRoute>} />
          <Route path="/employees/new" element={<ProtectedRoute requiredPermission="manage_employees"><AddEmployeePage /></ProtectedRoute>} />
          <Route path="/edit-employee/:id" element={<ProtectedRoute requiredPermission="manage_employees"><EditEmployeePage /></ProtectedRoute>} />
          <Route path="/admin/time-attendance" element={<ProtectedRoute requiredPermission="manage_employees"><TimeAttendanceAdminPage /></ProtectedRoute>} />
          
          {/* การจัดการข่าวสารและประกาศ (Announcement Management) */}
          <Route path="/admin/announcements" element={<ProtectedRoute requiredPermission="manage_announcements"><AnnouncementListPage /></ProtectedRoute>} />
          <Route path="/admin/announcements/new" element={<ProtectedRoute requiredPermission="manage_announcements"><AddAnnouncementPage /></ProtectedRoute>} />
          <Route path="/admin/announcements/edit/:id" element={<ProtectedRoute requiredPermission="manage_announcements"><EditAnnouncementPage /></ProtectedRoute>} />

          {/* งานบริหารจัดการระบบไอทีและโครงสร้างพื้นฐาน (IT Support & Infrastructure) */}
          <Route path="/admin/it-health-check" element={<ProtectedRoute requiredPermission="manage_it_support"><ITHealthCheckPage /></ProtectedRoute>} />
          <Route path="/admin/it-support" element={<ProtectedRoute requiredPermission="manage_it_support"><ITSupportAdminPage /></ProtectedRoute>} />
          <Route path="/admin/network" element={<ProtectedRoute requiredPermission="manage_it_support"><NetworkAdminPage /></ProtectedRoute>} />
          <Route path="/admin/hostings" element={<ProtectedRoute requiredPermission="manage_assets"><HostingAdminPage /></ProtectedRoute>} />
          <Route path="/admin/assets" element={<ProtectedRoute requiredPermission="manage_assets"><AssetAdminPage /></ProtectedRoute>} />

          {/* การตั้งค่าระบบและบัญชีผู้ใช้งาน (System Settings & Accounts) */}
          <Route path="/admin/system-accounts" element={<ProtectedRoute requiredPermission="manage_settings"><SystemAccountsAdminPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute requiredPermission="manage_settings"><SystemSettingsPage /></ProtectedRoute>} />
          <Route path="/settings/email-templates" element={<ProtectedRoute requiredPermission="manage_settings"><EmailTemplatesPage /></ProtectedRoute>} />
        </Route>
      </Routes>
    </Router>
  </ThemeProvider>
  );
}