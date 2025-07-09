const User = require('../models/User');
const Driver = require('../models/Driver');
const Admin = require('../models/Admin');
const Passenger = require('../models/Passenger');
const { createUserSession, refreshAccessToken, invalidateSession } = require('../utils/tokenManager');
const { sendVerification, verifyCode, resendVerification } = require('../utils/verification');
const { executeQuery } = require('../../database/config/database');
const authConfig = require('../config/auth');

class AuthController {
  /**
   * Register a new user
   */
  static async register(req, res) {
    try {
      const {
        email,
        phone,
        password,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        userType,
        driverData,
        passengerData
      } = req.body;

      // Create user
      const user = await User.create({
        email,
        phone,
        password,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        userType
      });

      // Create type-specific record
      let typeSpecificRecord = null;
      if (userType === 'driver' && driverData) {
        typeSpecificRecord = await Driver.create({
          userId: user.id,
          ...driverData
        });
      } else if (userType === 'passenger') {
        typeSpecificRecord = await Passenger.create({
          userId: user.id,
          ...passengerData
        });
      } else if (userType === 'admin') {
        // Admin records are created separately by existing admins
        typeSpecificRecord = { message: 'Admin access requires approval' };
      }

      // Send verification emails/SMS
      const verificationResult = await sendVerification({
        userId: user.id,
        email: user.email,
        phoneNumber: user.phone,
        firstName: user.firstName,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }, 'email_verification');

      // Log successful registration
      await executeQuery(`
        INSERT INTO audit_logs (
          user_id, action, entity_type, entity_id, 
          new_values, category, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user.id,
        'user_registration',
        'user',
        user.id,
        JSON.stringify({ userType, email }),
        'authentication',
        req.ip,
        req.get('User-Agent')
      ]);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: user.getPublicData(),
          typeSpecificRecord: typeSpecificRecord?.getPublicData?.() || typeSpecificRecord,
          verification: {
            emailSent: verificationResult.emailSent,
            smsSent: verificationResult.smsSent,
            expiresAt: verificationResult.expiresAt
          }
        }
      });

      // Decrement rate limit on success
      if (req.decrementRateLimit) {
        req.decrementRateLimit();
      }
    } catch (error) {
      console.error('Registration error:', error.message);

      // Log failed registration attempt
      try {
        await executeQuery(`
          INSERT INTO audit_logs (
            action, entity_type, new_values, category, 
            severity, success, error_message, ip_address, user_agent
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          'user_registration_failed',
          'user',
          JSON.stringify({ email: req.body.email }),
          'authentication',
          'medium',
          false,
          error.message,
          req.ip,
          req.get('User-Agent')
        ]);
      } catch (logError) {
        console.error('Failed to log registration error:', logError.message);
      }

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Login user
   */
  static async login(req, res) {
    try {
      const { email, password, deviceType, deviceId } = req.body;

      // Authenticate user
      const user = await User.authenticate(email, password);
      if (!user) {
        // Log failed login attempt
        await executeQuery(`
          INSERT INTO audit_logs (
            action, entity_type, new_values, category, 
            severity, success, error_message, ip_address, user_agent
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          'login_failed',
          'user',
          JSON.stringify({ email }),
          'security',
          'medium',
          false,
          'Invalid credentials',
          req.ip,
          req.get('User-Agent')
        ]);

        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked due to too many failed attempts'
        });
      }

      // Create user session
      const sessionData = await createUserSession({
        userId: user.id,
        userType: user.userType,
        email: user.email,
        isVerified: user.isVerified,
        deviceType,
        deviceId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        locationInfo: {
          ip: req.ip,
          timestamp: new Date().toISOString()
        }
      });

      // Get type-specific data
      let typeSpecificData = null;
      if (user.userType === 'driver') {
        const driver = await Driver.findByUserId(user.id);
        typeSpecificData = driver?.getPublicData();
      } else if (user.userType === 'passenger') {
        const passenger = await Passenger.findByUserId(user.id);
        typeSpecificData = passenger?.getPublicData();
      } else if (user.userType === 'admin') {
        const admin = await Admin.findByUserId(user.id);
        typeSpecificData = admin?.getPublicData();
      }

      // Log successful login
      await executeQuery(`
        INSERT INTO audit_logs (
          user_id, action, entity_type, entity_id, 
          new_values, category, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user.id,
        'login_success',
        'user',
        user.id,
        JSON.stringify({ deviceType, deviceId }),
        'authentication',
        req.ip,
        req.get('User-Agent')
      ]);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.getPublicData(),
          typeSpecificData,
          tokens: {
            accessToken: sessionData.accessToken,
            refreshToken: sessionData.refreshToken,
            expiresIn: sessionData.expiresIn,
            tokenType: 'Bearer'
          }
        }
      });

      // Decrement rate limit on success
      if (req.decrementRateLimit) {
        req.decrementRateLimit();
      }
    } catch (error) {
      console.error('Login error:', error.message);

      // Log login error
      try {
        await executeQuery(`
          INSERT INTO audit_logs (
            action, entity_type, new_values, category, 
            severity, success, error_message, ip_address, user_agent
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          'login_error',
          'user',
          JSON.stringify({ email: req.body.email }),
          'security',
          'high',
          false,
          error.message,
          req.ip,
          req.get('User-Agent')
        ]);
      } catch (logError) {
        console.error('Failed to log login error:', logError.message);
      }

      res.status(500).json({
        success: false,
        message: 'Login failed due to server error'
      });
    }
  }

  /**
   * Logout user
   */
  static async logout(req, res) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.substring(7); // Remove 'Bearer '

      if (token) {
        await invalidateSession(token);

        // Log logout
        await executeQuery(`
          INSERT INTO audit_logs (
            user_id, action, entity_type, entity_id, 
            category, ip_address, user_agent
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          req.user?.id,
          'logout',
          'user',
          req.user?.id,
          'authentication',
          req.ip,
          req.get('User-Agent')
        ]);
      }

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      const newTokenData = await refreshAccessToken(refreshToken);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newTokenData.accessToken,
          expiresIn: newTokenData.expiresIn,
          tokenType: 'Bearer'
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error.message);
      res.status(401).json({
        success: false,
        message: 'Token refresh failed'
      });
    }
  }

  /**
   * Verify email or phone
   */
  static async verify(req, res) {
    try {
      const { code, type } = req.body;
      const userId = req.user.id;

      const verified = await verifyCode({
        userId,
        type,
        code
      });

      if (verified) {
        res.json({
          success: true,
          message: `${type === 'email' ? 'Email' : 'Phone'} verified successfully`
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired verification code'
        });
      }
    } catch (error) {
      console.error('Verification error:', error.message);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Resend verification code
   */
  static async resendVerification(req, res) {
    try {
      const { type } = req.body;
      const userId = req.user.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const verificationResult = await resendVerification({
        userId: user.id,
        email: user.email,
        phoneNumber: user.phone,
        firstName: user.firstName,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }, type);

      res.json({
        success: true,
        message: 'Verification code sent successfully',
        data: {
          emailSent: verificationResult.emailSent,
          smsSent: verificationResult.smsSent,
          expiresAt: verificationResult.expiresAt
        }
      });
    } catch (error) {
      console.error('Resend verification error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to resend verification code'
      });
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists for security
        return res.json({
          success: true,
          message: 'If an account with this email exists, you will receive a password reset code'
        });
      }

      const verificationResult = await sendVerification({
        userId: user.id,
        email: user.email,
        phoneNumber: user.phone,
        firstName: user.firstName,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }, 'password_reset');

      // Log password reset request
      await executeQuery(`
        INSERT INTO audit_logs (
          user_id, action, entity_type, entity_id, 
          category, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        user.id,
        'password_reset_requested',
        'user',
        user.id,
        'security',
        req.ip,
        req.get('User-Agent')
      ]);

      res.json({
        success: true,
        message: 'If an account with this email exists, you will receive a password reset code'
      });
    } catch (error) {
      console.error('Password reset request error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to process password reset request'
      });
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(req, res) {
    try {
      const { email, code, newPassword } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify reset code
      const verified = await verifyCode({
        userId: user.id,
        type: 'password_reset',
        code
      });

      if (!verified) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset code'
        });
      }

      // Reset password
      await user.resetPassword(newPassword);

      // Log password reset
      await executeQuery(`
        INSERT INTO audit_logs (
          user_id, action, entity_type, entity_id, 
          category, severity, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user.id,
        'password_reset_completed',
        'user',
        user.id,
        'security',
        'medium',
        req.ip,
        req.get('User-Agent')
      ]);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      console.error('Password reset error:', error.message);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Change password (for authenticated users)
   */
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.changePassword(currentPassword, newPassword);

      // Log password change
      await executeQuery(`
        INSERT INTO audit_logs (
          user_id, action, entity_type, entity_id, 
          category, severity, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user.id,
        'password_changed',
        'user',
        user.id,
        'security',
        'medium',
        req.ip,
        req.get('User-Agent')
      ]);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Password change error:', error.message);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get type-specific data
      let typeSpecificData = null;
      if (user.userType === 'driver') {
        const driver = await Driver.findByUserId(userId);
        typeSpecificData = driver?.getFullData();
      } else if (user.userType === 'passenger') {
        const passenger = await Passenger.findByUserId(userId);
        typeSpecificData = passenger?.getFullData();
      } else if (user.userType === 'admin') {
        const admin = await Admin.findByUserId(userId);
        typeSpecificData = admin?.getFullData();
      }

      res.json({
        success: true,
        data: {
          user: user.getPublicData(),
          typeSpecificData
        }
      });
    } catch (error) {
      console.error('Get profile error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to get user profile'
      });
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updates = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user profile
      await user.updateProfile(updates);

      // Log profile update
      await executeQuery(`
        INSERT INTO audit_logs (
          user_id, action, entity_type, entity_id, 
          new_values, category, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user.id,
        'profile_updated',
        'user',
        user.id,
        JSON.stringify(updates),
        'data_change',
        req.ip,
        req.get('User-Agent')
      ]);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.getPublicData()
        }
      });
    } catch (error) {
      console.error('Update profile error:', error.message);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = AuthController;