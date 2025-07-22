# NetSuite Actuals Upload Feature

## Overview

The NetSuite Actuals Upload feature allows users to upload CSV/Excel exports from NetSuite containing actuals transactions, automatically match them to existing ledger entries, and handle unmatched transactions as unplanned actuals.

## Features

### File Upload & Processing
- Support for Excel (.xlsx, .xls) and CSV files
- Configurable column mapping for different NetSuite export formats
- Automatic program code filtering to process only relevant transactions
- Date format parsing for common NetSuite date formats

### Smart Matching Algorithm
The system uses a sophisticated matching algorithm with the following criteria:

#### Match Criteria (Weighted Scoring):
- **Vendor Name Matching (30% weight)**: String similarity using Jaccard similarity (highest priority)
- **Amount Matching (40% weight)**: Exact or near-exact amount matches against planned amounts
- **Date Matching (20% weight)**: Transactions within 7 days of each other, with support for period-based matching
- **Description Matching (10% weight)**: String similarity for expense descriptions (reduced weight)

#### Match Types:
- **Exact Match (95%+ confidence)**: Perfect or near-perfect matches
- **Fuzzy Match (80-94% confidence)**: High-confidence matches with minor differences
- **Partial Match (60-79% confidence)**: Moderate confidence matches
- **Date-based Match**: Same amount and date, different vendor/description
- **WBS-based Match**: Category/subcategory matches

### Transaction Management
- **Matched Transactions**: Can be confirmed to update ledger entries with actual data
- **Unmatched Transactions**: Can be added to ledger as unplanned actuals with null baseline/planned values
- **Status Tracking**: Full audit trail of transaction processing

### User Interface
- **Upload Tab**: File selection and column mapping configuration
- **Sessions Tab**: View all upload sessions and their status
- **Matching Tab**: Review and confirm/deny suggested matches

## Database Schema

### ImportSession Entity
```typescript
interface ImportSession {
  id: string;
  filename: string;
  originalFilename: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  totalRecords: number;
  processedRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  errorRecords: number;
  importConfig: ImportConfig;
  results: any;
  errorMessage: string | null;
  program: Program;
  createdAt: Date;
  updatedAt: Date;
}
```

### ImportTransaction Entity
```typescript
interface ImportTransaction {
  id: string;
  vendorName: string;
  description: string;
  amount: number;
  transactionDate: string;
  programCode: string;
  category?: string;
  subcategory?: string;
  invoiceNumber?: string;
  referenceNumber?: string;
  rawData: any;
  status: 'unmatched' | 'matched' | 'confirmed' | 'rejected' | 'added_to_ledger';
  matchConfidence?: number;
  suggestedMatches?: any[];
  importSession: ImportSession;
  matchedLedgerEntry?: LedgerEntry;
  createdAt: Date;
}
```

## API Endpoints

### Upload & Processing
- `POST /api/import/:programId/upload` - Upload and process NetSuite actuals file
- `GET /api/import/:programId/sessions` - Get upload sessions for a program
- `GET /api/import/session/:sessionId` - Get session details
- `GET /api/import/session/:sessionId/transactions` - Get transactions for a session

### Transaction Management
- `POST /api/import/transaction/:transactionId/confirm-match` - Confirm a match and update ledger with actual data
- `POST /api/import/transaction/:transactionId/add-to-ledger` - Add unmatched transaction to ledger as unplanned expense

### Templates & Utilities
- `GET /api/import/template/netsuite` - Get NetSuite actuals upload template
- `DELETE /api/import/session/:sessionId` - Delete upload session

## Configuration

### ImportConfig Interface
```typescript
interface ImportConfig {
  programCodeColumn: string;      // Column name for program code
  vendorColumn: string;           // Column name for vendor name
  descriptionColumn: string;      // Column name for description
  amountColumn: string;           // Column name for amount
  dateColumn: string;             // Column name for transaction date
  categoryColumn?: string;        // Optional: column name for category
  subcategoryColumn?: string;     // Optional: column name for subcategory
  invoiceColumn?: string;         // Optional: column name for invoice number
  referenceColumn?: string;       // Optional: column name for reference number
  dateFormat?: string;            // Date format (MM/DD/YYYY, YYYY-MM-DD, etc.)
  amountTolerance?: number;       // Amount matching tolerance (default: 0.01)
  matchThreshold?: number;        // Minimum confidence for matches (default: 0.7)
}
```

## Usage Workflow

### Prepare NetSuite Export
 - Export actual transaction data from NetSuite
 - Ensure the export includes:
   - Program codes
   - Vendor names
   - Transaction descriptions
   - Actual amounts
   - Transaction dates
   - Optional: categories, subcategories, invoice numbers, period information

### Upload File
 - Navigate to the "Upload Actuals" page for your program
 - Select the exported file
 - Configure column mapping to match your export format
 - Add a description for the upload (e.g., "Q1 2024 Actuals")
 - Click "Upload and Process Actuals"

### Review Matches
 - After processing, review the suggested matches
 - For each transaction:
   - **High confidence matches**: Review and confirm if correct
   - **Low confidence matches**: Manually review or reject
   - **Unmatched transactions**: Add to ledger as unplanned actuals

### Confirm Actions
 - **Confirm Matches**: Updates existing ledger entries with actual data
 - **Add to Ledger**: Creates new ledger entries for unplanned actuals with null baseline/planned values
 - **Reject Matches**: Keeps transactions unmatched for manual review

## Smart Matching Algorithm Details

### Confidence Calculation
```typescript
function calculateMatchConfidence(transaction, entry, tolerance) {
  let score = 0;
  let maxScore = 0;

  // Amount matching (40% weight)
  maxScore += 40;
  if (entry.actual_amount !== null) {
    const amountDiff = Math.abs(transaction.amount - entry.actual_amount);
    const amountPercent = amountDiff / transaction.amount;
    if (amountPercent <= tolerance) {
      score += 40 * (1 - amountPercent / tolerance);
    }
  }

  // Vendor name matching (30% weight)
  maxScore += 30;
  const vendorSimilarity = calculateStringSimilarity(
    transaction.vendorName.toLowerCase(),
    entry.vendor_name.toLowerCase()
  );
  score += 30 * vendorSimilarity;

  // Date matching (20% weight)
  maxScore += 20;
  if (entry.actual_date && transaction.transactionDate) {
    const dateDiff = Math.abs(
      new Date(transaction.transactionDate).getTime() - 
      new Date(entry.actual_date).getTime()
    );
    const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
    if (daysDiff <= 7) {
      score += 20 * (1 - daysDiff / 7);
    }
  }

  // Description matching (10% weight)
  maxScore += 10;
  const descSimilarity = calculateStringSimilarity(
    transaction.description.toLowerCase(),
    entry.expense_description.toLowerCase()
  );
  score += 10 * descSimilarity;

  return maxScore > 0 ? score / maxScore : 0;
}
```

### String Similarity (Jaccard)
```typescript
function calculateStringSimilarity(str1, str2) {
  if (str1 === str2) return 1;
  
  const set1 = new Set(str1.split(/\s+/));
  const set2 = new Set(str2.split(/\s+/));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}
```

## Best Practices

### Data Preparation
- Ensure NetSuite exports include all required columns
- Use consistent vendor naming conventions
- Include detailed transaction descriptions
- Verify program codes are correct

### Column Mapping
- Double-check column names match exactly
- Test with a small sample file first
- Use the template as a reference

### Match Review
- Always review high-confidence matches
- Pay attention to amount and date discrepancies
- Consider vendor name variations
- Use the confidence percentage as a guide, not a rule

### Unplanned Actuals
- Categorize unmatched transactions appropriately
- Use meaningful WBS categories and subcategories
- Add notes to track the source of unplanned actuals

## Troubleshooting

### Common Issues

 - **No transactions processed**
   - Check program code column mapping
   - Verify program codes in the export match the current program
   - Ensure required columns are present

 - **Low match rates**
   - Review column mapping configuration
   - Check for vendor name inconsistencies
   - Verify date formats and period information
   - Adjust match threshold if needed

 - **Upload failures**
   - Check file format (Excel/CSV only)
   - Verify file is not corrupted
   - Ensure sufficient disk space
   - Check server logs for detailed error messages

### Performance Considerations

- Large files (>10,000 records) may take several minutes to process
- Match confidence calculations are CPU-intensive
- Consider processing large uploads during off-peak hours
- Monitor database performance during large uploads

## Future Enhancements

### Planned Features
 - **Batch Processing**: Process multiple files simultaneously
 - **Advanced Matching**: Machine learning-based matching algorithms
 - **Audit Trail**: Detailed logging of all upload operations
 - **Rollback Capability**: Undo upload operations
 - **Duplicate Detection**: Identify and handle duplicate transactions
 - **Data Validation**: Enhanced validation rules and error reporting
 - **Upload Templates**: Pre-configured templates for common NetSuite exports
 - **Progress Indicators**: Real-time progress updates for large uploads

### Technical Improvements
 - **Background Processing**: Queue-based processing for large files
 - **Caching**: Cache frequently accessed data for better performance
 - **API Rate Limiting**: Prevent abuse of upload endpoints
 - **File Compression**: Support for compressed file formats
 - **Incremental Uploads**: Only process new or changed records 