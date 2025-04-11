const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'inProgress','review', 'completed', 'cancelled'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    dueDate: {
      type: Date,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer', // Reference to the User who created the task
      
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User who created the task
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization', // Reference to the Organization where this task belongs
      required: true,
    },
    tags: [String], // Optional tags for categorizing tasks
    comments: [
      {
        text: { type: String, required: true }, // Comment text
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User who commented
        createdAt: { type: Date, default: Date.now }, // Timestamp
      },
    ],
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Update the updatedAt field when the task is modified
taskSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
