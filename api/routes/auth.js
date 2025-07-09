const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { validateDriverSignup, validateAdminSignup } = require('../middleware/validation');
const Driver = require('../models/Driver');
const Admin = require('../models/Admin');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const userType = req.route.path.includes('driver') ? 'drivers' : 'admins';
        const uploadPath = path.join(uploadsDir, userType);
        
        try {
            await fs.mkdir(uploadPath, { recursive: true });
            cb(null, uploadPath);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}_${sanitizedName}`;
        cb(null, fileName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}`), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 10 // Maximum 10 files per request
    },
    fileFilter: fileFilter
});

// Driver signup endpoint
router.post('/driver-signup', upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'licenseCopy', maxCount: 1 },
    { name: 'vehiclePhotos', maxCount: 5 },
    { name: 'insuranceDocument', maxCount: 1 }
]), validateDriverSignup, async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            dateOfBirth,
            street,
            city,
            region,
            licenseNumber,
            licenseClass,
            licenseExpiry,
            vehicleMake,
            vehicleModel,
            vehicleYear,
            licensePlate,
            vehicleColor,
            insuranceProvider,
            insurancePolicy,
            insuranceExpiry,
            mobileMoneyProvider,
            mobileMoneyNumber,
            accountName,
            emergencyContactName,
            emergencyContactPhone,
            emergencyContactRelationship,
            workingHoursStart,
            workingHoursEnd,
            workingDaysArray
        } = req.body;

        // Check if driver already exists
        const existingDriver = await Driver.findByEmail(email);
        if (existingDriver) {
            return res.status(409).json({
                error: 'Driver already exists',
                message: 'A driver with this email address already exists'
            });
        }

        // Check if license number is already registered
        const existingLicense = await Driver.findByLicenseNumber(licenseNumber);
        if (existingLicense) {
            return res.status(409).json({
                error: 'License already registered',
                message: 'This license number is already registered with another driver'
            });
        }

        // Process uploaded files
        const uploadedFiles = {};
        if (req.files) {
            Object.keys(req.files).forEach(fieldName => {
                if (req.files[fieldName]) {
                    uploadedFiles[fieldName] = req.files[fieldName].map(file => ({
                        filename: file.filename,
                        originalName: file.originalname,
                        path: file.path,
                        size: file.size,
                        mimetype: file.mimetype
                    }));
                }
            });
        }

        // Parse working days
        const workingDays = workingDaysArray ? JSON.parse(workingDaysArray) : [];

        // Validate Ghana phone number format
        const formattedPhone = formatGhanaPhone(phone);
        const formattedEmergencyPhone = formatGhanaPhone(emergencyContactPhone);
        const formattedMobileMoneyNumber = formatGhanaPhone(mobileMoneyNumber);

        // Validate mobile money number against provider
        if (!validateMobileMoneyProvider(mobileMoneyProvider, formattedMobileMoneyNumber)) {
            return res.status(400).json({
                error: 'Invalid mobile money number',
                message: `Mobile money number is not compatible with ${mobileMoneyProvider}`
            });
        }

        // Create driver record
        const driverData = {
            firstName,
            lastName,
            email: email.toLowerCase(),
            phone: formattedPhone,
            dateOfBirth,
            address: {
                street,
                city,
                region
            },
            license: {
                number: licenseNumber.toUpperCase(),
                class: licenseClass,
                expiryDate: licenseExpiry,
                documentPath: uploadedFiles.licenseCopy ? uploadedFiles.licenseCopy[0].path : null
            },
            vehicle: {
                make: vehicleMake,
                model: vehicleModel,
                year: parseInt(vehicleYear),
                licensePlate: licensePlate.toUpperCase(),
                color: vehicleColor,
                photos: uploadedFiles.vehiclePhotos || []
            },
            insurance: {
                provider: insuranceProvider,
                policyNumber: insurancePolicy,
                expiryDate: insuranceExpiry,
                documentPath: uploadedFiles.insuranceDocument ? uploadedFiles.insuranceDocument[0].path : null
            },
            mobileMoney: {
                provider: mobileMoneyProvider,
                number: formattedMobileMoneyNumber,
                accountName
            },
            emergencyContact: {
                name: emergencyContactName,
                phone: formattedEmergencyPhone,
                relationship: emergencyContactRelationship
            },
            workAvailability: {
                days: workingDays,
                startTime: workingHoursStart,
                endTime: workingHoursEnd
            },
            profilePhotoPath: uploadedFiles.profilePhoto ? uploadedFiles.profilePhoto[0].path : null,
            status: 'pending_verification',
            verificationCode: generateVerificationCode(),
            createdAt: new Date()
        };

        // Save driver to database
        const driver = await Driver.create(driverData);

        // Send verification SMS and email
        await sendVerificationNotifications(driver);

        res.status(201).json({
            message: 'Driver registration successful',
            driverId: driver.id,
            email: driver.email,
            status: driver.status,
            nextSteps: [
                'Check your email for verification instructions',
                'Verify your phone number via SMS',
                'Complete background check process',
                'Wait for admin approval'
            ]
        });

    } catch (error) {
        console.error('Driver registration error:', error);
        
        // Clean up uploaded files on error
        if (req.files) {
            Object.values(req.files).flat().forEach(file => {
                fs.unlink(file.path).catch(console.error);
            });
        }

        res.status(500).json({
            error: 'Registration failed',
            message: 'Unable to process registration. Please try again.'
        });
    }
});

// Admin signup endpoint
router.post('/admin-signup', upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'identificationDoc', maxCount: 1 },
    { name: 'educationCertificate', maxCount: 1 },
    { name: 'resumeCV', maxCount: 1 },
    { name: 'referenceLetters', maxCount: 3 }
]), validateAdminSignup, async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            employeeId,
            adminRole,
            department,
            areaOfResponsibility,
            securityClearance,
            workLocation,
            reportingManager,
            managerEmail,
            managerPhone,
            startDate,
            password,
            twoFactorMethod,
            securityQuestion1,
            securityAnswer1,
            securityQuestion2,
            securityAnswer2,
            emergencyContactName,
            emergencyContactPhone,
            emergencyContactRelationship,
            systemAccessArray,
            dataAccessArray
        } = req.body;

        // Check if admin already exists
        const existingAdmin = await Admin.findByEmail(email);
        if (existingAdmin) {
            return res.status(409).json({
                error: 'Admin already exists',
                message: 'An admin with this email address already exists'
            });
        }

        // Check if employee ID is already used
        const existingEmployeeId = await Admin.findByEmployeeId(employeeId);
        if (existingEmployeeId) {
            return res.status(409).json({
                error: 'Employee ID already exists',
                message: 'This employee ID is already registered'
            });
        }

        // Process uploaded files
        const uploadedFiles = {};
        if (req.files) {
            Object.keys(req.files).forEach(fieldName => {
                if (req.files[fieldName]) {
                    uploadedFiles[fieldName] = req.files[fieldName].map(file => ({
                        filename: file.filename,
                        originalName: file.originalname,
                        path: file.path,
                        size: file.size,
                        mimetype: file.mimetype
                    }));
                }
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Parse access permissions
        const systemAccess = systemAccessArray ? JSON.parse(systemAccessArray) : [];
        const dataAccess = dataAccessArray ? JSON.parse(dataAccessArray) : [];

        // Format phone numbers
        const formattedPhone = formatGhanaPhone(phone);
        const formattedManagerPhone = formatGhanaPhone(managerPhone);
        const formattedEmergencyPhone = formatGhanaPhone(emergencyContactPhone);

        // Hash security answers
        const hashedAnswer1 = await bcrypt.hash(securityAnswer1.toLowerCase(), 10);
        const hashedAnswer2 = await bcrypt.hash(securityAnswer2.toLowerCase(), 10);

        // Create admin record
        const adminData = {
            firstName,
            lastName,
            email: email.toLowerCase(),
            phone: formattedPhone,
            employeeId: employeeId.toUpperCase(),
            role: adminRole,
            department,
            areaOfResponsibility,
            securityClearance,
            workLocation,
            reportingManager: {
                name: reportingManager,
                email: managerEmail.toLowerCase(),
                phone: formattedManagerPhone
            },
            startDate,
            passwordHash: hashedPassword,
            twoFactorAuth: {
                method: twoFactorMethod,
                enabled: false,
                secret: null // Will be generated when 2FA is set up
            },
            securityQuestions: [
                {
                    question: securityQuestion1,
                    answerHash: hashedAnswer1
                },
                {
                    question: securityQuestion2,
                    answerHash: hashedAnswer2
                }
            ],
            emergencyContact: {
                name: emergencyContactName,
                phone: formattedEmergencyPhone,
                relationship: emergencyContactRelationship
            },
            accessPermissions: {
                system: systemAccess,
                data: dataAccess
            },
            documents: {
                profilePhoto: uploadedFiles.profilePhoto ? uploadedFiles.profilePhoto[0] : null,
                identification: uploadedFiles.identificationDoc ? uploadedFiles.identificationDoc[0] : null,
                education: uploadedFiles.educationCertificate ? uploadedFiles.educationCertificate[0] : null,
                resume: uploadedFiles.resumeCV ? uploadedFiles.resumeCV[0] : null,
                references: uploadedFiles.referenceLetters || []
            },
            status: 'pending_manager_approval',
            verificationCode: generateVerificationCode(),
            createdAt: new Date()
        };

        // Save admin to database
        const admin = await Admin.create(adminData);

        // Send notifications to manager and admin
        await sendAdminRegistrationNotifications(admin);

        res.status(201).json({
            message: 'Admin registration submitted successfully',
            adminId: admin.id,
            email: admin.email,
            employeeId: admin.employeeId,
            status: admin.status,
            nextSteps: [
                'Manager approval notification sent',
                'Complete email verification',
                'Set up two-factor authentication',
                'Complete background check',
                'Wait for final approval'
            ]
        });

    } catch (error) {
        console.error('Admin registration error:', error);
        
        // Clean up uploaded files on error
        if (req.files) {
            Object.values(req.files).flat().forEach(file => {
                fs.unlink(file.path).catch(console.error);
            });
        }

        res.status(500).json({
            error: 'Registration failed',
            message: 'Unable to process registration. Please try again.'
        });
    }
});

// Helper functions
function formatGhanaPhone(phone) {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    
    // Remove country code if present
    if (cleaned.startsWith('233')) {
        cleaned = cleaned.substring(3);
    }
    
    // Remove leading zero if present
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    
    // Return in format +233XXXXXXXXX
    return `+233${cleaned}`;
}

function validateMobileMoneyProvider(provider, phone) {
    const number = phone.replace('+233', '');
    
    switch (provider) {
        case 'MTN':
            return /^(24|25|53|54|55|59)/.test(number);
        case 'Vodafone':
            return /^(20|50)/.test(number);
        case 'AirtelTigo':
            return /^(26|27|56|57)/.test(number);
        default:
            return false;
    }
}

function generateVerificationCode() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function sendVerificationNotifications(driver) {
    // TODO: Implement SMS and email sending
    console.log(`Sending verification notifications to driver: ${driver.email}`);
    // This would integrate with Twilio for SMS and Nodemailer for email
}

async function sendAdminRegistrationNotifications(admin) {
    // TODO: Implement manager notification email
    console.log(`Sending manager approval request for admin: ${admin.email}`);
    // This would send email to the reporting manager
}

module.exports = router;