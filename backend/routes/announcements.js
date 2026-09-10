const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const upload = require('../middleware/upload'); // นำเข้า upload middleware
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', announcementController.getAllAnnouncements);
router.get('/:id', announcementController.getAnnouncementById);
router.post('/', verifyToken, upload.single('coverImage'), announcementController.createAnnouncement);
router.put('/:id', verifyToken, upload.single('coverImage'), announcementController.updateAnnouncement);
router.delete('/:id', verifyToken, announcementController.deleteAnnouncement);

module.exports = router;
