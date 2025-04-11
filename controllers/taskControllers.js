const Task = require("../models/task");
const User = require("../models/users");
const Organization = require("../models/organization");

// CREATE a new task
exports.createTask = async (req, res) => {
  const { title, description, status, priority, dueDate, assignedTo, organization, tags, createdBy } = req.body;
  console.log(req.body);

  try {
    const users = await User.find({ _id: { $in: assignedTo } });
    if (users.length !== assignedTo.length) {
      return res.status(404).json({ success: false, message: "One or more assigned users not found" });
    }

    const org = await Organization.findById(organization);
    if (!org) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    const newTask = new Task({
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
      createdBy,
      organization,
      tags,
    });

    const savedTask = await newTask.save();
    res.status(201).json({ success: true, task: savedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create task" });
  }
};

// GET all tasks for an organization
exports.getTasksByOrganization = async (req, res) => {
  const { organizationId } = req.params;

  try {
    const tasks = await Task.find({ organization: organizationId }).populate('assignedTo createdBy organization');
    if (!tasks) {
      return res.status(404).json({ success: false, message: "No tasks found for this organization" });
    }
    res.status(200).json({ success: true, tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve tasks" });
  }
};

// GET task by ID
// GET task by ID with comments
exports.getTaskById = async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await Task.findById(taskId)
      .populate('assignedTo createdBy organization')
      .populate('comments.user', 'name email'); // Populate user details for comments

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve task" });
  }
};

// UPDATE a task
exports.updateTask = async (req, res) => {
  const { taskId } = req.params;
  const { title, description, status, priority, dueDate, assignedTo, tags } = req.body;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (assignedTo) {
      const users = await User.find({ _id: { $in: assignedTo } });
      if (users.length !== assignedTo.length) {
        return res.status(404).json({ success: false, message: "One or more assigned users not found" });
      }
      task.assignedTo = assignedTo;
    }

    task.title = title || task.title;
    task.description = description || task.description;
    task.status = status || task.status;
    task.priority = priority || task.priority;
    task.dueDate = dueDate || task.dueDate;
    task.tags = tags || task.tags;

    const updatedTask = await task.save();
    res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update task" });
  }
};

// UPDATE a task's status (when moved between columns)
exports.updateTaskStatus = async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;  // Only the status (new column) will be passed

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Update only the status (column)
    task.status = status;

    const updatedTask = await task.save();
    res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update task status" });
  }
};


// DELETE a task
exports.deleteTask = async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    await task.remove();
    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete task" });
  }
};

// ADD a comment to a task
exports.addComment = async (req, res) => {
  const { taskId } = req.params;
  const { user, text } = req.body;
  console.log(req.body);
 

  try {
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    //Check if the user is either assigned to the task or the creator
    if (!task.assignedTo.includes(user) && task.createdBy.toString() !== user) {
     return res.status(403).json({ success: false, message: "You are not allowed to comment on this task" });
    }

    // Add the comment to the task
    task.comments.push({
      text,
      user,
      createdAt: Date.now(),
    });

    const updatedTask = await task.save();
    res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to add comment" });
  }
};

// GET tasks by userId
exports.getTasksByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    // Find tasks either assigned to the user or created by the user
    const tasks = await Task.find({
      $or: [
        { assignedTo: userId }, 
        { createdBy: userId }
      ],
    })
      .populate('assignedTo', 'name email') // Populate user details for assignedTo
      .populate('createdBy', 'name email') // Populate user details for createdBy
      .populate('organization', 'name'); // Populate organization details

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ success: false, message: "No tasks found for this user" });
    }

    res.status(200).json({ success: true, tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve tasks" });
  }
};


