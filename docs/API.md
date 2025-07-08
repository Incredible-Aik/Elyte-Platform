# API Documentation - Elyte Platform

This document provides comprehensive documentation for the Elyte Platform REST API.

## Base URL

```
Production: https://api.elyte.com.gh/api
Development: http://localhost:3001/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Common Headers

```
Content-Type: application/json
Authorization: Bearer <jwt_token>
X-Request-ID: <optional_request_id>
```

## Error Responses

All API endpoints return errors in the following format:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": ["Specific error details"],
  "requestId": "unique_request_id",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

---

## Authentication Endpoints

### Register User

Create a new user account (passenger, driver, or admin).

```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "phone": "+233241234567",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "userType": "passenger",
  "city": "Accra",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "mobileMoneyProvider": "mtn"
}
```

**Response:**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "phone": "+233241234567",
    "firstName": "John",
    "lastName": "Doe",
    "userType": "passenger",
    "isVerified": false
  },
  "token": "jwt_token",
  "nextStep": "verification"
}
```

### Login

Authenticate an existing user.

```http
POST /auth/login
```

**Request Body:**
```json
{
  "emailOrPhone": "user@example.com",
  "password": "securepassword",
  "userType": "passenger"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "phone": "+233241234567",
    "firstName": "John",
    "lastName": "Doe",
    "userType": "passenger",
    "isVerified": true,
    "status": "active"
  },
  "token": "jwt_token"
}
```

### Verify OTP

Verify user account with OTP code.

```http
POST /auth/verify-otp
```

**Request Body:**
```json
{
  "phone": "+233241234567",
  "otp": "123456",
  "userType": "passenger"
}
```

### Resend OTP

Request a new verification code.

```http
POST /auth/resend-otp
```

**Request Body:**
```json
{
  "phone": "+233241234567",
  "userType": "passenger"
}
```

### Forgot Password

Request password reset code.

```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "emailOrPhone": "user@example.com",
  "userType": "passenger"
}
```

### Reset Password

Reset password with OTP.

```http
POST /auth/reset-password
```

**Request Body:**
```json
{
  "emailOrPhone": "user@example.com",
  "otp": "123456",
  "newPassword": "newsecurepassword",
  "userType": "passenger"
}
```

### Get Current User

Get authenticated user information.

```http
GET /auth/me
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "phone": "+233241234567",
    "firstName": "John",
    "lastName": "Doe",
    "userType": "passenger",
    "isVerified": true,
    "status": "active",
    "city": "Accra",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## User Management Endpoints

### Get User Profile

```http
GET /users/profile
```

### Update User Profile

```http
PUT /users/profile
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe Updated",
  "city": "Kumasi",
  "address": "New address",
  "mobileMoneyProvider": "vodafone"
}
```

### Upload Profile Image

```http
POST /users/profile/image
```

**Content-Type:** `multipart/form-data`

---

## Driver Endpoints

### Get Available Drivers

```http
GET /drivers/available
```

**Query Parameters:**
- `latitude` (required): Pickup latitude
- `longitude` (required): Pickup longitude
- `radius` (optional): Search radius in km (default: 5)

**Response:**
```json
{
  "drivers": [
    {
      "id": "uuid",
      "firstName": "Jane",
      "lastName": "Smith",
      "rating": 4.8,
      "vehicle": {
        "make": "Toyota",
        "model": "Camry",
        "color": "White",
        "plateNumber": "GR-1234-20"
      },
      "location": {
        "latitude": 5.6037,
        "longitude": -0.1870,
        "distance": 2.5
      },
      "estimatedArrival": 5
    }
  ]
}
```

### Get Driver Profile

```http
GET /drivers/profile
```

### Update Driver Status

```http
PUT /drivers/status
```

**Request Body:**
```json
{
  "isAvailable": true,
  "latitude": 5.6037,
  "longitude": -0.1870
}
```

---

## Ride Management Endpoints

### Request a Ride

```http
POST /rides/request
```

**Request Body:**
```json
{
  "pickupAddress": "Kotoka International Airport",
  "pickupLatitude": 5.6052,
  "pickupLongitude": -0.1719,
  "destinationAddress": "Accra Mall",
  "destinationLatitude": 5.6508,
  "destinationLongitude": -0.2166,
  "vehicleType": "standard",
  "specialRequests": "Please call when you arrive"
}
```

**Response:**
```json
{
  "ride": {
    "id": "uuid",
    "status": "requested",
    "pickupAddress": "Kotoka International Airport",
    "destinationAddress": "Accra Mall",
    "estimatedFare": 25.50,
    "estimatedDuration": 15,
    "estimatedDistance": 8.5,
    "requestedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

### Get Ride Details

```http
GET /rides/:rideId
```

**Response:**
```json
{
  "ride": {
    "id": "uuid",
    "status": "in_progress",
    "passenger": {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+233241234567"
    },
    "driver": {
      "firstName": "Jane",
      "lastName": "Smith",
      "phone": "+233247654321",
      "rating": 4.8,
      "vehicle": {
        "make": "Toyota",
        "model": "Camry",
        "color": "White",
        "plateNumber": "GR-1234-20"
      }
    },
    "pickup": {
      "address": "Kotoka International Airport",
      "latitude": 5.6052,
      "longitude": -0.1719
    },
    "destination": {
      "address": "Accra Mall",
      "latitude": 5.6508,
      "longitude": -0.2166
    },
    "fare": {
      "baseFare": 3.00,
      "distanceFare": 12.75,
      "timeFare": 3.75,
      "totalFare": 19.50
    },
    "timeline": {
      "requestedAt": "2024-01-01T10:00:00.000Z",
      "acceptedAt": "2024-01-01T10:02:00.000Z",
      "pickupTime": "2024-01-01T10:15:00.000Z",
      "estimatedArrival": "2024-01-01T10:30:00.000Z"
    }
  }
}
```

### Cancel Ride

```http
POST /rides/:rideId/cancel
```

**Request Body:**
```json
{
  "reason": "Change of plans"
}
```

### Accept Ride (Driver)

```http
POST /rides/:rideId/accept
```

### Complete Ride

```http
POST /rides/:rideId/complete
```

### Rate Ride

```http
POST /rides/:rideId/rate
```

**Request Body:**
```json
{
  "rating": 5,
  "feedback": "Great driver, very professional!",
  "ratingType": "driver"
}
```

### Get Ride History

```http
GET /rides/history
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status
- `from` (optional): Start date (ISO 8601)
- `to` (optional): End date (ISO 8601)

---

## Payment Endpoints

### Process Payment

```http
POST /payments/process
```

**Request Body:**
```json
{
  "rideId": "uuid",
  "amount": 25.50,
  "currency": "GHS",
  "paymentMethod": "mobile_money",
  "provider": "mtn",
  "phoneNumber": "+233241234567"
}
```

**Response:**
```json
{
  "payment": {
    "id": "uuid",
    "transactionId": "TXN123456789",
    "amount": 25.50,
    "currency": "GHS",
    "status": "processing",
    "paymentMethod": "mobile_money",
    "provider": "mtn"
  },
  "message": "Payment initiated. Please complete on your phone."
}
```

### Get Payment Status

```http
GET /payments/:paymentId/status
```

### Get Payment History

```http
GET /payments/history
```

### Refund Payment

```http
POST /payments/:paymentId/refund
```

**Request Body:**
```json
{
  "reason": "Ride cancelled",
  "amount": 25.50
}
```

---

## Mobile Money Integration

### MTN Mobile Money

All MTN Mobile Money transactions follow the standard payment flow with provider-specific parameters.

**Test Credentials:**
```json
{
  "phoneNumber": "+233241234567",
  "environment": "sandbox"
}
```

### Vodafone Cash

Similar integration with Vodafone-specific endpoints and parameters.

### AirtelTigo Money

AirtelTigo integration with their API specifications.

---

## USSD Integration

### USSD Webhook

```http
POST /ussd
```

**Request Body:**
```json
{
  "sessionId": "session123",
  "serviceCode": "*920*123#",
  "phoneNumber": "+233241234567",
  "text": "1*2*Accra Mall"
}
```

**Response:**
```
CON Welcome to Elyte
1. Book a Ride
2. Check Balance
3. Ride Status
4. Help
```

---

## Admin Endpoints

### Dashboard Statistics

```http
GET /admin/dashboard/stats
```

**Response:**
```json
{
  "overview": {
    "totalUsers": 50247,
    "totalDrivers": 1834,
    "totalRides": 127893,
    "totalRevenue": 1847392.50
  },
  "today": {
    "activeUsers": 8932,
    "completedRides": 1247,
    "revenue": 12847.30
  },
  "growth": {
    "userGrowth": 12.5,
    "rideGrowth": 8.3,
    "revenueGrowth": 15.2
  }
}
```

### Manage Users

```http
GET /admin/users
POST /admin/users/:userId/suspend
POST /admin/users/:userId/activate
```

### Manage Drivers

```http
GET /admin/drivers
POST /admin/drivers/:driverId/approve
POST /admin/drivers/:driverId/reject
```

### System Settings

```http
GET /admin/settings
PUT /admin/settings
```

---

## Real-time Features

### WebSocket Events

Connect to WebSocket for real-time updates:

```
ws://localhost:3001/socket.io/
```

**Events:**
- `ride_request` - New ride request
- `ride_accepted` - Ride accepted by driver
- `driver_location` - Driver location update
- `ride_completed` - Ride completed
- `payment_completed` - Payment processed

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- Authentication: 5 requests per 15 minutes
- OTP requests: 3 requests per 5 minutes
- General API: 100 requests per hour
- USSD: 10 requests per minute

---

## Ghana-Specific Features

### Supported Cities

The API supports the following Ghanaian cities:
- Accra
- Kumasi
- Tamale
- Cape Coast
- Sekondi-Takoradi
- Sunyani
- Koforidua
- Ho
- Bolgatanga
- Wa

### Mobile Money Providers

- **MTN Mobile Money**: Primary provider with highest transaction volume
- **Vodafone Cash**: Secondary provider with reliable service
- **AirtelTigo Money**: Third provider with growing adoption

### Currency

All monetary values are in Ghana Cedis (GHS).

### Phone Number Format

All phone numbers must be in Ghana format:
- `+233XXXXXXXXX` (international format)
- `0XXXXXXXXX` (local format, automatically converted)

---

## SDK and Libraries

### JavaScript SDK

```javascript
import ElyteAPI from 'elyte-platform-sdk';

const elyte = new ElyteAPI({
  baseURL: 'https://api.elyte.com.gh/api',
  apiKey: 'your_api_key'
});

// Request a ride
const ride = await elyte.rides.request({
  pickup: { lat: 5.6037, lng: -0.1870 },
  destination: { lat: 5.6508, lng: -0.2166 }
});
```

### PHP SDK

```php
use Elyte\ElyteAPI;

$elyte = new ElyteAPI([
    'base_url' => 'https://api.elyte.com.gh/api',
    'api_key' => 'your_api_key'
]);

$ride = $elyte->rides->request([
    'pickup' => ['lat' => 5.6037, 'lng' => -0.1870],
    'destination' => ['lat' => 5.6508, 'lng' => -0.2166]
]);
```

---

## Testing

### Sandbox Environment

Use the sandbox environment for testing:

```
Base URL: https://sandbox-api.elyte.com.gh/api
```

### Test Data

**Test Users:**
```json
{
  "passenger": {
    "email": "passenger@test.elyte.com.gh",
    "phone": "+233241234567",
    "password": "test123"
  },
  "driver": {
    "email": "driver@test.elyte.com.gh", 
    "phone": "+233247654321",
    "password": "test123"
  }
}
```

**Test Mobile Money:**
```json
{
  "mtn": "+233241234567",
  "vodafone": "+233501234567",
  "airteltigo": "+233271234567"
}
```

---

## Support

For API support and questions:

- **Email**: developers@elyte.com.gh
- **Documentation**: https://docs.elyte.com.gh
- **Status Page**: https://status.elyte.com.gh
- **GitHub Issues**: https://github.com/Incredible-Aik/Elyte-Platform/issues

---

## Changelog

### Version 1.0.0 (2024-01-01)
- Initial API release
- Authentication endpoints
- Ride management
- Payment processing
- Mobile money integration
- USSD support
- Admin dashboard