# Maintenance Scripts

This folder contains scripts for cleaning up and maintaining the development and production environments.

## Scripts

- `clean-uploads.sh`: Removes old or unnecessary uploaded files from the server.
- `clean-uploads-dev.sh`: Cleans up uploads specifically in the development environment.
- `clean.sh`: General cleanup script for various temporary or unnecessary files.
- `reset_wbs_templates.sh`: Resets WBS templates to the default template in the database.
- `migrate_to_hierarchical_wbs.sh`: Migrates database to support hierarchical WBS structure.

## WBS Template Reset

### `reset_wbs_templates.sh`

**Purpose**: Resets WBS (Work Breakdown Structure) templates to the default template in the database.

**What it does**:
- Connects to the PostgreSQL database container
- Executes the SQL reset script from `../database/reset_wbs_templates.sql`
- Deletes all existing WBS templates and elements
- Inserts the default "Standard Project WBS" template with complete hierarchical structure

**Prerequisites**:
- Docker containers must be running
- PostgreSQL database container must be accessible

**Usage**:
```bash
# From the project root
./scripts/maintenance/reset_wbs_templates.sh
```

**After running**:
- Refresh the Settings page in the application
- The default WBS template will be available for use
- All previous WBS templates will be permanently deleted

## Hierarchical WBS Migration

### `migrate_to_hierarchical_wbs.sh`

**Purpose**: Migrates the database to support the new hierarchical WBS structure alongside the existing 2-tier structure.

**What it does**:
- Creates the new `wbs_element` table with hierarchical structure support
- Adds `wbs_element_id` column to `ledger_entry` table for backward compatibility
- Creates sample hierarchical WBS elements for existing programs
- Updates existing ledger entries to reference the new WBS elements
- Creates database backup before migration
- Verifies migration success

**Prerequisites**:
- Docker containers must be running
- PostgreSQL database container must be accessible

**Usage**:
```bash
# From the project root
./scripts/maintenance/migrate_to_hierarchical_wbs.sh
```

**After running**:
- Restart the backend container to pick up the new entity
- The new hierarchical WBS structure is available alongside the old 2-tier structure
- You can gradually migrate ledger entries to use the new structure
- The WbsTreeView component can be integrated into program settings

**Safety**: Creates a backup before running the migration. 