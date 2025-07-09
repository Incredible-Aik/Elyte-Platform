const { body, param, query, validationResult } = require('express-validator');
const { validateGhanaPhoneNumber, validateGhanaIDNumber, validateGhanaLicenseNumber, validateGhanaPlateNumber } = require('../utils/ghanaValidation');
const authConfig = require('../config/auth');

/**
 * Handle validation errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
}

/**
 * Password validation rules
 */
const passwordValidation = [
  body('password')
    .isLength({ min: authConfig.password.minLength, max: authConfig.password.maxLength })
    .withMessage(`Password must be between ${authConfig.password.minLength} and ${authConfig.password.maxLength} characters`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character')
];

/**
 * Email validation rules
 */
const emailValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email too long')
];

/**
 * Ghana phone number validation
 */
const ghanaPhoneValidation = [
  body('phone')
    .custom((value) => {
      const validation = validateGhanaPhoneNumber(value);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      return true;
    })
    .withMessage('Valid Ghana phone number is required')
];

/**
 * User registration validation
 */
const registerValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name contains invalid characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name contains invalid characters'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Valid date of birth is required')
    .custom((value) => {
      const age = new Date().getFullYear() - new Date(value).getFullYear();
      if (age < 18 || age > 100) {
        throw new Error('Age must be between 18 and 100 years');
      }
      return true;
    }),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  
  body('userType')
    .isIn(['driver', 'passenger', 'admin'])
    .withMessage('User type must be driver, passenger, or admin'),
  
  ...emailValidation,
  ...ghanaPhoneValidation,
  ...passwordValidation,
  
  handleValidationErrors
];

/**
 * Login validation
 */
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  body('deviceType')
    .optional()
    .isIn(['mobile', 'web', 'tablet'])
    .withMessage('Invalid device type'),
  
  body('deviceId')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Device ID too long'),
  
  handleValidationErrors
];

/**
 * Driver registration validation
 */
const driverValidation = [
  body('licenseNumber')
    .custom((value) => {
      const validation = validateGhanaLicenseNumber(value);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      return true;
    }),
  
  body('licenseExpiry')
    .isISO8601()
    .withMessage('Valid license expiry date is required')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('License must not be expired');
      }
      return true;
    }),
  
  body('vehicleType')
    .isIn(['car', 'motorcycle', 'tricycle', 'bus'])
    .withMessage('Invalid vehicle type'),
  
  body('vehicleMake')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Vehicle make must be between 2 and 50 characters'),
  
  body('vehicleModel')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Vehicle model must be between 2 and 50 characters'),
  
  body('vehicleYear')
    .isInt({ min: 1980, max: new Date().getFullYear() + 1 })
    .withMessage('Invalid vehicle year'),
  
  body('vehicleColor')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Vehicle color must be between 2 and 30 characters'),
  
  body('vehiclePlateNumber')
    .custom((value) => {
      const validation = validateGhanaPlateNumber(value);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      return true;
    }),
  
  body('insuranceNumber')
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('Insurance number must be between 5 and 50 characters'),
  
  body('insuranceExpiry')
    .isISO8601()
    .withMessage('Valid insurance expiry date is required')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Insurance must not be expired');
      }
      return true;
    }),
  
  body('emergencyContactName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Emergency contact name must be between 2 and 100 characters'),
  
  body('emergencyContactPhone')
    .custom((value) => {
      const validation = validateGhanaPhoneNumber(value);
      if (!validation.isValid) {
        throw new Error('Valid Ghana emergency contact phone number is required');
      }
      return true;
    }),
  
  body('address')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  
  body('city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  body('region')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Region must be between 2 and 100 characters'),
  
  handleValidationErrors
];

/**
 * Password reset request validation
 */
const passwordResetRequestValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  handleValidationErrors
];

/**
 * Password reset validation
 */
const passwordResetValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
    .isNumeric()
    .withMessage('Verification code must be numeric'),
  
  ...passwordValidation,
  
  handleValidationErrors
];

/**
 * Verification code validation
 */
const verificationCodeValidation = [
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
    .isNumeric()
    .withMessage('Verification code must be numeric'),
  
  body('type')
    .isIn(['email', 'sms', 'password_reset', 'two_factor'])
    .withMessage('Invalid verification type'),
  
  handleValidationErrors
];

/**
 * Mobile money account validation
 */
const mobileMoneyValidation = [
  body('provider')
    .isIn(['mtn', 'vodafone', 'airteltigo'])
    .withMessage('Invalid mobile money provider'),
  
  body('phoneNumber')
    .custom((value) => {
      const validation = validateGhanaPhoneNumber(value);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      return true;
    }),
  
  body('accountName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Account name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Account name contains invalid characters'),
  
  body('isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary must be boolean'),
  
  handleValidationErrors
];

/**
 * Profile update validation
 */
const profileUpdateValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name contains invalid characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name contains invalid characters'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Valid date of birth is required')
    .custom((value) => {
      const age = new Date().getFullYear() - new Date(value).getFullYear();
      if (age < 18 || age > 100) {
        throw new Error('Age must be between 18 and 100 years');
      }
      return true;
    }),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  
  handleValidationErrors
];

/**
 * ID parameter validation
 */
const idParamValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid ID is required'),
  
  handleValidationErrors
];

/**
 * Pagination validation
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

/**
 * File upload validation middleware
 * @param {Array} allowedTypes - Allowed file types
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {Function} - Middleware function
 */
function fileUploadValidation(allowedTypes = authConfig.upload.documents.allowedTypes, maxSize = authConfig.upload.documents.maxFileSize) {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const files = req.files || [req.file];
    
    for (const file of files) {
      // Check file size
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`
        });
      }
      
      // Check file type
      const fileExtension = file.originalname.split('.').pop().toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        return res.status(400).json({
          success: false,
          message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
        });
      }
    }
    
    next();
  };
}

module.exports = {
  handleValidationErrors,
  registerValidation,
  loginValidation,
  driverValidation,
  passwordResetRequestValidation,
  passwordResetValidation,
  verificationCodeValidation,
  mobileMoneyValidation,
  profileUpdateValidation,
  idParamValidation,
  paginationValidation,
  fileUploadValidation,
  passwordValidation,
  emailValidation,
  ghanaPhoneValidation
};