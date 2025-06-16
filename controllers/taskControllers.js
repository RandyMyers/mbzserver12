const Task = require("../models/task");
const User = require("../models/users");
const Organization = require("../models/organization");
const logEvent = require('../helper/logEvent');

// CREATE a new task with subtasks
exports.createTask = async (req, res) => {
  const { title, description, status, priority, dueDate, assignedTo, organization, tags, createdBy, subtasks } = req.body;
  console.log(req.body);

  try {
    // Validate assigned users
    const users = await User.find({ _id: { $in: assignedTo } });
    if (users.length !== assignedTo.length) {
      return res.status(404).json({ success: false, message: "One or more assigned users not found" });
    }

    // Validate organization
    const org = await Organization.findById(organization);
    if (!org) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    // Validate subtask assignees if provided
    if (subtasks && subtasks.length > 0) {
      const subtaskUserIds = subtasks.map(s => s.assignedTo).filter(Boolean);
      const subtaskUsers = await User.find({ _id: { $in: subtaskUserIds } });
      if (subtaskUsers.length !== new Set(subtaskUserIds).size) {
        return res.status(404).json({ success: false, message: "One or more subtask assignees not found" });
      }
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
      subtasks: subtasks || []
    });

    const savedTask = await newTask.save();
    await logEvent({
      action: 'create_task',
      user: req.user._id,
      resource: 'Task',
      resourceId: savedTask._id,
      details: { title: savedTask.title, status: savedTask.status },
      organization: req.user.organization
    });
    res.status(201).json({ success: true, task: savedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create task" });
  }
};

// GET all tasks for an organization with subtasks
exports.getTasksByOrganization = async (req, res) => {
  const { organizationId } = req.params;

  try {
    const tasks = await Task.find({ organization: organizationId })
      .populate('assignedTo createdBy organization')
      

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ success: false, message: "No tasks found for this organization" });
    }
    res.status(200).json({ success: true, tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve tasks" });
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
exports.getTaskById = async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await Task.findById(taskId)
      .populate('assignedTo createdBy organization')
      .populate('comments.user', 'name email');

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve task" });
  }
};


// UPDATE a task (including subtasks)
exports.updateTask = async (req, res) => {
  const { taskId } = req.params;
  const updateData = req.body;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    

    // Update task fields
    const fields = ['title', 'status'];
    const oldTask = { ...task.toObject() };
    fields.forEach(field => {
      if (updateData[field] !== undefined) {
        task[field] = updateData[field];
      }
    });

    const updatedTask = await task.save();
    await logEvent({
      action: 'update_task',
      user: req.user._id,
      resource: 'Task',
      resourceId: task._id,
      details: { before: oldTask, after: updatedTask },
      organization: req.user.organization
    });
    res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update task" });
  }
};


// ADD a subtask to a task
exports.addSubtask = async (req, res) => {
  const { taskId } = req.params;
  const { title, createdBy } = req.body;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Validate createdBy user exists
    const user = await User.findById(createdBy);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const newSubtask = {
      title,
      createdBy,
      status: 'pending'
    };

    task.subtasks.push(newSubtask);
    const updatedTask = await task.save();

    res.status(201).json({ 
      success: true, 
      task: updatedTask,
      message: "Subtask added successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to add subtask",
      error: error.message 
    });
  }
};

exports.updateSubtask = async (req, res) => {
  const { taskId, subtaskId } = req.params;
  const { status, title } = req.body;  // Get title from body, not params

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const subtask = task.subtasks.id(subtaskId);
    if (!subtask) {
      return res.status(404).json({ success: false, message: "Subtask not found" });
    }

    // Update title if provided
    if (title !== undefined) {
      subtask.title = title;
    }

    // Update status if provided and valid
    if (status !== undefined) {
      if (['pending', 'completed'].includes(status)) {
        subtask.status = status;
      } else {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid status value. Must be 'pending' or 'completed'" 
        });
      }
    }

    // Return error if neither title nor status was provided
    if (title === undefined && status === undefined) {
      return res.status(400).json({
        success: false,
        message: "Must provide either title or status to update"
      });
    }

    const updatedTask = await task.save();
    res.status(200).json({ 
      success: true, 
      task: updatedTask,
      message: "Subtask updated successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update subtask",
      error: error.message 
    });
  }
};

// DELETE a subtask
exports.deleteSubtask = async (req, res) => {
  const { taskId, subtaskId } = req.params;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Find the index of the subtask
    const subtaskIndex = task.subtasks.findIndex(sub => sub._id.toString() === subtaskId);
    if (subtaskIndex === -1) {
      return res.status(404).json({ success: false, message: "Subtask not found" });
    }

    // Remove the subtask from the array
    task.subtasks.splice(subtaskIndex, 1);
    const updatedTask = await task.save();

    res.status(200).json({ 
      success: true, 
      task: updatedTask,
      message: "Subtask deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete subtask",
      error: error.message 
    });
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

// GET tasks by userId with subtasks
exports.getTasksByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const tasks = await Task.find({
      $or: [
        { assignedTo: userId },
        { createdBy: userId },
        { 'subtasks.assignedTo': userId }
      ]
    })
    .populate('assignedTo createdBy organization')
    .populate('subtasks.assignedTo', 'name email');

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ success: false, message: "No tasks found for this user" });
    }

    res.status(200).json({ success: true, tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve tasks" });
  }
};


