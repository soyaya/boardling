# Boardling

A privacy-first Zcash wallet analytics platform for Web3 projects. Track wallet behavior, analyze retention, monitor adoption funnels, and gain AI-powered insights into your user base.

## 🚀 Quick Start

### Prerequisites

- Node.js v18+ 
- PostgreSQL v14+
- Zcash RPC node (Zebra/Zaino or public RPC)

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/boardling.git
cd boardling

# Install dependencies
npm install
cd backend && npm install
cd ../api-frontend && npm install

# Setup database
cd ../backend
cp .env.example .env
# Edit .env with your configuration
psql -d your_db -f schema.sql

# Start services
npm start  # Backend API
cd ../api-frontend && npm start  # Frontend
cd ../backend/indexer && npm start  # Blockchain indexer
```

## 📚 Documentation

### For Users
- **[User Guide](docs/USER_GUIDE.md)** - Complete guide to using Boardling
- **[Platform Overview](PLATFORM_OVERVIEW.md)** - Features and capabilities

### For Developers
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Complete API reference
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[Environment Variables](docs/ENVIRONMENT_VARIABLES.md)** - Configuration reference

### Additional Resources
- **[Zcash Setup](docs/zcash-setup/README.md)** - Blockchain infrastructure setup
- **[Backend Documentation](backend/docs/README.md)** - Backend implementation details
- **[Architecture](docs/architecture/doc.md)** - System architecture

## 🏗️ Project Structure

```
├── src/                    # Frontend application (React/TypeScript)
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── store/             # State management (Zustand)
│   └── utils/             # Utility functions
│
├── backend/               # Backend API (Node.js/Express)
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # Business logic
│   │   ├── models/        # Data models
│   │   └── middleware/    # Express middleware
│   ├── migrations/        # Database migrations
│   ├── tests/            # Test suites
│   └── docs/             # Backend documentation
│
├── backend/indexer/       # Blockchain indexer
│   ├── db/               # Database operations
│   ├── parser/           # Transaction parsing
│   └── rpc/              # RPC client
│
├── docs/                  # Documentation
│   ├── API_DOCUMENTATION.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── ENVIRONMENT_VARIABLES.md
│   ├── USER_GUIDE.md
│   └── zcash-setup/      # Zcash setup guides
│
└── config/               # Configuration files
    └── zcash/            # Zcash node configs
```

## ✨ Features

### Analytics Dashboards
- **Dashboard**: High-level metrics and overview
- **Adoption**: User progression through adoption stages
- **Analytics**: Transaction patterns and behavior
- **Retention**: Cohort analysis and retention rates
- **Productivity**: Wallet health and productivity scores
- **Shielded Pool**: Privacy-focused transaction analytics
- **Segments**: Wallet segmentation and clustering
- **Project Health**: Overall project health indicators
- **Comparison**: Competitive benchmarking (privacy-gated)

### Privacy Controls
- **Private Mode**: Keep all data private
- **Public Mode**: Share anonymized data in aggregates
- **Monetizable Mode**: Earn ZEC by sharing your data

### Subscription Plans
- **Free Trial**: 30 days, all features, up to 5 wallets
- **Premium**: $29/month in ZEC, unlimited wallets, API access
- **Enterprise**: Custom pricing, white-label, dedicated support

### Payment Processing
- Zcash-native payment system
- Subscription management
- Data monetization (70/30 split)
- Withdrawal processing

## 🔧 Configuration

### Backend Environment Variables

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_USER=boardling_user
DB_PASS=your_password
DB_NAME=boardling

# JWT
JWT_SECRET=your_secret_key

# Zcash RPC
ZCASH_RPC_URL=http://localhost:8233
ZCASH_RPC_USER=your_rpc_user
ZCASH_RPC_PASS=your_rpc_pass

# Platform
PLATFORM_TREASURY_ADDRESS=t1YourAddress
```

See [Environment Variables](docs/ENVIRONMENT_VARIABLES.md) for complete reference.

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test                    # All tests
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:property      # Property-based tests

# Frontend tests
cd ..
npm test                   # All tests
npm run test:unit         # Unit tests
npm run test:component    # Component tests
```

## 🚀 Deployment

See [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for detailed production deployment instructions.

Quick deployment checklist:
- [ ] Database setup and migrations
- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] Zcash node running
- [ ] Firewall configured
- [ ] Backups scheduled
- [ ] Monitoring setup

## 🛠️ Development

### Running Locally

```bash
# Terminal 1: Backend API
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev

# Terminal 3: Indexer
cd backend/indexer
npm start
```

### Code Style

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## 📊 Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Zustand for state management
- Recharts for data visualization
- React Router for navigation

### Backend
- Node.js with Express
- PostgreSQL database
- JWT authentication
- bcrypt for password hashing
- Pure SQL (no ORM)

### Blockchain
- Zcash (ZEC)
- Zebra node
- Zaino indexer
- Support for t/z/u addresses

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines (coming soon).

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: https://docs.boardling.com
- **Email**: support@boardling.com
- **Discord**: https://discord.gg/boardling
- **Status Page**: https://status.boardling.com

## 🗺️ Roadmap

- [ ] Email verification
- [ ] Two-factor authentication
- [ ] Team collaboration
- [ ] API webhooks
- [ ] Mobile app
- [ ] Advanced AI insights
- [ ] Multi-chain support
- [ ] White-label solution

## 📈 Status

- **Version**: 1.0.0
- **Status**: Production Ready
- **Last Updated**: January 2024

## 🙏 Acknowledgments

- Zcash Foundation for Zebra
- Zingo Labs for Zaino
- The Zcash community

---

**Built with ❤️ for the Zcash ecosystem**
