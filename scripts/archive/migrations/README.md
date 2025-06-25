# Archived Migration Scripts

This directory contains one-time migration scripts that have been executed and are no longer needed for active development.

## Scripts

### `migrate-import-features.sh`
**Purpose**: Migrated import features from standalone components to feature-based organization
**Executed**: [Date when you ran this migration]
**Changes Made**:
- Moved `ImportPage.tsx` → `ActualsUploadPage.tsx`
- Updated routes from `/import` → `/actuals`
- Updated navigation labels
- Reorganized component structure

### `reorganize-structure.sh`
**Purpose**: Reorganized the entire project structure for better maintainability
**Executed**: [Date when you ran this migration]
**Changes Made**:
- Broke down monolithic components into subcomponents
- Reorganized actuals, ledger, and programs features
- Updated import paths throughout the codebase
- Refactored "Bulk Add" to "Bulk Import" terminology

## Important Notes

⚠️ **Do not run these scripts again** - they are designed for one-time use and may cause issues if run multiple times.

📝 **Git History**: These scripts remain in git history for reference. Use `git log` to see when they were executed.

🔍 **Reference**: If you need to understand what changes were made, review the git commits from when these scripts were executed. 