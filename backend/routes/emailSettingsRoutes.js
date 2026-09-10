const express = require('express');
const router = express.Router();
const emailSettingsController = require('../controllers/emailSettingsController');

router.get('/settings/email', emailSettingsController.getSettings);
router.put('/settings/email', emailSettingsController.updateSettings);
router.post('/settings/email/test', emailSettingsController.testEmail);
router.post('/announcements/:id/send-email', emailSettingsController.sendAnnouncement);

module.exports = router;
