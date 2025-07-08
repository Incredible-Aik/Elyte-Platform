/**
 * ELYTE PLATFORM API - MAIN APPLICATION
 * Ghana's Premier Ride-Sharing Platform Backend
 * 
 * This is the main Express.js application file that sets up the server,
 * middleware, routes, and database connections for the Elyte Platform.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import configuration
const { PORT, NODE_ENV } = require('./config/environment');
const { connectDB } = require('./config/database');

// Import middleware
const authMiddleware = require('./middleware/auth');
const corsMiddleware = require('./middleware/cors');
const validationMiddleware = require('./middleware/validation');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const driverRoutes = require('./routes/drivers');
const rideRoutes = require('./routes/rides');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');

// Import services
const notificationService = require('./services/notificationService');
const ussdService = require('./services/ussdService');

// Import utilities
const { logError, logInfo } = require('./utils/helpers');

// Create Express application
const app = express();

// =============================================================================
// SECURITY MIDDLEWARE
// =============================================================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(corsMiddleware);

// =============================================================================
// GENERAL MIDDLEWARE
// =============================================================================

// Request logging
if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (serve frontend from web-app directory)
app.use(express.static(path.join(__dirname, '../web-app')));

// Request ID middleware for tracking
app.use((req, res, next) => {
    req.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    res.set('X-Request-ID', req.id);
    next();
});

// =============================================================================
// API ROUTES
// =============================================================================

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: NODE_ENV,
        requestId: req.id
    });
});

// API status endpoint
app.get('/api/status', (req, res) => {
    res.status(200).json({
        message: 'Elyte Platform API is running',
        status: 'active',
        services: {
            database: 'connected',
            notifications: 'active',
            ussd: 'active',
            mobileMoneyIntegration: 'active'
        },
        ghana: {
            supportedProviders: ['MTN Mobile Money', 'Vodafone Cash', 'AirtelTigo Money'],
            ussdCode: '*920*123#',
            supportedCities: [
                'Accra', 'Kumasi', 'Tamale', 'Cape Coast', 'Sekondi-Takoradi',
                'Sunyani', 'Koforidua', 'Ho', 'Bolgatanga', 'Wa'
            ]
        },
        timestamp: new Date().toISOString(),
        requestId: req.id
    });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// USSD webhook endpoint (for telecom provider integration)
app.post('/ussd', (req, res) => {
    try {
        const { sessionId, serviceCode, phoneNumber, text } = req.body;
        
        logInfo('USSD Request received', {
            sessionId,
            serviceCode,
            phoneNumber: phoneNumber ? phoneNumber.replace(/\d(?=\d{4})/g, '*') : null,
            requestId: req.id
        });
        
        // Process USSD request
        ussdService.handleUSSDRequest(req.body)
            .then(response => {
                res.set('Content-Type', 'text/plain');
                res.send(response);
            })
            .catch(error => {
                logError('USSD processing error', error, { requestId: req.id });
                res.set('Content-Type', 'text/plain');
                res.send('END Service temporarily unavailable. Please try again later.');
            });
    } catch (error) {
        logError('USSD endpoint error', error, { requestId: req.id });
        res.set('Content-Type', 'text/plain');
        res.send('END Service error. Please try again later.');
    }
});

// =============================================================================
// FRONTEND ROUTES (SPA SUPPORT)
// =============================================================================

// Serve frontend for all non-API routes
app.get('*', (req, res) => {
    // Don't serve frontend for API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/ussd')) {
        return res.status(404).json({
            error: 'Endpoint not found',
            message: 'The requested API endpoint does not exist',
            path: req.path,
            method: req.method,
            requestId: req.id
        });
    }
    
    // Serve frontend
    res.sendFile(path.join(__dirname, '../web-app/index.html'));
});

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        message: `The API endpoint ${req.method} ${req.path} does not exist`,
        availableEndpoints: {
            auth: '/api/auth',
            users: '/api/users',
            drivers: '/api/drivers',
            rides: '/api/rides',
            payments: '/api/payments',
            admin: '/api/admin',
            status: '/api/status'
        },
        requestId: req.id
    });
});

// Global error handler
app.use((error, req, res, next) => {
    logError('Unhandled application error', error, {
        path: req.path,
        method: req.method,
        requestId: req.id,
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });
    
    // Don't leak error details in production
    const isDevelopment = NODE_ENV === 'development';
    
    res.status(error.status || 500).json({
        error: 'Internal server error',
        message: isDevelopment ? error.message : 'Something went wrong. Please try again later.',
        requestId: req.id,
        ...(isDevelopment && { stack: error.stack })
    });
});

// =============================================================================
// SERVER INITIALIZATION
// =============================================================================

/**
 * Start the server
 */
async function startServer() {
    try {
        // Connect to database
        await connectDB();
        logInfo('Database connected successfully');
        
        // Initialize services
        await notificationService.initialize();
        logInfo('Notification service initialized');
        
        await ussdService.initialize();
        logInfo('USSD service initialized');
        
        // Start server
        const server = app.listen(PORT, () => {
            logInfo(`Elyte Platform API server running on port ${PORT}`, {
                environment: NODE_ENV,
                port: PORT,
                processId: process.pid,
                nodeVersion: process.version
            });
            
            logInfo('Server features enabled:', {
                mobileMoneyIntegration: true,
                ussdService: true,
                smsNotifications: true,
                realTimeTracking: true,
                ghanaSpecificFeatures: true
            });
        });
        
        // Graceful shutdown handling
        process.on('SIGTERM', () => {
            logInfo('SIGTERM received, starting graceful shutdown');
            server.close(() => {
                logInfo('Server closed');
                process.exit(0);
            });
        });
        
        process.on('SIGINT', () => {
            logInfo('SIGINT received, starting graceful shutdown');
            server.close(() => {
                logInfo('Server closed');
                process.exit(0);
            });
        });
        
        return server;
        
    } catch (error) {
        logError('Failed to start server', error);
        process.exit(1);
    }
}

// =============================================================================
// EXPORT
// =============================================================================

module.exports = app;

// Start server if this file is run directly
if (require.main === module) {
    startServer();
}