const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { executeQuery } = require('../../database/config/database');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload
 * @returns {string} - JWT token
 */
function generateAccessToken(payload) {
  if (!payload.userId) {
    throw new Error('User ID is required for token generation');
  }
  
  const tokenPayload = {
    userId: payload.userId,
    userType: payload.userType,
    email: payload.email,
    isVerified: payload.isVerified,
    tokenType: 'access'
  };
  
  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
    issuer: 'elyte-platform',
    audience: 'elyte-platform-users'
  });
}

/**
 * Generate JWT refresh token
 * @param {Object} payload - Token payload
 * @returns {string} - JWT refresh token
 */
function generateRefreshToken(payload) {
  if (!payload.userId) {
    throw new Error('User ID is required for refresh token generation');
  }
  
  const tokenPayload = {
    userId: payload.userId,
    tokenType: 'refresh',
    sessionId: crypto.randomUUID()
  };
  
  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRE,
    issuer: 'elyte-platform',
    audience: 'elyte-platform-users'
  });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 */
function verifyToken(token) {
  if (!token) {
    throw new Error('Token is required');
  }
  
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'elyte-platform',
      audience: 'elyte-platform-users'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed: ' + error.message);
    }
  }
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} - Extracted token or null
 */
function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Create user session and store in database
 * @param {Object} sessionData - Session data
 * @returns {Object} - Session tokens
 */
async function createUserSession(sessionData) {
  const {
    userId,
    userType,
    email,
    isVerified,
    deviceType,
    deviceId,
    ipAddress,
    userAgent,
    locationInfo
  } = sessionData;
  
  try {
    // Generate tokens
    const accessToken = generateAccessToken({ userId, userType, email, isVerified });
    const refreshToken = generateRefreshToken({ userId });
    
    // Calculate expiration times
    const accessTokenExpiry = new Date(Date.now() + parseTimeToMs(JWT_EXPIRE));
    const refreshTokenExpiry = new Date(Date.now() + parseTimeToMs(JWT_REFRESH_EXPIRE));
    
    // Store session in database
    await executeQuery(`
      INSERT INTO user_sessions 
      (user_id, session_token, refresh_token, device_type, device_id, 
       ip_address, user_agent, location_info, expires_at, refresh_expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      accessToken,
      refreshToken,
      deviceType,
      deviceId,
      ipAddress,
      userAgent,
      JSON.stringify(locationInfo),
      accessTokenExpiry,
      refreshTokenExpiry
    ]);
    
    return {
      accessToken,
      refreshToken,
      expiresIn: parseTimeToMs(JWT_EXPIRE) / 1000, // Return in seconds
      refreshExpiresIn: parseTimeToMs(JWT_REFRESH_EXPIRE) / 1000
    };
  } catch (error) {
    throw new Error('Session creation failed: ' + error.message);
  }
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Object} - New access token
 */
async function refreshAccessToken(refreshToken) {
  try {
    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    
    if (decoded.tokenType !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    // Check if session exists and is active
    const sessions = await executeQuery(`
      SELECT s.*, u.user_type, u.email, u.is_verified
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.refresh_token = ? AND s.is_active = true AND s.refresh_expires_at > NOW()
    `, [refreshToken]);
    
    if (sessions.length === 0) {
      throw new Error('Invalid or expired refresh token');
    }
    
    const session = sessions[0];
    
    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: session.user_id,
      userType: session.user_type,
      email: session.email,
      isVerified: session.is_verified
    });
    
    const newExpiry = new Date(Date.now() + parseTimeToMs(JWT_EXPIRE));
    
    // Update session with new access token
    await executeQuery(`
      UPDATE user_sessions 
      SET session_token = ?, expires_at = ?, last_activity = NOW()
      WHERE id = ?
    `, [newAccessToken, newExpiry, session.id]);
    
    return {
      accessToken: newAccessToken,
      expiresIn: parseTimeToMs(JWT_EXPIRE) / 1000
    };
  } catch (error) {
    throw new Error('Token refresh failed: ' + error.message);
  }
}

/**
 * Invalidate user session
 * @param {string} token - Access or refresh token
 * @returns {boolean} - Success status
 */
async function invalidateSession(token) {
  try {
    await executeQuery(`
      UPDATE user_sessions 
      SET is_active = false, ended_at = NOW()
      WHERE session_token = ? OR refresh_token = ?
    `, [token, token]);
    
    return true;
  } catch (error) {
    console.error('Session invalidation error:', error.message);
    return false;
  }
}

/**
 * Invalidate all user sessions
 * @param {number} userId - User ID
 * @returns {boolean} - Success status
 */
async function invalidateAllUserSessions(userId) {
  try {
    await executeQuery(`
      UPDATE user_sessions 
      SET is_active = false, ended_at = NOW()
      WHERE user_id = ? AND is_active = true
    `, [userId]);
    
    return true;
  } catch (error) {
    console.error('All sessions invalidation error:', error.message);
    return false;
  }
}

/**
 * Clean up expired sessions
 * @returns {number} - Number of cleaned sessions
 */
async function cleanupExpiredSessions() {
  try {
    const result = await executeQuery(`
      UPDATE user_sessions 
      SET is_active = false, ended_at = NOW()
      WHERE is_active = true AND (expires_at < NOW() OR refresh_expires_at < NOW())
    `);
    
    return result.affectedRows || 0;
  } catch (error) {
    console.error('Session cleanup error:', error.message);
    return 0;
  }
}

/**
 * Get active sessions for user
 * @param {number} userId - User ID
 * @returns {Array} - Active sessions
 */
async function getUserActiveSessions(userId) {
  try {
    return await executeQuery(`
      SELECT id, device_type, device_id, ip_address, last_activity, created_at
      FROM user_sessions
      WHERE user_id = ? AND is_active = true AND expires_at > NOW()
      ORDER BY last_activity DESC
    `, [userId]);
  } catch (error) {
    console.error('Get user sessions error:', error.message);
    return [];
  }
}

/**
 * Parse time string to milliseconds
 * @param {string} timeStr - Time string (e.g., '24h', '7d')
 * @returns {number} - Milliseconds
 */
function parseTimeToMs(timeStr) {
  const units = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };
  
  const match = timeStr.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error('Invalid time format');
  }
  
  const [, value, unit] = match;
  return parseInt(value) * units[unit];
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  extractTokenFromHeader,
  createUserSession,
  refreshAccessToken,
  invalidateSession,
  invalidateAllUserSessions,
  cleanupExpiredSessions,
  getUserActiveSessions,
  parseTimeToMs
};