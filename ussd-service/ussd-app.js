/**
 * ELYTE PLATFORM USSD SERVICE
 * Ghana USSD Integration for Ride Booking
 * 
 * This service handles USSD requests from Ghana telecom providers
 * allowing users to book rides without internet connectivity.
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Import handlers
const mainMenuHandler = require('./handlers/mainMenu');
const bookRideHandler = require('./handlers/bookRide');
const checkBalanceHandler = require('./handlers/checkBalance');
const rideStatusHandler = require('./handlers/rideStatus');

// Import services
const ussdParser = require('./services/ussdParser');
const smsService = require('./services/smsService');
const telecomIntegration = require('./services/telecomIntegration');

// Import configuration
const { USSD_PORT, TELECOM_CONFIG } = require('./config/telecom');
const messages = require('./config/messages');

const app = express();

// =============================================================================
// MIDDLEWARE SETUP
// =============================================================================

app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging for USSD
app.use((req, res, next) => {
    req.timestamp = new Date().toISOString();
    req.requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // Log USSD request (mask phone number for privacy)
    if (req.body.phoneNumber) {
        console.log(`[${req.timestamp}] USSD Request:`, {
            sessionId: req.body.sessionId,
            serviceCode: req.body.serviceCode,
            phoneNumber: req.body.phoneNumber.replace(/\d(?=\d{4})/g, '*'),
            text: req.body.text,
            requestId: req.requestId
        });
    }
    
    next();
});

// =============================================================================
// USSD SESSION MANAGEMENT
// =============================================================================

class USSDSessionManager {
    constructor() {
        this.sessions = new Map();
        this.sessionTimeout = 5 * 60 * 1000; // 5 minutes
        
        // Clean up expired sessions every minute
        setInterval(() => this.cleanupExpiredSessions(), 60000);
    }
    
    createSession(sessionId, phoneNumber, serviceCode) {
        const session = {
            sessionId,
            phoneNumber,
            serviceCode,
            step: 'main_menu',
            data: {},
            createdAt: Date.now(),
            lastActivity: Date.now()
        };
        
        this.sessions.set(sessionId, session);
        return session;
    }
    
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivity = Date.now();
        }
        return session;
    }
    
    updateSession(sessionId, updates) {
        const session = this.sessions.get(sessionId);
        if (session) {
            Object.assign(session, updates);
            session.lastActivity = Date.now();
        }
        return session;
    }
    
    endSession(sessionId) {
        this.sessions.delete(sessionId);
    }
    
    cleanupExpiredSessions() {
        const now = Date.now();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.lastActivity > this.sessionTimeout) {
                this.sessions.delete(sessionId);
                console.log(`Cleaned up expired USSD session: ${sessionId}`);
            }
        }
    }
}

const sessionManager = new USSDSessionManager();

// =============================================================================
// MAIN USSD HANDLER
// =============================================================================

/**
 * Main USSD endpoint that receives requests from telecom providers
 */
app.post('/ussd', async (req, res) => {
    try {
        const { sessionId, serviceCode, phoneNumber, text } = req.body;
        
        // Validate required fields
        if (!sessionId || !serviceCode || !phoneNumber) {
            return res.send('END Invalid request parameters');
        }
        
        // Parse the USSD input
        const parsedInput = ussdParser.parseUSSDInput(text);
        
        // Get or create session
        let session = sessionManager.getSession(sessionId);
        if (!session) {
            session = sessionManager.createSession(sessionId, phoneNumber, serviceCode);
        }
        
        // Process the request based on current step and input
        let response;
        
        try {
            switch (session.step) {
                case 'main_menu':
                    response = await mainMenuHandler.handle(session, parsedInput);
                    break;
                    
                case 'book_ride':
                case 'enter_pickup':
                case 'enter_destination':
                case 'confirm_booking':
                    response = await bookRideHandler.handle(session, parsedInput);
                    break;
                    
                case 'check_balance':
                    response = await checkBalanceHandler.handle(session, parsedInput);
                    break;
                    
                case 'ride_status':
                    response = await rideStatusHandler.handle(session, parsedInput);
                    break;
                    
                default:
                    response = await mainMenuHandler.handle(session, parsedInput);
                    break;
            }
            
            // Update session with any changes
            if (response.nextStep) {
                sessionManager.updateSession(sessionId, {
                    step: response.nextStep,
                    data: { ...session.data, ...response.sessionData }
                });
            }
            
            // End session if response indicates completion
            if (response.endSession) {
                sessionManager.endSession(sessionId);
            }
            
            // Send the response
            res.set('Content-Type', 'text/plain');
            res.send(response.message);
            
        } catch (handlerError) {
            console.error('USSD Handler Error:', handlerError);
            
            // Send user-friendly error message
            const errorMessage = messages.error.generic;
            res.set('Content-Type', 'text/plain');
            res.send(`END ${errorMessage}`);
            
            // Clean up session on error
            sessionManager.endSession(sessionId);
        }
        
    } catch (error) {
        console.error('USSD Processing Error:', error);
        
        res.set('Content-Type', 'text/plain');
        res.send('END Service temporarily unavailable. Please try again later.');
    }
});

// =============================================================================
// HEALTH CHECK AND STATUS ENDPOINTS
// =============================================================================

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'ussd',
        timestamp: new Date().toISOString(),
        activeSessions: sessionManager.sessions.size,
        supportedCodes: Object.keys(TELECOM_CONFIG.codes)
    });
});

/**
 * Service status endpoint
 */
app.get('/status', (req, res) => {
    res.json({
        service: 'Elyte USSD Service',
        status: 'active',
        description: 'Ghana ride-sharing USSD integration',
        features: [
            'Ride booking without internet',
            'Balance checking',
            'Ride status tracking',
            'Multi-language support'
        ],
        supportedProviders: [
            'MTN Ghana',
            'Vodafone Ghana', 
            'AirtelTigo Ghana'
        ],
        ussdCodes: {
            main: '*920*123#',
            quickBook: '*920*123*1#',
            balance: '*920*123*2#',
            status: '*920*123*3#'
        },
        languages: ['en', 'tw', 'ee', 'ha'],
        activeSessions: sessionManager.sessions.size,
        timestamp: new Date().toISOString()
    });
});

/**
 * Test endpoint for development
 */
app.post('/test', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ error: 'Not found' });
    }
    
    const { sessionId = 'test-session', phoneNumber = '+233241234567', text = '' } = req.body;
    
    // Simulate USSD request
    const simulatedRequest = {
        body: {
            sessionId,
            serviceCode: '*920*123#',
            phoneNumber,
            text
        }
    };
    
    // Forward to main USSD handler
    req.body = simulatedRequest.body;
    return app._router.handle(req, res);
});

// =============================================================================
// WEBHOOK ENDPOINTS FOR TELECOM PROVIDERS
// =============================================================================

/**
 * MTN webhook endpoint
 */
app.post('/webhook/mtn', async (req, res) => {
    try {
        const processed = await telecomIntegration.processMTNRequest(req.body);
        res.json(processed);
    } catch (error) {
        console.error('MTN webhook error:', error);
        res.status(500).json({ error: 'Processing failed' });
    }
});

/**
 * Vodafone webhook endpoint
 */
app.post('/webhook/vodafone', async (req, res) => {
    try {
        const processed = await telecomIntegration.processVodafoneRequest(req.body);
        res.json(processed);
    } catch (error) {
        console.error('Vodafone webhook error:', error);
        res.status(500).json({ error: 'Processing failed' });
    }
});

/**
 * AirtelTigo webhook endpoint
 */
app.post('/webhook/airteltigo', async (req, res) => {
    try {
        const processed = await telecomIntegration.processAirtelTigoRequest(req.body);
        res.json(processed);
    } catch (error) {
        console.error('AirtelTigo webhook error:', error);
        res.status(500).json({ error: 'Processing failed' });
    }
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        service: 'Elyte USSD Service',
        availableEndpoints: [
            'POST /ussd - Main USSD handler',
            'GET /health - Health check',
            'GET /status - Service status',
            'POST /webhook/mtn - MTN webhook',
            'POST /webhook/vodafone - Vodafone webhook',
            'POST /webhook/airteltigo - AirtelTigo webhook'
        ]
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('USSD Service Error:', error);
    
    res.status(500).json({
        error: 'Internal server error',
        message: 'USSD service encountered an error',
        requestId: req.requestId,
        timestamp: req.timestamp
    });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

/**
 * Start the USSD service
 */
function startUSSDService() {
    const PORT = USSD_PORT || 3002;
    
    const server = app.listen(PORT, () => {
        console.log(`🚀 Elyte USSD Service running on port ${PORT}`);
        console.log(`📱 Service ready for Ghana telecom integration`);
        console.log(`🌍 Supported providers: MTN, Vodafone, AirtelTigo`);
        console.log(`📞 Main USSD code: *920*123#`);
        
        // Initialize telecom integrations
        telecomIntegration.initialize().then(() => {
            console.log('✅ Telecom integrations initialized');
        }).catch(error => {
            console.error('❌ Failed to initialize telecom integrations:', error);
        });
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('🛑 USSD service shutting down...');
        server.close(() => {
            console.log('✅ USSD service closed');
            process.exit(0);
        });
    });
    
    process.on('SIGINT', () => {
        console.log('🛑 USSD service shutting down...');
        server.close(() => {
            console.log('✅ USSD service closed');
            process.exit(0);
        });
    });
    
    return server;
}

// Export for testing
module.exports = app;

// Start server if this file is run directly
if (require.main === module) {
    startUSSDService();
}