const express = require('express');
const router = express.Router();
const hostingController = require('../controllers/hostingController');

router.get('/', hostingController.getAllHostings);
router.get('/:id', hostingController.getHostingById);
router.post('/', hostingController.createHosting);
router.put('/:id', hostingController.updateHosting);
router.delete('/:id', hostingController.deleteHosting);

module.exports = router;
