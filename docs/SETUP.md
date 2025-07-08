# Elyte Platform Setup Guide

This comprehensive guide will help you set up the Elyte Platform locally for development and testing.

## Prerequisites

### Required Software
- **Node.js** (v16.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **PostgreSQL** (v13 or higher with PostGIS extension)
- **Redis** (v6.0 or higher) - Optional but recommended
- **Git** (latest version)

### Optional Tools
- **Docker** and **Docker Compose** (for containerized deployment)
- **pgAdmin** or similar PostgreSQL management tool
- **Postman** or similar API testing tool

## Quick Start (Docker Method - Recommended)

### 1. Clone the Repository
```bash
git clone https://github.com/Incredible-Aik/Elyte-Platform.git
cd Elyte-Platform
```

### 2. Environment Configuration
```bash
# Copy the example environment file
cp deployment/.env.example .env

# Edit the .env file with your specific configuration
nano .env
```

### 3. Start All Services
```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 4. Access the Platform
- **Web Application**: http://localhost
- **API**: http://localhost:3001
- **USSD Service**: http://localhost:3002
- **Database**: localhost:5432

## Manual Setup (Local Development)

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Incredible-Aik/Elyte-Platform.git
cd Elyte-Platform

# Install root dependencies
npm install

# Install API dependencies
cd api && npm install && cd ..

# Install USSD service dependencies
cd ussd-service && npm install && cd ..
```

### 2. Database Setup

#### Install PostgreSQL with PostGIS
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib postgis

# macOS (using Homebrew)
brew install postgresql postgis

# Windows: Download from https://www.postgresql.org/download/windows/
```

#### Create Database and User
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE elyte_platform;
CREATE USER elyte_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE elyte_platform TO elyte_user;

# Enable PostGIS extension
\c elyte_platform;
CREATE EXTENSION postgis;
\q
```

#### Run Database Migrations
```bash
# Initialize the database schema
psql -U elyte_user -d elyte_platform -f database/init.sql

# Run sample data seeds (optional)
psql -U elyte_user -d elyte_platform -f database/seeds/sample_users.sql
```

### 3. Environment Configuration

Create environment files for each service:

#### Root .env file
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=elyte_platform
DB_USER=elyte_user
DB_PASSWORD=your_secure_password

# Redis Configuration (if using Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_2024
JWT_EXPIRES_IN=7d

# Mobile Money API Keys (Ghana)
MTN_API_KEY=your_mtn_api_key
MTN_API_SECRET=your_mtn_api_secret
VODAFONE_API_KEY=your_vodafone_api_key
VODAFONE_API_SECRET=your_vodafone_api_secret
AIRTELTIGO_API_KEY=your_airteltigo_api_key
AIRTELTIGO_API_SECRET=your_airteltigo_api_secret

# SMS Service (Twilio or local SMS gateway)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+233123456789

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password

# Ghana-specific Configuration
DEFAULT_CURRENCY=GHS
DEFAULT_TIMEZONE=GMT
USSD_CODE=*920*123#
```

#### API Environment (api/.env)
```bash
NODE_ENV=development
PORT=3001
API_VERSION=v1

# All the above environment variables are inherited
```

#### USSD Service Environment (ussd-service/.env)
```bash
NODE_ENV=development
USSD_PORT=3002

# Telecom Provider Configuration
MTN_USSD_ENDPOINT=https://api.mtn.com.gh/ussd
VODAFONE_USSD_ENDPOINT=https://api.vodafone.com.gh/ussd
AIRTELTIGO_USSD_ENDPOINT=https://api.airteltigo.com.gh/ussd
```

### 4. Start the Services

#### Start Individual Services
```bash
# Terminal 1: Start the API service
cd api
npm run dev

# Terminal 2: Start the USSD service
cd ussd-service
npm run dev

# Terminal 3: Start the web server (for static files)
cd web-app
npx http-server -p 3000
```

#### Or use the root script
```bash
# Start all services concurrently
npm run dev
```

### 5. Verify Installation

#### Check API Health
```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/status
```

#### Check USSD Service
```bash
curl http://localhost:3002/health
curl http://localhost:3002/status
```

#### Test Web Application
Open your browser and navigate to:
- http://localhost:3000 (if using http-server)
- http://localhost (if using nginx)

## Ghana-Specific Configuration

### Mobile Money Integration

#### MTN Mobile Money
1. Register at [MTN Developer Portal](https://momodeveloper.mtn.com/)
2. Create a new app and get API credentials
3. Configure sandbox/production endpoints
4. Update environment variables with your credentials

#### Vodafone Cash
1. Contact Vodafone Ghana for API access
2. Obtain API credentials and endpoints
3. Configure in environment variables

#### AirtelTigo Money
1. Register with AirtelTigo for developer access
2. Get API credentials
3. Configure endpoints and credentials

### USSD Integration

#### Telecom Provider Setup
1. **MTN Ghana**: Contact MTN for USSD code allocation
2. **Vodafone Ghana**: Apply for USSD code through Vodafone
3. **AirtelTigo Ghana**: Register for USSD services

#### USSD Code Registration
- Primary code: `*920*123#`
- Register with all three major telecom providers
- Configure webhook endpoints for each provider

### SMS Gateway Configuration

#### Local SMS Provider (Recommended for Ghana)
```bash
# Popular Ghana SMS providers
# 1. Hubtel SMS API
HUBTEL_API_KEY=your_hubtel_api_key
HUBTEL_API_SECRET=your_hubtel_api_secret

# 2. SMSGH (Now Hubtel)
SMSGH_CLIENT_ID=your_smsgh_client_id
SMSGH_CLIENT_SECRET=your_smsgh_client_secret

# 3. Other local providers
SMS_PROVIDER=hubtel
SMS_API_ENDPOINT=https://api.hubtel.com/v1/messages/send
```

## Testing the Platform

### 1. Create Test Accounts

#### Passenger Account
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "passenger@test.com",
    "phone": "+233241234567",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "userType": "passenger",
    "city": "Accra"
  }'
```

#### Driver Account
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@test.com",
    "phone": "+233247654321",
    "password": "password123",
    "firstName": "Jane",
    "lastName": "Smith",
    "userType": "driver",
    "city": "Accra",
    "licenseNumber": "GH123456789",
    "vehicleMake": "Toyota",
    "vehicleModel": "Camry",
    "vehicleYear": 2020,
    "vehicleColor": "White",
    "vehiclePlateNumber": "GR-1234-20"
  }'
```

### 2. Test USSD Functionality

#### Using the Test Endpoint
```bash
# Test main menu
curl -X POST http://localhost:3002/test \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test123",
    "phoneNumber": "+233241234567",
    "text": ""
  }'

# Test booking flow
curl -X POST http://localhost:3002/test \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test123",
    "phoneNumber": "+233241234567",
    "text": "1"
  }'
```

### 3. Test Mobile Money Integration

```bash
# Test payment processing (sandbox mode)
curl -X POST http://localhost:3001/api/payments/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 10.00,
    "currency": "GHS",
    "paymentMethod": "mobile_money",
    "provider": "mtn",
    "phoneNumber": "+233241234567"
  }'
```

## Development Workflow

### 1. Code Structure
```
elyte-platform/
├── web-app/           # Frontend React/HTML application
├── api/               # Backend Express.js API
├── ussd-service/      # USSD integration service
├── database/          # Database schemas and migrations
├── docs/              # Documentation
├── deployment/        # Docker and deployment configs
└── tests/             # Test suites
```

### 2. Development Commands

```bash
# Root level commands
npm run dev           # Start all services
npm run test          # Run all tests
npm run lint          # Run linting
npm run build         # Build all components

# API specific
cd api
npm run dev           # Start API with nodemon
npm run test          # Run API tests
npm run migrate       # Run database migrations
npm run seed          # Seed test data

# USSD service specific
cd ussd-service
npm run dev           # Start USSD service
npm run test          # Run USSD tests

# Web app specific
cd web-app
npm start             # Start development server
npm run build         # Build for production
npm run test          # Run frontend tests
```

### 3. Database Management

```bash
# Create new migration
npm run migrate:create "migration_name"

# Run migrations
npm run migrate:up

# Rollback migrations
npm run migrate:down

# Seed development data
npm run seed:dev

# Reset database (careful!)
npm run db:reset
```

## Production Deployment

### 1. Server Requirements
- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 50GB+ SSD recommended
- **Network**: Good internet connectivity for Ghana

### 2. Domain and SSL
```bash
# Configure domain
# Update nginx.conf with your domain
# Obtain SSL certificate (Let's Encrypt recommended)
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 3. Production Environment
```bash
# Set production environment variables
NODE_ENV=production
DB_PASSWORD=very_secure_production_password
JWT_SECRET=very_secure_production_jwt_secret

# Use production mobile money API endpoints
MTN_API_ENDPOINT=https://api.mtn.com.gh/v1
VODAFONE_API_ENDPOINT=https://api.vodafone.com.gh/v1
```

### 4. Deploy with Docker
```bash
# Pull latest code
git pull origin main

# Build and start production containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Monitor logs
docker-compose logs -f
```

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if PostGIS is installed
psql -U elyte_user -d elyte_platform -c "SELECT PostGIS_version();"

# Reset database if needed
npm run db:reset
```

#### USSD Service Issues
```bash
# Check USSD service logs
docker-compose logs ussd

# Test USSD endpoints manually
curl -X POST http://localhost:3002/test -d '{"text":"1"}'
```

#### Mobile Money Integration Issues
```bash
# Verify API credentials
# Check sandbox vs production endpoints
# Review provider documentation
# Test with sandbox credentials first
```

### Getting Help

1. **Documentation**: Check the `/docs` folder for detailed documentation
2. **API Documentation**: Visit http://localhost:3001/api/docs (when running)
3. **Issues**: Create an issue on the GitHub repository
4. **Community**: Join our developer community (contact information in README)

## Next Steps

After successful setup:

1. **Customize branding** in the web-app
2. **Configure real mobile money APIs** with production credentials
3. **Set up monitoring** with the included Prometheus/Grafana stack
4. **Implement additional features** as needed for your market
5. **Test thoroughly** with real Ghana phone numbers and mobile money accounts

## Security Considerations

1. **Change all default passwords** in production
2. **Use strong JWT secrets** (at least 32 characters)
3. **Enable HTTPS** for all production endpoints
4. **Implement rate limiting** on all public APIs
5. **Regular security updates** for all dependencies
6. **Monitor logs** for suspicious activity
7. **Backup database** regularly

This setup guide should get you running with the complete Elyte Platform. For specific questions about Ghana mobile money integration or USSD setup, refer to the respective provider documentation or contact their developer support teams.