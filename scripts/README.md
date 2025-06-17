# Scripts Directory

This directory contains utility scripts for development, testing, and maintenance of the LRE Manager application.

## Development Scripts

### `setup.sh`
Initial setup script for the development environment. Installs dependencies and sets up the database.
```bash
./setup.sh
```

### `clean.sh`
Cleans up development environment, removes temporary files and containers.
```bash
./clean.sh [options]
```
Options:
- `-h, --help`     Show help message
- `-f, --force`    Force cleanup without confirmation
- `-d, --docker`   Clean Docker resources only
- `-b, --build`    Clean build artifacts only
- `-n, --node`     Clean node_modules only

### `db-reset.sh`
Resets the database to a clean state. Useful for development and testing.
```bash
./db-reset.sh [options]
```
Options:
- `-h, --help`     Show help message
- `-f, --force`    Force reset without confirmation
- `-s, --seed`     Seed the database after reset
- `-m, --migrate`  Run migrations after reset (default: true)
- `-w, --wait`     Wait time for database to be ready (default: 5)

### `db-backup.sh`
Manage database backups
```bash
./db-backup.sh [options]
```
Options:
- `-h, --help`     Show help message
- `-b, --backup`   Create a backup
- `-r, --restore FILE` Restore from backup
- `-l, --list`     List available backups
- `-d, --dir DIR`  Backup directory (default: backups)
- `-f, --force`    Skip confirmation

### Environment Management

- `manage-env.sh`: Manage environment variables
  - Options:
    - `-h, --help`: Show help message
    - `-i, --init`: Initialize environment files
    - `-c, --check`: Check environment variables
    - `-u, --update KEY VAL`: Update a specific variable
    - `-v, --verbose`: Show detailed output
    - `-f, --force`: Skip confirmation

### Docker Management

- `manage-containers.sh`: Manage Docker containers
  - Options:
    - `-h, --help`: Show help message
    - `-l, --list`: List all containers
    - `-s, --start`: Start all containers
    - `-t, --stop`: Stop all containers
    - `-r, --restart`: Restart all containers
    - `-c, --clean`: Remove stopped containers
    - `-b, --rebuild`: Rebuild all containers
    - `-i, --info CONTAINER`: Show container information
    - `-v, --verbose`: Show detailed output
    - `-f, --force`: Skip confirmation

- `manage-volumes.sh`: Manage Docker volumes
  - Options:
    - `-h, --help`: Show help message
    - `-l, --list`: List all volumes
    - `-i, --info VOLUME`: Show volume information
    - `-c, --clean`: Clean unused volumes
    - `-b, --backup VOLUME`: Backup a volume
    - `-r, --restore FILE`: Restore from backup
    - `-v, --verbose`: Show detailed output
    - `-f, --force`: Skip confirmation

## Data Generation Scripts

### `seed_programs_and_expenses.ts`
TypeScript script to seed the database with sample programs and expenses.
```bash
npx ts-node seed_programs_and_expenses.ts
```

### `generate_transactions.sh`
Shell script to generate sample transaction data.
```bash
./generate_transactions.sh [options]
```
Options:
- `-h, --help`           Show help message
- `-a, --annual ID`      Generate transactions for Annual Program (ID required)
- `-p, --pop ID`         Generate transactions for POP Program (ID required)
- `-n, --number NUM`     Number of transactions to generate (default: 40)
- `-u, --url URL`        API URL (default: http://localhost:4000)
- `-v, --verbose`        Show detailed output

## Testing Scripts

### `test.sh`
Runs the test suite for the application.
```bash
./test.sh [options]
```
Options:
- `-h, --help`     Show help message
- `-b, --backend`  Run only backend tests
- `-f, --frontend` Run only frontend tests
- `-v, --verbose`  Show detailed test output

### System Management

- `check-all.sh`: Run all system checks
  - Options:
    - `-h, --help`: Show help message
    - `-v, --verbose`: Show detailed output
    - `-f, --fix`: Attempt to fix issues
  - Checks:
    - System requirements
    - Environment variables
    - Docker volumes
    - Database connection

- `check-requirements.sh`: Check system requirements
  - Options:
    - `-h, --help`: Show help message
    - `-v, --verbose`: Show detailed output
    - `-f, --fix`: Attempt to fix issues

## Directory Structure

- `setup.sh` - Development environment setup
- `clean.sh` - Cleanup script with granular options
- `db-reset.sh` - Database reset utility with safety checks
- `db-backup.sh` - Database backup utility
- `manage-env.sh` - Environment variable management utility
- `manage-volumes.sh` - Docker volume management utility
- `seed_programs_and_expenses.ts` - Database seeding script
- `generate_transactions.sh` - Transaction data generation with flexible options
- `test.sh` - Test runner with selective test execution
- `check-all.sh` - System check utility
- `check-requirements.sh` - System requirement check utility

## Usage Guidelines

1. Always run scripts from the project root directory
2. Make sure you have the required dependencies installed
3. Check the script's help or documentation before running (`./script.sh --help`)
4. Some scripts may require specific environment variables to be set
5. Use the `--help` option to see available options for each script
6. For destructive operations, scripts will ask for confirmation unless `--force` is used
7. **Backend TypeScript changes:** After editing backend TypeScript files, always run `npm run build` in the backend directory and restart the backend container to apply your changes.

## Adding New Scripts

When adding new scripts:
1. Add proper documentation in this README
2. Include help/usage information in the script
3. Follow the existing naming conventions
4. Add appropriate error handling
5. Make scripts executable (`chmod +x script.sh`)
6. Include command-line options for flexibility
7. Add confirmation prompts for destructive operations
8. Add progress reporting for long-running operations
9. Include health checks for required services

## Quick Start Guide

### Initial Setup
```bash
# Check system requirements
./check-all.sh -v

# Initialize environment files
./manage-env.sh -i

# Start the development environment
./manage-containers.sh -s

# Seed the database with test data
./seed_programs_and_expenses.ts
```

### Daily Development
```bash
# If you make changes to backend TypeScript code:
cd backend
npm run build
cd ..
# Then restart the backend container:
docker-compose -f docker/docker-compose.yml restart backend

# Start your development session
./manage-containers.sh -s

# Check if everything is running correctly
./check-all.sh

# Generate test transactions
./generate_transactions.sh -a 1 -p 2 -n 10

# Run tests
./test.sh -b -f
```

### Database Management
```bash
# Create a backup before making changes
./db-backup.sh -b

# Reset the database if needed
./db-reset.sh -f -s

# Restore from backup if something goes wrong
./db-backup.sh -r backups/lre_manager_20240315_123456.tar
```

### Docker Management
```bash
# List all containers and their status
./manage-containers.sh -l

# Rebuild containers after dependency changes
./manage-containers.sh -b

# Check container logs
./manage-containers.sh -i backend

# Clean up stopped containers
./manage-containers.sh -c
```

### Environment Management
```bash
# Check if all environment variables are set
./manage-env.sh -c

# Update a specific environment variable
./manage-env.sh -u DB_PASSWORD newpassword

# Initialize environment files in a new clone
./manage-env.sh -i
```

### Cleanup and Maintenance
```bash
# Clean up development artifacts
./clean.sh -d -b -n

# Clean up Docker resources
./manage-volumes.sh -c

# Check system health
./check-all.sh -v
```

### Troubleshooting
```bash
# Check if Docker is running properly
./manage-containers.sh -l -v

# Verify database connection
./check-all.sh -v

# Check container logs
./manage-containers.sh -i backend -v

# Verify environment variables
./manage-env.sh -c -v
```

### Production Deployment
```bash
# Backup database before deployment
./db-backup.sh -b

# Stop all containers
./manage-containers.sh -t

# Rebuild containers with new code
./manage-containers.sh -b

# Start containers
./manage-containers.sh -s

# Verify everything is running
./check-all.sh -v
```

## Available Scripts

- **Required columns:** `vendor_name`, `expense_description`, `wbs_category`, `wbs_subcategory`
- **Optional columns:** `baseline_date`, `baseline_amount`, `planned_date`, `planned_amount`, `actual_date`, `actual_amount`, `notes`, `invoice_link_text`, `invoice_link_url`