const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { executeQuery } = require('../../database/config/database');
const { generateVerificationCode, hashToken, generateSecureToken } = require('./encryption');
require('dotenv').config();

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
};

// SMS configuration (Twilio)
let twilioClient = null;
let twilioPhoneNumber = null;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  } catch (error) {
    console.warn('Twilio configuration error:', error.message);
    twilioClient = null;
  }
}

/**
 * Send verification email
 * @param {Object} options - Email options
 * @returns {boolean} - Success status
 */
async function sendVerificationEmail(options) {
  const { email, firstName, verificationCode, type = 'email_verification' } = options;
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('Email credentials not configured. Verification email not sent.');
    return false;
  }
  
  try {
    const transporter = nodemailer.createTransporter(emailConfig);
    
    const emailTemplates = {
      email_verification: {
        subject: 'Verify Your Elyte Platform Account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Welcome to Elyte Platform!</h2>
            <p>Hi ${firstName},</p>
            <p>Thank you for joining Elyte Platform, Ghana's premier ride-sharing service.</p>
            <p>To complete your account verification, please use the following code:</p>
            <div style="background: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #e74c3c; margin: 0; font-size: 32px; letter-spacing: 2px;">${verificationCode}</h1>
            </div>
            <p>This code will expire in 15 minutes for security reasons.</p>
            <p>If you didn't create an account with us, please ignore this email.</p>
            <p>Best regards,<br>The Elyte Platform Team</p>
            <hr>
            <p style="font-size: 12px; color: #7f8c8d;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        `
      },
      password_reset: {
        subject: 'Reset Your Elyte Platform Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Password Reset Request</h2>
            <p>Hi ${firstName},</p>
            <p>We received a request to reset your Elyte Platform password.</p>
            <p>Use the following code to reset your password:</p>
            <div style="background: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #e74c3c; margin: 0; font-size: 32px; letter-spacing: 2px;">${verificationCode}</h1>
            </div>
            <p>This code will expire in 15 minutes for security reasons.</p>
            <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
            <p>Best regards,<br>The Elyte Platform Team</p>
          </div>
        `
      },
      two_factor: {
        subject: 'Your Elyte Platform Two-Factor Authentication Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Two-Factor Authentication</h2>
            <p>Hi ${firstName},</p>
            <p>Your two-factor authentication code for Elyte Platform is:</p>
            <div style="background: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #e74c3c; margin: 0; font-size: 32px; letter-spacing: 2px;">${verificationCode}</h1>
            </div>
            <p>This code will expire in 5 minutes for security reasons.</p>
            <p>Best regards,<br>The Elyte Platform Team</p>
          </div>
        `
      }
    };
    
    const template = emailTemplates[type] || emailTemplates.email_verification;
    
    const mailOptions = {
      from: `"Elyte Platform" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: template.subject,
      html: template.html
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error.message);
    return false;
  }
}

/**
 * Send verification SMS
 * @param {Object} options - SMS options
 * @returns {boolean} - Success status
 */
async function sendVerificationSMS(options) {
  const { phoneNumber, firstName, verificationCode, type = 'sms_verification' } = options;
  
  if (!twilioClient || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn('Twilio credentials not configured. SMS not sent.');
    return false;
  }
  
  try {
    const smsTemplates = {
      sms_verification: `Hi ${firstName}, your Elyte Platform verification code is: ${verificationCode}. This code expires in 15 minutes. Do not share this code with anyone.`,
      password_reset: `Your Elyte Platform password reset code is: ${verificationCode}. This code expires in 15 minutes. If you didn't request this, ignore this message.`,
      two_factor: `Your Elyte Platform 2FA code is: ${verificationCode}. This code expires in 5 minutes.`,
      mobile_money_verification: `Your mobile money account verification code for Elyte Platform is: ${verificationCode}. Code expires in 10 minutes.`
    };
    
    const message = smsTemplates[type] || smsTemplates.sms_verification;
    
    await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber
    });
    
    console.log(`Verification SMS sent to ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error('SMS sending error:', error.message);
    return false;
  }
}

/**
 * Create verification record in database
 * @param {Object} verificationData - Verification data
 * @returns {Object} - Verification details
 */
async function createVerificationRecord(verificationData) {
  const {
    userId,
    type,
    ipAddress,
    userAgent,
    expiryMinutes = 15
  } = verificationData;
  
  try {
    // Generate verification code and token
    const verificationCode = generateVerificationCode();
    const token = generateSecureToken(32);
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + (expiryMinutes * 60 * 1000));
    
    // Store in database
    await executeQuery(`
      INSERT INTO user_verification 
      (user_id, verification_type, token, token_hash, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, type, verificationCode, tokenHash, expiresAt, ipAddress, userAgent]);
    
    return {
      verificationCode,
      token,
      expiresAt
    };
  } catch (error) {
    throw new Error('Verification record creation failed: ' + error.message);
  }
}

/**
 * Verify verification code
 * @param {Object} verificationData - Verification data
 * @returns {boolean} - Verification success
 */
async function verifyCode(verificationData) {
  const { userId, type, code } = verificationData;
  
  try {
    // Get verification record
    const verifications = await executeQuery(`
      SELECT * FROM user_verification
      WHERE user_id = ? AND verification_type = ? AND token = ? 
      AND expires_at > NOW() AND is_used = false
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId, type, code]);
    
    if (verifications.length === 0) {
      // Check if verification exists but is expired or used
      const expiredVerifications = await executeQuery(`
        SELECT * FROM user_verification
        WHERE user_id = ? AND verification_type = ? AND token = ?
        ORDER BY created_at DESC
        LIMIT 1
      `, [userId, type, code]);
      
      if (expiredVerifications.length > 0) {
        const verification = expiredVerifications[0];
        if (verification.is_used) {
          throw new Error('Verification code has already been used');
        } else if (new Date() > new Date(verification.expires_at)) {
          throw new Error('Verification code has expired');
        }
      }
      
      // Increment attempts
      await executeQuery(`
        UPDATE user_verification 
        SET attempts = attempts + 1
        WHERE user_id = ? AND verification_type = ? AND token = ?
      `, [userId, type, code]);
      
      throw new Error('Invalid verification code');
    }
    
    const verification = verifications[0];
    
    // Check attempts limit
    if (verification.attempts >= verification.max_attempts) {
      throw new Error('Too many verification attempts. Please request a new code.');
    }
    
    // Mark as used
    await executeQuery(`
      UPDATE user_verification 
      SET is_used = true, used_at = NOW()
      WHERE id = ?
    `, [verification.id]);
    
    // Update user verification status based on type
    if (type === 'email') {
      await executeQuery('UPDATE users SET email_verified = true WHERE id = ?', [userId]);
    } else if (type === 'sms') {
      await executeQuery('UPDATE users SET phone_verified = true WHERE id = ?', [userId]);
    }
    
    return true;
  } catch (error) {
    throw new Error('Verification failed: ' + error.message);
  }
}

/**
 * Send complete verification (email + SMS)
 * @param {Object} userData - User data
 * @param {string} type - Verification type
 * @returns {Object} - Verification details
 */
async function sendVerification(userData, type = 'email_verification') {
  const { userId, email, phoneNumber, firstName, ipAddress, userAgent } = userData;
  
  try {
    // Create verification record
    const verification = await createVerificationRecord({
      userId,
      type,
      ipAddress,
      userAgent,
      expiryMinutes: type === 'two_factor' ? 5 : 15
    });
    
    // Send email verification
    const emailSent = await sendVerificationEmail({
      email,
      firstName,
      verificationCode: verification.verificationCode,
      type
    });
    
    // Send SMS verification for phone verification or two-factor
    let smsSent = false;
    if (type === 'sms' || type === 'two_factor') {
      smsSent = await sendVerificationSMS({
        phoneNumber,
        firstName,
        verificationCode: verification.verificationCode,
        type
      });
    }
    
    return {
      success: emailSent || smsSent,
      emailSent,
      smsSent,
      expiresAt: verification.expiresAt
    };
  } catch (error) {
    throw new Error('Verification sending failed: ' + error.message);
  }
}

/**
 * Resend verification code
 * @param {Object} userData - User data
 * @param {string} type - Verification type
 * @returns {Object} - Verification details
 */
async function resendVerification(userData, type) {
  // Invalidate previous unused verifications
  await executeQuery(`
    UPDATE user_verification 
    SET is_used = true
    WHERE user_id = ? AND verification_type = ? AND is_used = false
  `, [userData.userId, type]);
  
  // Send new verification
  return await sendVerification(userData, type);
}

/**
 * Clean up expired verification codes
 * @returns {number} - Number of cleaned records
 */
async function cleanupExpiredVerifications() {
  try {
    const result = await executeQuery(`
      DELETE FROM user_verification
      WHERE expires_at < NOW() AND is_used = false
    `);
    
    return result.affectedRows || 0;
  } catch (error) {
    console.error('Verification cleanup error:', error.message);
    return 0;
  }
}

module.exports = {
  sendVerificationEmail,
  sendVerificationSMS,
  createVerificationRecord,
  verifyCode,
  sendVerification,
  resendVerification,
  cleanupExpiredVerifications
};