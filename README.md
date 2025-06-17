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
docker-compose -f docker/docker-compose.dev.yml up
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

## Development Setup

1. **Start the development environment:**
   ```bash
   docker-compose -f docker/docker-compose.dev.yml up
   ```
   This will start:
   - Frontend on http://localhost:3000
   - Backend on http://localhost:4000
   - PostgreSQL on port 5432

2. **Access the development environment:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Database: localhost:5432 (postgres/postgres)

3. **Development Features:**
   - Hot-reloading for both frontend and backend
   - Source code mounted as volumes for live updates
   - Debug port exposed (9229) for backend debugging
   - Development-specific environment variables

## Production Setup

1. **Build and start the production environment:**
   ```bash
   docker-compose -f docker/docker-compose.yml up --build
   ```
   This will start:
   - Frontend on http://localhost:80
   - Backend on http://localhost:4000
   - PostgreSQL on port 5432

2. **Access the production environment:**
   - Frontend: http://localhost
   - Backend API: http://localhost:4000
   - Database: localhost:5432

## Database Management

### Development Database
- The development database is automatically created and managed by Docker
- Data persists in a Docker volume named `postgres_data`
- Default credentials:
  - User: postgres
  - Password: postgres
  - Database: lre_manager

### Production Database
- Uses the same PostgreSQL image but with production-specific configurations
- Data persists in a Docker volume
- Credentials should be configured via environment variables

## Environment Variables

### Development
Create a `.env` file in the root directory with:
```
NODE_ENV=development
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=lre_manager
```

### Production
Set the following environment variables in your production environment:
```
NODE_ENV=production
DB_HOST=db
DB_PORT=5432
DB_USER=<your_production_user>
DB_PASSWORD=<your_production_password>
DB_NAME=lre_manager
```

## Available Scripts

### Development
- `docker-compose -f docker/docker-compose.dev.yml up`: Start development environment
- `docker-compose -f docker/docker-compose.dev.yml down`: Stop development environment
- `docker-compose -f docker/docker-compose.dev.yml logs -f`: View development logs

### Production
- `docker-compose -f docker/docker-compose.yml up -d`: Start production environment
- `docker-compose -f docker/docker-compose.yml down`: Stop production environment
- `docker-compose -f docker/docker-compose.yml logs -f`: View production logs

## Troubleshooting

1. **Port conflicts:**
   - Development: 3000 (frontend), 4000 (backend), 5432 (database)
   - Production: 80 (frontend), 4000 (backend), 5432 (database)
   - Ensure these ports are available on your system

2. **Database issues:**
   - Check if the database container is running: `docker ps | grep postgres`
   - View database logs: `docker-compose logs db`
   - Reset database volume: `docker-compose down -v`

3. **Application issues:**
   - Check application logs: `docker-compose logs frontend` or `docker-compose logs backend`
   - Ensure all environment variables are set correctly
   - Verify network connectivity between containers 