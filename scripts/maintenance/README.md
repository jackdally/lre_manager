# Maintenance Scripts

This folder contains scripts for cleaning up and maintaining the development and production environments.

## Scripts

- `clean-uploads.sh`: Removes old or unnecessary uploaded files from the server.
- `clean-uploads-dev.sh`: Cleans up uploads specifically in the development environment.
- `clean.sh`: General cleanup script for various temporary or unnecessary files.
- `reset_wbs_templates.sh`: Resets WBS templates to the default template in the database.

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