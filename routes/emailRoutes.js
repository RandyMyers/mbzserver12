const express = require("express");
const router = express.Router();
const emailController = require("../controllers/emailControllers");
const emailLogsController = require("../controllers/emailLogsController");

router.post("/create", emailController.createEmail);
router.get("/all", emailController.getAllEmails);
router.get("/get/:emailId", emailController.getEmailById);
router.patch("/update/:emailId", emailController.updateEmail);
router.delete("/delete/:emailId", emailController.deleteEmail);
// Route to get emails by status
router.get("/status/:status", emailController.getEmailsByStatus);

// --- Analytics endpoints ---
router.get("/analytics/delivery-stats", emailLogsController.getDeliveryStats);
router.get("/analytics/device-stats", emailLogsController.getDeviceStats);
router.get("/analytics/geo-stats", emailLogsController.getGeoStats);
router.post("/analytics/log", emailController.logEmailAnalytics);
// --- End analytics endpoints ---

module.exports = router;
