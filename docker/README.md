# Docker Configuration

This directory contains all Docker-related configuration files for the LRE Manager application.

## Files

- `docker-compose.yml` - Multi-container orchestration
- `Dockerfile.frontend` - Frontend container configuration
- `Dockerfile.backend` - Backend container configuration
- `Dockerfile.db` - Database container configuration

## Quick Start

1. Build and start all containers:
```bash
docker-compose -f docker/docker-compose.yml up --build
```

2. Access the applications:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Database: localhost:5432

## Container Details

### Frontend Container
- Based on Node.js 18 Alpine
- Serves the React application
- Uses Nginx in production
- Exposes port 3000

### Backend Container
- Based on Node.js 18 Alpine
- Runs the Express API server
- Uses TypeORM for database access
- Exposes port 4000

### Database Container
- Based on PostgreSQL 14 Alpine
- Stores application data
- Exposes port 5432
- Uses persistent volume for data storage

## Development

### Rebuilding Containers
```bash
docker-compose -f docker/docker-compose.yml build --no-cache
```

### Viewing Logs
```bash
# All containers
docker-compose -f docker/docker-compose.yml logs

# Specific container
docker-compose -f docker/docker-compose.yml logs frontend
docker-compose -f docker/docker-compose.yml logs backend
docker-compose -f docker/docker-compose.yml logs db
```

### Accessing Containers
```bash
# Frontend container
docker-compose -f docker/docker-compose.yml exec frontend sh

# Backend container
docker-compose -f docker/docker-compose.yml exec backend sh

# Database container
docker-compose -f docker/docker-compose.yml exec db psql -U postgres
```

## Production Deployment

1. Build production images:
```bash
docker-compose -f docker/docker-compose.prod.yml build
```

2. Deploy:
```bash
docker-compose -f docker/docker-compose.prod.yml up -d
```

## Troubleshooting

### Common Issues

1. Port Conflicts
- Check if ports 3000, 4000, or 5432 are in use
- Modify ports in docker/docker-compose.yml if needed

2. Container Startup Issues
- Check container logs
- Verify environment variables
- Ensure all required services are running

3. Database Issues
- Check database logs
- Verify database credentials
- Clear volumes if needed: `docker-compose -f docker/docker-compose.yml down -v`

## Best Practices

### Security
- Use non-root users in containers
- Keep base images updated
- Use multi-stage builds
- Implement proper secrets management

### Performance
- Use appropriate resource limits
- Implement caching strategies
- Optimize image sizes
- Use production-ready configurations

### Maintenance
- Regularly update base images
- Monitor container health
- Implement proper logging
- Use version control for Docker files 