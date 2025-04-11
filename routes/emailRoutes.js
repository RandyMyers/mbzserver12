const express = require("express");
const router = express.Router();
const emailController = require("../controllers/emailControllers");

router.post("/create", emailController.createEmail);
router.get("/all", emailController.getAllEmails);
router.get("/get/:emailId", emailController.getEmailById);
router.patch("/update/:emailId", emailController.updateEmail);
router.delete("/delete/:emailId", emailController.deleteEmail);
// Route to get emails by status
router.get("/status/:status", emailController.getEmailsByStatus);

module.exports = router;
