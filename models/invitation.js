const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvitationSchema = new Schema({
  email: { type: String, required: true },
  invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'cancelled'], default: 'pending' },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

InvitationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Invitation', InvitationSchema); 