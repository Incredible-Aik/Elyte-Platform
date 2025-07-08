const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    match: /^(\+233|0)[2-9][0-9]{8}$/ // Ghanaian phone number format
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  userType: {
    type: String,
    enum: ['passenger', 'driver'],
    default: 'passenger'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String
  },
  verificationCodeExpires: {
    type: Date
  },
  resetPasswordCode: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  
  // Profile information
  profilePicture: {
    type: String
  },
  dateOfBirth: {
    type: Date
  },
  
  // Driver-specific fields
  driverLicense: {
    type: String
  },
  vehicleRegistration: {
    type: String
  },
  vehicle: {
    make: String,
    model: String,
    year: Number,
    color: String,
    licensePlate: String
  },
  isDriverApproved: {
    type: Boolean,
    default: false
  },
  driverDocuments: [{
    type: {
      type: String,
      enum: ['license', 'registration', 'insurance', 'roadworthy']
    },
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    verified: {
      type: Boolean,
      default: false
    }
  }],
  
  // Location (for drivers)
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number] // [longitude, latitude]
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  
  // Ratings and reviews
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  ratingSum: {
    type: Number,
    default: 0
  },
  
  // Earnings (for drivers)
  totalEarnings: {
    type: Number,
    default: 0
  },
  todayEarnings: {
    type: Number,
    default: 0
  },
  
  // Activity tracking
  lastLogin: {
    type: Date
  },
  lastLocationUpdate: {
    type: Date
  },
  
  // Settings
  notifications: {
    sms: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    }
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspensionReason: {
    type: String
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for geospatial queries
userSchema.index({ currentLocation: '2dsphere' });

// Index for phone number lookups
userSchema.index({ phone: 1 });

// Index for driver queries
userSchema.index({ userType: 1, isOnline: 1 });

// Update updatedAt on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate rating
userSchema.methods.updateRating = function(newRating) {
  this.totalRatings += 1;
  this.ratingSum += newRating;
  this.rating = this.ratingSum / this.totalRatings;
};

// Check if user is online (for drivers)
userSchema.methods.isCurrentlyOnline = function() {
  return this.isOnline && this.userType === 'driver';
};

// Get user's full name
userSchema.methods.getFullName = function() {
  return this.name;
};

// Get user's display info
userSchema.methods.getDisplayInfo = function() {
  return {
    id: this._id,
    name: this.name,
    phone: this.phone,
    userType: this.userType,
    rating: this.rating,
    isOnline: this.isOnline,
    vehicle: this.vehicle
  };
};

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.verificationCode;
  delete user.resetPasswordCode;
  delete user.verificationCodeExpires;
  delete user.resetPasswordExpires;
  return user;
};

module.exports = mongoose.model('User', userSchema);