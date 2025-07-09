const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import database connection
const { testConnection } = require('../database/config/database');

// Import routes
const authRoutes = require('./routes/auth');

// Import configuration
const authConfig = require('./config/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
if (authConfig.enableHelmet) {
  app.use(helmet());
}

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    const allowedOrigins = [
      'https://elyteplatform.com',
      'https://app.elyteplatform.com',
      'https://admin.elyteplatform.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

if (authConfig.enableCors) {
  app.use(cors(corsOptions));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (authConfig.logRequests) {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
    next();
  });
}

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: authConfig.rateLimiting.windowMs,
  max: authConfig.rateLimiting.maxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Trust proxy (for accurate IP addresses behind load balancers)
app.set('trust proxy', 1);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    const status = dbConnected ? 'healthy' : 'unhealthy';
    const statusCode = dbConnected ? 200 : 503;
    
    res.status(statusCode).json({
      success: dbConnected,
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbConnected ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API information endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Elyte Platform API',
    version: '1.0.0',
    description: 'Ghana-focused ride-sharing platform with comprehensive authentication',
    endpoints: {
      authentication: '/api/auth',
      health: '/health',
      documentation: '/api/docs'
    },
    features: [
      'User registration and authentication',
      'Driver verification and management',
      'Ghana mobile money integration',
      'SMS and email verification',
      'Role-based access control',
      'Audit logging and security monitoring'
    ]
  });
});

// Mount authentication routes
app.use('/api/auth', authRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Log error to audit logs if database is available
  try {
    const { executeQuery } = require('../database/config/database');
    executeQuery(`
      INSERT INTO audit_logs (
        action, entity_type, error_message, category, 
        severity, success, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'global_error',
      'system',
      error.message,
      'system',
      'high',
      false,
      req.ip,
      req.get('User-Agent')
    ]).catch(logError => {
      console.error('Failed to log error to audit:', logError.message);
    });
  } catch (logError) {
    console.error('Failed to log error:', logError.message);
  }
  
  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;
  
  res.status(error.status || 500).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  try {
    const { closeConnection } = require('../database/config/database');
    await closeConnection();
  } catch (error) {
    console.error('Error during shutdown:', error.message);
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  
  try {
    const { closeConnection } = require('../database/config/database');
    await closeConnection();
  } catch (error) {
    console.error('Error during shutdown:', error.message);
  }
  
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('⚠️  Database connection failed, but server will start anyway');
    }
    
    app.listen(PORT, () => {
      console.log('🚀 Elyte Platform API Server Started');
      console.log(`📍 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
      console.log(`🔒 CORS: ${authConfig.enableCors ? 'Enabled' : 'Disabled'}`);
      console.log(`🛡️  Helmet: ${authConfig.enableHelmet ? 'Enabled' : 'Disabled'}`);
      console.log('📚 API Documentation: http://localhost:' + PORT + '/api');
      console.log('🏥 Health Check: http://localhost:' + PORT + '/health');
      console.log('🔐 Authentication: http://localhost:' + PORT + '/api/auth');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server only if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = app;