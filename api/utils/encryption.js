const crypto = require('crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here';
const IV_LENGTH = parseInt(process.env.IV_LENGTH) || 16;
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  
  try {
    const saltRounds = BCRYPT_ROUNDS;
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
  } catch (error) {
    throw new Error('Password hashing failed: ' + error.message);
  }
}

/**
 * Verify password against hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if password matches
 */
async function verifyPassword(password, hash) {
  if (!password || !hash) {
    return false;
  }
  
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error.message);
    return false;
  }
}

/**
 * Encrypt sensitive data using AES-256-CBC
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted text (iv:encryptedData)
 */
function encrypt(text) {
  if (!text) {
    throw new Error('Text to encrypt cannot be empty');
  }
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    cipher.setAutoPadding(true);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    throw new Error('Encryption failed: ' + error.message);
  }
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedText - Encrypted text (iv:encryptedData)
 * @returns {string} - Decrypted text
 */
function decrypt(encryptedText) {
  if (!encryptedText || !encryptedText.includes(':')) {
    throw new Error('Invalid encrypted text format');
  }
  
  try {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    decipher.setAutoPadding(true);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed: ' + error.message);
  }
}

/**
 * Generate secure random token
 * @param {number} length - Token length (default: 32)
 * @returns {string} - Random token
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate hash of a token for database storage
 * @param {string} token - Token to hash
 * @returns {string} - SHA-256 hash of token
 */
function hashToken(token) {
  if (!token) {
    throw new Error('Token cannot be empty');
  }
  
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate verification code (6 digits)
 * @returns {string} - 6-digit verification code
 */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate UUID v4
 * @returns {string} - UUID string
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Create HMAC signature
 * @param {string} data - Data to sign
 * @param {string} secret - Secret key
 * @returns {string} - HMAC signature
 */
function createHMAC(data, secret = ENCRYPTION_KEY) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verify HMAC signature
 * @param {string} data - Original data
 * @param {string} signature - HMAC signature to verify
 * @param {string} secret - Secret key
 * @returns {boolean} - True if signature is valid
 */
function verifyHMAC(data, signature, secret = ENCRYPTION_KEY) {
  const expectedSignature = createHMAC(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Mask sensitive data for logging
 * @param {string} data - Data to mask
 * @param {number} visibleChars - Number of characters to show (default: 4)
 * @returns {string} - Masked data
 */
function maskSensitiveData(data, visibleChars = 4) {
  if (!data || data.length <= visibleChars) {
    return '*'.repeat(data ? data.length : 0);
  }
  
  const visible = data.substring(0, visibleChars);
  const masked = '*'.repeat(data.length - visibleChars);
  return visible + masked;
}

module.exports = {
  hashPassword,
  verifyPassword,
  encrypt,
  decrypt,
  generateSecureToken,
  hashToken,
  generateVerificationCode,
  generateUUID,
  createHMAC,
  verifyHMAC,
  maskSensitiveData
};