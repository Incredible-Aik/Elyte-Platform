const { executeQuery } = require('../../database/config/database');
const User = require('./User');

class Admin {
  constructor(data = {}) {
    this.id = data.id;
    this.userId = data.user_id;
    this.role = data.role;
    this.department = data.department;
    this.permissions = data.permissions ? JSON.parse(data.permissions) : {};
    this.twoFactorEnabled = data.two_factor_enabled;
    this.twoFactorSecret = data.two_factor_secret;
    this.canApproveDrivers = data.can_approve_drivers;
    this.canManageUsers = data.can_manage_users;
    this.canViewReports = data.can_view_reports;
    this.canManageSystem = data.can_manage_system;
    this.lastAdminAction = data.last_admin_action;
    this.createdBy = data.created_by;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    
    // User data if joined
    if (data.email) {
      this.user = new User(data);
    }
  }

  /**
   * Create a new admin
   * @param {Object} adminData - Admin data
   * @returns {Admin} - Created admin instance
   */
  static async create(adminData) {
    const {
      userId,
      role = 'admin',
      department,
      permissions = {},
      twoFactorEnabled = false,
      canApproveDrivers = false,
      canManageUsers = false,
      canViewReports = false,
      canManageSystem = false,
      createdBy
    } = adminData;

    // Validate required fields
    if (!userId) {
      throw new Error('User ID is required');
    }

    const validRoles = ['super_admin', 'admin', 'moderator', 'support'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid admin role');
    }

    try {
      // Check if user exists and is an admin
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.userType !== 'admin') {
        throw new Error('User is not registered as an admin');
      }

      // Check if admin record already exists
      const existingAdmin = await Admin.findByUserId(userId);
      if (existingAdmin) {
        throw new Error('Admin record already exists for this user');
      }

      // Set default permissions based on role
      let defaultPermissions = {};
      switch (role) {
        case 'super_admin':
          defaultPermissions = {
            user_management: true,
            driver_approval: true,
            system_settings: true,
            reports: true,
            audit_logs: true,
            financial_management: true,
            emergency_access: true
          };
          break;
        case 'admin':
          defaultPermissions = {
            user_management: true,
            driver_approval: true,
            reports: true,
            basic_system_settings: true
          };
          break;
        case 'moderator':
          defaultPermissions = {
            user_moderation: true,
            driver_verification: true,
            basic_reports: true
          };
          break;
        case 'support':
          defaultPermissions = {
            user_support: true,
            driver_support: true,
            basic_reports: true,
            verification_assistance: true
          };
          break;
      }

      // Merge with provided permissions
      const finalPermissions = { ...defaultPermissions, ...permissions };

      // Set capability flags based on role and permissions
      let finalCanApproveDrivers = canApproveDrivers;
      let finalCanManageUsers = canManageUsers;
      let finalCanViewReports = canViewReports;
      let finalCanManageSystem = canManageSystem;

      if (role === 'super_admin') {
        finalCanApproveDrivers = true;
        finalCanManageUsers = true;
        finalCanViewReports = true;
        finalCanManageSystem = true;
      } else if (role === 'admin') {
        finalCanApproveDrivers = true;
        finalCanManageUsers = true;
        finalCanViewReports = true;
      }

      // Insert admin record
      const result = await executeQuery(`
        INSERT INTO admins (
          user_id, role, department, permissions, two_factor_enabled,
          can_approve_drivers, can_manage_users, can_view_reports,
          can_manage_system, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        role,
        department,
        JSON.stringify(finalPermissions),
        twoFactorEnabled,
        finalCanApproveDrivers,
        finalCanManageUsers,
        finalCanViewReports,
        finalCanManageSystem,
        createdBy
      ]);

      // Fetch and return created admin
      return await Admin.findById(result.insertId);
    } catch (error) {
      throw new Error(`Admin creation failed: ${error.message}`);
    }
  }

  /**
   * Find admin by ID
   * @param {number} id - Admin ID
   * @returns {Admin|null} - Admin instance or null
   */
  static async findById(id) {
    try {
      const admins = await executeQuery(`
        SELECT a.*, u.email, u.first_name, u.last_name, u.phone, u.is_verified
        FROM admins a
        JOIN users u ON a.user_id = u.id
        WHERE a.id = ?
      `, [id]);
      
      return admins.length > 0 ? new Admin(admins[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find admin by ID: ${error.message}`);
    }
  }

  /**
   * Find admin by user ID
   * @param {number} userId - User ID
   * @returns {Admin|null} - Admin instance or null
   */
  static async findByUserId(userId) {
    try {
      const admins = await executeQuery(`
        SELECT a.*, u.email, u.first_name, u.last_name, u.phone, u.is_verified
        FROM admins a
        JOIN users u ON a.user_id = u.id
        WHERE a.user_id = ?
      `, [userId]);
      
      return admins.length > 0 ? new Admin(admins[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find admin by user ID: ${error.message}`);
    }
  }

  /**
   * Update admin profile
   * @param {Object} updateData - Data to update
   * @returns {boolean} - Update success
   */
  async updateProfile(updateData) {
    try {
      const allowedFields = [
        'role', 'department', 'permissions', 'two_factor_enabled',
        'can_approve_drivers', 'can_manage_users', 'can_view_reports',
        'can_manage_system'
      ];

      const updates = [];
      const values = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          if (key === 'permissions') {
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
        UPDATE admins 
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = ?
      `, values);

      // Update instance properties
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          if (key === 'permissions') {
            this.permissions = value;
          } else {
            const camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            this[camelCaseKey] = value;
          }
        }
      }

      return true;
    } catch (error) {
      throw new Error(`Admin profile update failed: ${error.message}`);
    }
  }

  /**
   * Update admin permissions
   * @param {Object} newPermissions - New permissions object
   * @returns {boolean} - Update success
   */
  async updatePermissions(newPermissions) {
    try {
      await executeQuery(`
        UPDATE admins 
        SET permissions = ?, updated_at = NOW()
        WHERE id = ?
      `, [JSON.stringify(newPermissions), this.id]);

      this.permissions = newPermissions;
      return true;
    } catch (error) {
      throw new Error(`Permissions update failed: ${error.message}`);
    }
  }

  /**
   * Enable/disable two-factor authentication
   * @param {boolean} enabled - Two-factor status
   * @param {string} secret - Two-factor secret (optional)
   * @returns {boolean} - Update success
   */
  async setTwoFactorAuth(enabled, secret = null) {
    try {
      await executeQuery(`
        UPDATE admins 
        SET two_factor_enabled = ?, two_factor_secret = ?, updated_at = NOW()
        WHERE id = ?
      `, [enabled, secret, this.id]);

      this.twoFactorEnabled = enabled;
      this.twoFactorSecret = secret;
      return true;
    } catch (error) {
      throw new Error(`Two-factor auth update failed: ${error.message}`);
    }
  }

  /**
   * Record admin action
   * @param {string} action - Action performed
   * @param {string} entityType - Entity type affected
   * @param {number} entityId - Entity ID affected
   * @param {Object} details - Action details
   * @param {string} ipAddress - IP address
   * @returns {boolean} - Success status
   */
  async recordAction(action, entityType, entityId, details = {}, ipAddress = '0.0.0.0') {
    try {
      // Update last admin action timestamp
      await executeQuery(`
        UPDATE admins 
        SET last_admin_action = NOW(), updated_at = NOW()
        WHERE id = ?
      `, [this.id]);

      // Log in audit logs
      await executeQuery(`
        INSERT INTO audit_logs (
          user_id, action, entity_type, entity_id, 
          new_values, category, severity, ip_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        this.userId,
        action,
        entityType,
        entityId,
        JSON.stringify(details),
        'authorization',
        'medium',
        ipAddress
      ]);

      this.lastAdminAction = new Date();
      return true;
    } catch (error) {
      console.error('Failed to record admin action:', error.message);
      return false;
    }
  }

  /**
   * Check if admin has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} - Permission status
   */
  hasPermission(permission) {
    // Super admin has all permissions
    if (this.role === 'super_admin') {
      return true;
    }

    // Check in permissions object
    return this.permissions[permission] === true;
  }

  /**
   * Check if admin can perform action
   * @param {string} action - Action to check
   * @returns {boolean} - Action permission status
   */
  canPerformAction(action) {
    switch (action) {
      case 'approve_drivers':
        return this.canApproveDrivers || this.role === 'super_admin';
      case 'manage_users':
        return this.canManageUsers || this.role === 'super_admin';
      case 'view_reports':
        return this.canViewReports || this.role === 'super_admin';
      case 'manage_system':
        return this.canManageSystem || this.role === 'super_admin';
      default:
        return this.hasPermission(action);
    }
  }

  /**
   * Get admin activity statistics
   * @param {number} days - Number of days to look back
   * @returns {Object} - Activity statistics
   */
  async getActivityStats(days = 30) {
    try {
      const stats = await executeQuery(`
        SELECT 
          COUNT(*) as total_actions,
          COUNT(DISTINCT DATE(created_at)) as active_days,
          action,
          COUNT(*) as action_count
        FROM audit_logs
        WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY action
        ORDER BY action_count DESC
      `, [this.userId, days]);

      const totalActions = await executeQuery(`
        SELECT COUNT(*) as total
        FROM audit_logs
        WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `, [this.userId, days]);

      return {
        totalActions: totalActions[0].total,
        actionBreakdown: stats,
        activeDays: stats.length > 0 ? Math.max(...stats.map(s => s.active_days)) : 0
      };
    } catch (error) {
      throw new Error(`Failed to get activity stats: ${error.message}`);
    }
  }

  /**
   * Get admins with pagination and filters
   * @param {Object} options - Query options
   * @returns {Object} - Paginated admins
   */
  static async getAdmins(options = {}) {
    const {
      page = 1,
      limit = 20,
      role,
      department,
      twoFactorEnabled,
      search
    } = options;

    try {
      const offset = (page - 1) * limit;
      let whereConditions = [];
      let queryParams = [];

      // Build where conditions
      if (role) {
        whereConditions.push('a.role = ?');
        queryParams.push(role);
      }

      if (department) {
        whereConditions.push('a.department = ?');
        queryParams.push(department);
      }

      if (twoFactorEnabled !== undefined) {
        whereConditions.push('a.two_factor_enabled = ?');
        queryParams.push(twoFactorEnabled);
      }

      if (search) {
        whereConditions.push(`(
          u.first_name LIKE ? OR u.last_name LIKE ? OR 
          u.email LIKE ? OR a.department LIKE ?
        )`);
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM admins a
        JOIN users u ON a.user_id = u.id
        ${whereClause}
      `;
      const countResult = await executeQuery(countQuery, queryParams);
      const total = countResult[0].total;

      // Get admins
      const adminsQuery = `
        SELECT a.*, u.email, u.first_name, u.last_name, u.phone, u.is_verified
        FROM admins a
        JOIN users u ON a.user_id = u.id
        ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `;
      const admins = await executeQuery(adminsQuery, [...queryParams, limit, offset]);

      return {
        admins: admins.map(admin => new Admin(admin)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get admins: ${error.message}`);
    }
  }

  /**
   * Get recent admin activities
   * @param {number} limit - Number of activities to return
   * @returns {Array} - Recent activities
   */
  static async getRecentActivities(limit = 50) {
    try {
      const activities = await executeQuery(`
        SELECT al.*, u.first_name, u.last_name, u.email
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
        JOIN admins a ON u.id = a.user_id
        WHERE al.category IN ('authorization', 'system', 'data_change')
        ORDER BY al.created_at DESC
        LIMIT ?
      `, [limit]);

      return activities;
    } catch (error) {
      throw new Error(`Failed to get recent activities: ${error.message}`);
    }
  }

  /**
   * Get admin's public data
   * @returns {Object} - Public admin data
   */
  getPublicData() {
    return {
      id: this.id,
      userId: this.userId,
      role: this.role,
      department: this.department,
      twoFactorEnabled: this.twoFactorEnabled,
      canApproveDrivers: this.canApproveDrivers,
      canManageUsers: this.canManageUsers,
      canViewReports: this.canViewReports,
      canManageSystem: this.canManageSystem,
      lastAdminAction: this.lastAdminAction,
      createdAt: this.createdAt,
      user: this.user ? this.user.getPublicData() : null
    };
  }

  /**
   * Get admin's full data (for admin management)
   * @returns {Object} - Full admin data
   */
  getFullData() {
    return {
      id: this.id,
      userId: this.userId,
      role: this.role,
      department: this.department,
      permissions: this.permissions,
      twoFactorEnabled: this.twoFactorEnabled,
      canApproveDrivers: this.canApproveDrivers,
      canManageUsers: this.canManageUsers,
      canViewReports: this.canViewReports,
      canManageSystem: this.canManageSystem,
      lastAdminAction: this.lastAdminAction,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      user: this.user ? this.user.getPublicData() : null
    };
  }
}

module.exports = Admin;