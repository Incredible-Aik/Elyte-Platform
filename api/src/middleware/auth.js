const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    if (user.isSuspended) {
      return res.status(401).json({
        success: false,
        message: 'Account is suspended'
      });
    }

    req.user = decoded;
    req.userDoc = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Middleware to check if user is a driver
const requireDriver = (req, res, next) => {
  if (req.user.userType !== 'driver') {
    return res.status(403).json({
      success: false,
      message: 'Driver access required'
    });
  }
  next();
};

// Middleware to check if user is a passenger
const requirePassenger = (req, res, next) => {
  if (req.user.userType !== 'passenger') {
    return res.status(403).json({
      success: false,
      message: 'Passenger access required'
    });
  }
  next();
};

// Middleware to check if driver is approved
const requireApprovedDriver = (req, res, next) => {
  if (req.user.userType !== 'driver') {
    return res.status(403).json({
      success: false,
      message: 'Driver access required'
    });
  }
  
  if (!req.userDoc.isDriverApproved) {
    return res.status(403).json({
      success: false,
      message: 'Driver approval required'
    });
  }
  
  next();
};

// Middleware to check if user is verified
const requireVerified = (req, res, next) => {
  if (!req.userDoc.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Phone verification required'
    });
  }
  next();
};

module.exports = {
  auth,
  requireDriver,
  requirePassenger,
  requireApprovedDriver,
  requireVerified
};