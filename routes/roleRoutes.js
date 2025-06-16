const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');

router.post('/', roleController.createRole);
router.get('/', roleController.getRoles);
router.get('/:roleId', roleController.getRoleById);
router.patch('/:roleId', roleController.updateRole);
router.delete('/:roleId', roleController.deleteRole);

module.exports = router; 