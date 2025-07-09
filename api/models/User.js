const { executeQuery, executeTransaction } = require('../../database/config/database');
const { hashPassword, verifyPassword, generateUUID } = require('../utils/encryption');
const { validateGhanaPhoneNumber } = require('../utils/ghanaValidation');
const authConfig = require('../config/auth');

class User {
  constructor(data = {}) {
    this.id = data.id;
    this.uuid = data.uuid;
    this.email = data.email;
    this.phone = data.phone;
    this.passwordHash = data.password_hash;
    this.firstName = data.first_name;
    this.lastName = data.last_name;
    this.dateOfBirth = data.date_of_birth;
    this.gender = data.gender;
    this.userType = data.user_type;
    this.profileImage = data.profile_image;
    this.isVerified = data.is_verified;
    this.emailVerified = data.email_verified;
    this.phoneVerified = data.phone_verified;
    this.isActive = data.is_active;
    this.loginAttempts = data.login_attempts;
    this.lockedUntil = data.locked_until;
    this.lastLogin = data.last_login;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {User} - Created user instance
   */
  static async create(userData) {
    const {
      email,
      phone,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      userType
    } = userData;

    // Validate required fields
    if (!email || !phone || !password || !firstName || !lastName || !userType) {
      throw new Error('Missing required fields');
    }

    // Validate phone number
    const phoneValidation = validateGhanaPhoneNumber(phone);
    if (!phoneValidation.isValid) {
      throw new Error(phoneValidation.error);
    }

    try {
      // Check if user already exists
      const existingUsers = await executeQuery(
        'SELECT id FROM users WHERE email = ? OR phone = ?',
        [email, phoneValidation.formattedNumber]
      );

      if (existingUsers.length > 0) {
        throw new Error('User with this email or phone number already exists');
      }

      // Hash password
      const passwordHash = await hashPassword(password);
      const uuid = generateUUID();

      // Insert user
      const result = await executeQuery(`
        INSERT INTO users (
          uuid, email, phone, password_hash, first_name, last_name,
          date_of_birth, gender, user_type, is_verified, email_verified,
          phone_verified, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        uuid,
        email.toLowerCase(),
        phoneValidation.formattedNumber,
        passwordHash,
        firstName,
        lastName,
        dateOfBirth || null,
        gender || null,
        userType,
        false,
        false,
        false,
        true
      ]);

      // Fetch and return created user
      return await User.findById(result.insertId);
    } catch (error) {
      throw new Error(`User creation failed: ${error.message}`);
    }
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {User|null} - User instance or null
   */
  static async findById(id) {
    try {
      const users = await executeQuery('SELECT * FROM users WHERE id = ?', [id]);
      return users.length > 0 ? new User(users[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }
  }

  /**
   * Find user by UUID
   * @param {string} uuid - User UUID
   * @returns {User|null} - User instance or null
   */
  static async findByUUID(uuid) {
    try {
      const users = await executeQuery('SELECT * FROM users WHERE uuid = ?', [uuid]);
      return users.length > 0 ? new User(users[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find user by UUID: ${error.message}`);
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {User|null} - User instance or null
   */
  static async findByEmail(email) {
    try {
      const users = await executeQuery('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
      return users.length > 0 ? new User(users[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  /**
   * Find user by phone number
   * @param {string} phone - User phone number
   * @returns {User|null} - User instance or null
   */
  static async findByPhone(phone) {
    try {
      const phoneValidation = validateGhanaPhoneNumber(phone);
      if (!phoneValidation.isValid) {
        return null;
      }

      const users = await executeQuery('SELECT * FROM users WHERE phone = ?', [phoneValidation.formattedNumber]);
      return users.length > 0 ? new User(users[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find user by phone: ${error.message}`);
    }
  }

  /**
   * Authenticate user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {User|null} - User instance if authenticated
   */
  static async authenticate(email, password) {
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        return null;
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        throw new Error('Account is temporarily locked due to too many failed login attempts');
      }

      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        await user.incrementLoginAttempts();
        return null;
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();
      await user.updateLastLogin();

      return user;
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Update user profile
   * @param {Object} updateData - Data to update
   * @returns {boolean} - Update success
   */
  async updateProfile(updateData) {
    try {
      const allowedFields = [
        'first_name', 'last_name', 'date_of_birth', 'gender', 'profile_image'
      ];

      const updates = [];
      const values = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (updates.length === 0) {
        return false;
      }

      values.push(this.id);

      await executeQuery(`
        UPDATE users 
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = ?
      `, values);

      // Update instance properties
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          const camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
          this[camelCaseKey] = value;
        }
      }

      return true;
    } catch (error) {
      throw new Error(`Profile update failed: ${error.message}`);
    }
  }

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {boolean} - Change success
   */
  async changePassword(currentPassword, newPassword) {
    try {
      // Verify current password
      const isValid = await verifyPassword(currentPassword, this.passwordHash);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password
      await executeQuery(`
        UPDATE users 
        SET password_hash = ?, updated_at = NOW()
        WHERE id = ?
      `, [newPasswordHash, this.id]);

      this.passwordHash = newPasswordHash;
      return true;
    } catch (error) {
      throw new Error(`Password change failed: ${error.message}`);
    }
  }

  /**
   * Reset password (used during password reset flow)
   * @param {string} newPassword - New password
   * @returns {boolean} - Reset success
   */
  async resetPassword(newPassword) {
    try {
      const newPasswordHash = await hashPassword(newPassword);

      await executeQuery(`
        UPDATE users 
        SET password_hash = ?, updated_at = NOW()
        WHERE id = ?
      `, [newPasswordHash, this.id]);

      this.passwordHash = newPasswordHash;
      return true;
    } catch (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  /**
   * Mark email as verified
   * @returns {boolean} - Verification success
   */
  async verifyEmail() {
    try {
      await executeQuery(`
        UPDATE users 
        SET email_verified = true, updated_at = NOW()
        WHERE id = ?
      `, [this.id]);

      this.emailVerified = true;
      await this.updateVerificationStatus();
      return true;
    } catch (error) {
      throw new Error(`Email verification failed: ${error.message}`);
    }
  }

  /**
   * Mark phone as verified
   * @returns {boolean} - Verification success
   */
  async verifyPhone() {
    try {
      await executeQuery(`
        UPDATE users 
        SET phone_verified = true, updated_at = NOW()
        WHERE id = ?
      `, [this.id]);

      this.phoneVerified = true;
      await this.updateVerificationStatus();
      return true;
    } catch (error) {
      throw new Error(`Phone verification failed: ${error.message}`);
    }
  }

  /**
   * Update overall verification status
   * @returns {boolean} - Update success
   */
  async updateVerificationStatus() {
    try {
      const isVerified = this.emailVerified && this.phoneVerified;

      await executeQuery(`
        UPDATE users 
        SET is_verified = ?, updated_at = NOW()
        WHERE id = ?
      `, [isVerified, this.id]);

      this.isVerified = isVerified;
      return true;
    } catch (error) {
      throw new Error(`Verification status update failed: ${error.message}`);
    }
  }

  /**
   * Increment login attempts
   */
  async incrementLoginAttempts() {
    try {
      const newAttempts = (this.loginAttempts || 0) + 1;
      let lockedUntil = null;

      // Lock account if max attempts reached
      if (newAttempts >= authConfig.security.maxLoginAttempts) {
        lockedUntil = new Date(Date.now() + (authConfig.security.lockoutTime * 60 * 1000));
      }

      await executeQuery(`
        UPDATE users 
        SET login_attempts = ?, locked_until = ?, updated_at = NOW()
        WHERE id = ?
      `, [newAttempts, lockedUntil, this.id]);

      this.loginAttempts = newAttempts;
      this.lockedUntil = lockedUntil;
    } catch (error) {
      console.error('Failed to increment login attempts:', error.message);
    }
  }

  /**
   * Reset login attempts
   */
  async resetLoginAttempts() {
    try {
      await executeQuery(`
        UPDATE users 
        SET login_attempts = 0, locked_until = NULL, updated_at = NOW()
        WHERE id = ?
      `, [this.id]);

      this.loginAttempts = 0;
      this.lockedUntil = null;
    } catch (error) {
      console.error('Failed to reset login attempts:', error.message);
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin() {
    try {
      const now = new Date();
      await executeQuery(`
        UPDATE users 
        SET last_login = ?, updated_at = NOW()
        WHERE id = ?
      `, [now, this.id]);

      this.lastLogin = now;
    } catch (error) {
      console.error('Failed to update last login:', error.message);
    }
  }

  /**
   * Check if account is locked
   * @returns {boolean} - Lock status
   */
  isAccountLocked() {
    if (!this.lockedUntil) {
      return false;
    }

    return new Date() < new Date(this.lockedUntil);
  }

  /**
   * Deactivate user account
   */
  async deactivate() {
    try {
      await executeQuery(`
        UPDATE users 
        SET is_active = false, updated_at = NOW()
        WHERE id = ?
      `, [this.id]);

      this.isActive = false;
    } catch (error) {
      throw new Error(`Account deactivation failed: ${error.message}`);
    }
  }

  /**
   * Activate user account
   */
  async activate() {
    try {
      await executeQuery(`
        UPDATE users 
        SET is_active = true, updated_at = NOW()
        WHERE id = ?
      `, [this.id]);

      this.isActive = true;
    } catch (error) {
      throw new Error(`Account activation failed: ${error.message}`);
    }
  }

  /**
   * Get user's public data (safe for API responses)
   * @returns {Object} - Public user data
   */
  getPublicData() {
    return {
      id: this.id,
      uuid: this.uuid,
      email: this.email,
      phone: this.phone,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: `${this.firstName} ${this.lastName}`,
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,
      userType: this.userType,
      profileImage: this.profileImage,
      isVerified: this.isVerified,
      emailVerified: this.emailVerified,
      phoneVerified: this.phoneVerified,
      isActive: this.isActive,
      lastLogin: this.lastLogin,
      createdAt: this.createdAt
    };
  }

  /**
   * Get users with pagination
   * @param {Object} options - Query options
   * @returns {Object} - Paginated users
   */
  static async getUsers(options = {}) {
    const {
      page = 1,
      limit = 20,
      userType,
      isVerified,
      isActive,
      search
    } = options;

    try {
      const offset = (page - 1) * limit;
      let whereConditions = [];
      let queryParams = [];

      // Build where conditions
      if (userType) {
        whereConditions.push('user_type = ?');
        queryParams.push(userType);
      }

      if (isVerified !== undefined) {
        whereConditions.push('is_verified = ?');
        queryParams.push(isVerified);
      }

      if (isActive !== undefined) {
        whereConditions.push('is_active = ?');
        queryParams.push(isActive);
      }

      if (search) {
        whereConditions.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      const countResult = await executeQuery(countQuery, queryParams);
      const total = countResult[0].total;

      // Get users
      const usersQuery = `
        SELECT * FROM users 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      const users = await executeQuery(usersQuery, [...queryParams, limit, offset]);

      return {
        users: users.map(user => new User(user)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
  }
}

module.exports = User;