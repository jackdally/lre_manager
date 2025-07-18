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
