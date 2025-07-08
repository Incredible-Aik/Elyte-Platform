const express = require('express');
const { validateUssdRequest } = require('../middleware/validation');
const ussdService = require('../services/ussdService');

const router = express.Router();

// USSD webhook endpoint
router.post('/webhook', validateUssdRequest, async (req, res) => {
  try {
    const { sessionId, serviceCode, phoneNumber, text } = req.body;

    const response = await ussdService.handleUssdRequest({
      sessionId,
      serviceCode,
      phoneNumber,
      text
    });

    res.set('Content-Type', 'text/plain');
    res.send(response);

  } catch (error) {
    console.error('USSD webhook error:', error);
    res.set('Content-Type', 'text/plain');
    res.send('END An error occurred. Please try again.');
  }
});

// Get USSD service status
router.get('/status', async (req, res) => {
  try {
    res.json({
      success: true,
      status: 'active',
      serviceCode: '*920*8*1#',
      message: 'USSD service is active'
    });

  } catch (error) {
    console.error('USSD status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get USSD status'
    });
  }
});

module.exports = router;