# Elyte Platform API Documentation

## Overview

The Elyte Platform API provides comprehensive ride-hailing services specifically designed for Ghana. The API supports multiple access methods including web applications, mobile apps, and USSD for offline access.

## Base URL

```
Production: https://api.elyte.gh/v1
Development: http://localhost:5000/api/v1
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Rate Limiting

- 100 requests per 15 minutes per IP address
- Higher limits available for approved applications

## Response Format

All responses follow this format:

```json
{
  "success": true|false,
  "message": "Response message",
  "data": { /* Response data */ },
  "pagination": { /* For paginated responses */ }
}
```

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+233244123456",
  "email": "john@example.com",
  "password": "securepassword",
  "userType": "passenger"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "requiresVerification": true,
  "userId": "60f7b1b5e1b0c123456789ab"
}
```

#### Login User
```http
POST /auth/login
```

**Request Body:**
```json
{
  "phone": "+233244123456",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "60f7b1b5e1b0c123456789ab",
    "name": "John Doe",
    "phone": "+233244123456",
    "type": "passenger"
  }
}
```

#### Verify Phone Number
```http
POST /auth/verify-phone
```

**Request Body:**
```json
{
  "phone": "+233244123456",
  "code": "123456"
}
```

### Rides

#### Book a Ride
```http
POST /rides/book
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "pickup": "Osu Oxford Street, Accra",
  "destination": "Kotoka International Airport",
  "rideType": "standard",
  "paymentMethod": "mobile-money",
  "scheduledTime": "2024-12-15T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ride booked successfully",
  "ride": {
    "id": "60f7b1b5e1b0c123456789ac",
    "pickup": "Osu Oxford Street, Accra",
    "destination": "Kotoka International Airport",
    "rideType": "standard",
    "fare": 32.50,
    "status": "pending"
  }
}
```

#### Get Ride History
```http
GET /rides/history?page=1&limit=10
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "rides": [
    {
      "id": "60f7b1b5e1b0c123456789ac",
      "pickup": "Osu Oxford Street",
      "destination": "Kotoka Airport",
      "fare": 32.50,
      "status": "completed",
      "createdAt": "2024-12-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### Get Ride Status
```http
GET /rides/{rideId}/status
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "ride": {
    "id": "60f7b1b5e1b0c123456789ac",
    "status": "driver_assigned",
    "driver": {
      "name": "Kwame Asante",
      "phone": "+233244987654",
      "vehicle": "Toyota Corolla - GR 1234 X",
      "rating": 4.8
    }
  }
}
```

#### Cancel Ride
```http
POST /rides/{rideId}/cancel
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reason": "Change of plans"
}
```

#### Rate Ride
```http
POST /rides/{rideId}/rate
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excellent service!"
}
```

### Driver Endpoints

#### Update Driver Status
```http
POST /drivers/status
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "online"
}
```

#### Update Driver Location
```http
POST /drivers/location
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "latitude": 5.6037,
  "longitude": -0.1870
}
```

#### Get Driver Stats
```http
GET /drivers/stats
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "todayEarnings": "125.50",
    "ridesCompleted": 8,
    "rating": 4.8,
    "onlineTime": "6h 30m",
    "totalEarnings": 2450.75
  }
}
```

#### Accept Ride Request
```http
POST /drivers/accept-ride/{rideId}
```

**Headers:**
```
Authorization: Bearer <token>
```

### Payments

#### Process Payment
```http
POST /payments/process
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "amount": 32.50,
  "method": "mobile-money",
  "reference": "MM123456789",
  "rideId": "60f7b1b5e1b0c123456789ac"
}
```

#### Get Payment Methods
```http
GET /payments/methods
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "paymentMethods": [
    {
      "id": "mobile-money",
      "name": "Mobile Money",
      "description": "Pay with MTN, Vodafone, or AirtelTigo",
      "available": true
    },
    {
      "id": "cash",
      "name": "Cash",
      "description": "Pay with cash to the driver",
      "available": true
    }
  ]
}
```

### USSD

#### USSD Webhook
```http
POST /ussd/webhook
```

**Request Body:**
```json
{
  "sessionId": "session123",
  "serviceCode": "*920*8*1#",
  "phoneNumber": "+233244123456",
  "text": "1*Osu*Airport"
}
```

**Response:**
```
CON Ride booked successfully!
From: Osu
To: Airport
Fare: GHS 25.00
Finding driver...
```

## Ghana-Specific Features

### Phone Number Format
All phone numbers must follow Ghanaian format:
- `+233XXXXXXXXX` (international format)
- `0XXXXXXXXX` (local format)

### Mobile Money Integration
Supported networks:
- MTN Mobile Money
- Vodafone Cash
- AirtelTigo Money

### USSD Access
Service Code: `*920*8*1#`

### Local Currency
All amounts are in Ghana Cedis (GHS)

## Error Handling

### Common Error Responses

```json
{
  "success": false,
  "message": "Invalid phone number format",
  "details": "Phone number must be a valid Ghanaian number"
}
```

```json
{
  "success": false,
  "message": "Unauthorized",
  "details": "Token expired"
}
```

## Testing

### Postman Collection
Download our Postman collection: [Elyte API Collection](./postman/elyte-api.json)

### Test Phone Numbers
For testing purposes, use these numbers:
- `+233244000001` - Test passenger
- `+233244000002` - Test driver

### Test Verification Codes
In development mode, use code: `123456`

## SDKs and Libraries

- JavaScript/Node.js: `npm install elyte-api-client`
- PHP: `composer require elyte/api-client`
- Python: `pip install elyte-api-client`

## Support

- Documentation: [https://docs.elyte.gh](https://docs.elyte.gh)
- API Status: [https://status.elyte.gh](https://status.elyte.gh)
- Email: api-support@elyte.gh
- Phone: +233 XXX XXX XXX