const { executeQuery } = require('../../database/config/database');
const User = require('./User');
const { validateGhanaPhoneNumber } = require('../utils/ghanaValidation');

class Passenger {
  constructor(data = {}) {
    this.id = data.id;
    this.userId = data.user_id;
    this.preferredPaymentMethod = data.preferred_payment_method;
    this.emergencyContactName = data.emergency_contact_name;
    this.emergencyContactPhone = data.emergency_contact_phone;
    this.homeAddress = data.home_address;
    this.workAddress = data.work_address;
    this.homeLatitude = parseFloat(data.home_latitude) || null;
    this.homeLongitude = parseFloat(data.home_longitude) || null;
    this.workLatitude = parseFloat(data.work_latitude) || null;
    this.workLongitude = parseFloat(data.work_longitude) || null;
    this.passengerRating = parseFloat(data.passenger_rating) || 0.00;
    this.totalTrips = parseInt(data.total_trips) || 0;
    this.preferredVehicleType = data.preferred_vehicle_type;
    this.accessibilityNeeds = data.accessibility_needs;
    this.languagePreference = data.language_preference || 'en';
    this.notificationPreferences = data.notification_preferences ? JSON.parse(data.notification_preferences) : {};
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    
    // User data if joined
    if (data.email) {
      this.user = new User(data);
    }
  }

  /**
   * Create a new passenger
   * @param {Object} passengerData - Passenger data
   * @returns {Passenger} - Created passenger instance
   */
  static async create(passengerData) {
    const {
      userId,
      preferredPaymentMethod = 'cash',
      emergencyContactName,
      emergencyContactPhone,
      homeAddress,
      workAddress,
      homeLatitude,
      homeLongitude,
      workLatitude,
      workLongitude,
      preferredVehicleType,
      accessibilityNeeds,
      languagePreference = 'en',
      notificationPreferences = {}
    } = passengerData;

    // Validate required fields
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Validate emergency contact phone if provided
    if (emergencyContactPhone) {
      const phoneValidation = validateGhanaPhoneNumber(emergencyContactPhone);
      if (!phoneValidation.isValid) {
        throw new Error('Invalid emergency contact phone number: ' + phoneValidation.error);
      }
    }

    try {
      // Check if user exists and is a passenger
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.userType !== 'passenger') {
        throw new Error('User is not registered as a passenger');
      }

      // Check if passenger record already exists
      const existingPassenger = await Passenger.findByUserId(userId);
      if (existingPassenger) {
        throw new Error('Passenger record already exists for this user');
      }

      // Set default notification preferences
      const defaultNotificationPreferences = {
        email: {
          booking_confirmations: true,
          driver_updates: true,
          promotions: false,
          weekly_summary: true
        },
        sms: {
          ride_status: true,
          driver_arrival: true,
          emergency_alerts: true,
          payment_confirmations: true
        },
        push: {
          ride_requests: true,
          driver_messages: true,
          promotions: false,
          location_updates: true
        }
      };

      const finalNotificationPreferences = { ...defaultNotificationPreferences, ...notificationPreferences };

      // Insert passenger record
      const result = await executeQuery(`
        INSERT INTO passengers (
          user_id, preferred_payment_method, emergency_contact_name,
          emergency_contact_phone, home_address, work_address,
          home_latitude, home_longitude, work_latitude, work_longitude,
          preferred_vehicle_type, accessibility_needs, language_preference,
          notification_preferences
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        preferredPaymentMethod,
        emergencyContactName || null,
        emergencyContactPhone ? validateGhanaPhoneNumber(emergencyContactPhone).formattedNumber : null,
        homeAddress || null,
        workAddress || null,
        homeLatitude || null,
        homeLongitude || null,
        workLatitude || null,
        workLongitude || null,
        preferredVehicleType || null,
        accessibilityNeeds || null,
        languagePreference,
        JSON.stringify(finalNotificationPreferences)
      ]);

      // Fetch and return created passenger
      return await Passenger.findById(result.insertId);
    } catch (error) {
      throw new Error(`Passenger creation failed: ${error.message}`);
    }
  }

  /**
   * Find passenger by ID
   * @param {number} id - Passenger ID
   * @returns {Passenger|null} - Passenger instance or null
   */
  static async findById(id) {
    try {
      const passengers = await executeQuery(`
        SELECT p.*, u.email, u.first_name, u.last_name, u.phone, u.is_verified
        FROM passengers p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
      `, [id]);
      
      return passengers.length > 0 ? new Passenger(passengers[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find passenger by ID: ${error.message}`);
    }
  }

  /**
   * Find passenger by user ID
   * @param {number} userId - User ID
   * @returns {Passenger|null} - Passenger instance or null
   */
  static async findByUserId(userId) {
    try {
      const passengers = await executeQuery(`
        SELECT p.*, u.email, u.first_name, u.last_name, u.phone, u.is_verified
        FROM passengers p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ?
      `, [userId]);
      
      return passengers.length > 0 ? new Passenger(passengers[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find passenger by user ID: ${error.message}`);
    }
  }

  /**
   * Update passenger profile
   * @param {Object} updateData - Data to update
   * @returns {boolean} - Update success
   */
  async updateProfile(updateData) {
    try {
      const allowedFields = [
        'preferred_payment_method', 'emergency_contact_name', 'emergency_contact_phone',
        'home_address', 'work_address', 'home_latitude', 'home_longitude',
        'work_latitude', 'work_longitude', 'preferred_vehicle_type',
        'accessibility_needs', 'language_preference', 'notification_preferences'
      ];

      const updates = [];
      const values = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          // Validate specific fields
          if (key === 'emergency_contact_phone' && value) {
            const phoneValidation = validateGhanaPhoneNumber(value);
            if (!phoneValidation.isValid) {
              throw new Error('Invalid emergency contact phone number');
            }
            updates.push(`${key} = ?`);
            values.push(phoneValidation.formattedNumber);
          } else if (key === 'notification_preferences') {
            updates.push(`${key} = ?`);
            values.push(JSON.stringify(value));
          } else {
            updates.push(`${key} = ?`);
            values.push(value);
          }
        }
      }

      if (updates.length === 0) {
        return false;
      }

      values.push(this.id);

      await executeQuery(`
        UPDATE passengers 
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = ?
      `, values);

      // Update instance properties
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          if (key === 'emergency_contact_phone' && value) {
            this.emergencyContactPhone = validateGhanaPhoneNumber(value).formattedNumber;
          } else if (key === 'notification_preferences') {
            this.notificationPreferences = value;
          } else {
            const camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            this[camelCaseKey] = value;
          }
        }
      }

      return true;
    } catch (error) {
      throw new Error(`Passenger profile update failed: ${error.message}`);
    }
  }

  /**
   * Update home address and location
   * @param {string} address - Home address
   * @param {number} latitude - Home latitude
   * @param {number} longitude - Home longitude
   * @returns {boolean} - Update success
   */
  async updateHomeLocation(address, latitude = null, longitude = null) {
    try {
      await executeQuery(`
        UPDATE passengers 
        SET home_address = ?, home_latitude = ?, home_longitude = ?, updated_at = NOW()
        WHERE id = ?
      `, [address, latitude, longitude, this.id]);

      this.homeAddress = address;
      this.homeLatitude = latitude;
      this.homeLongitude = longitude;

      return true;
    } catch (error) {
      throw new Error(`Home location update failed: ${error.message}`);
    }
  }

  /**
   * Update work address and location
   * @param {string} address - Work address
   * @param {number} latitude - Work latitude
   * @param {number} longitude - Work longitude
   * @returns {boolean} - Update success
   */
  async updateWorkLocation(address, latitude = null, longitude = null) {
    try {
      await executeQuery(`
        UPDATE passengers 
        SET work_address = ?, work_latitude = ?, work_longitude = ?, updated_at = NOW()
        WHERE id = ?
      `, [address, latitude, longitude, this.id]);

      this.workAddress = address;
      this.workLatitude = latitude;
      this.workLongitude = longitude;

      return true;
    } catch (error) {
      throw new Error(`Work location update failed: ${error.message}`);
    }
  }

  /**
   * Update notification preferences
   * @param {Object} preferences - New notification preferences
   * @returns {boolean} - Update success
   */
  async updateNotificationPreferences(preferences) {
    try {
      // Merge with existing preferences
      const mergedPreferences = { ...this.notificationPreferences, ...preferences };

      await executeQuery(`
        UPDATE passengers 
        SET notification_preferences = ?, updated_at = NOW()
        WHERE id = ?
      `, [JSON.stringify(mergedPreferences), this.id]);

      this.notificationPreferences = mergedPreferences;
      return true;
    } catch (error) {
      throw new Error(`Notification preferences update failed: ${error.message}`);
    }
  }

  /**
   * Update passenger rating
   * @param {number} newRating - New rating to add
   * @returns {boolean} - Update success
   */
  async updateRating(newRating) {
    try {
      // Calculate new average rating
      const totalRatings = this.totalTrips;
      const currentTotal = this.passengerRating * totalRatings;
      const newTotal = currentTotal + newRating;
      const newAverage = newTotal / (totalRatings + 1);

      await executeQuery(`
        UPDATE passengers 
        SET passenger_rating = ?, updated_at = NOW()
        WHERE id = ?
      `, [newAverage, this.id]);

      this.passengerRating = newAverage;
      return true;
    } catch (error) {
      throw new Error(`Rating update failed: ${error.message}`);
    }
  }

  /**
   * Increment trip count
   * @returns {boolean} - Update success
   */
  async incrementTripCount() {
    try {
      await executeQuery(`
        UPDATE passengers 
        SET total_trips = total_trips + 1, updated_at = NOW()
        WHERE id = ?
      `, [this.id]);

      this.totalTrips += 1;
      return true;
    } catch (error) {
      throw new Error(`Trip count update failed: ${error.message}`);
    }
  }

  /**
   * Get passenger travel patterns
   * @param {number} days - Number of days to analyze
   * @returns {Object} - Travel patterns
   */
  async getTravelPatterns(days = 30) {
    try {
      // This would typically involve analyzing ride history
      // For now, return basic info from passenger profile
      const patterns = {
        preferredVehicleType: this.preferredVehicleType,
        preferredPaymentMethod: this.preferredPaymentMethod,
        homeLocation: {
          address: this.homeAddress,
          coordinates: this.homeLatitude && this.homeLongitude ? {
            latitude: this.homeLatitude,
            longitude: this.homeLongitude
          } : null
        },
        workLocation: {
          address: this.workAddress,
          coordinates: this.workLatitude && this.workLongitude ? {
            latitude: this.workLatitude,
            longitude: this.workLongitude
          } : null
        },
        totalTrips: this.totalTrips,
        rating: this.passengerRating,
        accessibilityNeeds: this.accessibilityNeeds
      };

      return patterns;
    } catch (error) {
      throw new Error(`Failed to get travel patterns: ${error.message}`);
    }
  }

  /**
   * Check notification preference for specific type
   * @param {string} channel - Notification channel (email, sms, push)
   * @param {string} type - Notification type
   * @returns {boolean} - Preference status
   */
  shouldReceiveNotification(channel, type) {
    try {
      return this.notificationPreferences[channel] && 
             this.notificationPreferences[channel][type] === true;
    } catch (error) {
      // Default to true for important notifications
      if (type === 'emergency_alerts' || type === 'ride_status') {
        return true;
      }
      return false;
    }
  }

  /**
   * Get passengers with pagination and filters
   * @param {Object} options - Query options
   * @returns {Object} - Paginated passengers
   */
  static async getPassengers(options = {}) {
    const {
      page = 1,
      limit = 20,
      preferredPaymentMethod,
      preferredVehicleType,
      minRating,
      minTrips,
      languagePreference,
      search
    } = options;

    try {
      const offset = (page - 1) * limit;
      let whereConditions = [];
      let queryParams = [];

      // Build where conditions
      if (preferredPaymentMethod) {
        whereConditions.push('p.preferred_payment_method = ?');
        queryParams.push(preferredPaymentMethod);
      }

      if (preferredVehicleType) {
        whereConditions.push('p.preferred_vehicle_type = ?');
        queryParams.push(preferredVehicleType);
      }

      if (minRating) {
        whereConditions.push('p.passenger_rating >= ?');
        queryParams.push(minRating);
      }

      if (minTrips) {
        whereConditions.push('p.total_trips >= ?');
        queryParams.push(minTrips);
      }

      if (languagePreference) {
        whereConditions.push('p.language_preference = ?');
        queryParams.push(languagePreference);
      }

      if (search) {
        whereConditions.push(`(
          u.first_name LIKE ? OR u.last_name LIKE ? OR 
          u.email LIKE ? OR p.home_address LIKE ?
        )`);
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM passengers p
        JOIN users u ON p.user_id = u.id
        ${whereClause}
      `;
      const countResult = await executeQuery(countQuery, queryParams);
      const total = countResult[0].total;

      // Get passengers
      const passengersQuery = `
        SELECT p.*, u.email, u.first_name, u.last_name, u.phone, u.is_verified
        FROM passengers p
        JOIN users u ON p.user_id = u.id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;
      const passengers = await executeQuery(passengersQuery, [...queryParams, limit, offset]);

      return {
        passengers: passengers.map(passenger => new Passenger(passenger)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get passengers: ${error.message}`);
    }
  }

  /**
   * Get passenger statistics
   * @returns {Object} - Passenger statistics
   */
  static async getPassengerStats() {
    try {
      const stats = await executeQuery(`
        SELECT 
          COUNT(*) as total_passengers,
          AVG(passenger_rating) as average_rating,
          SUM(total_trips) as total_trips,
          COUNT(CASE WHEN preferred_payment_method = 'mobile_money' THEN 1 END) as mobile_money_users,
          COUNT(CASE WHEN preferred_payment_method = 'cash' THEN 1 END) as cash_users,
          COUNT(CASE WHEN preferred_payment_method = 'card' THEN 1 END) as card_users
        FROM passengers
      `);

      const vehicleTypeStats = await executeQuery(`
        SELECT 
          preferred_vehicle_type,
          COUNT(*) as count
        FROM passengers
        WHERE preferred_vehicle_type IS NOT NULL
        GROUP BY preferred_vehicle_type
      `);

      const languageStats = await executeQuery(`
        SELECT 
          language_preference,
          COUNT(*) as count
        FROM passengers
        GROUP BY language_preference
      `);

      return {
        overview: stats[0],
        vehicleTypePreferences: vehicleTypeStats,
        languagePreferences: languageStats
      };
    } catch (error) {
      throw new Error(`Failed to get passenger statistics: ${error.message}`);
    }
  }

  /**
   * Get passenger's public data
   * @returns {Object} - Public passenger data
   */
  getPublicData() {
    return {
      id: this.id,
      userId: this.userId,
      passengerRating: this.passengerRating,
      totalTrips: this.totalTrips,
      preferredVehicleType: this.preferredVehicleType,
      languagePreference: this.languagePreference,
      user: this.user ? this.user.getPublicData() : null
    };
  }

  /**
   * Get passenger's full data (for passenger themselves or admin)
   * @returns {Object} - Full passenger data
   */
  getFullData() {
    return {
      id: this.id,
      userId: this.userId,
      preferredPaymentMethod: this.preferredPaymentMethod,
      emergencyContactName: this.emergencyContactName,
      emergencyContactPhone: this.emergencyContactPhone,
      homeAddress: this.homeAddress,
      workAddress: this.workAddress,
      homeLatitude: this.homeLatitude,
      homeLongitude: this.homeLongitude,
      workLatitude: this.workLatitude,
      workLongitude: this.workLongitude,
      passengerRating: this.passengerRating,
      totalTrips: this.totalTrips,
      preferredVehicleType: this.preferredVehicleType,
      accessibilityNeeds: this.accessibilityNeeds,
      languagePreference: this.languagePreference,
      notificationPreferences: this.notificationPreferences,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      user: this.user ? this.user.getPublicData() : null
    };
  }
}

module.exports = Passenger;