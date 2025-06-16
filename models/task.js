const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

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
      enum: ['pending', 'inProgress', 'review', 'completed', 'cancelled'],
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
      ref: 'Customer',
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    tags: [String],
    comments: [
      {
        text: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Add subtasks array
    subtasks: [subtaskSchema],
    // Add progress tracking
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  {
    timestamps: true,
  }
);

// Update progress when subtasks are modified
taskSchema.pre('save', function(next) {
  if (this.subtasks && this.subtasks.length > 0) {
    const completedSubtasks = this.subtasks.filter(
      subtask => subtask.status === 'completed'
    ).length;
    this.progress = Math.round((completedSubtasks / this.subtasks.length) * 100);
  } else {
    this.progress = 0;
  }
  next();
});

// Update parent task status if all subtasks are completed
taskSchema.post('save', function(doc) {
  if (doc.subtasks && doc.subtasks.length > 0) {
    const allSubtasksCompleted = doc.subtasks.every(
      subtask => subtask.status === 'completed'
    );
    
    if (allSubtasksCompleted && doc.status !== 'completed') {
      mongoose.model('Task').findByIdAndUpdate(
        doc._id,
        { status: 'completed' },
        { new: true }
      ).exec();
    }
  }
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;