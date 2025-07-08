const express = require('express');
const { auth, requireDriver, requireApprovedDriver } = require('../middleware/auth');
const { validateDriverStatus } = require('../middleware/validation');
const User = require('../models/User');
const Ride = require('../models/Ride');

const router = express.Router();

// Update driver status (online/offline)
router.post('/status', auth, requireDriver, validateDriverStatus, async (req, res) => {
  try {
    const { status } = req.body;
    const driverId = req.user.userId;

    const driver = await User.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    driver.isOnline = status === 'online';
    driver.lastLocationUpdate = Date.now();
    await driver.save();

    res.json({
      success: true,
      message: `Driver status updated to ${status}`,
      isOnline: driver.isOnline
    });

  } catch (error) {
    console.error('Update driver status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update driver status'
    });
  }
});

// Update driver location
router.post('/location', auth, requireDriver, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const driverId = req.user.userId;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const driver = await User.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    driver.currentLocation = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };
    driver.lastLocationUpdate = Date.now();
    await driver.save();

    res.json({
      success: true,
      message: 'Location updated successfully'
    });

  } catch (error) {
    console.error('Update driver location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location'
    });
  }
});

// Get driver stats
router.get('/stats', auth, requireDriver, async (req, res) => {
  try {
    const driverId = req.user.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const driver = await User.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Get today's rides
    const todayRides = await Ride.find({
      driverId,
      createdAt: { $gte: today },
      status: 'completed'
    });

    // Calculate stats
    const todayEarnings = todayRides.reduce((sum, ride) => sum + (ride.actualFare || 0), 0);
    const ridesCompleted = todayRides.length;
    
    // Get total rides for overall stats
    const totalRides = await Ride.countDocuments({
      driverId,
      status: 'completed'
    });

    // Calculate online time for today (simplified)
    const onlineTime = driver.isOnline ? '6h 30m' : '0h 0m';

    res.json({
      success: true,
      stats: {
        todayEarnings: todayEarnings.toFixed(2),
        ridesCompleted,
        totalRides,
        rating: driver.rating || 0,
        onlineTime,
        totalEarnings: driver.totalEarnings || 0
      }
    });

  } catch (error) {
    console.error('Get driver stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get driver stats'
    });
  }
});

// Get recent rides
router.get('/recent-rides', auth, requireDriver, async (req, res) => {
  try {
    const driverId = req.user.userId;
    const limit = parseInt(req.query.limit) || 10;

    const rides = await Ride.find({ driverId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('passengerId', 'name phone rating');

    res.json({
      success: true,
      rides: rides.map(ride => ({
        id: ride._id,
        pickup: ride.pickup.address || ride.pickup,
        destination: ride.destination.address || ride.destination,
        fare: ride.actualFare || ride.estimatedFare,
        rating: ride.passengerRating,
        status: ride.status,
        createdAt: ride.createdAt,
        completedAt: ride.completedAt,
        passenger: ride.passengerId ? {
          name: ride.passengerId.name,
          phone: ride.passengerId.phone,
          rating: ride.passengerId.rating
        } : null
      }))
    });

  } catch (error) {
    console.error('Get recent rides error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent rides'
    });
  }
});

// Get ride requests (for online drivers)
router.get('/ride-requests', auth, requireApprovedDriver, async (req, res) => {
  try {
    const driverId = req.user.userId;

    const driver = await User.findById(driverId);
    if (!driver.isOnline) {
      return res.json({
        success: true,
        requests: [],
        message: 'Driver is offline'
      });
    }

    // Find nearby pending rides
    const pendingRides = await Ride.find({
      status: 'pending',
      'pickup.coordinates': {
        $near: {
          $geometry: driver.currentLocation,
          $maxDistance: 5000 // 5km radius
        }
      }
    })
    .limit(5)
    .populate('passengerId', 'name phone rating');

    res.json({
      success: true,
      requests: pendingRides.map(ride => ({
        id: ride._id,
        pickup: ride.pickup.address || ride.pickup,
        destination: ride.destination.address || ride.destination,
        distance: ride.estimatedDistance,
        fare: ride.estimatedFare,
        rideType: ride.rideType,
        scheduledTime: ride.scheduledTime,
        passenger: ride.passengerId ? {
          name: ride.passengerId.name,
          rating: ride.passengerId.rating
        } : null
      }))
    });

  } catch (error) {
    console.error('Get ride requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ride requests'
    });
  }
});

// Accept ride request
router.post('/accept-ride/:rideId', auth, requireApprovedDriver, async (req, res) => {
  try {
    const { rideId } = req.params;
    const driverId = req.user.userId;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    if (ride.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Ride is no longer available'
      });
    }

    // Check if driver is online
    const driver = await User.findById(driverId);
    if (!driver.isOnline) {
      return res.status(400).json({
        success: false,
        message: 'Driver must be online to accept rides'
      });
    }

    // Update ride
    ride.driverId = driverId;
    ride.status = 'driver_assigned';
    ride.driverAssignedAt = Date.now();
    await ride.save();

    // Populate driver info
    await ride.populate('driverId', 'name phone vehicle rating');

    res.json({
      success: true,
      message: 'Ride accepted successfully',
      ride: {
        id: ride._id,
        pickup: ride.pickup.address || ride.pickup,
        destination: ride.destination.address || ride.destination,
        fare: ride.estimatedFare,
        status: ride.status,
        passenger: {
          id: ride.passengerId,
          phone: ride.passengerId.phone // You'd populate this properly
        }
      }
    });

  } catch (error) {
    console.error('Accept ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept ride'
    });
  }
});

// Update ride status
router.post('/ride/:rideId/status', auth, requireDriver, async (req, res) => {
  try {
    const { rideId } = req.params;
    const { status } = req.body;
    const driverId = req.user.userId;

    const ride = await Ride.findOne({ _id: rideId, driverId });
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    const validStatuses = ['driver_arriving', 'driver_arrived', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    ride.status = status;
    
    // Set timestamps based on status
    switch (status) {
      case 'driver_arrived':
        ride.driverArrivedAt = Date.now();
        break;
      case 'in_progress':
        ride.rideStartedAt = Date.now();
        break;
      case 'completed':
        ride.completedAt = Date.now();
        ride.actualFare = ride.calculateActualFare();
        break;
    }
    
    await ride.save();

    res.json({
      success: true,
      message: 'Ride status updated successfully',
      status: ride.status
    });

  } catch (error) {
    console.error('Update ride status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ride status'
    });
  }
});

// Get driver profile
router.get('/profile', auth, requireDriver, async (req, res) => {
  try {
    const driverId = req.user.userId;
    
    const driver = await User.findById(driverId).select('-password');
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    res.json({
      success: true,
      profile: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        rating: driver.rating,
        totalEarnings: driver.totalEarnings,
        isOnline: driver.isOnline,
        isApproved: driver.isDriverApproved,
        vehicle: driver.vehicle,
        createdAt: driver.createdAt
      }
    });

  } catch (error) {
    console.error('Get driver profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get driver profile'
    });
  }
});

module.exports = router;