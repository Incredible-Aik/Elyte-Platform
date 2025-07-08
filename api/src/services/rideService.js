const User = require('../models/User');
const Ride = require('../models/Ride');

class RideService {
  constructor() {
    this.baseFareRates = {
      standard: 2.0,
      premium: 3.0,
      shared: 1.5
    };
    
    this.perKmRates = {
      standard: 1.5,
      premium: 2.0,
      shared: 1.0
    };
    
    this.perMinuteRates = {
      standard: 0.5,
      premium: 0.8,
      shared: 0.3
    };
  }

  async calculateRide(pickup, destination, rideType) {
    try {
      // Mock calculation - in production, this would use a mapping service
      const distance = this.calculateMockDistance(pickup, destination);
      const duration = this.calculateMockDuration(distance);
      const fare = this.calculateFare(distance, duration, rideType);

      return {
        distance: parseFloat(distance.toFixed(2)),
        duration: Math.round(duration),
        fare: parseFloat(fare.toFixed(2))
      };

    } catch (error) {
      console.error('Ride calculation error:', error);
      throw new Error('Failed to calculate ride details');
    }
  }

  calculateMockDistance(pickup, destination) {
    // Mock distance calculation based on string similarity
    // In production, this would use Google Maps API or similar
    const baseDistance = 5 + Math.random() * 15; // 5-20km
    return baseDistance;
  }

  calculateMockDuration(distance) {
    // Mock duration calculation
    // Assume average speed of 30km/h in traffic
    const avgSpeed = 30;
    const duration = (distance / avgSpeed) * 60; // Convert to minutes
    return duration;
  }

  calculateFare(distance, duration, rideType) {
    const baseFare = this.baseFareRates[rideType] || this.baseFareRates.standard;
    const distanceFare = distance * (this.perKmRates[rideType] || this.perKmRates.standard);
    const timeFare = duration * (this.perMinuteRates[rideType] || this.perMinuteRates.standard);
    
    return baseFare + distanceFare + timeFare;
  }

  async findNearbyDrivers(ride) {
    try {
      console.log(`Finding drivers for ride ${ride._id}`);
      
      // Mock driver finding - in production, this would use geospatial queries
      const nearbyDrivers = await User.find({
        userType: 'driver',
        isOnline: true,
        isDriverApproved: true,
        // In production, you'd use geospatial query here
        // currentLocation: {
        //   $near: {
        //     $geometry: ride.pickup.coordinates,
        //     $maxDistance: 5000 // 5km
        //   }
        // }
      }).limit(10);

      console.log(`Found ${nearbyDrivers.length} nearby drivers`);

      // For demo purposes, we'll simulate driver matching
      // In production, this would involve real-time notifications
      if (nearbyDrivers.length > 0) {
        // Simulate automatic driver assignment after a delay
        setTimeout(async () => {
          await this.assignDriverToRide(ride._id, nearbyDrivers[0]._id);
        }, 5000);
      }

      return nearbyDrivers;

    } catch (error) {
      console.error('Find nearby drivers error:', error);
      throw new Error('Failed to find nearby drivers');
    }
  }

  async assignDriverToRide(rideId, driverId) {
    try {
      const ride = await Ride.findById(rideId);
      if (!ride || ride.status !== 'pending') {
        return null;
      }

      ride.driverId = driverId;
      ride.status = 'driver_assigned';
      ride.driverAssignedAt = Date.now();
      await ride.save();

      console.log(`Driver ${driverId} assigned to ride ${rideId}`);
      
      // In production, this would send real-time notifications
      // via Socket.IO or push notifications
      
      return ride;

    } catch (error) {
      console.error('Assign driver error:', error);
      throw new Error('Failed to assign driver to ride');
    }
  }

  async updateUserRating(userId, newRating) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.updateRating(newRating);
      await user.save();

      console.log(`Updated rating for user ${userId}: ${user.rating}`);
      
      return user.rating;

    } catch (error) {
      console.error('Update user rating error:', error);
      throw new Error('Failed to update user rating');
    }
  }

  async cancelRide(rideId, userId, reason) {
    try {
      const ride = await Ride.findById(rideId);
      if (!ride) {
        throw new Error('Ride not found');
      }

      if (ride.status === 'completed' || ride.status === 'cancelled') {
        throw new Error('Cannot cancel completed or already cancelled ride');
      }

      ride.status = 'cancelled';
      ride.cancelledBy = userId;
      ride.cancellationReason = reason;
      ride.cancelledAt = Date.now();
      await ride.save();

      console.log(`Ride ${rideId} cancelled by user ${userId}`);
      
      // In production, notify the other party
      
      return ride;

    } catch (error) {
      console.error('Cancel ride error:', error);
      throw new Error('Failed to cancel ride');
    }
  }

  async getRideStatus(rideId) {
    try {
      const ride = await Ride.findById(rideId)
        .populate('passengerId', 'name phone')
        .populate('driverId', 'name phone vehicle rating');

      if (!ride) {
        throw new Error('Ride not found');
      }

      return {
        id: ride._id,
        status: ride.status,
        pickup: ride.pickup,
        destination: ride.destination,
        fare: ride.actualFare || ride.estimatedFare,
        passenger: ride.passengerId,
        driver: ride.driverId,
        createdAt: ride.createdAt,
        updatedAt: ride.updatedAt
      };

    } catch (error) {
      console.error('Get ride status error:', error);
      throw new Error('Failed to get ride status');
    }
  }

  async completeRide(rideId) {
    try {
      const ride = await Ride.findById(rideId);
      if (!ride) {
        throw new Error('Ride not found');
      }

      if (ride.status !== 'in_progress') {
        throw new Error('Can only complete rides that are in progress');
      }

      ride.status = 'completed';
      ride.completedAt = Date.now();
      ride.actualFare = ride.calculateActualFare();
      await ride.save();

      // Update driver earnings
      if (ride.driverId) {
        const driver = await User.findById(ride.driverId);
        if (driver) {
          driver.totalEarnings = (driver.totalEarnings || 0) + ride.actualFare;
          driver.todayEarnings = (driver.todayEarnings || 0) + ride.actualFare;
          await driver.save();
        }
      }

      console.log(`Ride ${rideId} completed`);
      
      return ride;

    } catch (error) {
      console.error('Complete ride error:', error);
      throw new Error('Failed to complete ride');
    }
  }

  // Mock geolocation functions - in production, these would use real GPS/mapping services
  async getCoordinatesFromAddress(address) {
    // Mock geocoding
    const mockCoordinates = {
      'Accra': [-0.1870, 5.6037],
      'Tema': [-0.0170, 5.6698],
      'Kumasi': [-1.6244, 6.6885],
      'Takoradi': [-1.7531, 4.8845]
    };

    // Simple matching
    for (const city in mockCoordinates) {
      if (address.toLowerCase().includes(city.toLowerCase())) {
        return mockCoordinates[city];
      }
    }

    // Default coordinates (Accra)
    return [-0.1870, 5.6037];
  }

  async getAddressFromCoordinates(coordinates) {
    // Mock reverse geocoding
    const [lng, lat] = coordinates;
    return `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

module.exports = new RideService();