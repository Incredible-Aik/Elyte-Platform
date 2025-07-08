/**
 * AUTHENTICATION ROUTES
 * Handles user authentication, registration, and session management
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const User = require('../models/User');
const Driver = require('../models/Driver');
const Admin = require('../models/Admin');
const authMiddleware = require('../middleware/auth');
const { sendSMS, sendEmail } = require('../services/notificationService');
const { generateOTP, formatGhanaPhone } = require('../utils/helpers');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/auth');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        error: 'Too many authentication attempts',
        message: 'Please try again later'
    }
});

const otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // limit each IP to 3 OTP requests per windowMs
    message: {
        error: 'Too many OTP requests',
        message: 'Please wait before requesting another OTP'
    }
});

// =============================================================================
// VALIDATION RULES
// =============================================================================

const registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').isMobilePhone('en-GH').withMessage('Valid Ghana phone number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
    body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
    body('userType').isIn(['passenger', 'driver', 'admin']).withMessage('Valid user type is required')
];

const loginValidation = [
    body('emailOrPhone').notEmpty().withMessage('Email or phone number is required'),
    body('password').notEmpty().withMessage('Password is required')
];

const otpValidation = [
    body('phone').isMobilePhone('en-GH').withMessage('Valid Ghana phone number is required'),
    body('otp').isLength({ min: 4, max: 6 }).withMessage('Valid OTP is required')
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate JWT token
 */
function generateToken(userId, userType, additionalPayload = {}) {
    return jwt.sign(
        {
            userId,
            userType,
            ...additionalPayload
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

/**
 * Get user model based on type
 */
function getUserModel(userType) {
    switch (userType) {
        case 'driver':
            return Driver;
        case 'admin':
            return Admin;
        default:
            return User;
    }
}

// =============================================================================
// REGISTRATION ENDPOINTS
// =============================================================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (passenger, driver, or admin)
 * @access  Public
 */
router.post('/register', authLimiter, registerValidation, async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const {
            email,
            phone,
            password,
            firstName,
            lastName,
            userType,
            city,
            mobileMoneyProvider,
            ...additionalData
        } = req.body;

        // Format phone number
        const formattedPhone = formatGhanaPhone(phone);

        // Check if user already exists
        const UserModel = getUserModel(userType);
        const existingUser = await UserModel.findOne({
            where: {
                $or: [
                    { email },
                    { phone: formattedPhone }
                ]
            }
        });

        if (existingUser) {
            return res.status(409).json({
                error: 'User already exists',
                message: 'An account with this email or phone number already exists'
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Generate verification OTP
        const verificationOTP = generateOTP();

        // Create user data
        const userData = {
            email,
            phone: formattedPhone,
            password: hashedPassword,
            firstName,
            lastName,
            city,
            mobileMoneyProvider,
            isVerified: false,
            verificationOTP,
            otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            ...additionalData
        };

        // Create user
        const user = await UserModel.create(userData);

        // Send verification SMS
        const verificationMessage = `Welcome to Elyte! Your verification code is: ${verificationOTP}. Valid for 10 minutes.`;
        await sendSMS(formattedPhone, verificationMessage);

        // Generate token (user not verified yet)
        const token = generateToken(user.id, userType, { verified: false });

        res.status(201).json({
            message: 'Registration successful',
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                firstName: user.firstName,
                lastName: user.lastName,
                userType,
                isVerified: false
            },
            token,
            nextStep: 'verification'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: 'Unable to create account. Please try again.'
        });
    }
});

// =============================================================================
// LOGIN ENDPOINTS
// =============================================================================

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authLimiter, loginValidation, async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { emailOrPhone, password, userType = 'passenger' } = req.body;

        // Determine if input is email or phone
        const isEmail = emailOrPhone.includes('@');
        const searchField = isEmail ? 'email' : 'phone';
        const searchValue = isEmail ? emailOrPhone : formatGhanaPhone(emailOrPhone);

        // Find user
        const UserModel = getUserModel(userType);
        const user = await UserModel.findOne({
            where: { [searchField]: searchValue }
        });

        if (!user) {
            return res.status(401).json({
                error: 'Authentication failed',
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Authentication failed',
                message: 'Invalid credentials'
            });
        }

        // Check if account is active
        if (user.status === 'suspended' || user.status === 'banned') {
            return res.status(403).json({
                error: 'Account suspended',
                message: 'Your account has been suspended. Please contact support.'
            });
        }

        // Update last login
        await user.update({ lastLoginAt: new Date() });

        // Generate token
        const token = generateToken(user.id, userType, {
            verified: user.isVerified,
            status: user.status
        });

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                firstName: user.firstName,
                lastName: user.lastName,
                userType,
                isVerified: user.isVerified,
                status: user.status
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: 'Unable to authenticate. Please try again.'
        });
    }
});

// =============================================================================
// VERIFICATION ENDPOINTS
// =============================================================================

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify user with OTP
 * @access  Public
 */
router.post('/verify-otp', otpLimiter, otpValidation, async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { phone, otp, userType = 'passenger' } = req.body;
        const formattedPhone = formatGhanaPhone(phone);

        // Find user
        const UserModel = getUserModel(userType);
        const user = await UserModel.findOne({
            where: { phone: formattedPhone }
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'No account found with this phone number'
            });
        }

        // Check OTP
        if (user.verificationOTP !== otp) {
            return res.status(400).json({
                error: 'Invalid OTP',
                message: 'The verification code is incorrect'
            });
        }

        // Check OTP expiry
        if (new Date() > user.otpExpiresAt) {
            return res.status(400).json({
                error: 'OTP expired',
                message: 'The verification code has expired. Please request a new one.'
            });
        }

        // Verify user
        await user.update({
            isVerified: true,
            verificationOTP: null,
            otpExpiresAt: null,
            status: 'active'
        });

        // Generate new token with verified status
        const token = generateToken(user.id, userType, {
            verified: true,
            status: 'active'
        });

        res.json({
            message: 'Verification successful',
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                firstName: user.firstName,
                lastName: user.lastName,
                userType,
                isVerified: true,
                status: 'active'
            },
            token
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            error: 'Verification failed',
            message: 'Unable to verify account. Please try again.'
        });
    }
});

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend verification OTP
 * @access  Public
 */
router.post('/resend-otp', otpLimiter, async (req, res) => {
    try {
        const { phone, userType = 'passenger' } = req.body;
        const formattedPhone = formatGhanaPhone(phone);

        // Find user
        const UserModel = getUserModel(userType);
        const user = await UserModel.findOne({
            where: { phone: formattedPhone }
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'No account found with this phone number'
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                error: 'Already verified',
                message: 'This account is already verified'
            });
        }

        // Generate new OTP
        const newOTP = generateOTP();
        await user.update({
            verificationOTP: newOTP,
            otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        });

        // Send SMS
        const message = `Your new Elyte verification code is: ${newOTP}. Valid for 10 minutes.`;
        await sendSMS(formattedPhone, message);

        res.json({
            message: 'Verification code sent',
            expiresIn: '10 minutes'
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            error: 'Failed to send OTP',
            message: 'Unable to send verification code. Please try again.'
        });
    }
});

// =============================================================================
// PASSWORD RESET
// =============================================================================

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', otpLimiter, async (req, res) => {
    try {
        const { emailOrPhone, userType = 'passenger' } = req.body;

        // Determine if input is email or phone
        const isEmail = emailOrPhone.includes('@');
        const searchField = isEmail ? 'email' : 'phone';
        const searchValue = isEmail ? emailOrPhone : formatGhanaPhone(emailOrPhone);

        // Find user
        const UserModel = getUserModel(userType);
        const user = await UserModel.findOne({
            where: { [searchField]: searchValue }
        });

        if (!user) {
            // Don't reveal if user exists or not
            return res.json({
                message: 'If an account exists, you will receive a reset code'
            });
        }

        // Generate reset OTP
        const resetOTP = generateOTP();
        await user.update({
            resetPasswordOTP: resetOTP,
            resetOTPExpiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        });

        // Send reset code
        if (isEmail) {
            await sendEmail(user.email, 'Password Reset - Elyte Platform', 
                `Your password reset code is: ${resetOTP}. Valid for 15 minutes.`);
        } else {
            await sendSMS(user.phone, 
                `Your Elyte password reset code is: ${resetOTP}. Valid for 15 minutes.`);
        }

        res.json({
            message: 'If an account exists, you will receive a reset code',
            expiresIn: '15 minutes'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            error: 'Failed to process request',
            message: 'Unable to process password reset. Please try again.'
        });
    }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with OTP
 * @access  Public
 */
router.post('/reset-password', authLimiter, async (req, res) => {
    try {
        const { emailOrPhone, otp, newPassword, userType = 'passenger' } = req.body;

        // Validate new password
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                error: 'Invalid password',
                message: 'Password must be at least 6 characters long'
            });
        }

        // Determine if input is email or phone
        const isEmail = emailOrPhone.includes('@');
        const searchField = isEmail ? 'email' : 'phone';
        const searchValue = isEmail ? emailOrPhone : formatGhanaPhone(emailOrPhone);

        // Find user
        const UserModel = getUserModel(userType);
        const user = await UserModel.findOne({
            where: { [searchField]: searchValue }
        });

        if (!user || user.resetPasswordOTP !== otp) {
            return res.status(400).json({
                error: 'Invalid reset code',
                message: 'The reset code is incorrect or expired'
            });
        }

        // Check OTP expiry
        if (new Date() > user.resetOTPExpiresAt) {
            return res.status(400).json({
                error: 'Reset code expired',
                message: 'The reset code has expired. Please request a new one.'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await user.update({
            password: hashedPassword,
            resetPasswordOTP: null,
            resetOTPExpiresAt: null
        });

        res.json({
            message: 'Password reset successful',
            nextStep: 'login'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            error: 'Password reset failed',
            message: 'Unable to reset password. Please try again.'
        });
    }
});

// =============================================================================
// TOKEN MANAGEMENT
// =============================================================================

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Private
 */
router.post('/refresh-token', authMiddleware, async (req, res) => {
    try {
        const { userId, userType } = req.user;

        // Find user to ensure they still exist and are active
        const UserModel = getUserModel(userType);
        const user = await UserModel.findByPk(userId);

        if (!user || user.status !== 'active') {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'Please log in again'
            });
        }

        // Generate new token
        const token = generateToken(userId, userType, {
            verified: user.isVerified,
            status: user.status
        });

        res.json({
            message: 'Token refreshed',
            token
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            error: 'Token refresh failed',
            message: 'Unable to refresh token'
        });
    }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', authMiddleware, async (req, res) => {
    // In a stateless JWT system, logout is handled client-side
    // In production, you might want to maintain a blacklist of tokens
    res.json({
        message: 'Logged out successfully'
    });
});

// =============================================================================
// USER INFO
// =============================================================================

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const { userId, userType } = req.user;

        const UserModel = getUserModel(userType);
        const user = await UserModel.findByPk(userId, {
            attributes: { exclude: ['password', 'verificationOTP', 'resetPasswordOTP'] }
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User account no longer exists'
            });
        }

        res.json({
            user: {
                ...user.toJSON(),
                userType
            }
        });

    } catch (error) {
        console.error('Get user info error:', error);
        res.status(500).json({
            error: 'Failed to get user info',
            message: 'Unable to retrieve user information'
        });
    }
});

module.exports = router;