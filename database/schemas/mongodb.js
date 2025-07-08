// MongoDB Schema Definitions and Indexes for Elyte Platform
// Run this script to set up indexes and constraints in MongoDB

// Connect to the Elyte Platform database
use('elyte-platform');

// Create collections with validation schemas
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'phone', 'password', 'userType'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 50,
          description: 'User full name'
        },
        phone: {
          bsonType: 'string',
          pattern: '^(\\+233|0)[2-9][0-9]{8}$',
          description: 'Ghanaian phone number'
        },
        email: {
          bsonType: 'string',
          pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
          description: 'Valid email address'
        },
        password: {
          bsonType: 'string',
          minLength: 6,
          description: 'Hashed password'
        },
        userType: {
          bsonType: 'string',
          enum: ['passenger', 'driver'],
          description: 'Type of user account'
        },
        rating: {
          bsonType: 'number',
          minimum: 0,
          maximum: 5,
          description: 'User rating out of 5'
        },
        currentLocation: {
          bsonType: 'object',
          required: ['type', 'coordinates'],
          properties: {
            type: {
              bsonType: 'string',
              enum: ['Point']
            },
            coordinates: {
              bsonType: 'array',
              minItems: 2,
              maxItems: 2,
              items: {
                bsonType: 'number'
              }
            }
          }
        }
      }
    }
  }
});

db.createCollection('rides', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['passengerId', 'pickup', 'destination', 'rideType', 'paymentMethod', 'estimatedFare'],
      properties: {
        passengerId: {
          bsonType: 'objectId',
          description: 'Reference to user (passenger)'
        },
        driverId: {
          bsonType: 'objectId',
          description: 'Reference to user (driver)'
        },
        rideType: {
          bsonType: 'string',
          enum: ['standard', 'premium', 'shared'],
          description: 'Type of ride requested'
        },
        paymentMethod: {
          bsonType: 'string',
          enum: ['cash', 'mobile-money', 'card'],
          description: 'Payment method for the ride'
        },
        status: {
          bsonType: 'string',
          enum: ['pending', 'driver_assigned', 'driver_arriving', 'driver_arrived', 'in_progress', 'completed', 'cancelled'],
          description: 'Current status of the ride'
        },
        estimatedFare: {
          bsonType: 'number',
          minimum: 0,
          description: 'Estimated fare in GHS'
        },
        actualFare: {
          bsonType: 'number',
          minimum: 0,
          description: 'Actual fare charged in GHS'
        },
        passengerRating: {
          bsonType: 'number',
          minimum: 1,
          maximum: 5,
          description: 'Passenger rating for driver'
        },
        driverRating: {
          bsonType: 'number',
          minimum: 1,
          maximum: 5,
          description: 'Driver rating for passenger'
        }
      }
    }
  }
});

// Create indexes for better performance

// Users collection indexes
db.users.createIndex({ phone: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { sparse: true });
db.users.createIndex({ userType: 1, isOnline: 1 });
db.users.createIndex({ currentLocation: '2dsphere' });
db.users.createIndex({ isDriverApproved: 1, isOnline: 1 });
db.users.createIndex({ createdAt: -1 });

// Rides collection indexes
db.rides.createIndex({ passengerId: 1, createdAt: -1 });
db.rides.createIndex({ driverId: 1, createdAt: -1 });
db.rides.createIndex({ status: 1, createdAt: -1 });
db.rides.createIndex({ 'pickup.coordinates': '2dsphere' });
db.rides.createIndex({ 'destination.coordinates': '2dsphere' });
db.rides.createIndex({ scheduledTime: 1 });
db.rides.createIndex({ createdAt: -1 });

// Compound indexes for common queries
db.rides.createIndex({ 
  status: 1, 
  'pickup.coordinates': '2dsphere' 
});

db.rides.createIndex({ 
  passengerId: 1, 
  status: 1, 
  createdAt: -1 
});

db.rides.createIndex({ 
  driverId: 1, 
  status: 1, 
  createdAt: -1 
});

// Text indexes for search functionality
db.users.createIndex({ 
  name: 'text', 
  phone: 'text' 
});

db.rides.createIndex({ 
  'pickup.address': 'text', 
  'destination.address': 'text' 
});

print('Database schema and indexes created successfully!');
print('Collections created: users, rides');
print('Indexes created for optimal performance');
print('Validation rules applied to ensure data integrity');