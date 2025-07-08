const ussdService = require('../services/ussdService');

class USSDController {
  async handleUssdRequest(req, res) {
    try {
      const { sessionId, serviceCode, phoneNumber, text } = req.body;

      // Log the request for debugging
      console.log('USSD Request:', {
        sessionId,
        serviceCode,
        phoneNumber,
        text: text || '(empty)'
      });

      // Validate required fields
      if (!sessionId || !serviceCode || !phoneNumber) {
        console.error('Missing required USSD fields');
        return res.set('Content-Type', 'text/plain')
                  .send('END Invalid request. Please try again.');
      }

      // Process the USSD request
      const response = await ussdService.processUssdRequest({
        sessionId,
        serviceCode,
        phoneNumber,
        text: text || ''
      });

      // Log the response
      console.log('USSD Response:', response);

      // Send response
      res.set('Content-Type', 'text/plain').send(response);

    } catch (error) {
      console.error('USSD Controller Error:', error);
      res.set('Content-Type', 'text/plain')
         .send('END Service temporarily unavailable. Please try again.');
    }
  }

  async getUssdStatus(req, res) {
    try {
      res.json({
        success: true,
        status: 'active',
        serviceCode: '*920*8*1#',
        activeSessionsCount: ussdService.getActiveSessionsCount(),
        uptime: process.uptime()
      });
    } catch (error) {
      console.error('Get USSD status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get USSD status'
      });
    }
  }

  async clearSession(req, res) {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
      }

      await ussdService.clearSession(sessionId);
      
      res.json({
        success: true,
        message: 'Session cleared successfully'
      });

    } catch (error) {
      console.error('Clear session error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear session'
      });
    }
  }
}

module.exports = new USSDController();