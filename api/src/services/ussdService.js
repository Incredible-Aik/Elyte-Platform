const User = require('../models/User');
const Ride = require('../models/Ride');

class USSDService {
  constructor() {
    this.sessions = new Map(); // In production, use Redis or database
  }

  async handleUssdRequest({ sessionId, serviceCode, phoneNumber, text }) {
    try {
      const input = text || '';
      const inputArray = input.split('*');
      const session = this.getSession(sessionId) || this.createSession(sessionId, phoneNumber);

      // Main menu
      if (input === '') {
        return this.showMainMenu();
      }

      // Route based on first menu choice
      const firstChoice = inputArray[0];

      switch (firstChoice) {
        case '1':
          return await this.handleBookRide(session, inputArray.slice(1));
        case '2':
          return await this.handleCheckRides(session, phoneNumber);
        case '3':
          return await this.handleBalance(session, phoneNumber);
        case '4':
          return await this.handleHelp(session);
        default:
          return 'END Invalid option. Please try again.';
      }

    } catch (error) {
      console.error('USSD handling error:', error);
      return 'END Service temporarily unavailable. Please try again later.';
    }
  }

  showMainMenu() {
    return `CON Welcome to Elyte
1. Book a Ride
2. Check My Rides
3. Check Balance
4. Help
0. Exit`;
  }

  async handleBookRide(session, inputs) {
    const step = inputs.length;

    switch (step) {
      case 0:
        session.booking = {};
        return `CON Book a Ride
Enter pickup location:`;

      case 1:
        session.booking.pickup = inputs[0];
        return `CON Pickup: ${inputs[0]}
Enter destination:`;

      case 2:
        session.booking.destination = inputs[1];
        return `CON Choose ride type:
1. Standard (GHS 15-25)
2. Premium (GHS 25-40)
3. Shared (GHS 8-15)`;

      case 3:
        const rideTypes = ['', 'standard', 'premium', 'shared'];
        const rideType = rideTypes[parseInt(inputs[2])] || 'standard';
        session.booking.rideType = rideType;
        
        return `CON Choose payment:
1. Mobile Money
2. Cash
3. Cancel`;

      case 4:
        const paymentChoice = inputs[3];
        if (paymentChoice === '3') {
          return 'END Booking cancelled.';
        }
        
        const paymentMethods = ['', 'mobile-money', 'cash'];
        const paymentMethod = paymentMethods[parseInt(paymentChoice)] || 'cash';
        session.booking.paymentMethod = paymentMethod;

        // Create the ride
        const rideResult = await this.createRide(session, session.phoneNumber);
        if (rideResult.success) {
          return `END Ride booked successfully!
From: ${session.booking.pickup}
To: ${session.booking.destination}
Type: ${session.booking.rideType}
Fare: GHS ${rideResult.fare}
Reference: ${rideResult.reference}

Finding driver...`;
        } else {
          return 'END Booking failed. Please try again.';
        }

      default:
        return 'END Invalid input. Please try again.';
    }
  }

  async handleCheckRides(session, phoneNumber) {
    try {
      // Find user by phone number
      const user = await User.findOne({ phone: phoneNumber });
      if (!user) {
        return 'END No account found. Please register on our app.';
      }

      // Get recent rides
      const rides = await Ride.find({ passengerId: user._id })
        .sort({ createdAt: -1 })
        .limit(3);

      if (rides.length === 0) {
        return 'END No rides found.';
      }

      let response = 'END Recent Rides:\n';
      rides.forEach((ride, index) => {
        const status = ride.status === 'completed' ? 'Completed' : 
                     ride.status === 'in_progress' ? 'In Progress' : 
                     ride.status === 'cancelled' ? 'Cancelled' : 'Pending';
        
        response += `${index + 1}. ${ride.pickup.address || ride.pickup} → ${ride.destination.address || ride.destination}
Status: ${status}
Fare: GHS ${ride.actualFare || ride.estimatedFare}
Date: ${ride.createdAt.toLocaleDateString()}

`;
      });

      return response;

    } catch (error) {
      console.error('Check rides error:', error);
      return 'END Unable to retrieve rides. Please try again.';
    }
  }

  async handleBalance(session, phoneNumber) {
    try {
      // Find user by phone number
      const user = await User.findOne({ phone: phoneNumber });
      if (!user) {
        return 'END No account found. Please register on our app.';
      }

      // Mock balance check - in production, this would check with payment providers
      const mockBalance = {
        'mobile-money': 50.75,
        'wallet': 0.00
      };

      return `END Account Balance:
Mobile Money: GHS ${mockBalance['mobile-money']}
Elyte Wallet: GHS ${mockBalance.wallet}

For top-up, use our mobile app.`;

    } catch (error) {
      console.error('Balance check error:', error);
      return 'END Unable to check balance. Please try again.';
    }
  }

  async handleHelp(session) {
    return `END Elyte Help:

Book Ride: Enter pickup and destination
Payment: Mobile Money or Cash
Support: Call +233-XXX-XXXX

Download our app for more features!
Visit: elyte.gh`;
  }

  async createRide(session, phoneNumber) {
    try {
      // Find user by phone number
      const user = await User.findOne({ phone: phoneNumber });
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Mock fare calculation
      const baseFare = {
        'standard': 20,
        'premium': 30,
        'shared': 15
      };

      const fare = baseFare[session.booking.rideType] || 20;
      const reference = `USSD${Date.now()}`;

      // Create ride (simplified for USSD)
      const ride = new Ride({
        passengerId: user._id,
        pickup: {
          address: session.booking.pickup,
          coordinates: [-0.1870, 5.6037] // Default coordinates
        },
        destination: {
          address: session.booking.destination,
          coordinates: [-0.1870, 5.6037] // Default coordinates
        },
        rideType: session.booking.rideType,
        paymentMethod: session.booking.paymentMethod,
        estimatedFare: fare,
        estimatedDistance: 10, // Mock distance
        estimatedDuration: 20, // Mock duration
        status: 'pending'
      });

      await ride.save();

      return {
        success: true,
        fare: fare,
        reference: reference,
        rideId: ride._id
      };

    } catch (error) {
      console.error('Create ride error:', error);
      return { success: false, message: 'Failed to create ride' };
    }
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  createSession(sessionId, phoneNumber) {
    const session = {
      id: sessionId,
      phoneNumber: phoneNumber,
      createdAt: Date.now(),
      booking: {}
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  clearSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  // Clean up old sessions (call this periodically)
  cleanupSessions() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.createdAt > maxAge) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

module.exports = new USSDService();