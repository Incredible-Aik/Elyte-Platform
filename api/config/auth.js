require('dotenv').config();

const authConfig = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
    accessTokenExpire: process.env.JWT_EXPIRE || '24h',
    refreshTokenExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
    issuer: 'elyte-platform',
    audience: 'elyte-platform-users'
  },

  // Password Configuration
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  },

  // Account Security
  security: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    lockoutTime: parseInt(process.env.LOCKOUT_TIME) || 15, // minutes
    sessionExpire: parseInt(process.env.SESSION_EXPIRE) || 30, // minutes
    maxActiveSessions: 5,
    requireEmailVerification: true,
    requirePhoneVerification: true,
    twoFactorRequired: {
      admin: true,
      driver: false,
      passenger: false
    }
  },

  // Verification Configuration
  verification: {
    email: {
      expireMinutes: 15,
      maxAttempts: 3,
      resendCooldown: 2 // minutes
    },
    sms: {
      expireMinutes: 15,
      maxAttempts: 3,
      resendCooldown: 2 // minutes
    },
    passwordReset: {
      expireMinutes: 15,
      maxAttempts: 3,
      resendCooldown: 5 // minutes
    },
    twoFactor: {
      expireMinutes: 5,
      maxAttempts: 3,
      resendCooldown: 1 // minutes
    }
  },

  // Rate Limiting
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    authEndpoints: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10, // 10 auth attempts per window
      skipSuccessfulRequests: false
    },
    verificationEndpoints: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 3, // 3 verification requests per minute
      skipSuccessfulRequests: true
    }
  },

  // File Upload Configuration
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,pdf').split(','),
    documents: {
      maxFiles: 10,
      allowedTypes: ['jpg', 'jpeg', 'png', 'pdf'],
      maxFileSize: 5 * 1024 * 1024, // 5MB per file
      required: {
        driver: ['license', 'insurance', 'vehicle_registration', 'id_card']
      }
    }
  },

  // User Types and Permissions
  userTypes: {
    passenger: {
      permissions: [
        'book_ride',
        'view_ride_history',
        'rate_driver',
        'manage_profile',
        'manage_payment_methods'
      ],
      requiresApproval: false,
      requiresDocuments: false
    },
    driver: {
      permissions: [
        'accept_rides',
        'view_ride_history',
        'rate_passenger',
        'manage_profile',
        'manage_vehicle',
        'view_earnings'
      ],
      requiresApproval: true,
      requiresDocuments: true,
      requiredDocuments: ['license', 'insurance', 'vehicle_registration', 'id_card']
    },
    admin: {
      permissions: [
        'manage_users',
        'approve_drivers',
        'view_reports',
        'manage_system',
        'view_audit_logs'
      ],
      requiresApproval: true,
      requiresDocuments: false,
      requiresTwoFactor: true
    }
  },

  // Ghana-Specific Configuration
  ghana: {
    phoneNumberFormat: '+233XXXXXXXXX',
    supportedCurrency: 'GHS',
    mobileMoneyProviders: ['mtn', 'vodafone', 'airteltigo'],
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'tw', 'ga'],
    businessHours: {
      start: '06:00',
      end: '22:00',
      timezone: 'Africa/Accra'
    }
  },

  // Email Configuration
  email: {
    from: process.env.EMAIL_FROM || 'noreply@elyteplatform.com',
    replyTo: 'support@elyteplatform.com',
    templates: {
      verification: 'verification',
      passwordReset: 'password-reset',
      twoFactor: 'two-factor',
      welcome: 'welcome',
      driverApproval: 'driver-approval'
    }
  },

  // Mobile Money Configuration
  mobileMoney: {
    providers: {
      mtn: {
        name: 'MTN Mobile Money',
        apiEndpoint: process.env.MTN_API_ENDPOINT,
        apiKey: process.env.MTN_API_KEY,
        apiSecret: process.env.MTN_API_SECRET,
        ussdCode: '*170#'
      },
      vodafone: {
        name: 'Vodafone Cash',
        apiEndpoint: process.env.VODAFONE_API_ENDPOINT,
        apiKey: process.env.VODAFONE_API_KEY,
        ussdCode: '*110#'
      },
      airteltigo: {
        name: 'AirtelTigo Money',
        apiEndpoint: process.env.AIRTELTIGO_API_ENDPOINT,
        apiKey: process.env.AIRTELTIGO_API_KEY,
        ussdCode: '*110#'
      }
    },
    limits: {
      daily: 2000, // GHS
      monthly: 20000, // GHS
      perTransaction: 1000 // GHS
    }
  },

  // Audit Configuration
  audit: {
    logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    retentionDays: 90,
    sensitiveFields: [
      'password',
      'password_hash',
      'token',
      'verification_code',
      'two_factor_secret'
    ],
    categories: {
      authentication: ['login', 'logout', 'register', 'password_change'],
      authorization: ['permission_check', 'role_change', 'access_denied'],
      dataChange: ['create', 'update', 'delete'],
      system: ['backup', 'maintenance', 'configuration_change'],
      security: ['failed_login', 'suspicious_activity', 'account_lockout']
    }
  },

  // Environment-specific settings
  development: {
    enableCors: true,
    logRequests: true,
    skipEmailVerification: false,
    skipSMSVerification: false,
    mockPayments: true
  },

  production: {
    enableCors: false,
    logRequests: false,
    skipEmailVerification: false,
    skipSMSVerification: false,
    mockPayments: false,
    forceHTTPS: true,
    enableHelmet: true
  }
};

// Environment-specific overrides
const env = process.env.NODE_ENV || 'development';
if (authConfig[env]) {
  Object.assign(authConfig, authConfig[env]);
}

module.exports = authConfig;