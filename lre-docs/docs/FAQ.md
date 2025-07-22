# Frequently Asked Questions

## General Questions

### What is LRE Manager?
LRE Manager is a comprehensive tool for managing Latest Revised Estimate (LRE) programs, tracking expenses, and maintaining financial records.

### What are the system requirements?
- Node.js v18 or later
- npm v8 or later
- Docker and Docker Compose
- PostgreSQL 14 or later (if running without Docker)

## Installation & Setup

### How do I install LRE Manager?
Follow the setup instructions in `docs/SETUP.md`. The basic steps are:
 - Clone the repository
 - Install dependencies
 - Configure environment variables
 - Start the development environment

### How do I start the application?
```bash
docker-compose -f docker/docker-compose.yml up
```

### How do I stop the application?
```bash
docker-compose -f docker/docker-compose.yml down
```

## Troubleshooting

### The application won't start
Try these steps in order:
 - Check if all required ports are available
 - Rebuild the containers:
   ```bash
   docker-compose -f docker/docker-compose.yml build --no-cache
   ```
 - Check the logs:
   ```bash
   docker-compose -f docker/docker-compose.yml logs
   ```
 - Restart all containers:
   ```bash
   docker-compose -f docker/docker-compose.yml down && docker-compose -f docker/docker-compose.yml up
   ```

### Database connection issues
 - Ensure the database container is running:
   ```bash
   docker-compose -f docker/docker-compose.yml ps
   ```
 - Check database logs:
   ```bash
   docker-compose -f docker/docker-compose.yml logs db
   ```
 - Verify environment variables in `.env` files

### Frontend/Backend communication issues
 - Check if both services are running:
   ```bash
   docker-compose -f docker/docker-compose.yml ps
   ```
 - Verify the API URL in frontend environment variables
 - Check network connectivity between containers

## Development

### How do I add new features?
 - Create a new branch from `main`
 - Make your changes
 - Write tests
 - Submit a pull request

### How do I run tests?
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### How do I update dependencies?
```bash
# Backend
cd backend
npm update

# Frontend
cd frontend
npm update
```

## Production

### How do I deploy to production?
 - Build production images:
   ```bash
   docker-compose -f docker/docker-compose.prod.yml build
   ```
 - Deploy using your preferred method (see `docs/DEPLOYMENT.md`)

### How do I backup the database?
```bash
docker-compose -f docker/docker-compose.yml exec db pg_dump -U postgres lre_manager > backup.sql
```

### How do I restore from a backup?
```bash
docker-compose -f docker/docker-compose.yml exec db psql -U postgres lre_manager < backup.sql
```

## Support

### Where can I get help?
 - Check the documentation
 - Open a GitHub issue
 - Contact the maintainers
 - Join the community chat

### How do I report a security issue?
Please email security@example.com with details of the vulnerability. 