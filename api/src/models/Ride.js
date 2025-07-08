const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  // Basic ride information
  passengerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Location details
  pickup: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    landmark: String
  },
  destination: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    landmark: String
  },
  
  // Ride details
  rideType: {
    type: String,
    enum: ['standard', 'premium', 'shared'],
    required: true
  },
  
  // Pricing
  estimatedFare: {
    type: Number,
    required: true
  },
  actualFare: {
    type: Number
  },
  baseFare: {
    type: Number
  },
  distanceFare: {
    type: Number
  },
  timeFare: {
    type: Number
  },
  additionalCharges: {
    type: Number,
    default: 0
  },
  
  // Distance and time
  estimatedDistance: {
    type: Number, // in kilometers
    required: true
  },
  actualDistance: {
    type: Number
  },
  estimatedDuration: {
    type: Number, // in minutes
    required: true
  },
  actualDuration: {
    type: Number
  },
  
  // Payment
  paymentMethod: {
    type: String,
    enum: ['cash', 'mobile-money', 'card'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentReference: {
    type: String
  },
  
  // Ride status
  status: {
    type: String,
    enum: [
      'pending',
      'driver_assigned',
      'driver_arriving',
      'driver_arrived',
      'in_progress',
      'completed',
      'cancelled'
    ],
    default: 'pending'
  },
  
  // Timing
  scheduledTime: {
    type: Date,
    default: Date.now
  },
  driverAssignedAt: {
    type: Date
  },
  driverArrivedAt: {
    type: Date
  },
  rideStartedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  
  // Cancellation
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: {
    type: String
  },
  
  // Ratings and reviews
  passengerRating: {
    type: Number,
    min: 1,
    max: 5
  },
  driverRating: {
    type: Number,
    min: 1,
    max: 5
  },
  passengerComment: {
    type: String,
    maxlength: 500
  },
  driverComment: {
    type: String,
    maxlength: 500
  },
  
  // Route tracking
  route: [{
    coordinates: [Number],
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Special requirements
  specialRequests: {
    type: String,
    maxlength: 200
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

// Indexes for performance
rideSchema.index({ passengerId: 1, createdAt: -1 });
rideSchema.index({ driverId: 1, createdAt: -1 });
rideSchema.index({ status: 1, createdAt: -1 });
rideSchema.index({ 'pickup.coordinates': '2dsphere' });
rideSchema.index({ 'destination.coordinates': '2dsphere' });

// Update updatedAt on save
rideSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate actual fare based on distance and time
rideSchema.methods.calculateActualFare = function() {
  const baseRate = {
    standard: 2.0,
    premium: 3.0,
    shared: 1.5
  };
  
  const distanceRate = {
    standard: 1.5,
    premium: 2.0,
    shared: 1.0
  };
  
  const timeRate = {
    standard: 0.5,
    premium: 0.8,
    shared: 0.3
  };
  
  this.baseFare = baseRate[this.rideType] || baseRate.standard;
  this.distanceFare = (this.actualDistance || this.estimatedDistance) * (distanceRate[this.rideType] || distanceRate.standard);
  this.timeFare = (this.actualDuration || this.estimatedDuration) * (timeRate[this.rideType] || timeRate.standard);
  
  this.actualFare = this.baseFare + this.distanceFare + this.timeFare + this.additionalCharges;
  
  return this.actualFare;
};

// Get ride duration in minutes
rideSchema.methods.getDuration = function() {
  if (this.rideStartedAt && this.completedAt) {
    return Math.round((this.completedAt - this.rideStartedAt) / (1000 * 60));
  }
  return null;
};

// Get ride distance (if route is available)
rideSchema.methods.getDistance = function() {
  if (this.route && this.route.length > 1) {
    // Calculate distance from route points
    // This is a simplified calculation
    let totalDistance = 0;
    for (let i = 1; i < this.route.length; i++) {
      const prev = this.route[i-1].coordinates;
      const curr = this.route[i].coordinates;
      totalDistance += this.calculateDistanceBetweenPoints(prev, curr);
    }
    return totalDistance;
  }
  return this.actualDistance || this.estimatedDistance;
};

// Calculate distance between two points (Haversine formula)
rideSchema.methods.calculateDistanceBetweenPoints = function(point1, point2) {
  const R = 6371; // Earth's radius in km
  const dLat = this.toRadians(point2[1] - point1[1]);
  const dLon = this.toRadians(point2[0] - point1[0]);
  const lat1 = this.toRadians(point1[1]);
  const lat2 = this.toRadians(point2[1]);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
};

rideSchema.methods.toRadians = function(degrees) {
  return degrees * (Math.PI / 180);
};

// Check if ride is active
rideSchema.methods.isActive = function() {
  return ['pending', 'driver_assigned', 'driver_arriving', 'driver_arrived', 'in_progress'].includes(this.status);
};

// Check if ride is completed
rideSchema.methods.isCompleted = function() {
  return this.status === 'completed';
};

// Check if ride is cancelled
rideSchema.methods.isCancelled = function() {
  return this.status === 'cancelled';
};

// Get ride summary
rideSchema.methods.getSummary = function() {
  return {
    id: this._id,
    pickup: this.pickup.address,
    destination: this.destination.address,
    rideType: this.rideType,
    fare: this.actualFare || this.estimatedFare,
    status: this.status,
    distance: this.getDistance(),
    duration: this.getDuration(),
    createdAt: this.createdAt,
    completedAt: this.completedAt
  };
};

module.exports = mongoose.model('Ride', rideSchema);