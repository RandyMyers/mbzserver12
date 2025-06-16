const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');

router.post('/', groupController.createGroup);
router.get('/', groupController.getGroups);
router.get('/:groupId', groupController.getGroupById);
router.patch('/:groupId', groupController.updateGroup);
router.delete('/:groupId', groupController.deleteGroup);
router.post('/:groupId/add-user', groupController.addUserToGroup);
router.post('/:groupId/remove-user', groupController.removeUserFromGroup);

module.exports = router; 