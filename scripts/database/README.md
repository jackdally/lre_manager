# Database Scripts

This folder contains SQL scripts for database operations and maintenance.

## Scripts

### `reset_wbs_templates.sql`

**Purpose**: Resets WBS (Work Breakdown Structure) templates to the default template.

**What it does**:
- Deletes all existing WBS template elements and templates
- Inserts the default "Standard Project WBS" template with a complete hierarchical structure
- Creates 10 elements total (3 level 1 + 7 level 2 elements)

**Default Template Structure**:
- **Project Management** (1.0)
  - Planning (1.1)
  - Monitoring & Control (1.2)
- **Technical Development** (2.0)
  - Design (2.1)
  - Implementation (2.2)
  - Testing (2.3)
- **Integration & Deployment** (3.0)
  - Integration (3.1)
  - Deployment (3.2)

**Usage**: This script is typically executed by the maintenance script `../maintenance/reset_wbs_templates.sh`

**Note**: This script uses PostgreSQL-specific features like `gen_random_uuid()` and PL/pgSQL blocks for proper UUID generation and hierarchical data insertion.

### `migrate_to_hierarchical_wbs.sql`

**Purpose**: Migrates the database to support the new hierarchical WBS structure alongside the existing 2-tier structure.

**What it does**:
- Creates the new `wbs_element` table with hierarchical structure support
- Adds `wbs_element_id` column to `ledger_entry` table for backward compatibility
- Creates sample hierarchical WBS elements for existing programs (only if none exist)
- Updates existing ledger entries to reference the new WBS elements
- Adds database indexes for performance optimization
- Creates triggers for automatic timestamp updates

**New Structure Features**:
- **Unlimited Depth**: Supports unlimited levels of hierarchy
- **Code-based Organization**: Each element has a unique code (e.g., "1.1", "2.3.1")
- **Backward Compatibility**: Maintains existing ledger entries while adding new structure
- **Performance Optimized**: Includes indexes for fast queries and joins
- **Duplicate Prevention**: Checks for existing elements before creating new ones

### `cleanup_duplicate_wbs_elements.sql`

**Purpose**: Removes duplicate WBS elements that may have been created by running the migration multiple times.

**What it does**:
- Identifies duplicate WBS elements by code, name, and program
- Keeps the earliest created element and removes duplicates
- Verifies cleanup was successful
- Shows final element counts by program

**Usage**: This script is typically executed by the maintenance script `../maintenance/cleanup_duplicate_wbs_elements.sh`

**Note**: This script creates a backup before performing cleanup operations.

**Usage**: This script is typically executed by the maintenance script `../maintenance/migrate_to_hierarchical_wbs.sh`

**Safety**: The maintenance script creates a backup before running this migration.
