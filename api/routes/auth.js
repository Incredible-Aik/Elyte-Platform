const express = require('express');
const router = express.Router();

// Import middleware
const {
  authenticateToken,
  authRateLimit,
  requireVerification
} = require('../middleware/auth');

const {
  registerValidation,
  loginValidation,
  passwordResetRequestValidation,
  passwordResetValidation,
  verificationCodeValidation,
  profileUpdateValidation,
  passwordValidation,
  handleValidationErrors
} = require('../middleware/validation');

// Import controller
const AuthController = require('../controllers/authController');
const { body } = require('express-validator');

// Apply rate limiting to all auth routes
router.use(authRateLimit());

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerValidation, AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidation, AuthController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticateToken, AuthController.logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  handleValidationErrors
], AuthController.refreshToken);

/**
 * @route   POST /api/auth/verify
 * @desc    Verify email or phone with code
 * @access  Private
 */
router.post('/verify', authenticateToken, verificationCodeValidation, AuthController.verify);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification code
 * @access  Private
 */
router.post('/resend-verification', [
  authenticateToken,
  body('type')
    .isIn(['email', 'sms'])
    .withMessage('Type must be email or sms'),
  handleValidationErrors
], AuthController.resendVerification);

/**
 * @route   POST /api/auth/request-password-reset
 * @desc    Request password reset code
 * @access  Public
 */
router.post('/request-password-reset', [
  authRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 3, // Only 3 password reset requests per 15 minutes
    skipSuccessfulRequests: false
  }),
  passwordResetRequestValidation
], AuthController.requestPasswordReset);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with code
 * @access  Public
 */
router.post('/reset-password', [
  authRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    skipSuccessfulRequests: true
  }),
  passwordResetValidation
], AuthController.resetPassword);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (for authenticated users)
 * @access  Private
 */
router.post('/change-password', [
  authenticateToken,
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  ...passwordValidation,
  handleValidationErrors
], AuthController.changePassword);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, AuthController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', [
  authenticateToken,
  profileUpdateValidation
], AuthController.updateProfile);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info (alias for profile)
 * @access  Private
 */
router.get('/me', authenticateToken, AuthController.getProfile);

/**
 * @route   POST /api/auth/verify-account
 * @desc    Complete account verification (requires both email and phone verification)
 * @access  Private
 */
router.post('/verify-account', [
  authenticateToken,
  requireVerification
], (req, res) => {
  res.json({
    success: true,
    message: 'Account is fully verified',
    data: {
      user: req.user,
      isVerified: true
    }
  });
});

/**
 * @route   GET /api/auth/verification-status
 * @desc    Get current verification status
 * @access  Private
 */
router.get('/verification-status', authenticateToken, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        userId: user.id,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        isVerified: user.isVerified,
        accountActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Verification status error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get verification status'
    });
  }
});

/**
 * @route   GET /api/auth/check
 * @desc    Check if user is authenticated (health check)
 * @access  Private
 */
router.get('/check', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication valid',
    data: {
      userId: req.user.id,
      userType: req.user.userType,
      isVerified: req.user.isVerified,
      sessionId: req.user.sessionId
    }
  });
});

module.exports = router;