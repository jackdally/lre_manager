# LRE Manager

A comprehensive tool for managing Laboratory Research Equipment (LRE) programs, tracking expenses, and maintaining financial records.

## Features

- Program Management
- Expense Tracking
- Financial Reporting
- User Management
- Role-based Access Control

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/lre_manager.git
cd lre_manager
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend && npm install
cd ..

# Install frontend dependencies
cd frontend && npm install
cd ..
```

3. Start the development environment:
```bash
docker-compose -f docker/docker-compose.yml up
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## Documentation

For detailed documentation, see the [docs](docs/) directory:
- [Setup Guide](docs/SETUP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API Examples](docs/API_EXAMPLES.md)
- [FAQ](docs/FAQ.md)

## Development

### Prerequisites

- Node.js v18 or later
- npm v8 or later
- Docker and Docker Compose
- PostgreSQL 14 or later (if running without Docker)

### Development Workflow

1. Create a new branch for your feature
2. Make your changes
3. Write tests
4. Submit a pull request

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 