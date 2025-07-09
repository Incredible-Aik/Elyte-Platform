const { verifyToken, extractTokenFromHeader } = require('../utils/tokenManager');
const { executeQuery } = require('../../database/config/database');
const authConfig = require('../config/auth');

/**
 * Authenticate JWT token middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }
    
    // Verify JWT token
    const decoded = verifyToken(token);
    
    if (decoded.tokenType !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }
    
    // Check if session exists and is active
    const sessions = await executeQuery(`
      SELECT s.*, u.id, u.email, u.user_type, u.is_active, u.is_verified
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ? AND s.is_active = true AND s.expires_at > NOW()
    `, [token]);
    
    if (sessions.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }
    
    const session = sessions[0];
    
    // Check if user is active
    if (!session.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }
    
    // Update last activity
    await executeQuery(`
      UPDATE user_sessions 
      SET last_activity = NOW()
      WHERE id = ?
    `, [session.id]);
    
    // Add user info to request
    req.user = {
      id: session.user_id,
      email: session.email,
      userType: session.user_type,
      isVerified: session.is_verified,
      sessionId: session.id
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
}

/**
 * Authorize user types middleware
 * @param {Array} allowedUserTypes - Allowed user types
 * @returns {Function} - Middleware function
 */
function authorizeUserTypes(allowedUserTypes) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!allowedUserTypes.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
}

/**
 * Require verification middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function requireVerification(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Account verification required',
      code: 'VERIFICATION_REQUIRED'
    });
  }
  
  next();
}

/**
 * Check admin permissions middleware
 * @param {Array} requiredPermissions - Required permissions
 * @returns {Function} - Middleware function
 */
function requireAdminPermissions(requiredPermissions) {
  return async (req, res, next) => {
    if (!req.user || req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    try {
      // Get admin permissions
      const admins = await executeQuery(`
        SELECT * FROM admins WHERE user_id = ?
      `, [req.user.id]);
      
      if (admins.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Admin record not found'
        });
      }
      
      const admin = admins[0];
      
      // Super admin has all permissions
      if (admin.role === 'super_admin') {
        req.admin = admin;
        return next();
      }
      
      // Check specific permissions
      const hasPermissions = requiredPermissions.every(permission => {
        const permissionColumn = `can_${permission}`;
        return admin[permissionColumn] === true;
      });
      
      if (!hasPermissions) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient admin permissions'
        });
      }
      
      req.admin = admin;
      next();
    } catch (error) {
      console.error('Permission check error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
}

/**
 * Rate limiting middleware for authentication endpoints
 * @param {Object} options - Rate limit options
 * @returns {Function} - Middleware function
 */
function authRateLimit(options = {}) {
  const {
    windowMs = authConfig.rateLimiting.authEndpoints.windowMs,
    maxRequests = authConfig.rateLimiting.authEndpoints.maxRequests,
    skipSuccessfulRequests = authConfig.rateLimiting.authEndpoints.skipSuccessfulRequests
  } = options;
  
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean expired entries
    for (const [ip, data] of attempts.entries()) {
      if (now - data.resetTime > windowMs) {
        attempts.delete(ip);
      }
    }
    
    // Get or create attempt record
    let attemptData = attempts.get(key);
    if (!attemptData || now - attemptData.resetTime > windowMs) {
      attemptData = { count: 0, resetTime: now };
      attempts.set(key, attemptData);
    }
    
    // Check if limit exceeded
    if (attemptData.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: Math.ceil((windowMs - (now - attemptData.resetTime)) / 1000)
      });
    }
    
    // Increment attempt count (will be decremented if request succeeds and skipSuccessfulRequests is true)
    attemptData.count++;
    
    // Add function to decrement count on success
    if (skipSuccessfulRequests) {
      req.decrementRateLimit = () => {
        if (attemptData.count > 0) {
          attemptData.count--;
        }
      };
    }
    
    next();
  };
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return next(); // Continue without authentication
    }
    
    // Verify JWT token
    const decoded = verifyToken(token);
    
    if (decoded.tokenType !== 'access') {
      return next(); // Continue without authentication
    }
    
    // Check if session exists and is active
    const sessions = await executeQuery(`
      SELECT s.*, u.id, u.email, u.user_type, u.is_active, u.is_verified
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ? AND s.is_active = true AND s.expires_at > NOW()
    `, [token]);
    
    if (sessions.length > 0) {
      const session = sessions[0];
      
      if (session.is_active) {
        // Update last activity
        await executeQuery(`
          UPDATE user_sessions 
          SET last_activity = NOW()
          WHERE id = ?
        `, [session.id]);
        
        // Add user info to request
        req.user = {
          id: session.user_id,
          email: session.email,
          userType: session.user_type,
          isVerified: session.is_verified,
          sessionId: session.id
        };
      }
    }
    
    next();
  } catch (error) {
    // Log error but continue without authentication
    console.error('Optional authentication error:', error.message);
    next();
  }
}

/**
 * Check if user owns resource middleware
 * @param {string} paramName - Parameter name containing resource ID
 * @param {string} tableName - Table name to check ownership
 * @param {string} userIdColumn - Column name for user ID (default: 'user_id')
 * @returns {Function} - Middleware function
 */
function requireOwnership(paramName, tableName, userIdColumn = 'user_id') {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const resourceId = req.params[paramName];
    if (!resourceId) {
      return res.status(400).json({
        success: false,
        message: `${paramName} parameter is required`
      });
    }
    
    try {
      const resources = await executeQuery(`
        SELECT ${userIdColumn} FROM ${tableName} WHERE id = ?
      `, [resourceId]);
      
      if (resources.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }
      
      const resource = resources[0];
      
      // Check ownership (admins can access any resource)
      if (resource[userIdColumn] !== req.user.id && req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      next();
    } catch (error) {
      console.error('Ownership check error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Ownership check failed'
      });
    }
  };
}

module.exports = {
  authenticateToken,
  authorizeUserTypes,
  requireVerification,
  requireAdminPermissions,
  authRateLimit,
  optionalAuth,
  requireOwnership
};