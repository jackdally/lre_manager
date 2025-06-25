# Database Scripts

This folder contains scripts for managing the database, including backup, reset, and seeding operations.

- `db-backup.sh`: Creates a backup of the database.
- `db-reset.sh`: Resets the database to a clean state.
- `seed_programs_and_expenses.ts`: Seeds the database with initial program and expense data.

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
```
