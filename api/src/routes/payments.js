const express = require('express');
const { auth } = require('../middleware/auth');
const { validatePayment } = require('../middleware/validation');

const router = express.Router();

// Process payment
router.post('/process', auth, validatePayment, async (req, res) => {
  try {
    const { amount, method, reference, rideId } = req.body;
    const userId = req.user.userId;

    // Mock payment processing
    const paymentResult = await processPayment({
      amount,
      method,
      reference,
      userId,
      rideId
    });

    res.json({
      success: true,
      message: 'Payment processed successfully',
      payment: {
        id: paymentResult.id,
        amount: paymentResult.amount,
        method: paymentResult.method,
        status: paymentResult.status,
        reference: paymentResult.reference
      }
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed'
    });
  }
});

// Get payment history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Mock payment history
    const mockPayments = [
      {
        id: 1,
        amount: 25.50,
        method: 'mobile-money',
        status: 'completed',
        reference: 'MM001234567',
        createdAt: new Date(),
        rideId: 'ride_123'
      },
      {
        id: 2,
        amount: 15.00,
        method: 'cash',
        status: 'completed',
        reference: 'CASH001',
        createdAt: new Date(Date.now() - 86400000),
        rideId: 'ride_122'
      }
    ];

    res.json({
      success: true,
      payments: mockPayments,
      pagination: {
        page,
        limit,
        total: mockPayments.length,
        pages: Math.ceil(mockPayments.length / limit)
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history'
    });
  }
});

// Get payment methods
router.get('/methods', auth, async (req, res) => {
  try {
    const paymentMethods = [
      {
        id: 'mobile-money',
        name: 'Mobile Money',
        description: 'Pay with MTN, Vodafone, or AirtelTigo',
        icon: '📱',
        available: true
      },
      {
        id: 'cash',
        name: 'Cash',
        description: 'Pay with cash to the driver',
        icon: '💵',
        available: true
      },
      {
        id: 'card',
        name: 'Card',
        description: 'Pay with credit or debit card',
        icon: '💳',
        available: false // Not implemented yet
      }
    ];

    res.json({
      success: true,
      paymentMethods
    });

  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment methods'
    });
  }
});

// Mock payment processing function
async function processPayment({ amount, method, reference, userId, rideId }) {
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock different payment methods
  switch (method) {
    case 'mobile-money':
      return {
        id: `mm_${Date.now()}`,
        amount,
        method,
        status: 'completed',
        reference: reference || `MM${Date.now()}`
      };
    
    case 'cash':
      return {
        id: `cash_${Date.now()}`,
        amount,
        method,
        status: 'pending', // Cash payments are pending until driver confirms
        reference: reference || `CASH${Date.now()}`
      };
    
    case 'card':
      return {
        id: `card_${Date.now()}`,
        amount,
        method,
        status: 'completed',
        reference: reference || `CARD${Date.now()}`
      };
    
    default:
      throw new Error('Invalid payment method');
  }
}

module.exports = router;