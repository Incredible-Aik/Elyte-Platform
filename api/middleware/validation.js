const Joi = require('joi');

// Ghana-specific validation schemas
const ghanaPhoneSchema = Joi.string()
    .pattern(/^(\+233|0)?[245][0-9]{8}$/)
    .required()
    .messages({
        'string.pattern.base': 'Please enter a valid Ghana phone number'
    });

const ghanaRegionsSchema = Joi.string()
    .valid(
        'Greater Accra',
        'Ashanti',
        'Northern',
        'Western',
        'Central',
        'Eastern',
        'Volta',
        'Brong Ahafo',
        'Upper East',
        'Upper West'
    )
    .required();

const ghanaCitiesSchema = Joi.string()
    .valid(
        'Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast',
        'Tema', 'Ho', 'Koforidua', 'Sunyani', 'Wa',
        'Obuasi', 'Ejisu', 'Mampong', 'Konongo', 'Bekwai',
        'Yendi', 'Gushegu', 'Karaga', 'Kumbungu', 'Sagnarigu',
        'Tarkwa', 'Elubo', 'Half Assini', 'Axim', 'Prestea',
        'Elmina', 'Winneba', 'Kasoa', 'Swedru', 'Dunkwa',
        'Akropong', 'Somanya', 'Begoro', 'Akim Oda', 'Nkawkaw',
        'Hohoe', 'Keta', 'Sogakope', 'Denu', 'Aflao',
        'Techiman', 'Berekum', 'Dormaa Ahenkro', 'Kintampo',
        'Bolgatanga', 'Bawku', 'Navrongo', 'Paga', 'Zebilla',
        'Lawra', 'Jirapa', 'Tumu', 'Funsi', 'Madina', 'Adenta', 'Teshie', 'Nungua'
    )
    .required();

const mobileMoneyProviderSchema = Joi.string()
    .valid('MTN', 'Vodafone', 'AirtelTigo')
    .required();

const licensePlateSchema = Joi.string()
    .pattern(/^[A-Z]{2}-[0-9]{4}-[A-Z]{2}$/i)
    .required()
    .messages({
        'string.pattern.base': 'License plate must be in format: XX-0000-XX (e.g., GR-1234-AB)'
    });

const licenseNumberSchema = Joi.string()
    .pattern(/^[A-Z]{2,3}[0-9]{6,8}$/i)
    .required()
    .messages({
        'string.pattern.base': 'License number format: 2-3 letters followed by 6-8 digits'
    });

// Driver signup validation schema
const driverSignupSchema = Joi.object({
    // Personal Information
    firstName: Joi.string()
        .pattern(/^[a-zA-Z\s'-]+$/)
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.pattern.base': 'First name can only contain letters, spaces, apostrophes, and hyphens'
        }),
    
    lastName: Joi.string()
        .pattern(/^[a-zA-Z\s'-]+$/)
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.pattern.base': 'Last name can only contain letters, spaces, apostrophes, and hyphens'
        }),
    
    email: Joi.string()
        .email()
        .lowercase()
        .required(),
    
    phone: ghanaPhoneSchema,
    
    dateOfBirth: Joi.date()
        .max('now')
        .min(new Date(new Date().getFullYear() - 70, 0, 1))
        .custom((value, helpers) => {
            const age = new Date().getFullYear() - new Date(value).getFullYear();
            if (age < 18) {
                return helpers.error('custom.minAge');
            }
            return value;
        })
        .required()
        .messages({
            'custom.minAge': 'Driver must be at least 18 years old',
            'date.max': 'Invalid date of birth',
            'date.min': 'Maximum age limit is 70 years'
        }),

    // Address Information
    street: Joi.string()
        .min(5)
        .max(200)
        .required(),
    
    city: ghanaCitiesSchema,
    region: ghanaRegionsSchema,

    // License Information
    licenseNumber: licenseNumberSchema,
    licenseClass: Joi.string()
        .valid('A', 'B', 'C', 'D')
        .required(),
    
    licenseExpiry: Joi.date()
        .min('now')
        .required()
        .messages({
            'date.min': 'License must not be expired'
        }),

    // Vehicle Information
    vehicleMake: Joi.string()
        .min(2)
        .max(50)
        .required(),
    
    vehicleModel: Joi.string()
        .min(2)
        .max(50)
        .required(),
    
    vehicleYear: Joi.number()
        .integer()
        .min(2000)
        .max(new Date().getFullYear())
        .required(),
    
    licensePlate: licensePlateSchema,
    vehicleColor: Joi.string()
        .min(3)
        .max(30)
        .required(),

    // Insurance Information
    insuranceProvider: Joi.string()
        .min(3)
        .max(100)
        .required(),
    
    insurancePolicy: Joi.string()
        .min(5)
        .max(50)
        .required(),
    
    insuranceExpiry: Joi.date()
        .min('now')
        .required()
        .messages({
            'date.min': 'Insurance must not be expired'
        }),

    // Mobile Money Information
    mobileMoneyProvider: mobileMoneyProviderSchema,
    mobileMoneyNumber: ghanaPhoneSchema,
    accountName: Joi.string()
        .pattern(/^[a-zA-Z\s'-]+$/)
        .min(2)
        .max(100)
        .required(),

    // Emergency Contact
    emergencyContactName: Joi.string()
        .pattern(/^[a-zA-Z\s'-]+$/)
        .min(2)
        .max(100)
        .required(),
    
    emergencyContactPhone: ghanaPhoneSchema,
    emergencyContactRelationship: Joi.string()
        .valid('Parent', 'Spouse', 'Sibling', 'Friend', 'Other')
        .required(),

    // Work Availability
    workingHoursStart: Joi.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required(),
    
    workingHoursEnd: Joi.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required(),
    
    workingDaysArray: Joi.string()
        .custom((value, helpers) => {
            try {
                const days = JSON.parse(value);
                if (!Array.isArray(days) || days.length === 0) {
                    return helpers.error('custom.emptyDays');
                }
                const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                const invalidDays = days.filter(day => !validDays.includes(day));
                if (invalidDays.length > 0) {
                    return helpers.error('custom.invalidDays');
                }
                return value;
            } catch {
                return helpers.error('custom.invalidJSON');
            }
        })
        .required()
        .messages({
            'custom.emptyDays': 'Please select at least one working day',
            'custom.invalidDays': 'Invalid working day selected',
            'custom.invalidJSON': 'Invalid working days format'
        }),

    // Agreements (these will be checked as checkboxes in frontend)
    backgroundCheck: Joi.string().valid('on').required(),
    termsConditions: Joi.string().valid('on').required(),
    privacyPolicy: Joi.string().valid('on').required()
});

// Admin signup validation schema
const adminSignupSchema = Joi.object({
    // Personal Information
    firstName: Joi.string()
        .pattern(/^[a-zA-Z\s'-]+$/)
        .min(2)
        .max(50)
        .required(),
    
    lastName: Joi.string()
        .pattern(/^[a-zA-Z\s'-]+$/)
        .min(2)
        .max(50)
        .required(),
    
    email: Joi.string()
        .email()
        .lowercase()
        .required(),
    
    phone: ghanaPhoneSchema,
    
    employeeId: Joi.string()
        .pattern(/^EMP-\d{4,6}$/i)
        .required()
        .messages({
            'string.pattern.base': 'Employee ID format: EMP-XXXX (e.g., EMP-1234)'
        }),

    // Administrative Information
    adminRole: Joi.string()
        .valid(
            'super-admin',
            'operations-manager',
            'fleet-manager',
            'customer-service',
            'finance-manager',
            'compliance-officer',
            'support-staff'
        )
        .required(),
    
    department: Joi.string()
        .valid(
            'operations',
            'fleet-management',
            'customer-service',
            'finance',
            'compliance',
            'hr',
            'it',
            'marketing'
        )
        .required(),
    
    areaOfResponsibility: Joi.string()
        .min(20)
        .max(500)
        .required(),
    
    securityClearance: Joi.string()
        .valid('level-1', 'level-2', 'level-3', 'level-4', 'level-5')
        .required(),
    
    workLocation: Joi.string()
        .valid(
            'accra-hq',
            'kumasi-office',
            'tamale-office',
            'takoradi-office',
            'remote',
            'field-operations'
        )
        .required(),

    // Manager Information
    reportingManager: Joi.string()
        .pattern(/^[a-zA-Z\s'-]+$/)
        .min(2)
        .max(100)
        .required(),
    
    managerEmail: Joi.string()
        .email()
        .lowercase()
        .required(),
    
    managerPhone: ghanaPhoneSchema,
    
    startDate: Joi.date()
        .min('now')
        .max(new Date(new Date().setMonth(new Date().getMonth() + 6)))
        .required()
        .messages({
            'date.min': 'Start date cannot be in the past',
            'date.max': 'Start date cannot be more than 6 months in the future'
        }),

    // Security Setup
    password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
        .required()
        .messages({
            'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character'
        }),
    
    confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
            'any.only': 'Passwords do not match'
        }),
    
    twoFactorMethod: Joi.string()
        .valid('sms', 'email', 'authenticator', 'hardware-token')
        .required(),
    
    securityQuestion1: Joi.string()
        .valid(
            'mothers-maiden-name',
            'first-pet',
            'childhood-city',
            'first-school',
            'favorite-teacher'
        )
        .required(),
    
    securityAnswer1: Joi.string()
        .min(2)
        .max(100)
        .required(),
    
    securityQuestion2: Joi.string()
        .valid(
            'first-car',
            'childhood-friend',
            'high-school',
            'wedding-city',
            'fathers-middle-name'
        )
        .required(),
    
    securityAnswer2: Joi.string()
        .min(2)
        .max(100)
        .required(),

    // Emergency Contact
    emergencyContactName: Joi.string()
        .pattern(/^[a-zA-Z\s'-]+$/)
        .min(2)
        .max(100)
        .required(),
    
    emergencyContactPhone: ghanaPhoneSchema,
    emergencyContactRelationship: Joi.string()
        .valid('spouse', 'parent', 'sibling', 'child', 'friend', 'other')
        .required(),

    // Access Permissions
    systemAccessArray: Joi.string()
        .custom((value, helpers) => {
            try {
                const access = JSON.parse(value);
                if (!Array.isArray(access) || access.length === 0) {
                    return helpers.error('custom.emptyAccess');
                }
                const validAccess = [
                    'driver-management',
                    'fleet-tracking',
                    'financial-reports',
                    'customer-support',
                    'compliance-monitoring',
                    'user-management',
                    'analytics-dashboard',
                    'mobile-money-integration'
                ];
                const invalidAccess = access.filter(item => !validAccess.includes(item));
                if (invalidAccess.length > 0) {
                    return helpers.error('custom.invalidAccess');
                }
                return value;
            } catch {
                return helpers.error('custom.invalidJSON');
            }
        })
        .required()
        .messages({
            'custom.emptyAccess': 'Please select at least one system access permission',
            'custom.invalidAccess': 'Invalid system access permission selected',
            'custom.invalidJSON': 'Invalid system access format'
        }),
    
    dataAccessArray: Joi.string()
        .custom((value, helpers) => {
            try {
                const access = JSON.parse(value);
                if (!Array.isArray(access) || access.length === 0) {
                    return helpers.error('custom.emptyAccess');
                }
                const validAccess = [
                    'driver-data',
                    'financial-data',
                    'operational-data',
                    'customer-data',
                    'analytics-data',
                    'audit-logs'
                ];
                const invalidAccess = access.filter(item => !validAccess.includes(item));
                if (invalidAccess.length > 0) {
                    return helpers.error('custom.invalidAccess');
                }
                return value;
            } catch {
                return helpers.error('custom.invalidJSON');
            }
        })
        .required()
        .messages({
            'custom.emptyAccess': 'Please select at least one data access permission',
            'custom.invalidAccess': 'Invalid data access permission selected',
            'custom.invalidJSON': 'Invalid data access format'
        }),

    // Agreements
    backgroundCheck: Joi.string().valid('on').required(),
    dataProcessing: Joi.string().valid('on').required(),
    codeOfConduct: Joi.string().valid('on').required(),
    termsConditions: Joi.string().valid('on').required(),
    privacyPolicy: Joi.string().valid('on').required()
});

// Validation middleware functions
const validateDriverSignup = (req, res, next) => {
    const { error } = driverSignupSchema.validate(req.body, { 
        abortEarly: false,
        allowUnknown: true // Allow file upload fields
    });

    if (error) {
        const validationErrors = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
        }));

        return res.status(400).json({
            error: 'Validation failed',
            message: 'Please correct the following errors',
            details: validationErrors
        });
    }

    // Additional custom validations
    const { workingHoursStart, workingHoursEnd, mobileMoneyProvider, mobileMoneyNumber } = req.body;

    // Validate working hours
    const startTime = new Date(`2000-01-01T${workingHoursStart}`);
    const endTime = new Date(`2000-01-01T${workingHoursEnd}`);
    
    if (endTime <= startTime) {
        return res.status(400).json({
            error: 'Validation failed',
            message: 'End time must be after start time',
            details: [{ field: 'workingHoursEnd', message: 'End time must be after start time' }]
        });
    }

    // Validate mobile money provider compatibility
    if (mobileMoneyProvider && mobileMoneyNumber) {
        const cleanNumber = mobileMoneyNumber.replace(/\D/g, '').replace(/^233/, '').replace(/^0/, '');
        let isValidProvider = false;

        switch (mobileMoneyProvider) {
            case 'MTN':
                isValidProvider = /^(24|25|53|54|55|59)/.test(cleanNumber);
                break;
            case 'Vodafone':
                isValidProvider = /^(20|50)/.test(cleanNumber);
                break;
            case 'AirtelTigo':
                isValidProvider = /^(26|27|56|57)/.test(cleanNumber);
                break;
        }

        if (!isValidProvider) {
            return res.status(400).json({
                error: 'Validation failed',
                message: `Mobile money number is not compatible with ${mobileMoneyProvider}`,
                details: [{ field: 'mobileMoneyNumber', message: `Invalid ${mobileMoneyProvider} number format` }]
            });
        }
    }

    next();
};

const validateAdminSignup = (req, res, next) => {
    const { error } = adminSignupSchema.validate(req.body, { 
        abortEarly: false,
        allowUnknown: true // Allow file upload fields
    });

    if (error) {
        const validationErrors = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
        }));

        return res.status(400).json({
            error: 'Validation failed',
            message: 'Please correct the following errors',
            details: validationErrors
        });
    }

    // Additional custom validations
    const { email, managerEmail, securityQuestion1, securityQuestion2 } = req.body;

    // Validate manager email is different from user email
    if (email === managerEmail) {
        return res.status(400).json({
            error: 'Validation failed',
            message: 'Manager email cannot be the same as your email',
            details: [{ field: 'managerEmail', message: 'Manager email cannot be the same as your email' }]
        });
    }

    // Validate security questions are different
    if (securityQuestion1 === securityQuestion2) {
        return res.status(400).json({
            error: 'Validation failed',
            message: 'Security questions must be different',
            details: [{ field: 'securityQuestion2', message: 'Security questions must be different' }]
        });
    }

    next();
};

module.exports = {
    validateDriverSignup,
    validateAdminSignup,
    driverSignupSchema,
    adminSignupSchema
};