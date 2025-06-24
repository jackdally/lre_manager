# Transaction ID Feature

## Overview

This document describes the new Transaction ID feature that was added to the upload page. This feature allows users to map a "Transaction ID" column from their NetSuite export files and automatically generates NetSuite invoice links for each transaction.

## Changes Made

### Backend Changes

#### 1. ImportConfig Entity (`backend/src/entities/ImportConfig.ts`)
- Added `transactionIdColumn?: string` to the columnMapping JSON structure
- This allows users to specify which column contains the Transaction ID

#### 2. ImportTransaction Entity (`backend/src/entities/ImportTransaction.ts`)
- Added `transactionId: string` field to store the Transaction ID from the import
- This field is nullable since Transaction ID is optional

#### 3. ImportService (`backend/src/services/importService.ts`)
- Updated `ImportConfig` interface to include `transactionIdColumn?: string`
- Modified `parseTransactionRow` method to:
  - Extract Transaction ID from the specified column
  - Generate NetSuite invoice URLs automatically using the format:
    `https://5578993.app.netsuite.com/app/accounting/transactions/cardchrg.nl?id={transactionId}&whence=`
  - Store both the Transaction ID and the generated reference URL
- Enhanced `confirmMatch` method to store invoice links in the ledger
- Enhanced `addUnmatchedToLedger` method to include invoice links

### Frontend Changes

#### 1. ImportPage Component (`frontend/src/components/ImportPage.tsx`)
- Updated `ImportConfig` interface to include `transactionIdColumn?: string`
- Updated `ImportTransaction` interface to include `transactionId?: string`
- Added default value for `transactionIdColumn: 'Transaction ID'` in the config
- Added new column mapping fields to the UI:
  - **Category Column**: Maps to category field
  - **Subcategory Column**: Maps to subcategory field  
  - **Invoice Number Column**: Maps to invoiceNumber field
  - **Transaction ID Column**: Maps to transactionId field (NEW)
  - **Reference Number Column**: Maps to referenceNumber field

## How It Works

### 1. Column Mapping
Users can now specify which column in their CSV/Excel file contains the Transaction ID. The default mapping is "Transaction ID".

### 2. URL Generation
When a Transaction ID is provided, the system automatically generates a NetSuite invoice link using the format:
```
https://5578993.app.netsuite.com/app/accounting/transactions/cardchrg.nl?id={transactionId}&whence=
```

### 3. Reference Number Handling
- If a Reference Number column is mapped AND a Transaction ID is provided:
  - Use the Reference Number from the file if it exists
  - Otherwise, generate the NetSuite URL from the Transaction ID
- If only a Transaction ID is provided (no Reference Number column):
  - Generate the NetSuite URL from the Transaction ID
- If neither is provided:
  - Reference Number remains null

## What Fields Are Filled in the Ledger When a Match is Confirmed

When you confirm a match between an import transaction and a ledger entry, the following fields are updated in the ledger:

### ✅ **Fields Updated in Ledger Entry:**

1. **`actual_amount`** - Set to the transaction amount from the import
2. **`actual_date`** - Set to the transaction date from the import  
3. **`notes`** - Set to `"Invoice: {invoiceNumber}"` if an invoice number exists
4. **`invoice_link_url`** - Set to the generated NetSuite URL (NEW)
5. **`invoice_link_text`** - Set to the invoice number or "View Invoice" (NEW)

### ✅ **Fields Updated When Adding Unmatched Transactions:**

When adding unmatched transactions to the ledger, these fields are also populated:
1. **`vendor_name`** - From the import transaction
2. **`expense_description`** - From the import transaction
3. **`wbs_category`** - User-selected category
4. **`wbs_subcategory`** - User-selected subcategory
5. **`actual_amount`** - From the import transaction
6. **`actual_date`** - From the import transaction
7. **`notes`** - Contains import information and invoice number
8. **`invoice_link_url`** - Set to the generated NetSuite URL (NEW)
9. **`invoice_link_text`** - Set to the invoice number or "View Invoice" (NEW)

### ❌ **Fields NOT Updated:**

The following fields from the import transaction are **NOT** copied to the ledger:
- **`category`** and **`subcategory`** (these don't map to ledger fields)
- **`transactionId`** (stored separately in the import transaction)
- **`referenceNumber`** (stored as `invoice_link_url` instead)

## Usage

### 1. Prepare Your CSV/Excel File
Ensure your export file includes a "Transaction ID" column with the NetSuite transaction IDs.

Example CSV structure:
```csv
Program Code,Vendor Name,Description,Amount,Transaction Date,Category,Subcategory,Invoice Number,Transaction ID,Reference Number
PROG001,ABC Supplies Inc,Office supplies for Q1 2024,1250.00,2024-01-15,Supplies,Office,INV-2024-001,541703,REF-001
```

### 2. Configure Column Mapping
On the upload page, map the "Transaction ID" column to the appropriate column name in your file.

### 3. Upload and Process
The system will automatically:
- Extract the Transaction ID from the specified column
- Generate NetSuite invoice links for each transaction
- Store both the Transaction ID and the generated URL in the database

### 4. Confirm Matches
When you confirm a match:
- The ledger entry will be updated with actual amounts and dates
- The NetSuite invoice link will be stored in the `invoice_link_url` field
- The invoice number will be stored in the `invoice_link_text` field

## Benefits

1. **Automatic Link Generation**: No need to manually create NetSuite links
2. **Consistent Format**: All links follow the same NetSuite URL pattern
3. **Audit Trail**: Transaction IDs are preserved for reference
4. **Flexibility**: Users can still provide custom Reference Numbers if needed
5. **Backward Compatibility**: Existing uploads without Transaction IDs continue to work
6. **Enhanced Ledger**: Invoice links are now stored directly in ledger entries for easy access

## Testing

A test script was created (`scripts/test_transaction_id_feature.js`) to verify:
- URL generation logic
- Column mapping configuration
- Sample CSV data processing

Run the test with:
```bash
cd scripts && node test_transaction_id_feature.js
```

## Sample Files

- `scripts/sample_netsuite_export.csv` - Original sample without Transaction ID
- `scripts/sample_netsuite_export_with_transaction_id.csv` - Updated sample with Transaction ID column

## Database Migration

The database will automatically update when the application starts in development mode (due to `synchronize: true` in the database configuration). The new `transactionId` column will be added to the `import_transaction` table.

## Future Enhancements

Potential improvements could include:
- Support for different NetSuite URL patterns
- Custom URL template configuration
- Bulk link validation
- Link accessibility testing
- Display of invoice links in the ledger table UI 