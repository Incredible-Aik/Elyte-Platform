# Elyte Platform - Ghana's Inclusive Ride-Hailing Service

For everyday Ghanaians — students, workers, families, and visitors — and qualified drivers with legal documents and experience, who need a reliable, accessible, and fair ride-hailing service that works with or without internet, Elyte is a multi-access ride-hailing platform that allows anyone to book rides easily through mobile app, website, or USSD, and gives drivers more freedom to earn across platforms.

Unlike traditional ride-hailing services that limit access to only smartphones or restrict drivers from multi-platform use, our product is designed to be fully inclusive, driver-friendly, and Ghana-ready — combining digital innovation with local flexibility.

## 🌟 Key Features

### For Passengers
- **Multiple Access Methods**: Mobile app, website, or USSD (*XXX#)
- **No Internet Required**: Book rides via USSD on any mobile phone
- **Local Payment Methods**: Mobile Money (MTN, Vodafone, AirtelTigo), Cash, Cards
- **Real-time Tracking**: Live GPS tracking of your ride
- **Transparent Pricing**: Upfront fare estimates in Ghana Cedis (GHS)

### For Drivers
- **Multi-Platform Freedom**: Work with multiple ride-hailing services
- **Fair Earnings**: Competitive rates and transparent fee structure
- **Flexible Schedule**: Go online/offline anytime
- **Local Support**: Ghana-based customer service

### Ghana-Ready Features
- **USSD Access**: Works on feature phones and smartphones
- **Mobile Money Integration**: Support for all major Ghanaian networks
- **Local Currency**: All transactions in Ghana Cedis (GHS)
- **Offline Functionality**: Basic operations without internet connection
- **SMS Notifications**: Ride updates via SMS

## 🏗️ Project Structure

```
elyte-platform/
├── web-app/                 # Frontend web application
│   ├── public/             # HTML pages
│   ├── src/
│   │   ├── css/           # Stylesheets
│   │   ├── js/            # JavaScript functionality
│   │   └── assets/        # Images and icons
├── api/                    # Backend REST API
│   ├── src/
│   │   ├── controllers/   # API route handlers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API route definitions
│   │   ├── middleware/    # Express middleware
│   │   └── services/      # Business logic services
│   ├── config/            # Configuration files
│   └── tests/             # API tests
├── ussd-service/          # USSD integration service
│   ├── src/
│   │   ├── controllers/   # USSD request handlers
│   │   └── services/      # USSD business logic
├── database/              # Database schemas and migrations
│   ├── schemas/           # Database schema definitions
│   ├── migrations/        # Database migration scripts
│   └── seeds/             # Sample data
├── docs/                  # Project documentation
│   ├── api/               # API documentation
│   ├── user-guides/       # User manuals
│   ├── developer/         # Developer guides
│   └── architecture/      # System architecture docs
└── deployment/            # Deployment configurations
    ├── docker/            # Docker configurations
    ├── ci-cd/             # CI/CD pipeline configs
    └── environments/      # Environment-specific configs
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB 5.0+
- Redis 6.0+ (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Incredible-Aik/Elyte-Platform.git
   cd Elyte-Platform
   ```

2. **Set up the API**
   ```bash
   cd api
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Set up the USSD Service**
   ```bash
   cd ussd-service
   npm install
   npm run dev
   ```

4. **Serve the Web Application**
   ```bash
   cd web-app/public
   # Serve with any static file server
   python -m http.server 3000
   # or
   npx serve -p 3000
   ```

### Using Docker

```bash
# Start all services
docker-compose -f deployment/docker/docker-compose.yml up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api
```

## 📱 How to Use

### Web Application
1. Visit `http://localhost:3000`
2. Register as passenger or driver
3. Verify your phone number
4. Start booking rides or accepting ride requests

### USSD Service
1. Dial `*920*8*1#` from any mobile phone
2. Follow the menu prompts:
   - 1: Book a Ride
   - 2: Check My Rides  
   - 3: Check Balance
   - 4: Help

### API Integration
```javascript
// Example API usage
const response = await fetch('http://localhost:5000/api/v1/rides/book', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    pickup: 'Osu Oxford Street, Accra',
    destination: 'Kotoka International Airport',
    rideType: 'standard',
    paymentMethod: 'mobile-money'
  })
});
```

## 🛠️ Development

### Running Tests
```bash
# API tests
cd api
npm test

# Web app tests (if implemented)
cd web-app
npm test

# USSD service tests
cd ussd-service
npm test
```

### Code Style
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Database Setup
```bash
# Start MongoDB
docker run -d -p 27017:27017 --name elyte-mongo mongo:6.0

# Run migrations (if needed)
cd api
npm run db:migrate

# Seed sample data
npm run db:seed
```

## 📚 Documentation

- **API Documentation**: [docs/api/README.md](docs/api/README.md)
- **User Guide**: [docs/user-guides/](docs/user-guides/)
- **Developer Guide**: [docs/developer/](docs/developer/)
- **Architecture**: [docs/architecture/](docs/architecture/)

## 🌍 Ghana-Specific Implementation

### Phone Number Format
All phone numbers use Ghanaian format:
- International: `+233XXXXXXXXX`
- Local: `0XXXXXXXXX`

### Payment Integration
- **MTN Mobile Money**: Direct API integration
- **Vodafone Cash**: Payment gateway integration  
- **AirtelTigo Money**: API integration
- **Cash Payments**: Driver confirmation system

### USSD Integration
Service code: `*920*8*1#`
- Works on all Ghanaian networks
- No internet connection required
- SMS confirmations and updates

## 🔧 Configuration

### Environment Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/elyte-platform
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key

# SMS/USSD
SMS_PROVIDER=africas-talking
AFRICAS_TALKING_API_KEY=your-api-key
USSD_SERVICE_CODE=*920*8*1#

# Payment
MTN_MOMO_API_KEY=your-mtn-api-key
VODAFONE_CASH_API_KEY=your-vodafone-api-key
```

## 🚢 Deployment

### Production Deployment
```bash
# Build and deploy with Docker
docker-compose -f deployment/docker/docker-compose.prod.yml up -d

# Or deploy to cloud platforms
# See deployment/environments/ for specific configurations
```

### Supported Platforms
- **Local Development**: Docker Compose
- **Cloud**: AWS, Google Cloud, Azure
- **Ghana Hosting**: Local data centers for compliance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Website**: [https://elyte.gh](https://elyte.gh)
- **Email**: support@elyte.gh
- **Phone**: +233 XXX XXX XXX
- **USSD Help**: Dial `*920*8*1#` and select option 4

## 🙏 Acknowledgments

- Ghana's telecommunications regulatory framework
- Local payment gateway partners
- Open source community
- Beta testers and early adopters

---

**Built with ❤️ for Ghana** 🇬🇭