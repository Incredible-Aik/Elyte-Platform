# Elyte-Platform

A comprehensive multi-role transportation platform designed specifically for Ghana, featuring driver and admin management with integrated mobile money services, USSD support, and local compliance features.

## Features

### 🚗 Driver Management
- **Comprehensive Registration**: Personal info, vehicle details, license verification, insurance documentation
- **Mobile Money Integration**: Support for MTN, Vodafone, and AirtelTigo mobile money services
- **Ghana-Specific Features**: Phone number validation (+233), local address verification, Ghana Cedis support
- **Document Upload**: License, insurance, vehicle photos, and profile pictures
- **Work Availability**: Flexible scheduling with day/time preferences
- **Background Verification**: Automated background check consent and processing

### 👨‍💼 Admin Management
- **Role-Based Access**: Multiple admin roles (super-admin, operations, fleet, finance, etc.)
- **Security Features**: Two-factor authentication, security questions, access permissions
- **Manager Approval Workflow**: Multi-level approval process for admin registration
- **Department Management**: Organized by departments with specific responsibilities
- **Document Management**: ID verification, education certificates, resume upload

### 🇬🇭 Ghana Integration
- **Mobile Money**: Native support for Ghana's mobile money ecosystem
- **USSD Fallback**: Basic phone user support through USSD codes
- **Local Validation**: Ghana phone numbers, cities, regions
- **Currency Support**: Ghana Cedis (GHS) with proper formatting
- **SMS Verification**: Multi-language SMS support

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with comprehensive schemas
- **File Upload**: Multer with local/cloud storage support
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: Joi for comprehensive form validation
- **Security**: Helmet, CORS, rate limiting

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

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
   # Create PostgreSQL database
   createdb elyte_platform
   
   # Run migrations
   psql -d elyte_platform -f database/migrations/add-driver-admin-tables.sql
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Driver Registration: http://localhost:3000/driver-signup
   - Admin Registration: http://localhost:3000/admin-signup
   - API Health Check: http://localhost:3000/api/health

## File Structure

```
Elyte-Platform/
├── api/                          # Backend API
│   ├── middleware/               # Validation and auth middleware
│   ├── models/                   # Database models
│   ├── routes/                   # API routes
│   ├── uploads/                  # File upload directory
│   └── server.js                 # Main server file
├── database/
│   └── migrations/               # Database migration files
├── web-app/                      # Frontend application
│   ├── css/                      # Stylesheets
│   ├── js/                       # JavaScript files
│   └── signup/                   # Registration forms
├── package.json                  # Node.js dependencies
└── README.md                     # This file
```

## API Endpoints

### Authentication Routes
- `POST /api/auth/driver-signup` - Driver registration
- `POST /api/auth/admin-signup` - Admin registration
- `GET /api/health` - Health check

### Form Validation Features

#### Driver Registration Validation
- ✅ Ghana phone number validation (+233)
- ✅ Vehicle license plate format (XX-0000-XX)
- ✅ Driver's license number validation
- ✅ Mobile money provider compatibility
- ✅ Age verification (18-70 years)
- ✅ Document type and size validation
- ✅ Working hours validation

#### Admin Registration Validation
- ✅ Employee ID format validation
- ✅ Password strength requirements
- ✅ Security question uniqueness
- ✅ Manager email validation
- ✅ Access permission validation
- ✅ Two-factor authentication setup

## Ghana-Specific Features

### Mobile Money Providers
- **MTN Mobile Money**: Prefixes 24, 25, 53, 54, 55, 59
- **Vodafone Cash**: Prefixes 20, 50
- **AirtelTigo Money**: Prefixes 26, 27, 56, 57

### Supported Regions
- Greater Accra, Ashanti, Northern, Western, Central
- Eastern, Volta, Brong Ahafo, Upper East, Upper West

### Local Features
- Ghana phone number formatting
- Local address validation
- Regional city databases
- Ghana Cedis currency support
- USSD fallback for basic phones

## Database Schema

The platform uses PostgreSQL with comprehensive schemas for:

- **Drivers**: Personal info, vehicles, licenses, insurance
- **Admins**: Roles, permissions, security, documents
- **Mobile Money**: Provider integration and account management
- **Emergency Contacts**: Safety and communication
- **Work Availability**: Scheduling and preferences

## Security Features

- JWT authentication with secure token handling
- bcrypt password hashing (12 rounds)
- File upload validation and sanitization
- Rate limiting and CORS protection
- SQL injection prevention
- XSS protection with Helmet
- Two-factor authentication for admins

## Environment Configuration

Key environment variables to configure:

```env
# Database
DB_HOST=localhost
DB_NAME=elyte_platform
DB_USER=elyte_user
DB_PASSWORD=elyte_password

# JWT
JWT_SECRET=your-secret-key

# Email & SMS
EMAIL_HOST=smtp.gmail.com
TWILIO_ACCOUNT_SID=your-sid

# Mobile Money APIs
MTN_API_KEY=your-mtn-key
VODAFONE_API_KEY=your-vodafone-key
```

## Development

### Running Tests
```bash
npm test
```

### Running Linters
```bash
npm run lint
```

### Building for Production
```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Email: support@elyteplatform.com
- Documentation: [Wiki](https://github.com/Incredible-Aik/Elyte-Platform/wiki)

## Roadmap

- [ ] Mobile app integration
- [ ] Real-time GPS tracking
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Payment gateway integration
- [ ] Fleet management features