const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Routes & Controllers
const employeeRoutes = require('./routes/employeeRoutes');
const authRoutes = require('./routes/authRoutes');
const employeeController = require('./controllers/employeeController');
const itSupportController = require('./controllers/itSupportController');
const path = require('path');
const settingsController = require('./controllers/settingsController');
const { verifyToken } = require('./middlewares/authMiddleware');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
// Middleware: Parse JSON request body
app.use(express.json()); 

// Static Files: Serve uploaded assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check API
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Backend is running' });
});

// Authentication & Employee Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);

app.get('/api/companies', employeeController.getAllCompanies);
app.put('/api/employees/:id/status', employeeController.updateEmployeeStatus);

// ==========================================
// IT Helpdesk Routes
// ==========================================
app.post('/api/it-support', itSupportController.createTicket);                      // Public: Submit ticket
app.get('/api/it-support', verifyToken, itSupportController.getAllTickets);          // Protected: View all tickets
app.put('/api/it-support/:id', verifyToken, itSupportController.updateTicket);       // Protected: Update ticket
app.delete('/api/it-support/:id', verifyToken, itSupportController.deleteTicket);    // Protected: Delete ticket



// Announcements Management
const announcementRoutes = require('./routes/announcements');
app.use('/api/announcements', announcementRoutes);

// Hosting Management
const hostingRoutes = require('./routes/hostings');
app.use('/api/hostings', verifyToken, hostingRoutes);

// Asset Management
const assetRoutes = require('./routes/assets');
app.use('/api/assets', verifyToken, assetRoutes);


// Network & Infrastructure Management
const networkRoutes = require('./routes/networkRoutes');
app.use('/api/network-devices', networkRoutes);

// Time Attendance (ZKTeco SpeedFace-V3L)
const timeAttendanceRoutes = require('./routes/timeAttendanceRoutes');
app.use('/api/time-attendance', timeAttendanceRoutes);

// ==========================================
// System Settings Routes
// ==========================================
app.use('/api/settings', verifyToken);
app.get('/api/settings/companies', settingsController.getCompanies);
app.post('/api/settings/companies', settingsController.createCompany);
app.put('/api/settings/companies/:id', settingsController.updateCompany);
app.delete('/api/settings/companies/:id', settingsController.deleteCompany);

app.get('/api/settings/departments', settingsController.getDepartments);
app.post('/api/settings/departments', settingsController.createDepartment);
app.put('/api/settings/departments/:id', settingsController.updateDepartment);
app.delete('/api/settings/departments/:id', settingsController.deleteDepartment);

app.get('/api/settings/roles', settingsController.getRoles);
app.put('/api/settings/roles/:id', settingsController.updateRole);

app.get('/api/settings/permissions', settingsController.getPermissions);
app.get('/api/settings/roles/:id/permissions', settingsController.getRolePermissions);
app.put('/api/settings/roles/:id/permissions', settingsController.updateRolePermissions);

app.get('/api/settings/positions', settingsController.getPositions);
app.post('/api/settings/positions', settingsController.createPosition);
app.put('/api/settings/positions/:id', settingsController.updatePosition);
app.delete('/api/settings/positions/:id', settingsController.deletePosition);

// ==========================================
// Categories & System Accounts
// ==========================================
const categoriesRoutes = require('./routes/categoriesRoutes');
app.use('/api', categoriesRoutes);
app.use('/api/settings', categoriesRoutes);

// System Accounts Alias
app.get('/api/settings/system-accounts', employeeController.getSystemAccounts);

// ==========================================
// Email Settings & BCC Groups
// ==========================================
const emailSettingsRoutes = require('./routes/emailSettingsRoutes');
app.use('/api', emailSettingsRoutes);

const bccGroupsRoutes = require('./routes/bccGroupsRoutes');
app.use('/api/bcc-groups', verifyToken, bccGroupsRoutes);

// IT System Health Check
const itHealthRoutes = require('./routes/itHealthRoutes');
app.use('/api', itHealthRoutes);

// -------------------------------------------------------------
// Serve React Frontend Static Files & SPA Routing
// -------------------------------------------------------------
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err);
    res.status(500).json({
        status: 'error',
        message: err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
    });
});

// SPA Fallback Handler
app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ status: 'error', message: 'API route not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`CorpHub Server is running on http://0.0.0.0:${port} (Standalone Mode)`);
});