const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        userType: user.userType,
        rating: user.rating,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        // Driver specific fields
        ...(user.userType === 'driver' && {
          vehicle: user.vehicle,
          isOnline: user.isOnline,
          isApproved: user.isDriverApproved,
          totalEarnings: user.totalEarnings
        })
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    // Remove sensitive fields from updates
    delete updates.password;
    delete updates.phone;
    delete updates.userType;
    delete updates.isVerified;
    delete updates.rating;

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        userType: user.userType
      }
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Get user stats
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let stats = {
      totalRides: 0,
      rating: user.rating || 0,
      memberSince: user.createdAt
    };

    // Add driver-specific stats
    if (user.userType === 'driver') {
      stats = {
        ...stats,
        totalEarnings: user.totalEarnings || 0,
        todayEarnings: user.todayEarnings || 0,
        isOnline: user.isOnline,
        isApproved: user.isDriverApproved
      };
    }

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user stats'
    });
  }
});

module.exports = router;