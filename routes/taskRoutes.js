const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskControllers");


// CREATE a new task
router.post("/create",  taskController.createTask);

// GET all tasks for an organization
router.get("/:organizationId",  taskController.getTasksByOrganization);

// GET task by ID
router.get("/task/:taskId",  taskController.getTaskById);

// UPDATE a task
router.patch("/update/:taskId", taskController.updateTask);

// DELETE a task
router.delete("/delete/:taskId",  taskController.deleteTask);

// Add comment to task
router.post('/comments/:taskId', taskController.addComment);

router.get('/user/:userId', taskController.getTasksByUserId);

// Update task status (for drag and drop)
router.patch("/status/:taskId", taskController.updateTaskStatus);

module.exports = router;
