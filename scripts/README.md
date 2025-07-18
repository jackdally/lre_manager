# Scripts Directory

This directory contains various utility scripts for development, deployment, and maintenance tasks.

## Directory Structure

```
scripts/
├── development/               # Development environment scripts
├── production/                # Production deployment scripts
├── database/                  # Database management scripts
├── testing/                   # Testing and validation scripts
├── maintenance/               # Maintenance and cleanup scripts
├── utils/                     # Utility scripts
├── samples/                   # Sample files and templates
├── archive/                   # Obsolete scripts (for reference)
│   ├── migrations/            # One-time migration scripts
│   └── README.md              # Archive documentation
└── README.md                  # This file
```

## Active Scripts

### Development
- `development/setup.sh` - Set up development environment

### Production
- `production/production-setup.sh` - Production environment setup

### Database
- `database/db-backup.sh` - Database backup
- `database/db-reset.sh` - Database reset
- `database/seed_programs_and_expenses.ts` - Seed data
- `database/reset_wbs_templates.sql` - Reset WBS templates to default

### Testing
- `testing/test.sh` - Run tests
- `testing/check-all.sh` - Comprehensive testing

### Maintenance
- `maintenance/clean.sh` - Clean up temporary files
- `maintenance/clean-uploads.sh` - Clean uploaded files
- `maintenance/reset_wbs_templates.sh` - Reset WBS templates to default

### Utils
- `utils/check-requirements.sh` - Check system requirements
- `utils/manage-containers.sh` - Docker container management
- `utils/manage-volumes.sh` - Docker volume management
- `utils/manage-env.sh` - Environment management
- `utils/generate_transactions.sh` - Generate test transactions

## Archived Scripts

See `archive/README.md` for information about obsolete scripts that have been moved to the archive directory.

## Usage

Most scripts can be run directly from the project root:

```bash
# Development setup
./scripts/development/setup.sh

# Database backup
./scripts/database/db-backup.sh

# Reset WBS templates
./scripts/maintenance/reset_wbs_templates.sh

# Run tests
./scripts/testing/test.sh
```

## Contributing

When adding new scripts:
1. Place them in the appropriate category directory
2. Add documentation to this README
3. Include usage examples
4. Test thoroughly before committing