const express = require("express");
const router = express.Router();
const senderController = require("../controllers/senderControllers");

// CREATE a new sender
router.post("/create", senderController.createSender);

// GET all senders for a user
router.get("/user/:userId", senderController.getSendersByUser);

// GET all senders for a specific organization
router.get("/organization/:organizationId", senderController.getSendersByOrganization);  // New route for organization

// GET a specific sender by ID
router.get("/:senderId", senderController.getSenderById);

// UPDATE sender details
router.patch("/update/:senderId", senderController.updateSender);

// DELETE a sender
router.delete("/:senderId", senderController.deleteSender);

// RESET the daily email limit for a sender
router.patch("/reset-limit/:senderId", senderController.resetDailyLimit);

module.exports = router;
