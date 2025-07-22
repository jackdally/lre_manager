# Docker Configuration

This directory contains all Docker-related configuration files for the LRE Manager application.

## Files

### Development Configuration
- `docker-compose.dev.yml` - Development multi-container orchestration
- `Dockerfile.frontend.dev` - Frontend development container
- `Dockerfile.backend.dev` - Backend development container
- `Dockerfile.docs.dev` - Documentation development container

### Production Configuration
- `docker-compose.prod.yml` - Production multi-container orchestration
- `Dockerfile.frontend.prod` - Frontend production container
- `Dockerfile.backend.prod` - Backend production container
- `Dockerfile.docs.prod` - Documentation production container
- `nginx.conf` - Nginx configuration for frontend
- `nginx.docs.conf` - Nginx configuration for documentation
- `env.prod.example` - Production environment template

### Deployment Scripts
- `../scripts/deploy-prod.sh` - Production deployment script

## Quick Start

### Development Environment

1. Build and start all development containers:
```bash
docker-compose -f docker/docker-compose.dev.yml up --build
```

2. Access the applications:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Documentation: http://localhost:3001
- Database: localhost:5432

### Production Environment

1. Set up production environment:
```bash
cp docker/env.prod.example docker/.env.prod
# Edit docker/.env.prod with your production values
```

2. Deploy using the deployment script:
```bash
./scripts/deploy-prod.sh
```

Or manually:
```bash
docker-compose -f docker/docker-compose.prod.yml up --build -d
```

## Container Details

### Frontend Container
- **Development**: Node.js 18 Alpine with hot-reloading
- **Production**: Multi-stage build with Nginx serving static files
- Exposes port 3000 (dev) or 80 (prod)

### Backend Container
- **Development**: Node.js 18 Alpine with hot-reloading
- **Production**: Multi-stage build with optimized dependencies
- Uses TypeORM for database access
- Exposes port 4000
- Includes health checks in production

### Documentation Container
- **Development**: Node.js 18 Alpine running Docusaurus dev server
- **Production**: Multi-stage build with Nginx serving static site
- Exposes port 3001 (dev) or 80 (prod)
- Includes search, auto-linking, and responsive design

### Database Container
- Based on PostgreSQL 15 Alpine
- Stores application data
- Exposes port 5432
- Uses persistent volume for data storage

## Development

### Rebuilding Containers
```bash
# Development
docker-compose -f docker/docker-compose.dev.yml build --no-cache

# Production
docker-compose -f docker/docker-compose.prod.yml build --no-cache
```

### Viewing Logs
```bash
# Development - All containers
docker-compose -f docker/docker-compose.dev.yml logs

# Development - Specific container
docker-compose -f docker/docker-compose.dev.yml logs frontend
docker-compose -f docker/docker-compose.dev.yml logs backend
docker-compose -f docker/docker-compose.dev.yml logs docs

# Production
docker-compose -f docker/docker-compose.prod.yml logs -f
```

### Accessing Containers
```bash
# Development containers
docker-compose -f docker/docker-compose.dev.yml exec frontend sh
docker-compose -f docker/docker-compose.dev.yml exec backend sh
docker-compose -f docker/docker-compose.dev.yml exec docs sh

# Production containers
docker-compose -f docker/docker-compose.prod.yml exec frontend sh
docker-compose -f docker/docker-compose.prod.yml exec backend sh
docker-compose -f docker/docker-compose.prod.yml exec docs sh

# Database
docker-compose -f docker/docker-compose.dev.yml exec db psql -U postgres
```

## Production Deployment

### Automated Deployment
Use the deployment script for a complete production setup:
```bash
./scripts/deploy-prod.sh
```

The script will:
- Check for required environment files
- Stop existing containers
- Build and start production containers
- Perform health checks
- Display service URLs

### Manual Deployment
1. Set up environment variables:
```bash
cp docker/env.prod.example docker/.env.prod
# Edit with your production values
```

2. Build and deploy:
```bash
docker-compose -f docker/docker-compose.prod.yml up --build -d
```

3. Check service health:
```bash
curl http://localhost:3000  # Frontend
curl http://localhost:4000/api/health  # Backend
curl http://localhost:3001  # Documentation
```

### Environment Variables
Key production environment variables:
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - JWT signing secret
- `REACT_APP_API_URL` - Frontend API URL
- `CORS_ORIGIN` - Allowed CORS origins

## Documentation Service

The documentation service runs Docusaurus and provides:
- **Auto-linking**: Automatic cross-references between documents
- **Search**: Full-text search across all documentation
- **Responsive Design**: Mobile-friendly interface
- **Versioning**: Support for multiple documentation versions
- **Custom Styling**: Branded with LRE Manager theme

### Documentation Structure
- **Getting Started**: Setup, architecture, API examples
- **Features**: Roadmap, implementation plans, completed features
- **Tasks**: Active tasks, completed tasks, task management
- **Implementation**: Implementation plans, sprint planning, archived plans

## Troubleshooting

### Common Issues

1. **Port Conflicts**
- Check if ports 3000, 3001, 4000, or 5432 are in use
- Modify ports in docker-compose files if needed

2. **Container Startup Issues**
- Check container logs: `docker-compose logs <service>`
- Verify environment variables
- Ensure all required services are running

3. **Database Issues**
- Check database logs
- Verify database credentials
- Clear volumes if needed: `docker-compose down -v`

4. **Documentation Build Errors**
- Check for invalid sidebar references
- Verify document IDs match file names
- Check for syntax errors in Markdown files

### Health Checks
Production containers include health checks:
```bash
# Check container health
docker-compose -f docker/docker-compose.prod.yml ps

# View health check logs
docker-compose -f docker/docker-compose.prod.yml logs backend | grep health
```

## Best Practices

### Security
- Use non-root users in production containers
- Keep base images updated
- Use multi-stage builds to reduce attack surface
- Implement proper secrets management
- Use environment variables for sensitive data

### Performance
- Use appropriate resource limits
- Implement caching strategies (nginx, application-level)
- Optimize image sizes with multi-stage builds
- Use production-ready configurations
- Enable gzip compression

### Maintenance
- Regularly update base images
- Monitor container health
- Implement proper logging
- Use version control for Docker files
- Document environment requirements

### Documentation
- Keep documentation up to date
- Use consistent naming conventions
- Include examples and troubleshooting guides
- Maintain clear separation between dev and prod configs 