# Elyte Platform - Ghana Ride-Sharing Solution

A comprehensive ride-sharing platform designed specifically for Ghana, featuring web application, mobile money integration, and USSD access for all users.

## Features

### Core Platform
- **Multi-Role System**: Passengers, Drivers, and Administrators
- **Real-time Ride Matching**: Advanced algorithm for optimal driver-passenger pairing
- **Ghana Mobile Money Integration**: Support for MTN, Vodafone, and AirtelTigo
- **USSD Access**: Offline ride booking via USSD codes
- **Professional Admin Dashboard**: Comprehensive fleet and revenue management

### Ghana-Specific Features
- **Local Payment Methods**: Integration with major Ghana mobile money providers
- **USSD Service**: Works on basic phones without internet
- **Ghana Cities Database**: Pre-loaded with major Ghanaian cities and locations
- **Local Currency**: All pricing in Ghana Cedis (GHS)
- **SMS Notifications**: Multi-language support including local languages

### Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with comprehensive schemas
- **Real-time**: WebSocket integration
- **Mobile Integration**: USSD and SMS services
- **Deployment**: Docker containerization

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Incredible-Aik/Elyte-Platform.git
   cd Elyte-Platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd api && npm install
   cd ../ussd-service && npm install
   ```

3. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb elyte_platform
   
   # Run migrations
   psql elyte_platform < database/init.sql
   ```

4. **Configure environment**
   ```bash
   cp deployment/.env.example .env
   # Edit .env with your configuration
   ```

5. **Start the platform**
   ```bash
   # Using Docker (recommended)
   docker-compose up
   
   # Or manually
   npm run dev
   ```

## Project Structure

```
elyte-platform-complete/
├── web-app/          # Frontend application
├── api/              # Backend API service
├── ussd-service/     # USSD integration
├── database/         # Database schemas and migrations
├── docs/             # Documentation
├── deployment/       # Docker and deployment configs
└── tests/            # Test suites
```

## Documentation

- [Setup Guide](docs/SETUP.md) - Complete setup instructions
- [API Documentation](docs/API.md) - REST API endpoints
- [USSD Guide](docs/USSD.md) - USSD integration details
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment
- [Architecture](docs/ARCHITECTURE.md) - System architecture overview

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## License

Copyright (c) 2024 Elyte Platform. All rights reserved.

## Support

For support and questions, please contact our development team or create an issue in this repository.