const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskControllers");

// CREATE a new task
router.post("/create", taskController.createTask);

// GET all tasks for an organization
router.get("/organization/:organizationId", taskController.getTasksByOrganization);

// GET task by ID
router.get("/get/:taskId", taskController.getTaskById);

// UPDATE a task
router.patch("/update/:taskId", taskController.updateTask);

// DELETE a task
router.delete("/delete/:taskId", taskController.deleteTask); 

// Task status update (for drag and drop)
router.patch("/status/:taskId", taskController.updateTaskStatus);

// Subtask routes
router.post("/subtasks/create/:taskId", taskController.addSubtask);
router.patch("/:taskId/subtasks/update/:subtaskId", taskController.updateSubtask);
router.delete("/:taskId/subtasks/delete/:subtaskId", taskController.deleteSubtask);

// Comment routes
router.post("/:taskId/comments", taskController.addComment);

// User-specific tasks
router.get("/user/:userId", taskController.getTasksByUserId);

module.exports = router;