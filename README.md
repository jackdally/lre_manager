# LRE Manager

A comprehensive tool for managing Latest Revised Estimate (LRE) programs, tracking expenses, and maintaining financial records.

## Features

- Program Management
- Expense Tracking
- Financial Reporting
- **NetSuite Actuals Upload & Smart Matching** - Upload and automatically match NetSuite transaction exports
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

## Key Features

### NetSuite Actuals Upload & Smart Matching
The application includes a sophisticated upload system that allows you to:
- Upload CSV/Excel exports from NetSuite containing actual transactions
- Automatically match transactions to existing ledger entries using smart algorithms
- Handle unmatched transactions as unplanned expenses with null baseline/planned values
- Review and confirm matches with confidence scoring
- Track upload sessions and processing status

For detailed information about the actuals upload feature, see [IMPORT_FEATURE.md](lre-docs/docs/IMPORT_FEATURE.md).

## Documentation

For detailed documentation, see the [Docusaurus documentation site](lre-docs/):
- [Setup Guide](lre-docs/docs/SETUP.md)
- [Architecture](lre-docs/docs/ARCHITECTURE.md)
- [API Examples](lre-docs/docs/API_EXAMPLES.md)
- [NetSuite Actuals Upload Feature](lre-docs/docs/IMPORT_FEATURE.md)
- [FAQ](lre-docs/docs/FAQ.md)

### Project Management
- [Project Management Overview](lre-docs/docs/PROJECT_MANAGEMENT.md) - Development workflow and tracking
- [Feature Development Checklist](lre-docs/docs/FEATURE_DEVELOPMENT_CHECKLIST.md) - **Essential guide for feature development sessions**
- [Feature Roadmap](lre-docs/docs/FEATURES.md) - Planned features and status
- [Implementation Plans](lre-docs/docs/implementation-plans/) - Detailed technical plans
- [Implementation Plans](lre-docs/docs/implementation-plans/) - Detailed technical plans
- [Task Management](lre-docs/docs/tasks/) - Organized task tracking by category
- [Legacy Task List](lre-docs/docs/archive/TODO-LEGACY.md) - Original task list (archived)

## Development

### Prerequisites

- Node.js v18 or later
- npm v8 or later
- Docker and Docker Compose
- PostgreSQL 14 or later (if running without Docker)
- jq (JSON processor) - automatically installed in Docker containers, or run `./scripts/install-jq.sh` for local development

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