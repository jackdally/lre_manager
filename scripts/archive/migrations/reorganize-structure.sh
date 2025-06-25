#!/bin/bash

# =============================================================================
# ⚠️  DEPRECATED SCRIPT - DO NOT RUN ⚠️
# =============================================================================
# This script has been executed and is archived for reference only.
# Running this script again may cause issues with your codebase.
# 
# Purpose: Reorganized the entire project structure for better maintainability
# Executed: [Date when you ran this migration]
# 
# See scripts/archive/migrations/README.md for details about what this script accomplished.
# =============================================================================

# Directory Structure Reorganization Script
# Updated to work with current structure after feature reorganization
# This script helps implement the recommended directory structure improvements

set -e

echo "🏗️ Starting Directory Structure Reorganization"
echo "=============================================="

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

# Check if running in project root
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Function to create directory if it doesn't exist
create_dir() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        print_success "Created directory: $1"
    else
        print_warning "Directory already exists: $1"
    fi
}

# Function to create file with content
create_file() {
    local file_path="$1"
    local content="$2"
    
    if [ ! -f "$file_path" ]; then
        echo "$content" > "$file_path"
        print_success "Created file: $file_path"
    else
        print_warning "File already exists: $file_path"
    fi
}

echo ""
echo "📁 Phase 1: Creating Backend Structure"
echo "======================================"

# Backend directories
print_status "Creating backend directory structure..."

# Main backend directories
create_dir "backend/src/controllers"
create_dir "backend/src/repositories"
create_dir "backend/src/middleware"
create_dir "backend/src/utils"
create_dir "backend/src/types"
create_dir "backend/src/migrations"
create_dir "backend/src/seeds"
create_dir "backend/src/tests"
create_dir "backend/src/tests/unit"
create_dir "backend/src/tests/integration"
create_dir "backend/src/tests/e2e"

# Create backend type definitions
print_status "Creating backend type definitions..."

create_file "backend/src/types/api.ts" 'export interface ApiResponse<T = any> {
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
  sortOrder?: "ASC" | "DESC";
}

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}'

create_file "backend/src/types/entities.ts" 'export interface ProgramCreateRequest {
  code: string;
  name: string;
  description: string;
  type: "Annual" | "Period of Performance";
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

export interface ImportConfig {
  vendorColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  dateColumn: string;
  programCodeColumn?: string;
  invoiceColumn?: string;
  categoryColumn?: string;
  subcategoryColumn?: string;
}'

create_file "backend/src/types/middleware.ts" 'import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface ValidationSchema {
  body?: any;
  query?: any;
  params?: any;
}

export type MiddlewareFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;'

# Create backend utility files
print_status "Creating backend utility files..."

create_file "backend/src/utils/logger.ts" 'import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
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
      filename: "logs/error.log", 
      level: "error" 
    }),
    new winston.transports.File({ 
      filename: "logs/combined.log" 
    })
  ],
});

// Create logs directory
import fs from "fs";
import path from "path";

const logsDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}'

create_file "backend/src/utils/validators.ts" 'import Joi from "joi";

export const programSchema = Joi.object({
  code: Joi.string().required().pattern(/^[A-Z]{3}\.\d{4}$/),
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().required(),
  type: Joi.string().valid("Annual", "Period of Performance").required(),
  totalBudget: Joi.number().positive().required(),
  status: Joi.string().default("Active"),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  program_manager: Joi.string().optional()
});

export const ledgerEntrySchema = Joi.object({
  vendor_name: Joi.string().required(),
  expense_description: Joi.string().required(),
  wbs_category: Joi.string().required(),
  wbs_subcategory: Joi.string().required(),
  baseline_date: Joi.date().optional(),
  baseline_amount: Joi.number().positive().optional(),
  planned_date: Joi.date().optional(),
  planned_amount: Joi.number().positive().optional(),
  actual_date: Joi.date().optional(),
  actual_amount: Joi.number().positive().optional(),
  notes: Joi.string().optional(),
  invoice_link_text: Joi.string().optional(),
  invoice_link_url: Joi.string().uri().optional()
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC")
});'

create_file "backend/src/utils/formatters.ts" 'export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};'

create_file "backend/src/utils/helpers.ts" 'export const isValidUUID = (str: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};'

echo ""
echo "📁 Phase 2: Creating Frontend Structure"
echo "======================================"

# Frontend directories
print_status "Creating frontend directory structure..."

# Main frontend directories (skip features since it already exists)
create_dir "frontend/src/components/common"
create_dir "frontend/src/components/layout"
create_dir "frontend/src/components/pages"
create_dir "frontend/src/hooks"
create_dir "frontend/src/services"
create_dir "frontend/src/utils"
create_dir "frontend/src/types"
create_dir "frontend/src/context"

# Feature directories - work with existing structure
print_status "Working with existing feature structure..."

# Programs feature directories
create_dir "frontend/src/components/features/programs"
create_dir "frontend/src/components/features/programs/ProgramDirectory"
create_dir "frontend/src/components/features/programs/ProgramDashboard"
create_dir "frontend/src/components/features/programs/ProgramSettings"

# Ledger feature directories (work with existing)
create_dir "frontend/src/components/features/ledger/LedgerPage"
create_dir "frontend/src/components/features/ledger/LedgerEntry"
create_dir "frontend/src/components/features/ledger/LedgerTable"

# Actuals feature directories (already exist, just ensure subdirectories)
create_dir "frontend/src/components/features/actuals/ActualsUploadPage"
create_dir "frontend/src/components/features/actuals/TransactionMatchModal"
create_dir "frontend/src/components/features/actuals/UploadSessionDetails"

# Create frontend type definitions
print_status "Creating frontend type definitions..."

create_file "frontend/src/types/api.ts" 'export interface ApiResponse<T = any> {
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
  sortOrder?: "ASC" | "DESC";
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}'

create_file "frontend/src/types/programs.ts" 'export interface Program {
  id: string;
  code: string;
  name: string;
  description: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  totalBudget: number;
  type: "Annual" | "Period of Performance";
  program_manager?: string | null;
}

export interface ProgramCreateRequest {
  code: string;
  name: string;
  description: string;
  type: "Annual" | "Period of Performance";
  totalBudget: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  program_manager?: string;
}

export interface ProgramUpdateRequest extends Partial<ProgramCreateRequest> {
  id: string;
}'

create_file "frontend/src/types/ledger.ts" 'export interface LedgerEntry {
  id: string;
  vendor_name: string;
  expense_description: string;
  wbs_category: string;
  wbs_subcategory: string;
  baseline_date: string | null;
  baseline_amount: number | null;
  planned_date: string | null;
  planned_amount: number | null;
  actual_date: string | null;
  actual_amount: number | null;
  notes: string | null;
  invoice_link_text: string | null;
  invoice_link_url: string | null;
  program: {
    id: string;
    code: string;
    name: string;
  };
  importTransaction?: {
    id: string;
    vendorName: string;
    description: string;
    amount: number;
    transactionDate: string;
    status: string;
    importSession?: {
      id: string;
      originalFilename: string;
      description: string;
      createdAt: string;
    };
  };
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

export interface LedgerSummary {
  month: string;
  actualsToDate: number;
  plannedToDate: number;
  baselineToDate: number;
  budget: number;
  etc: number;
  eac: number;
  vac: number;
  monthlyCashFlow: number;
  scheduleVariance: number;
  costVariance: number;
  schedulePerformanceIndex: number;
  costPerformanceIndex: number;
}'

create_file "frontend/src/types/actuals.ts" 'export interface ActualsSession {
  id: string;
  filename: string;
  originalFilename: string;
  description: string;
  status: string;
  totalRecords: number;
  processedRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  errorRecords: number;
  createdAt: string;
  updatedAt: string;
  program: {
    id: string;
    code: string;
    name: string;
  };
}

export interface ActualsTransaction {
  id: string;
  vendorName: string;
  description: string;
  amount: number;
  transactionDate: string;
  programCode: string;
  category: string | null;
  subcategory: string | null;
  invoiceNumber: string | null;
  referenceNumber: string | null;
  transactionId: string | null;
  status: string;
  duplicateType: string;
  duplicateOfId: string | null;
  createdAt: string;
  updatedAt: string;
  actualsSession: {
    id: string;
    originalFilename: string;
    description: string;
  };
}

export interface ActualsConfig {
  vendorColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  dateColumn: string;
  programCodeColumn?: string;
  invoiceColumn?: string;
  categoryColumn?: string;
  subcategoryColumn?: string;
}'

# Create frontend utility files
print_status "Creating frontend utility files..."

create_file "frontend/src/utils/formatters.ts" 'export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount == null) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "N/A";
  const datePart = dateStr.split("T")[0];
  const [y, m, d] = datePart.split("-");
  return `${m}/${d}/${y}`;
};

export const formatDateTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export const formatPercentage = (value: number | null | undefined): string => {
  if (value == null) return "--";
  return `${(value * 100).toFixed(1)}%`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};'

create_file "frontend/src/utils/validators.ts" 'export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidProgramCode = (code: string): boolean => {
  const codeRegex = /^[A-Z]{3}\.\d{4}$/;
  return codeRegex.test(code);
};

export const isValidAmount = (amount: string): boolean => {
  const amountRegex = /^\d+(\.\d{1,2})?$/;
  return amountRegex.test(amount) && parseFloat(amount) > 0;
};

export const isValidDate = (date: string): boolean => {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

export const validateRequired = (value: any): boolean => {
  return value !== null && value !== undefined && value !== "";
};'

create_file "frontend/src/utils/constants.ts" 'export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
};

export const FILE_TYPES = {
  EXCEL: [".xlsx", ".xls"],
  CSV: [".csv"],
  ALL: [".xlsx", ".xls", ".csv"]
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const PROGRAM_TYPES = ["Annual", "Period of Performance"] as const;

export const PROGRAM_STATUSES = ["Active", "Inactive", "Completed", "On Hold"] as const;

export const TRANSACTION_STATUSES = [
  "UNMATCHED",
  "MATCHED",
  "CONFIRMED",
  "REJECTED",
  "ADDED_TO_LEDGER",
  "REPLACED"
] as const;

export const DUPLICATE_TYPES = [
  "NONE",
  "EXACT",
  "INVOICE_MATCH",
  "NO_INVOICE_POTENTIAL",
  "MULTIPLE_POTENTIAL"
] as const;'

create_file "frontend/src/utils/helpers.ts" 'export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};'

echo ""
echo "📁 Phase 3: Creating Scripts Organization"
echo "========================================="

# Scripts directories
print_status "Creating scripts directory structure..."

create_dir "scripts/development"
create_dir "scripts/production"
create_dir "scripts/database"
create_dir "scripts/testing"
create_dir "scripts/maintenance"
create_dir "scripts/utils"

# Create script README files
print_status "Creating script documentation..."

create_file "scripts/development/README.md" '# Development Scripts

This directory contains scripts for development environment setup and management.

## Scripts

- `setup-dev.sh` - Set up development environment
- `start-dev.sh` - Start development servers
- `clean-dev.sh` - Clean development environment

## Usage

```bash
# Set up development environment
./scripts/development/setup-dev.sh

# Start development servers
./scripts/development/start-dev.sh

# Clean development environment
./scripts/development/clean-dev.sh
```'

create_file "scripts/production/README.md" '# Production Scripts

This directory contains scripts for production environment setup and deployment.

## Scripts

- `setup-prod.sh` - Set up production environment
- `deploy.sh` - Deploy to production
- `backup.sh` - Create production backups

## Usage

```bash
# Set up production environment
./scripts/production/setup-prod.sh

# Deploy to production
./scripts/production/deploy.sh

# Create production backup
./scripts/production/backup.sh
```'

create_file "scripts/database/README.md" '# Database Scripts

This directory contains scripts for database management and operations.

## Scripts

- `reset.sh` - Reset database
- `backup.sh` - Backup database
- `migrate.sh` - Run database migrations
- `seed.sh` - Seed database with test data

## Usage

```bash
# Reset database
./scripts/database/reset.sh

# Backup database
./scripts/database/backup.sh

# Run migrations
./scripts/database/migrate.sh

# Seed database
./scripts/database/seed.sh
```'

echo ""
echo "📁 Phase 4: Creating Configuration Files"
echo "======================================="

# Update TypeScript configurations
print_status "Updating TypeScript configurations..."

# Update frontend tsconfig.json
create_file "frontend/tsconfig.json" '{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/services/*": ["src/services/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"],
      "@/context/*": ["src/context/*"]
    }
  },
  "include": ["src"]
}'

# Update backend tsconfig.json
create_file "backend/tsconfig.json" '{
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/controllers/*": ["src/controllers/*"],
      "@/services/*": ["src/services/*"],
      "@/middleware/*": ["src/middleware/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"],
      "@/entities/*": ["src/entities/*"],
      "@/config/*": ["src/config/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}'

echo ""
echo "✅ Phase 5: Final Steps"
echo "======================"

print_success "Directory structure reorganization completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Review the new structure in docs/DIRECTORY_STRUCTURE_IMPROVEMENTS.md"
echo "2. Gradually move existing files to their new locations"
echo "3. Update import statements as you move files"
echo "4. Test thoroughly after each move"
echo ""
echo "🔧 Migration Tips:"
echo "- Start with one feature at a time"
echo "- Use search and replace to update imports"
echo "- Keep the old structure until migration is complete"
echo "- Test each component after moving"
echo ""
echo "📚 Documentation:"
echo "- Structure guide: docs/DIRECTORY_STRUCTURE_IMPROVEMENTS.md"
echo "- Production readiness: docs/PRODUCTION_READINESS_REVIEW.md"
echo "- Immediate actions: docs/IMMEDIATE_ACTION_ITEMS.md"
echo ""

print_success "🎉 Directory structure reorganization script completed successfully!" 