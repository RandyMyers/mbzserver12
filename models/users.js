const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        trim: true,
      },
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: false,
    },
    groups: [{
      type: Schema.Types.ObjectId,
      ref: 'Group',
    }],
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
    },
    invitations: [{
      type: Schema.Types.ObjectId,
      ref: 'Invitation',
    }],
    department: {
      type: String,
      enum: [
        'Customer Support', 
        'IT', 
        'HR', 
        'Sales', 
        'Marketing', 
        'Finance', 
        'Billing', 
        'Shipping'
      ],
        
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: function () {
        return this.role !== 'super-admin';
      },
    },
   
    organizationCode: {
        type: String,
      },
    displayCurrency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          // Basic currency code validation (3 uppercase letters)
          return /^[A-Z]{3}$/.test(v);
        },
        message: 'Currency code must be 3 uppercase letters (e.g., USD, EUR, NGN)'
      }
    },
    profilePicture: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  });
  

UserSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if password was changed after a given timestamp
UserSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

module.exports = mongoose.model('User', UserSchema);