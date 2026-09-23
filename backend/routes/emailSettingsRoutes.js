const express = require('express');
const router = express.Router();
const emailSettingsController = require('../controllers/emailSettingsController');

const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/settings/email', verifyToken, emailSettingsController.getSettings);
router.put('/settings/email', verifyToken, emailSettingsController.updateSettings);
router.post('/settings/email/test', verifyToken, emailSettingsController.testEmail);
router.post('/announcements/:id/send-email', verifyToken, emailSettingsController.sendAnnouncement);

module.exports = router;
