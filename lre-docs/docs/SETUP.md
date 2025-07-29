# Setup Guide

## Prerequisites

- Node.js (v18 or later)
- npm (v8 or later)
- Docker and Docker Compose
- Git
- PostgreSQL (if running without Docker)

## Development Setup

 - Clone the repository:
```bash
git clone https://github.com/yourusername/lre_manager.git
cd lre_manager
```

 - Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

 - Set up environment variables:
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your configuration
```

 - Start the development environment:
```bash
# If you make changes to backend TypeScript code, run:
cd backend
npm run build
cd ..
# Then restart the backend container:
docker-compose -f docker/docker-compose.yml restart backend

# Start the environment (if not already running):
docker-compose -f docker/docker-compose.yml up
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Database: localhost:5432

## Environment Variables

### Backend Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=lre_manager

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRATION=24h

# Logging
LOG_LEVEL=debug

# CORS
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables
```env
# API
REACT_APP_API_URL=http://localhost:4000

# Environment
NODE_ENV=development
```

## Troubleshooting

### Database Issues
- Try rebuilding containers: `docker-compose -f docker/docker-compose.yml build --no-cache`
- Check container logs: `docker-compose -f docker/docker-compose.yml logs`

### Port Conflicts
If you see port conflict errors:
 - Check if any services are using the required ports (3000, 4000, 5432)
 - Stop conflicting services
 - Or modify the ports in `docker/docker-compose.yml`

### Container Issues
- Restart containers: `docker-compose -f docker/docker-compose.yml down && docker-compose -f docker/docker-compose.yml up`
- Check logs: `docker-compose -f docker/docker-compose.yml logs [service_name]`
- Rebuild specific service: `docker-compose -f docker/docker-compose.yml build [service_name]`

### Backend TypeScript Changes Not Reflected
- If you change backend TypeScript files, you must run `npm run build` in the backend directory to update the compiled code in `dist/`.
- Then restart the backend container: `docker-compose -f docker/docker-compose.yml restart backend`
- If you skip this, your changes will not take effect.

## Next Steps

- Review the [API Documentation](API.md)
- Check the [Testing Guide](TESTING.md)
- Read the [Contributing Guidelines](CONTRIBUTING.md)

## Support

For additional help:
- Open an issue on GitHub
- Check existing issues for similar problems
- Review the [FAQ](FAQ.md) (coming soon)

## Additional Information

- **Required columns:** `vendor_name`, `expense_description`, `wbs_category`, `wbs_subcategory`
- **Optional columns:** `baseline_date`, `baseline_amount`, `planned_date`, `planned_amount`, `actual_date`, `actual_amount`, `notes`, `invoice_link_text`, `invoice_link_url`
