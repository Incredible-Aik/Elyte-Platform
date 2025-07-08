const express = require('express');
const Ride = require('../models/Ride');
const auth = require('../middleware/auth');
const { validateRideBooking } = require('../middleware/validation');
const rideService = require('../services/rideService');

const router = express.Router();

// Book a new ride
router.post('/book', auth, validateRideBooking, async (req, res) => {
  try {
    const { pickup, destination, rideType, paymentMethod, scheduledTime } = req.body;
    const passengerId = req.user.userId;

    // Calculate fare and distance
    const rideDetails = await rideService.calculateRide(pickup, destination, rideType);
    
    // Create ride
    const ride = new Ride({
      passengerId,
      pickup,
      destination,
      rideType,
      paymentMethod,
      estimatedFare: rideDetails.fare,
      estimatedDistance: rideDetails.distance,
      estimatedDuration: rideDetails.duration,
      scheduledTime: scheduledTime || Date.now(),
      status: 'pending'
    });

    await ride.save();

    // Start driver matching process
    rideService.findNearbyDrivers(ride);

    res.status(201).json({
      success: true,
      message: 'Ride booked successfully',
      ride: {
        id: ride._id,
        pickup: ride.pickup,
        destination: ride.destination,
        rideType: ride.rideType,
        fare: ride.estimatedFare,
        status: ride.status,
        createdAt: ride.createdAt
      }
    });

  } catch (error) {
    console.error('Ride booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book ride'
    });
  }
});

// Get ride history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const rides = await Ride.find({ 
      $or: [
        { passengerId: userId },
        { driverId: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('passengerId', 'name phone')
    .populate('driverId', 'name phone vehicle');

    const total = await Ride.countDocuments({ 
      $or: [
        { passengerId: userId },
        { driverId: userId }
      ]
    });

    res.json({
      success: true,
      rides: rides.map(ride => ({
        id: ride._id,
        pickup: ride.pickup,
        destination: ride.destination,
        rideType: ride.rideType,
        fare: ride.actualFare || ride.estimatedFare,
        status: ride.status,
        createdAt: ride.createdAt,
        completedAt: ride.completedAt,
        passenger: ride.passengerId ? {
          name: ride.passengerId.name,
          phone: ride.passengerId.phone
        } : null,
        driver: ride.driverId ? {
          name: ride.driverId.name,
          phone: ride.driverId.phone,
          vehicle: ride.driverId.vehicle
        } : null
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get ride history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ride history'
    });
  }
});

// Get active ride
router.get('/active', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const activeRide = await Ride.findOne({
      $or: [
        { passengerId: userId },
        { driverId: userId }
      ],
      status: { $in: ['pending', 'driver_assigned', 'driver_arriving', 'in_progress'] }
    })
    .populate('passengerId', 'name phone')
    .populate('driverId', 'name phone vehicle rating');

    if (!activeRide) {
      return res.json({
        success: true,
        ride: null,
        message: 'No active ride found'
      });
    }

    res.json({
      success: true,
      ride: {
        id: activeRide._id,
        pickup: activeRide.pickup,
        destination: activeRide.destination,
        rideType: activeRide.rideType,
        fare: activeRide.actualFare || activeRide.estimatedFare,
        status: activeRide.status,
        createdAt: activeRide.createdAt,
        passenger: activeRide.passengerId ? {
          name: activeRide.passengerId.name,
          phone: activeRide.passengerId.phone
        } : null,
        driver: activeRide.driverId ? {
          name: activeRide.driverId.name,
          phone: activeRide.driverId.phone,
          vehicle: activeRide.driverId.vehicle,
          rating: activeRide.driverId.rating
        } : null
      }
    });

  } catch (error) {
    console.error('Get active ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active ride'
    });
  }
});

// Get ride status
router.get('/:rideId/status', auth, async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.user.userId;

    const ride = await Ride.findOne({
      _id: rideId,
      $or: [
        { passengerId: userId },
        { driverId: userId }
      ]
    })
    .populate('passengerId', 'name phone')
    .populate('driverId', 'name phone vehicle rating');

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    res.json({
      success: true,
      ride: {
        id: ride._id,
        pickup: ride.pickup,
        destination: ride.destination,
        status: ride.status,
        fare: ride.actualFare || ride.estimatedFare,
        passenger: ride.passengerId ? {
          name: ride.passengerId.name,
          phone: ride.passengerId.phone
        } : null,
        driver: ride.driverId ? {
          name: ride.driverId.name,
          phone: ride.driverId.phone,
          vehicle: ride.driverId.vehicle,
          rating: ride.driverId.rating
        } : null
      }
    });

  } catch (error) {
    console.error('Get ride status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ride status'
    });
  }
});

// Cancel ride
router.post('/:rideId/cancel', auth, async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.user.userId;
    const { reason } = req.body;

    const ride = await Ride.findOne({
      _id: rideId,
      $or: [
        { passengerId: userId },
        { driverId: userId }
      ]
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    if (ride.status === 'completed' || ride.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed or already cancelled ride'
      });
    }

    // Update ride status
    ride.status = 'cancelled';
    ride.cancelledBy = userId;
    ride.cancellationReason = reason || 'No reason provided';
    ride.cancelledAt = Date.now();

    await ride.save();

    // Notify other party about cancellation
    // This would typically involve Socket.IO or push notifications

    res.json({
      success: true,
      message: 'Ride cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel ride'
    });
  }
});

// Rate ride
router.post('/:rideId/rate', auth, async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.user.userId;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const ride = await Ride.findOne({
      _id: rideId,
      $or: [
        { passengerId: userId },
        { driverId: userId }
      ]
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    if (ride.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed rides'
      });
    }

    // Check if user is passenger or driver
    const isPassenger = ride.passengerId.toString() === userId;
    
    if (isPassenger) {
      if (ride.passengerRating) {
        return res.status(400).json({
          success: false,
          message: 'You have already rated this ride'
        });
      }
      
      ride.passengerRating = rating;
      ride.passengerComment = comment;
    } else {
      if (ride.driverRating) {
        return res.status(400).json({
          success: false,
          message: 'You have already rated this ride'
        });
      }
      
      ride.driverRating = rating;
      ride.driverComment = comment;
    }

    await ride.save();

    // Update user's overall rating
    await rideService.updateUserRating(isPassenger ? ride.driverId : ride.passengerId, rating);

    res.json({
      success: true,
      message: 'Rating submitted successfully'
    });

  } catch (error) {
    console.error('Rate ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit rating'
    });
  }
});

// Get fare estimate
router.post('/estimate', auth, async (req, res) => {
  try {
    const { pickup, destination, rideType } = req.body;

    if (!pickup || !destination || !rideType) {
      return res.status(400).json({
        success: false,
        message: 'Pickup, destination, and ride type are required'
      });
    }

    const estimate = await rideService.calculateRide(pickup, destination, rideType);

    res.json({
      success: true,
      estimate: {
        fare: estimate.fare,
        distance: estimate.distance,
        duration: estimate.duration,
        rideType: rideType
      }
    });

  } catch (error) {
    console.error('Fare estimate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate fare estimate'
    });
  }
});

module.exports = router;