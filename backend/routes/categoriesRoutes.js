const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');

const { verifyToken } = require('../middlewares/authMiddleware');

// IT Categories
router.get('/it-categories', categoriesController.getITCategories);
router.post('/it-categories', verifyToken, categoriesController.createITCategory);
router.put('/it-categories/:id', verifyToken, categoriesController.updateITCategory);
router.delete('/it-categories/:id', verifyToken, categoriesController.deleteITCategory);

// Announcement Types
router.get('/announcement-types', categoriesController.getAnnouncementTypes);
router.post('/announcement-types', verifyToken, categoriesController.createAnnouncementType);
router.put('/announcement-types/:id', verifyToken, categoriesController.updateAnnouncementType);
router.delete('/announcement-types/:id', verifyToken, categoriesController.deleteAnnouncementType);

module.exports = router;
