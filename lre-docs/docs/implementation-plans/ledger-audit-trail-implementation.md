# Ledger Audit Trail Implementation Plan

**Created:** 2025-01-XX  
**Status:** Planning  
**Feature Branch:** TBD

## Overview

Implement comprehensive audit trail logging for all ledger entry actions, including manual CRUD operations, matching operations, imports, and other actions that are currently not logged.

## Current State Analysis

### Currently Logged ✅
1. **BOE Operations**
   - `CREATED` - When entries created from BOE allocation (`boeElementAllocationService.ts:468`)
   - `PUSHED_FROM_BOE` - When BOE pushes to ledger (`boeElementAllocationService.ts:485`)
   - `UPDATED` - When entries updated during BOE push (`boeElementAllocationService.ts:428`)

2. **Splitting Operations**
   - `SPLIT` - When entries are split (`ledgerSplittingService.ts:109`)
   - `CREATED` - New entries created from split (`ledgerSplittingService.ts:109`)
   - `UPDATED` - Re-forecast operations (`ledgerSplittingService.ts:271, 361`)

3. **Transaction Adjustments**
   - `UPDATED` and `CREATED` - Via transaction adjustment service (`transactionAdjustmentService.ts:439, 449, 555, 587`)

### Missing Audit Trail Logging ❌

1. **Manual CRUD Operations** (`backend/src/routes/ledger.ts`)
   - `POST /:programId/ledger` - Manual creation (line 185)
   - `PUT /:programId/ledger/:id` - Manual updates (line 227)
   - `DELETE /ledger/:id` - Deletion (line 260)

2. **Matching Operations** (`backend/src/services/importService.ts`)
   - `confirmMatch` - Transaction matched to ledger entry (line 1145) - Updates ledger entry but no audit trail
   - `removeMatch` - Unmatching transaction (line 1305) - Updates ledger entry but no audit trail
   - `addUnmatchedToLedger` - Creating entry from unmatched transaction (line 1183) - Creates entry but no audit trail

3. **Import Operations** (`backend/src/services/ledger.ts`)
   - `importLedgerFromFile` - Excel/CSV import (line 38) - Creates entries but no audit trail

4. **Risk Operations** (`backend/src/routes/ledger.ts`)
   - `POST /:programId/ledger/:entryId/link-risk` - Risk linking (line 665)
   - `POST /:programId/ledger/:entryId/utilize-mr` - MR utilization (line 733)

5. **Bulk Operations** (Frontend calls individual endpoints, but no bulk audit logging)

## Implementation Plan

### Phase 1: Manual CRUD Operations
**File**: `backend/src/routes/ledger.ts`

1. **Create Entry** (line 185-224)
   - Add audit logging after successful creation
   - Use `LedgerAuditTrailService.auditLedgerEntryCreation()` with `AuditSource.MANUAL`
   - Extract `userId` from request if available

2. **Update Entry** (line 227-257)
   - Capture previous values before merge
   - Add audit logging after successful update
   - Use `LedgerAuditTrailService.auditLedgerEntryUpdate()` with `AuditSource.MANUAL`
   - Only log if values actually changed

3. **Delete Entry** (line 260-270)
   - Add audit logging before deletion
   - Create new method `LedgerAuditTrailService.auditLedgerEntryDeletion()`
   - Store entry snapshot in `previousValues` before deletion

### Phase 2: Matching Operations
**File**: `backend/src/services/importService.ts`

1. **confirmMatch** (line 1145-1181)
   - Add audit logging after updating ledger entry
   - Use `LedgerAuditTrailService.auditInvoiceMatching()` with `isMatched=true`
   - Include transaction ID in metadata
   - Log the actual_amount and actual_date updates

2. **removeMatch** (line 1305-1356)
   - Capture previous values (actual_amount, actual_date, invoice links)
   - Add audit logging after clearing actuals
   - Use `LedgerAuditTrailService.auditInvoiceMatching()` with `isMatched=false`
   - Include transaction ID in metadata

3. **addUnmatchedToLedger** (line 1183-1225)
   - Add audit logging after creating entry
   - Use `LedgerAuditTrailService.auditLedgerEntryCreation()` with `AuditSource.INVOICE_MATCH`
   - Include transaction ID and import session ID in metadata

### Phase 3: Import Operations
**File**: `backend/src/services/ledger.ts`

1. **importLedgerFromFile** (line 38-111)
   - Generate session ID for the import operation
   - Add audit logging for each successfully created entry
   - Use `LedgerAuditTrailService.auditLedgerEntryCreation()` with `AuditSource.SYSTEM`
   - Include import session metadata (filename, row number, etc.)

### Phase 4: Risk Operations
**File**: `backend/src/routes/ledger.ts`

1. **link-risk** (line 665-705)
   - Capture previous riskId value
   - Add audit logging after linking/unlinking
   - Create new action type or use `UPDATED` with metadata indicating risk link change
   - Use `AuditSource.MANUAL`

2. **utilize-mr** (line 733-797)
   - Add audit logging after MR utilization
   - Use `UPDATED` action with metadata indicating MR utilization
   - Include amount and reason in metadata

### Phase 5: Service Method Enhancements
**File**: `backend/src/services/ledgerAuditTrailService.ts`

1. **Add `auditLedgerEntryDeletion()` method**
   - Similar to `auditLedgerEntryUpdate()` but for deletions
   - Store complete entry snapshot in `previousValues`
   - Use `AuditAction.DELETED`

2. **Enhance `auditInvoiceMatching()` method**
   - Update to accept transaction ID instead of invoice ID
   - Include transaction metadata (amount, date, vendor, etc.)
   - Support both confirm and remove match operations

### Phase 6: User ID Extraction
**Files**: Multiple route files

1. **Extract userId from request**
   - Check for authentication middleware that provides user context
   - Add helper function to extract userId from request
   - Pass userId to all audit trail methods

### Phase 7: Testing and Validation

1. **Test each operation**
   - Verify audit trail entries are created
   - Verify correct action types and sources
   - Verify previous/new values are captured correctly
   - Verify metadata is populated appropriately

2. **Frontend verification**
   - Ensure audit trail sidebar displays all new events
   - Verify correct icons and descriptions for new actions

## Files to Modify

1. `backend/src/routes/ledger.ts` - Add audit logging to CRUD endpoints and risk operations
2. `backend/src/services/importService.ts` - Add audit logging to matching operations
3. `backend/src/services/ledger.ts` - Add audit logging to import function
4. `backend/src/services/ledgerAuditTrailService.ts` - Add deletion method and enhance matching method
5. `backend/src/entities/LedgerAuditTrail.ts` - Verify enum values are sufficient (may need new action types)

## Implementation Notes

- All audit logging should be non-blocking (errors should not prevent the operation)
- Use try-catch around audit logging to prevent failures from affecting main operations
- Store complete state snapshots for deletions
- Include relevant metadata (transaction IDs, session IDs, filenames, etc.)
- Maintain backward compatibility with existing audit trail entries

