# Ledger Feature

This feature handles the management of program ledger entries, including viewing, adding, editing, and bulk operations.

## Components

- **LedgerPage**: Main page for the ledger feature with filters and bulk import functionality
- **LedgerTable**: Complex table component with inline editing, bulk operations, and filtering
  - **Header**: Table header with search and filter controls
  - **Table**: Main table component with pagination
  - **Row**: Individual row component with inline editing
  - **Cell**: Cell component with edit functionality
  - **BulkEditModal**: Modal for bulk editing selected rows
  - **BulkDeleteModal**: Modal for bulk deleting selected rows
  - **ErrorModal**: Modal for displaying errors
- **BulkImport**: Bulk import functionality
  - **BulkImportModal**: Modal for bulk importing ledger entries via file upload

## Purpose

This feature allows users to:
1. View and manage program ledger entries
2. Add individual ledger entries with inline editing
3. Bulk import ledger entries from Excel/CSV files
4. Bulk edit and delete multiple entries
5. Filter and search through ledger entries
6. Track baseline, planned, and actual amounts

## Usage

Users access this feature through the "Ledger" navigation item within a program.

## File Structure

```
ledger/
├── LedgerPage/           # Main page component
├── LedgerTable/          # Table with all subcomponents
│   ├── Header.tsx        # Search and filter controls
│   ├── Table.tsx         # Main table logic
│   ├── Row.tsx           # Individual row component
│   ├── Cell.tsx          # Cell with inline editing
│   ├── BulkEditModal.tsx # Bulk edit functionality
│   ├── BulkDeleteModal.tsx # Bulk delete confirmation
│   └── ErrorModal.tsx    # Error display
├── BulkImport/           # Bulk import functionality
│   ├── BulkImportModal.tsx  # File upload modal
│   └── README.md         # Bulk import documentation
├── index.ts              # Feature exports
└── README.md             # This file
``` 