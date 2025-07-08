const Joi = require('joi');

// Validation schemas
const registrationSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^(\+233|0)[2-9][0-9]{8}$/).required(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).required(),
  userType: Joi.string().valid('passenger', 'driver').optional()
});

const loginSchema = Joi.object({
  phone: Joi.string().pattern(/^(\+233|0)[2-9][0-9]{8}$/).required(),
  password: Joi.string().required()
});

const rideBookingSchema = Joi.object({
  pickup: Joi.string().required(),
  destination: Joi.string().required(),
  rideType: Joi.string().valid('standard', 'premium', 'shared').required(),
  paymentMethod: Joi.string().valid('cash', 'mobile-money', 'card').required(),
  scheduledTime: Joi.date().optional(),
  specialRequests: Joi.string().max(200).optional()
});

const phoneVerificationSchema = Joi.object({
  phone: Joi.string().pattern(/^(\+233|0)[2-9][0-9]{8}$/).required(),
  code: Joi.string().length(6).required()
});

const passwordResetSchema = Joi.object({
  phone: Joi.string().pattern(/^(\+233|0)[2-9][0-9]{8}$/).required(),
  code: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).required()
});

const driverStatusSchema = Joi.object({
  status: Joi.string().valid('online', 'offline').required()
});

const rideRatingSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().max(500).optional()
});

const paymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  method: Joi.string().valid('cash', 'mobile-money', 'card').required(),
  reference: Joi.string().optional()
});

const ussdRequestSchema = Joi.object({
  sessionId: Joi.string().required(),
  serviceCode: Joi.string().required(),
  phoneNumber: Joi.string().pattern(/^(\+233|0)[2-9][0-9]{8}$/).required(),
  text: Joi.string().allow('').optional()
});

// Validation middleware functions
const validateRegistration = (req, res, next) => {
  const { error } = registrationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  next();
};

const validateRideBooking = (req, res, next) => {
  const { error } = rideBookingSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  next();
};

const validatePhoneVerification = (req, res, next) => {
  const { error } = phoneVerificationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  next();
};

const validatePasswordReset = (req, res, next) => {
  const { error } = passwordResetSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  next();
};

const validateDriverStatus = (req, res, next) => {
  const { error } = driverStatusSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  next();
};

const validateRideRating = (req, res, next) => {
  const { error } = rideRatingSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  next();
};

const validatePayment = (req, res, next) => {
  const { error } = paymentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  next();
};

const validateUssdRequest = (req, res, next) => {
  const { error } = ussdRequestSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  next();
};

// Custom validation helpers
const isValidGhanaianPhone = (phone) => {
  return /^(\+233|0)[2-9][0-9]{8}$/.test(phone);
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidCoordinates = (coordinates) => {
  return Array.isArray(coordinates) && 
         coordinates.length === 2 && 
         typeof coordinates[0] === 'number' && 
         typeof coordinates[1] === 'number' &&
         coordinates[0] >= -180 && coordinates[0] <= 180 &&
         coordinates[1] >= -90 && coordinates[1] <= 90;
};

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  return input;
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateRideBooking,
  validatePhoneVerification,
  validatePasswordReset,
  validateDriverStatus,
  validateRideRating,
  validatePayment,
  validateUssdRequest,
  isValidGhanaianPhone,
  isValidEmail,
  isValidCoordinates,
  sanitizeInput,
  
  // Export schemas for direct use
  schemas: {
    registration: registrationSchema,
    login: loginSchema,
    rideBooking: rideBookingSchema,
    phoneVerification: phoneVerificationSchema,
    passwordReset: passwordResetSchema,
    driverStatus: driverStatusSchema,
    rideRating: rideRatingSchema,
    payment: paymentSchema,
    ussdRequest: ussdRequestSchema
  }
};