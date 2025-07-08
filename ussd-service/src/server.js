const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const ussdController = require('./controllers/ussdController');
const smsController = require('./controllers/smsController');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'USSD Service is running',
    timestamp: new Date().toISOString()
  });
});

// USSD webhook endpoint
app.post('/ussd', ussdController.handleUssdRequest);

// SMS callback endpoint
app.post('/sms/callback', smsController.handleSmsCallback);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Elyte USSD Service',
    version: '1.0.0',
    serviceCode: '*920*8*1#'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('USSD Service Error:', err);
  res.status(500).send('END Service error. Please try again.');
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`
🔧 Elyte USSD Service Running
📍 Port: ${PORT}
📞 Service Code: *920*8*1#
🌍 Environment: ${process.env.NODE_ENV || 'development'}
  `);
});

module.exports = app;