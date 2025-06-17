const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  moveToTrash,
  getTrashEmails,
  restoreFromTrash,
  deleteFromTrash
} = require("../controllers/trashControllers");

// Move email to trash
router.post("/move", protect, moveToTrash);

// Get all trash emails
router.get("/", protect, getTrashEmails);

// Restore email from trash
router.post("/restore/:trashId", protect, restoreFromTrash);

// Permanently delete from trash
router.delete("/:trashId", protect, deleteFromTrash);

module.exports = router; 