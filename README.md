# Elyte Platform

A comprehensive ride-sharing platform built specifically for Ghana, featuring robust authentication, mobile money integration, and user verification systems.

## Features

### 🔐 Authentication & Security
- JWT-based authentication with refresh tokens
- Role-based access control (Passengers, Drivers, Admins)
- Account lockout protection after failed login attempts
- Two-factor authentication for admin accounts
- Email and SMS verification
- Password reset functionality
- Comprehensive audit logging

### 🇬🇭 Ghana-Specific Features
- Ghana phone number validation (+233)
- Mobile money provider integration (MTN, Vodafone, AirtelTigo)
- Ghana cities and regions database
- Local currency (GHS) support
- Driver's license and vehicle registration validation
- Ghana ID number validation

### 👥 User Management
- **Passengers**: Regular users with ride booking capabilities
- **Drivers**: Verified drivers with vehicle and document management
- **Admins**: Administrative users with various permission levels

### 🛡️ Security Features
- bcrypt password hashing
- AES-256 encryption for sensitive data
- SQL injection prevention
- Rate limiting on authentication endpoints
- CORS protection
- Helmet.js security headers

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Incredible-Aik/Elyte-Platform.git
   cd Elyte-Platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Run migrations
   npm run migrate

   # Seed initial data
   npm run seed
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=elyte_platform
DB_USER=root
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=24h

# Email Configuration (for verification)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# SMS Configuration (Twilio for Ghana)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Mobile Money Configuration
MTN_API_KEY=your_mtn_momo_api_key
VODAFONE_API_KEY=your_vodafone_api_key
AIRTELTIGO_API_KEY=your_airteltigo_api_key
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/verify` - Verify email/phone with code
- `POST /api/auth/resend-verification` - Resend verification code
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password with code
- `POST /api/auth/change-password` - Change password (authenticated)
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Health & Info
- `GET /health` - Health check endpoint
- `GET /api` - API information

## Database Schema

The platform includes comprehensive database tables:

1. **users** - Core user information
2. **drivers** - Driver-specific data and verification
3. **admins** - Administrative users and permissions
4. **passengers** - Passenger preferences and data
5. **user_verification** - Email/SMS verification tokens
6. **driver_documents** - Document storage and verification
7. **mobile_money_accounts** - Ghana mobile money integration
8. **user_sessions** - Authentication sessions and tokens
9. **audit_logs** - Security and activity logging
10. **ghana_locations** - Ghana cities and regions

## Development

### Running Migrations
```bash
npm run migrate
```

### Running Seeders
```bash
npm run seed
```

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run migrate` - Run database migrations
- `npm run seed` - Run database seeders

## Project Structure

```
elyte-platform/
├── api/
│   ├── config/
│   │   └── auth.js
│   ├── controllers/
│   │   └── authController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Driver.js
│   │   ├── Admin.js
│   │   └── Passenger.js
│   ├── routes/
│   │   └── auth.js
│   ├── utils/
│   │   ├── encryption.js
│   │   ├── tokenManager.js
│   │   ├── verification.js
│   │   └── ghanaValidation.js
│   └── app.js
├── database/
│   ├── config/
│   │   └── database.js
│   ├── migrations/
│   │   └── migrate.js
│   ├── schema/
│   │   └── *.sql
│   └── seeders/
│       ├── *.sql
│       └── seed.js
├── .env.example
├── package.json
└── README.md
```

## Security Considerations

- Never commit `.env` files to version control
- Use strong JWT secrets in production
- Enable HTTPS in production
- Regularly update dependencies
- Monitor audit logs for suspicious activity
- Implement proper backup strategies
- Use secure database credentials

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details