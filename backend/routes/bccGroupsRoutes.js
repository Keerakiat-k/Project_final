const express = require('express');
const router = express.Router();
const bccGroupsController = require('../controllers/bccGroupsController');

router.get('/', bccGroupsController.getAll);
router.post('/', bccGroupsController.create);
router.put('/:id', bccGroupsController.update);
router.delete('/:id', bccGroupsController.remove);

module.exports = router;
