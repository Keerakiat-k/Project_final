import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import LeaveRequestPage from './pages/LeaveRequestPage';
import LeaveManagementPage from './pages/LeaveManagementPage';
import LeaveSettingsPage from './pages/LeaveSettingsPage';
import ProfilePage from './pages/ProfilePage';
import LeaveHistoryPage from './pages/LeaveHistoryPage';
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
        {/* หน้าแรก (ข่าวสาร) */}
        <Route path="/" element={<AnnouncementPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        {/* แจ้งปัญหา IT แบบไม่ต้องล็อคอิน (จากหน้าประกาศ) */}
        <Route path="/report-it" element={<ITSupportPage />} />

        {/* 🌟 Layout สำหรับหน้าที่ต้อง Login (มี Sidebar & Navbar) 🌟 */}
        <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          
          {/* ทุกคนที่ล็อกอินเข้าได้ */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/it-support" element={<ITSupportPage />} />
          {/* จัดการพนักงาน */}
          <Route path="/employee-list" element={<ProtectedRoute requiredPermission="manage_employees"><EmployeeListPage /></ProtectedRoute>} />
          <Route path="/employees/new" element={<ProtectedRoute requiredPermission="manage_employees"><AddEmployeePage /></ProtectedRoute>} />
          <Route path="/edit-employee/:id" element={<ProtectedRoute requiredPermission="manage_employees"><EditEmployeePage /></ProtectedRoute>} />
          <Route path="/admin/time-attendance" element={<ProtectedRoute requiredPermission="manage_employees"><TimeAttendanceAdminPage /></ProtectedRoute>} />
          
          {/* จัดการประกาศ */}
          <Route path="/admin/announcements" element={<ProtectedRoute requiredPermission="manage_announcements"><AnnouncementListPage /></ProtectedRoute>} />
          <Route path="/admin/announcements/new" element={<ProtectedRoute requiredPermission="manage_announcements"><AddAnnouncementPage /></ProtectedRoute>} />
          <Route path="/admin/announcements/edit/:id" element={<ProtectedRoute requiredPermission="manage_announcements"><EditAnnouncementPage /></ProtectedRoute>} />

          {/* ฝั่ง IT */}
          <Route path="/admin/it-health-check" element={<ProtectedRoute requiredPermission="manage_it_support"><ITHealthCheckPage /></ProtectedRoute>} />
          <Route path="/admin/it-support" element={<ProtectedRoute requiredPermission="manage_it_support"><ITSupportAdminPage /></ProtectedRoute>} />
          <Route path="/admin/network" element={<ProtectedRoute requiredPermission="manage_it_support"><NetworkAdminPage /></ProtectedRoute>} />
          <Route path="/admin/hostings" element={<ProtectedRoute requiredPermission="manage_assets"><HostingAdminPage /></ProtectedRoute>} />
          <Route path="/admin/assets" element={<ProtectedRoute requiredPermission="manage_assets"><AssetAdminPage /></ProtectedRoute>} />

          {/* Settings */}
          <Route path="/admin/system-accounts" element={<ProtectedRoute requiredPermission="manage_settings"><SystemAccountsAdminPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute requiredPermission="manage_settings"><SystemSettingsPage /></ProtectedRoute>} />
          <Route path="/settings/email-templates" element={<ProtectedRoute requiredPermission="manage_settings"><EmailTemplatesPage /></ProtectedRoute>} />
          
          {/* Redirect disabled leave routes to dashboard */}
          <Route path="/leave" element={<Navigate to="/dashboard" replace />} />
          <Route path="/leave/*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/settings/leave" element={<Navigate to="/dashboard" replace />} />
          
        </Route>
      </Routes>
    </Router>
  </ThemeProvider>
  );
}