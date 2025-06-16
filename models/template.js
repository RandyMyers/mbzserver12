// models/Template.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const templateSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User who created the task
        required: true,
      },
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Template description is required'],
    trim: true
  },
  image: {
    url: String,
    publicId: String
  },
  previewUrl: String,
  category: {
    type: String,
    enum: ['ecommerce', 'portfolio', 'blog', 'business', 'other']
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0
  },
  features: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Template', templateSchema);