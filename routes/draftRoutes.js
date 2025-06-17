const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createDraft,
  getDrafts,
  getDraftById,
  updateDraft,
  deleteDraft,
  sendDraft
} = require("../controllers/draftControllers");

// Create a new draft
router.post("/", protect, createDraft);

// Get all drafts
router.get("/", protect, getDrafts);

// Get a single draft
router.get("/:draftId", protect, getDraftById);

// Update a draft
router.put("/:draftId", protect, updateDraft);

// Delete a draft
router.delete("/:draftId", protect, deleteDraft);

// Send draft as email
router.post("/:draftId/send", protect, sendDraft);

module.exports = router; 