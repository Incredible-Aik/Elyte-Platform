// SMS Service for sending verification codes and notifications
// This would integrate with services like Twilio, Africa's Talking, or local SMS gateways

class SMSService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'mock';
    this.apiKey = process.env.SMS_API_KEY;
    this.senderId = process.env.SMS_SENDER_ID || 'Elyte';
  }

  async sendVerificationCode(phoneNumber, code) {
    const message = `Your Elyte verification code is: ${code}. Valid for 10 minutes.`;
    return await this.sendSMS(phoneNumber, message);
  }

  async sendPasswordResetCode(phoneNumber, code) {
    const message = `Your Elyte password reset code is: ${code}. Valid for 10 minutes.`;
    return await this.sendSMS(phoneNumber, message);
  }

  async sendRideNotification(phoneNumber, message) {
    return await this.sendSMS(phoneNumber, message);
  }

  async sendSMS(phoneNumber, message) {
    try {
      console.log(`Sending SMS to ${phoneNumber}: ${message}`);

      if (this.provider === 'mock') {
        // Mock SMS sending for development
        return {
          success: true,
          messageId: `mock_${Date.now()}`,
          message: 'SMS sent successfully (mock)'
        };
      }

      // Real SMS integration would go here
      // Example with Twilio:
      /*
      const twilio = require('twilio');
      const client = twilio(this.accountSid, this.authToken);
      
      const result = await client.messages.create({
        body: message,
        from: this.senderId,
        to: phoneNumber
      });
      
      return {
        success: true,
        messageId: result.sid,
        message: 'SMS sent successfully'
      };
      */

      // Example with Africa's Talking:
      /*
      const AfricasTalking = require('africastalking');
      const sms = AfricasTalking({
        apiKey: this.apiKey,
        username: process.env.AFRICAS_TALKING_USERNAME
      }).SMS;
      
      const result = await sms.send({
        to: phoneNumber,
        message: message,
        from: this.senderId
      });
      
      return {
        success: true,
        messageId: result.SMSMessageData.Recipients[0].messageId,
        message: 'SMS sent successfully'
      };
      */

      return {
        success: true,
        messageId: `dev_${Date.now()}`,
        message: 'SMS sent successfully (development mode)'
      };

    } catch (error) {
      console.error('SMS sending error:', error);
      throw new Error('Failed to send SMS');
    }
  }

  async sendDriverNotification(driverId, message) {
    try {
      // This would get the driver's phone number and send SMS
      // For now, we'll just log it
      console.log(`Driver notification for ${driverId}: ${message}`);
      
      return {
        success: true,
        message: 'Driver notification sent'
      };
    } catch (error) {
      console.error('Driver notification error:', error);
      throw new Error('Failed to send driver notification');
    }
  }

  async sendPassengerNotification(passengerId, message) {
    try {
      // This would get the passenger's phone number and send SMS
      // For now, we'll just log it
      console.log(`Passenger notification for ${passengerId}: ${message}`);
      
      return {
        success: true,
        message: 'Passenger notification sent'
      };
    } catch (error) {
      console.error('Passenger notification error:', error);
      throw new Error('Failed to send passenger notification');
    }
  }

  // Format phone number for international format
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Handle Ghanaian numbers
    if (digits.startsWith('0')) {
      return `+233${digits.substring(1)}`;
    } else if (digits.startsWith('233')) {
      return `+${digits}`;
    } else if (digits.startsWith('+233')) {
      return digits;
    }
    
    return phoneNumber;
  }

  // Validate Ghanaian phone number
  isValidGhanaianPhone(phoneNumber) {
    const formatted = this.formatPhoneNumber(phoneNumber);
    return /^\+233[2-9][0-9]{8}$/.test(formatted);
  }
}

module.exports = new SMSService();