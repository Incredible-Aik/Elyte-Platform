const { executeQuery, executeTransaction } = require('../../database/config/database');
const User = require('./User');
const { validateGhanaPhoneNumber, validateGhanaLicenseNumber, validateGhanaPlateNumber, validateGhanaLocation } = require('../utils/ghanaValidation');

class Driver {
  constructor(data = {}) {
    this.id = data.id;
    this.userId = data.user_id;
    this.licenseNumber = data.license_number;
    this.licenseExpiry = data.license_expiry;
    this.vehicleType = data.vehicle_type;
    this.vehicleMake = data.vehicle_make;
    this.vehicleModel = data.vehicle_model;
    this.vehicleYear = data.vehicle_year;
    this.vehicleColor = data.vehicle_color;
    this.vehiclePlateNumber = data.vehicle_plate_number;
    this.insuranceNumber = data.insurance_number;
    this.insuranceExpiry = data.insurance_expiry;
    this.emergencyContactName = data.emergency_contact_name;
    this.emergencyContactPhone = data.emergency_contact_phone;
    this.address = data.address;
    this.city = data.city;
    this.region = data.region;
    this.verificationStatus = data.verification_status;
    this.backgroundCheckStatus = data.background_check_status;
    this.driverRating = parseFloat(data.driver_rating) || 0.00;
    this.totalTrips = parseInt(data.total_trips) || 0;
    this.isOnline = data.is_online;
    this.currentLatitude = parseFloat(data.current_latitude) || null;
    this.currentLongitude = parseFloat(data.current_longitude) || null;
    this.lastLocationUpdate = data.last_location_update;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    
    // User data if joined
    if (data.email) {
      this.user = new User(data);
    }
  }

  /**
   * Create a new driver
   * @param {Object} driverData - Driver data
   * @returns {Driver} - Created driver instance
   */
  static async create(driverData) {
    const {
      userId,
      licenseNumber,
      licenseExpiry,
      vehicleType,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehicleColor,
      vehiclePlateNumber,
      insuranceNumber,
      insuranceExpiry,
      emergencyContactName,
      emergencyContactPhone,
      address,
      city,
      region
    } = driverData;

    // Validate required fields
    if (!userId || !licenseNumber || !licenseExpiry || !vehicleType || 
        !vehicleMake || !vehicleModel || !vehicleYear || !vehicleColor ||
        !vehiclePlateNumber || !insuranceNumber || !insuranceExpiry ||
        !emergencyContactName || !emergencyContactPhone || !address ||
        !city || !region) {
      throw new Error('Missing required driver fields');
    }

    // Validate license number
    const licenseValidation = validateGhanaLicenseNumber(licenseNumber);
    if (!licenseValidation.isValid) {
      throw new Error(licenseValidation.error);
    }

    // Validate plate number
    const plateValidation = validateGhanaPlateNumber(vehiclePlateNumber);
    if (!plateValidation.isValid) {
      throw new Error(plateValidation.error);
    }

    // Validate emergency contact phone
    const phoneValidation = validateGhanaPhoneNumber(emergencyContactPhone);
    if (!phoneValidation.isValid) {
      throw new Error('Invalid emergency contact phone number: ' + phoneValidation.error);
    }

    try {
      // Check if user exists and is a driver
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.userType !== 'driver') {
        throw new Error('User is not registered as a driver');
      }

      // Check for duplicate license or plate numbers
      const existingDrivers = await executeQuery(`
        SELECT id FROM drivers 
        WHERE license_number = ? OR vehicle_plate_number = ?
      `, [licenseValidation.formattedLicense, plateValidation.formattedPlate]);

      if (existingDrivers.length > 0) {
        throw new Error('Driver with this license number or plate number already exists');
      }

      // Validate location
      const locationValidation = await validateGhanaLocation(region, city);
      if (!locationValidation.isValid) {
        throw new Error('Invalid region or city');
      }

      // Insert driver record
      const result = await executeQuery(`
        INSERT INTO drivers (
          user_id, license_number, license_expiry, vehicle_type,
          vehicle_make, vehicle_model, vehicle_year, vehicle_color,
          vehicle_plate_number, insurance_number, insurance_expiry,
          emergency_contact_name, emergency_contact_phone, address,
          city, region, verification_status, background_check_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        licenseValidation.formattedLicense,
        licenseExpiry,
        vehicleType,
        vehicleMake,
        vehicleModel,
        vehicleYear,
        vehicleColor,
        plateValidation.formattedPlate,
        insuranceNumber,
        insuranceExpiry,
        emergencyContactName,
        phoneValidation.formattedNumber,
        address,
        city,
        region,
        'pending',
        'pending'
      ]);

      // Fetch and return created driver
      return await Driver.findById(result.insertId);
    } catch (error) {
      throw new Error(`Driver creation failed: ${error.message}`);
    }
  }

  /**
   * Find driver by ID
   * @param {number} id - Driver ID
   * @returns {Driver|null} - Driver instance or null
   */
  static async findById(id) {
    try {
      const drivers = await executeQuery(`
        SELECT d.*, u.email, u.first_name, u.last_name, u.phone, u.is_verified
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        WHERE d.id = ?
      `, [id]);
      
      return drivers.length > 0 ? new Driver(drivers[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find driver by ID: ${error.message}`);
    }
  }

  /**
   * Find driver by user ID
   * @param {number} userId - User ID
   * @returns {Driver|null} - Driver instance or null
   */
  static async findByUserId(userId) {
    try {
      const drivers = await executeQuery(`
        SELECT d.*, u.email, u.first_name, u.last_name, u.phone, u.is_verified
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        WHERE d.user_id = ?
      `, [userId]);
      
      return drivers.length > 0 ? new Driver(drivers[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find driver by user ID: ${error.message}`);
    }
  }

  /**
   * Find driver by license number
   * @param {string} licenseNumber - License number
   * @returns {Driver|null} - Driver instance or null
   */
  static async findByLicenseNumber(licenseNumber) {
    try {
      const licenseValidation = validateGhanaLicenseNumber(licenseNumber);
      if (!licenseValidation.isValid) {
        return null;
      }

      const drivers = await executeQuery(`
        SELECT d.*, u.email, u.first_name, u.last_name, u.phone, u.is_verified
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        WHERE d.license_number = ?
      `, [licenseValidation.formattedLicense]);
      
      return drivers.length > 0 ? new Driver(drivers[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find driver by license: ${error.message}`);
    }
  }

  /**
   * Update driver profile
   * @param {Object} updateData - Data to update
   * @returns {boolean} - Update success
   */
  async updateProfile(updateData) {
    try {
      const allowedFields = [
        'vehicle_make', 'vehicle_model', 'vehicle_year', 'vehicle_color',
        'insurance_number', 'insurance_expiry', 'emergency_contact_name',
        'emergency_contact_phone', 'address', 'city', 'region'
      ];

      const updates = [];
      const values = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          // Validate specific fields
          if (key === 'emergency_contact_phone') {
            const phoneValidation = validateGhanaPhoneNumber(value);
            if (!phoneValidation.isValid) {
              throw new Error('Invalid emergency contact phone number');
            }
            updates.push(`${key} = ?`);
            values.push(phoneValidation.formattedNumber);
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
        UPDATE drivers 
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = ?
      `, values);

      // Update instance properties
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          const camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
          this[camelCaseKey] = key === 'emergency_contact_phone' ? 
            validateGhanaPhoneNumber(value).formattedNumber : value;
        }
      }

      return true;
    } catch (error) {
      throw new Error(`Driver profile update failed: ${error.message}`);
    }
  }

  /**
   * Update verification status
   * @param {string} status - Verification status
   * @param {number} verifiedBy - Admin user ID
   * @returns {boolean} - Update success
   */
  async updateVerificationStatus(status, verifiedBy = null) {
    const validStatuses = ['pending', 'approved', 'rejected', 'suspended'];
    
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid verification status');
    }

    try {
      await executeQuery(`
        UPDATE drivers 
        SET verification_status = ?, updated_at = NOW()
        WHERE id = ?
      `, [status, this.id]);

      this.verificationStatus = status;

      // Log the verification status change in audit logs
      if (verifiedBy) {
        await executeQuery(`
          INSERT INTO audit_logs (
            user_id, action, entity_type, entity_id, 
            new_values, category, ip_address
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          verifiedBy,
          'verification_status_change',
          'driver',
          this.id,
          JSON.stringify({ verification_status: status }),
          'authorization',
          '0.0.0.0' // Will be updated with actual IP from controller
        ]);
      }

      return true;
    } catch (error) {
      throw new Error(`Verification status update failed: ${error.message}`);
    }
  }

  /**
   * Update background check status
   * @param {string} status - Background check status
   * @param {number} checkedBy - Admin user ID
   * @returns {boolean} - Update success
   */
  async updateBackgroundCheckStatus(status, checkedBy = null) {
    const validStatuses = ['pending', 'approved', 'failed'];
    
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid background check status');
    }

    try {
      await executeQuery(`
        UPDATE drivers 
        SET background_check_status = ?, updated_at = NOW()
        WHERE id = ?
      `, [status, this.id]);

      this.backgroundCheckStatus = status;

      // Log the background check status change
      if (checkedBy) {
        await executeQuery(`
          INSERT INTO audit_logs (
            user_id, action, entity_type, entity_id, 
            new_values, category, ip_address
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          checkedBy,
          'background_check_status_change',
          'driver',
          this.id,
          JSON.stringify({ background_check_status: status }),
          'authorization',
          '0.0.0.0'
        ]);
      }

      return true;
    } catch (error) {
      throw new Error(`Background check status update failed: ${error.message}`);
    }
  }

  /**
   * Update driver location
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {boolean} - Update success
   */
  async updateLocation(latitude, longitude) {
    try {
      await executeQuery(`
        UPDATE drivers 
        SET current_latitude = ?, current_longitude = ?, 
            last_location_update = NOW(), updated_at = NOW()
        WHERE id = ?
      `, [latitude, longitude, this.id]);

      this.currentLatitude = latitude;
      this.currentLongitude = longitude;
      this.lastLocationUpdate = new Date();

      return true;
    } catch (error) {
      throw new Error(`Location update failed: ${error.message}`);
    }
  }

  /**
   * Set driver online status
   * @param {boolean} isOnline - Online status
   * @returns {boolean} - Update success
   */
  async setOnlineStatus(isOnline) {
    try {
      await executeQuery(`
        UPDATE drivers 
        SET is_online = ?, updated_at = NOW()
        WHERE id = ?
      `, [isOnline, this.id]);

      this.isOnline = isOnline;

      // Clear location when going offline
      if (!isOnline) {
        await this.updateLocation(null, null);
      }

      return true;
    } catch (error) {
      throw new Error(`Online status update failed: ${error.message}`);
    }
  }

  /**
   * Update driver rating
   * @param {number} newRating - New rating to add
   * @returns {boolean} - Update success
   */
  async updateRating(newRating) {
    try {
      // Calculate new average rating
      const totalRatings = this.totalTrips;
      const currentTotal = this.driverRating * totalRatings;
      const newTotal = currentTotal + newRating;
      const newAverage = newTotal / (totalRatings + 1);

      await executeQuery(`
        UPDATE drivers 
        SET driver_rating = ?, updated_at = NOW()
        WHERE id = ?
      `, [newAverage, this.id]);

      this.driverRating = newAverage;
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
        UPDATE drivers 
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
   * Check if driver is eligible for rides
   * @returns {boolean} - Eligibility status
   */
  isEligibleForRides() {
    return this.verificationStatus === 'approved' && 
           this.backgroundCheckStatus === 'approved' &&
           new Date(this.licenseExpiry) > new Date() &&
           new Date(this.insuranceExpiry) > new Date();
  }

  /**
   * Get nearby drivers
   * @param {number} latitude - Center latitude
   * @param {number} longitude - Center longitude
   * @param {number} radiusKm - Search radius in kilometers
   * @param {number} limit - Maximum number of drivers
   * @returns {Array} - Nearby drivers
   */
  static async getNearbyDrivers(latitude, longitude, radiusKm = 10, limit = 20) {
    try {
      // Using Haversine formula to calculate distance
      const drivers = await executeQuery(`
        SELECT d.*, u.first_name, u.last_name, u.phone,
          (6371 * acos(cos(radians(?)) * cos(radians(d.current_latitude)) 
          * cos(radians(d.current_longitude) - radians(?)) 
          + sin(radians(?)) * sin(radians(d.current_latitude)))) AS distance
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        WHERE d.is_online = true 
          AND d.verification_status = 'approved'
          AND d.background_check_status = 'approved'
          AND d.current_latitude IS NOT NULL
          AND d.current_longitude IS NOT NULL
          AND u.is_active = true
        HAVING distance <= ?
        ORDER BY distance ASC
        LIMIT ?
      `, [latitude, longitude, latitude, radiusKm, limit]);

      return drivers.map(driver => new Driver(driver));
    } catch (error) {
      throw new Error(`Failed to get nearby drivers: ${error.message}`);
    }
  }

  /**
   * Get drivers with pagination and filters
   * @param {Object} options - Query options
   * @returns {Object} - Paginated drivers
   */
  static async getDrivers(options = {}) {
    const {
      page = 1,
      limit = 20,
      verificationStatus,
      backgroundCheckStatus,
      vehicleType,
      region,
      city,
      isOnline,
      search
    } = options;

    try {
      const offset = (page - 1) * limit;
      let whereConditions = [];
      let queryParams = [];

      // Build where conditions
      if (verificationStatus) {
        whereConditions.push('d.verification_status = ?');
        queryParams.push(verificationStatus);
      }

      if (backgroundCheckStatus) {
        whereConditions.push('d.background_check_status = ?');
        queryParams.push(backgroundCheckStatus);
      }

      if (vehicleType) {
        whereConditions.push('d.vehicle_type = ?');
        queryParams.push(vehicleType);
      }

      if (region) {
        whereConditions.push('d.region = ?');
        queryParams.push(region);
      }

      if (city) {
        whereConditions.push('d.city = ?');
        queryParams.push(city);
      }

      if (isOnline !== undefined) {
        whereConditions.push('d.is_online = ?');
        queryParams.push(isOnline);
      }

      if (search) {
        whereConditions.push(`(
          u.first_name LIKE ? OR u.last_name LIKE ? OR 
          d.license_number LIKE ? OR d.vehicle_plate_number LIKE ?
        )`);
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        ${whereClause}
      `;
      const countResult = await executeQuery(countQuery, queryParams);
      const total = countResult[0].total;

      // Get drivers
      const driversQuery = `
        SELECT d.*, u.email, u.first_name, u.last_name, u.phone, u.is_verified
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        ${whereClause}
        ORDER BY d.created_at DESC
        LIMIT ? OFFSET ?
      `;
      const drivers = await executeQuery(driversQuery, [...queryParams, limit, offset]);

      return {
        drivers: drivers.map(driver => new Driver(driver)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get drivers: ${error.message}`);
    }
  }

  /**
   * Get driver's public data
   * @returns {Object} - Public driver data
   */
  getPublicData() {
    return {
      id: this.id,
      userId: this.userId,
      vehicleType: this.vehicleType,
      vehicleMake: this.vehicleMake,
      vehicleModel: this.vehicleModel,
      vehicleYear: this.vehicleYear,
      vehicleColor: this.vehicleColor,
      vehiclePlateNumber: this.vehiclePlateNumber,
      driverRating: this.driverRating,
      totalTrips: this.totalTrips,
      isOnline: this.isOnline,
      verificationStatus: this.verificationStatus,
      user: this.user ? this.user.getPublicData() : null
    };
  }

  /**
   * Get driver's full data (for admin or driver themselves)
   * @returns {Object} - Full driver data
   */
  getFullData() {
    return {
      id: this.id,
      userId: this.userId,
      licenseNumber: this.licenseNumber,
      licenseExpiry: this.licenseExpiry,
      vehicleType: this.vehicleType,
      vehicleMake: this.vehicleMake,
      vehicleModel: this.vehicleModel,
      vehicleYear: this.vehicleYear,
      vehicleColor: this.vehicleColor,
      vehiclePlateNumber: this.vehiclePlateNumber,
      insuranceNumber: this.insuranceNumber,
      insuranceExpiry: this.insuranceExpiry,
      emergencyContactName: this.emergencyContactName,
      emergencyContactPhone: this.emergencyContactPhone,
      address: this.address,
      city: this.city,
      region: this.region,
      verificationStatus: this.verificationStatus,
      backgroundCheckStatus: this.backgroundCheckStatus,
      driverRating: this.driverRating,
      totalTrips: this.totalTrips,
      isOnline: this.isOnline,
      currentLatitude: this.currentLatitude,
      currentLongitude: this.currentLongitude,
      lastLocationUpdate: this.lastLocationUpdate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      user: this.user ? this.user.getPublicData() : null
    };
  }
}

module.exports = Driver;