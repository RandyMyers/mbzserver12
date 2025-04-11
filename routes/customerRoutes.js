const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerControllers');

router.post('/create', customerController.createCustomer);
router.get('/all', customerController.getAllCustomers);
router.get('/get/:id', customerController.getCustomerById);
router.get('/organization/:organizationId', customerController.getCustomersByOrganizationId);

router.patch('/update/:id', customerController.updateCustomer);
router.delete('/delete/:id', customerController.deleteCustomer);
router.get('/store/:storeId', customerController.getCustomersByStoreId);
// Route for syncing customers
router.post('/sync/:storeId/:organizationId', customerController.syncCustomers);

module.exports = router;
