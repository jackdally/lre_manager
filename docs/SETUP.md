# Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- Git

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/lre_manager.git
   cd lre_manager
   ```

2. Run the setup script:
   ```bash
   ./scripts/setup.sh
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Development Environment

### Starting the Application

1. Start all services:
   ```bash
   docker-compose up
   ```

2. Access the applications:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Development Workflow

1. Frontend Development:
   ```bash
   cd frontend
   npm run dev
   ```

2. Backend Development:
   ```bash
   cd backend
   npm run dev
   ```

## Database Setup

The application uses PostgreSQL. The database is automatically configured when using Docker Compose.

To manually set up the database:

1. Create the database:
   ```bash
   createdb lre_manager
   ```

2. Run migrations:
   ```bash
   cd backend
   npm run migrate
   ```

## Testing

Run the test suite:
```bash
./scripts/test.sh
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   - Ensure ports 3000 and 3001 are available
   - Check for running instances of the application

2. **Database Connection**
   - Verify PostgreSQL is running
   - Check database credentials in .env

3. **Docker Issues**
   - Ensure Docker daemon is running
   - Try rebuilding containers: `docker-compose build`

## Support

For additional help:
- Check the [API Documentation](API.md)
- Review the [Contributing Guidelines](CONTRIBUTING.md)
- Open an issue on GitHub
