const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');

router.post('/', auditLogController.createLog);
router.get('/', auditLogController.getLogs);
router.get('/:logId', auditLogController.getLogById);
router.delete('/:logId', auditLogController.deleteLog);

module.exports = router; 