#!/bin/bash

# Production Setup Script for LRE Manager
# This script implements critical production readiness improvements

set -e

echo "🚀 Starting Production Setup for LRE Manager"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running in project root
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Phase 1: Security Improvements
echo ""
echo "🔒 Phase 1: Security Improvements"
echo "=================================="

# 1.1 Create production environment template
print_status "Creating production environment template..."
if [ ! -f "config/env/production.js" ]; then
    cp config/env/development.js config/env/production.js
    print_success "Created production environment template"
else
    print_warning "Production environment template already exists"
fi

# 1.2 Create .env.production template
print_status "Creating .env.production template..."
cat > .env.production.template << 'EOF'
# Production Environment Variables
NODE_ENV=production

# Database Configuration
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=lre_manager

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRATION=24h

# Logging
LOG_LEVEL=info

# Frontend URL
FRONTEND_URL=https://your-domain.com

# Redis Configuration (for caching)
REDIS_HOST=your-redis-host
REDIS_PORT=6379

# File Upload Limits
MAX_FILE_SIZE=10485760
EOF

print_success "Created .env.production.template"

# 1.3 Install security dependencies
print_status "Installing security dependencies..."
cd backend
npm install --save helmet express-rate-limit joi winston
npm install --save-dev @types/helmet
cd ..

# Phase 2: Create Security Middleware
echo ""
echo "🛡️ Phase 2: Creating Security Middleware"
echo "========================================="

# Create middleware directory
mkdir -p backend/src/middleware

# Create security middleware
print_status "Creating security middleware..."
cat > backend/src/middleware/security.ts << 'EOF'
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Express } from 'express';

export const securityMiddleware = (app: Express) => {
  // Security headers
  app.use(helmet());
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
  });
  app.use('/api/', limiter);
  
  // File upload limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
};
EOF

# Create validation middleware
print_status "Creating validation middleware..."
cat > backend/src/middleware/validation.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }
    next();
  };
};

// Common validation schemas
export const programSchema = Joi.object({
  code: Joi.string().required().pattern(/^[A-Z]{3}\.\d{4}$/),
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().required(),
  type: Joi.string().valid('Annual', 'Period of Performance').required(),
  totalBudget: Joi.number().positive().required(),
  status: Joi.string().default('Active'),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  program_manager: Joi.string().optional()
});
EOF

# Create error handler middleware
print_status "Creating error handler middleware..."
cat > backend/src/middleware/errorHandler.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });
  
  res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};
EOF

# Phase 3: Create Logging Utility
echo ""
echo "📝 Phase 3: Setting up Structured Logging"
echo "========================================="

# Create utils directory
mkdir -p backend/src/utils

# Create logger utility
print_status "Creating logger utility..."
cat > backend/src/utils/logger.ts << 'EOF'
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ],
});

// Create logs directory
import fs from 'fs';
import path from 'path';

const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
EOF

# Phase 4: Create Type Definitions
echo ""
echo "🔧 Phase 4: Setting up Type Definitions"
echo "======================================="

# Create types directory
mkdir -p backend/src/types

# Create shared types
print_status "Creating shared type definitions..."
cat > backend/src/types/index.ts << 'EOF'
export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ProgramCreateRequest {
  code: string;
  name: string;
  description: string;
  type: 'Annual' | 'Period of Performance';
  totalBudget: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  program_manager?: string;
}

export interface LedgerEntryCreateRequest {
  vendor_name: string;
  expense_description: string;
  wbs_category: string;
  wbs_subcategory: string;
  baseline_date?: string;
  baseline_amount?: number;
  planned_date?: string;
  planned_amount?: number;
  actual_date?: string;
  actual_amount?: number;
  notes?: string;
  invoice_link_text?: string;
  invoice_link_url?: string;
}
EOF

# Phase 5: Create Health Check Endpoint
echo ""
echo "🏥 Phase 5: Setting up Health Checks"
echo "===================================="

# Create health check route
print_status "Creating health check endpoint..."
cat > backend/src/routes/health.ts << 'EOF'
import { Router } from 'express';
import { AppDataSource } from '../config/database';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    await AppDataSource.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/health/ready', async (req, res) => {
  try {
    // Check database connection
    await AppDataSource.query('SELECT 1');
    
    // Check if we can perform a basic operation
    const programRepo = AppDataSource.getRepository('Program');
    await programRepo.count();
    
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ 
      status: 'not ready', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export const healthRouter = router;
EOF

# Phase 6: Update Main Application
echo ""
echo "⚙️ Phase 6: Updating Main Application"
echo "====================================="

# Update backend index.ts to include new middleware
print_status "Updating main application file..."
cp backend/src/index.ts backend/src/index.ts.backup

# Create updated index.ts
cat > backend/src/index.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { AppDataSource } from './config/database';
import { programRouter } from './routes/program';
import { ledgerRouter } from './routes/ledger';
import { wbsRouter } from './routes/wbs';
import { importRouter } from './routes/import';
import { healthRouter } from './routes/health';
import { securityMiddleware } from './middleware/security';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import * as XLSX from 'xlsx';
import { Express } from 'express';

const app = express();
const port = process.env.PORT || 4000;

// Security middleware
securityMiddleware(app);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LRE Manager API',
      version: '1.0.0',
      description: 'API documentation for LRE Manager',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Health check routes
app.use('/api', healthRouter);

// API routes
app.use('/api/programs', programRouter);
app.use('/api/programs', ledgerRouter);
app.use('/api/programs', wbsRouter);
app.use('/api/import', importRouter);

// Dedicated endpoint for ledger template download
app.get('/api/ledger/template', (req, res) => {
  const headers = [
    'vendor_name',
    'expense_description',
    'wbs_category',
    'wbs_subcategory',
    'baseline_date',
    'baseline_amount',
    'planned_date',
    'planned_amount',
    'actual_date',
    'actual_amount',
    'notes',
    'invoice_link_text',
    'invoice_link_url',
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'LedgerTemplate');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="ledger_template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Debug: Print all registered routes
function printRoutes(app: Express) {
  const routes: any[] = [];
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) { // routes registered directly on the app
      routes.push(middleware.route);
    } else if (middleware.name === 'router') { // router middleware 
      middleware.handle.stack.forEach((handler: any) => {
        let route;
        route = handler.route;
        route && routes.push(route);
      });
    }
  });
  logger.info('Registered routes:', routes.map(route => {
    const methods = Object.keys(route.methods).join(', ').toUpperCase();
    return `${methods} ${route.path}`;
  }));
}

// Initialize database connection
AppDataSource.initialize()
  .then(() => {
    logger.info('Database connection established');
    printRoutes(app); // Print all routes after DB is ready
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    logger.error('Error during Data Source initialization:', error);
    process.exit(1);
  });
EOF

# Phase 7: Create Production Docker Configuration
echo ""
echo "🐳 Phase 7: Creating Production Docker Configuration"
echo "==================================================="

# Create production docker-compose
print_status "Creating production docker-compose configuration..."
cat > docker/docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  frontend:
    build:
      context: ..
      dockerfile: docker/Dockerfile.frontend
    image: lre_manager_take2-frontend:prod
    container_name: lre_manager_take2-frontend-prod
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  backend:
    build:
      context: ..
      dockerfile: docker/Dockerfile.backend
    image: lre_manager_take2-backend:prod
    container_name: lre_manager_take2-backend-prod
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DB_HOST=${DB_HOST:-db}
      - DB_PORT=${DB_PORT:-5432}
      - DB_USER=${DB_USER:-postgres}
      - DB_PASSWORD=${DB_PASSWORD:-postgres}
      - DB_NAME=${DB_NAME:-lre_manager}
      - JWT_SECRET=${JWT_SECRET:-change-me-in-production}
      - JWT_EXPIRATION=${JWT_EXPIRATION:-24h}
      - LOG_LEVEL=${LOG_LEVEL:-info}
      - FRONTEND_URL=${FRONTEND_URL:-http://localhost}
      - REDIS_HOST=${REDIS_HOST:-redis}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    container_name: lre_manager_take2-db-prod
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_NAME:-lre_manager}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres}"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: lre_manager_take2-redis-prod
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
    driver: local
EOF

# Update production Dockerfile
print_status "Updating production Dockerfile..."
cat > docker/Dockerfile.backend.prod << 'EOF'
# Multi-stage build for smaller production image
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies for building
COPY backend/package*.json ./
RUN npm ci

# Copy source code
COPY backend/ ./

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Create logs directory
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Switch to non-root user
USER nodejs

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

CMD ["node", "dist/index.js"]
EOF

# Phase 8: Create Deployment Scripts
echo ""
echo "🚀 Phase 8: Creating Deployment Scripts"
echo "======================================="

# Create deployment script
print_status "Creating deployment script..."
cat > scripts/deploy-prod.sh << 'EOF'
#!/bin/bash

# Production Deployment Script for LRE Manager

set -e

echo "🚀 Starting Production Deployment"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    print_status "Please copy .env.production.template to .env.production and configure it"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker/docker-compose.prod.yml down

# Build new images
print_status "Building production images..."
docker-compose -f docker/docker-compose.prod.yml build --no-cache

# Start services
print_status "Starting production services..."
docker-compose -f docker/docker-compose.prod.yml up -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 30

# Check health
print_status "Checking service health..."
if curl -f http://localhost:4000/api/health > /dev/null 2>&1; then
    print_success "Backend is healthy"
else
    print_error "Backend health check failed"
    exit 1
fi

if curl -f http://localhost > /dev/null 2>&1; then
    print_success "Frontend is healthy"
else
    print_error "Frontend health check failed"
    exit 1
fi

print_success "Production deployment completed successfully!"
print_status "Frontend: http://localhost"
print_status "Backend API: http://localhost:4000"
print_status "API Documentation: http://localhost:4000/api-docs"
EOF

chmod +x scripts/deploy-prod.sh

# Phase 9: Create Monitoring Script
echo ""
echo "📊 Phase 9: Creating Monitoring Scripts"
echo "======================================="

# Create monitoring script
print_status "Creating monitoring script..."
cat > scripts/monitor.sh << 'EOF'
#!/bin/bash

# Monitoring Script for LRE Manager

set -e

echo "📊 LRE Manager System Monitor"
echo "============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check container status
echo "🐳 Container Status:"
docker-compose -f docker/docker-compose.prod.yml ps

echo ""
echo "🏥 Health Checks:"

# Backend health
if curl -f http://localhost:4000/api/health > /dev/null 2>&1; then
    print_success "Backend: Healthy"
else
    print_error "Backend: Unhealthy"
fi

# Frontend health
if curl -f http://localhost > /dev/null 2>&1; then
    print_success "Frontend: Healthy"
else
    print_error "Frontend: Unhealthy"
fi

# Database health
if docker-compose -f docker/docker-compose.prod.yml exec -T db pg_isready -U postgres > /dev/null 2>&1; then
    print_success "Database: Healthy"
else
    print_error "Database: Unhealthy"
fi

# Redis health
if docker-compose -f docker/docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis: Healthy"
else
    print_error "Redis: Unhealthy"
fi

echo ""
echo "💾 Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

echo ""
echo "📈 Application Metrics:"
curl -s http://localhost:4000/api/health | jq '.' 2>/dev/null || echo "Unable to fetch metrics"
EOF

chmod +x scripts/monitor.sh

# Phase 10: Final Steps
echo ""
echo "✅ Phase 10: Final Setup Steps"
echo "=============================="

print_success "Production setup completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Copy .env.production.template to .env.production and configure it"
echo "2. Update your production environment variables"
echo "3. Run: ./scripts/deploy-prod.sh"
echo "4. Monitor with: ./scripts/monitor.sh"
echo ""
echo "🔧 Additional Recommendations:"
echo "- Set up SSL/TLS certificates for HTTPS"
echo "- Configure backup strategies for the database"
echo "- Set up monitoring and alerting (e.g., Prometheus, Grafana)"
echo "- Implement log aggregation (e.g., ELK stack)"
echo "- Set up CI/CD pipelines for automated deployments"
echo ""
echo "📚 Documentation:"
echo "- Production setup guide: docs/PRODUCTION_READINESS_REVIEW.md"
echo "- API documentation: http://localhost:4000/api-docs (after deployment)"
echo ""

print_success "🎉 Production setup script completed successfully!" 