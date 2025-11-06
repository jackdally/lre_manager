# Risk Linking Enhancements Implementation Plan

**Created:** 2025-01-XX  
**Status:** Completed  
**Completed:** 2025-11-05  
**Feature Branch:** N/A (implemented directly)

## Overview

Enhance the risk linking system to support:
1. Multiple risk links per ledger entry with an improved UI
2. Allocation-level risk linking (primary use case)
3. Risk inheritance from allocations to ledger entries
4. Enhanced LinkToRiskModal with full risk creation support

## Current State Analysis

### Current Limitations
- **Ledger Entry Risk Linking**: Single risk via `riskId` field (ManyToOne relationship)
- **Allocation Risk Linking**: No risk relationship exists
- **UI**: Simple modal that only shows one linked risk
- **Risk Creation**: Inline minimal form in LinkToRiskModal
- **Menu Item**: Always shows "Link to Risk" regardless of linked state

### Data Model
- `LedgerEntry.riskId` - Single risk link (nullable)
- `LedgerEntry.boeElementAllocationId` - Links to parent allocation
- `BOEElementAllocation` - No risk relationship currently

## Proposed Solution

### Architecture Decision: Simplified Propagation Model

**Key Principle**: Risks are linked to ledger entries, but automatically propagate to all entries in the same allocation

**Propagation Rules**:
- When a risk is linked to a ledger entry → automatically linked to ALL ledger entries with the same `boeElementAllocationId`
- When a risk is unlinked from a ledger entry → automatically unlinked from ALL ledger entries with the same `boeElementAllocationId`
- If a ledger entry has no `boeElementAllocationId`, the risk is only linked to that specific entry
- UI shows risks as "shared across allocation" for entries from allocations

**Benefits**:
- No need for separate allocation-level risk management
- Simpler data model (risks only linked to ledger entries)
- Automatic consistency across allocation entries

## Implementation Plan

### Phase 1: Database Schema Changes

#### 1.1 Create Junction Table
**Files to Create:**
- `backend/src/entities/LedgerEntryRisk.ts` - Many-to-many junction table

**Migration:**
- Migrate existing `riskId` data to new junction table
- Keep `riskId` field temporarily for backward compatibility

#### 1.2 Update Entities
**Files to Modify:**
- `backend/src/entities/LedgerEntry.ts`
  - Add `@ManyToMany` relationship to Risk via LedgerEntryRisk
  - Keep `riskId` field for backward compatibility (deprecated)
- No changes needed to `BOEElementAllocation.ts` (risks managed through ledger entries)

### Phase 2: Backend API Enhancements

#### 2.1 Ledger Entry Risk Management
**File:** `backend/src/routes/ledger.ts`

**New Endpoints:**
- `GET /api/programs/:programId/ledger/:entryId/risks` - Get all linked risks (including inherited)
- `POST /api/programs/:programId/ledger/:entryId/risks` - Link multiple risks
- `DELETE /api/programs/:programId/ledger/:entryId/risks/:riskId` - Unlink specific risk

**Modified Endpoints:**
- `POST /api/programs/:programId/ledger/:entryId/link-risk` - Update to support multiple risks (backward compatible)

#### 2.2 Risk Propagation Logic
**File:** `backend/src/services/ledgerService.ts` or new `riskLinkingService.ts`

**New Service Methods:**
- `linkRiskToLedgerEntry(entryId, riskId)` - Links risk and propagates to all entries in same allocation
- `unlinkRiskFromLedgerEntry(entryId, riskId)` - Unlinks risk and propagates to all entries in same allocation
- `getRisksForLedgerEntry(entryId)` - Returns all linked risks (checks if from allocation)
- `getAllocationEntries(allocationId)` - Helper to get all entries for an allocation

#### 2.3 Risk Propagation Implementation
**File:** `backend/src/services/ledgerService.ts` or new `riskLinkingService.ts`

**Key Logic:**
```typescript
// When linking a risk to entryId:
1. Check if entry has boeElementAllocationId
2. If yes: Find all entries with same boeElementAllocationId
3. Link risk to ALL those entries
4. If no: Link only to this entry

// When unlinking a risk from entryId:
1. Check if entry has boeElementAllocationId
2. If yes: Find all entries with same boeElementAllocationId
3. Unlink risk from ALL those entries
4. If no: Unlink only from this entry
```

### Phase 3: Frontend UI Enhancements

#### 3.1 Enhanced LinkToRiskModal
**File:** `frontend/src/components/features/ledger/LinkToRiskModal/index.tsx`

**New Features:**
1. **Linked Risks Section**
   - Display all currently linked risks
   - Show indicator if risks are shared across allocation entries
   - Show count of other entries sharing the same risks
   - Remove/unlink buttons (will remove from all allocation entries)
   - Warning message when unlinking: "This will remove the risk from all X entries in this allocation"

2. **Search & Link Section**
   - Enhanced search with debouncing
   - Multi-select capability
   - "Link Selected" button to link multiple risks at once

3. **Create New Risk**
   - Remove inline minimal form
   - Add "Create New Risk" button
   - Open full `RiskFormModal` component
   - Auto-link newly created risk after save

**UI Layout:**
```
┌─────────────────────────────────────┐
│  Manage Risks - [Ledger Entry Name] │
├─────────────────────────────────────┤
│                                     │
│  Linked Risks (2)                   │
│  ┌─────────────────────────────┐   │
│  │ • Risk A                     │   │
│  │   Shared with 11 other entries │ │
│  │   [Remove]                    │   │
│  │ • Risk B                      │   │
│  │   Shared with 11 other entries │ │
│  │   [Remove]                    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ⚠️ Changes apply to all entries   │
│     in this allocation              │
│                                     │
│  Search & Link Risks                │
│  [Search input...]                  │
│  ┌─────────────────────────────┐   │
│  │ ☐ Risk D                     │   │
│  │ ☐ Risk E                     │   │
│  └─────────────────────────────┘   │
│  [Link Selected]                    │
│                                     │
│  [Create New Risk]                  │
│                                     │
│  [Cancel] [Save]                    │
└─────────────────────────────────────┘
```

#### 3.2 Menu Item Update
**File:** `frontend/src/components/features/ledger/LedgerTable/Table.tsx`

**Changes:**
- Update menu item text based on linked risks count:
  - "Link to Risk" → if no risks linked
  - "Manage Risks (2)" → if risks are linked (show count)
- Add visual indicator (badge/dot) when risks are linked

#### 3.3 Risk Propagation Indicator
**File:** `frontend/src/components/features/ledger/LinkToRiskModal/index.tsx`

**Features:**
- Show warning message when entry is from allocation
- Display count of other entries that will be affected
- Confirm dialog when unlinking: "This will remove the risk from X other entries. Continue?"

### Phase 4: Risk Propagation Implementation

#### 4.1 Link Risk Service
**File:** `backend/src/services/ledgerService.ts` or new `riskLinkingService.ts`

**New Method:** `linkRiskToLedgerEntry(entryId, riskId, userId?)`
- Link risk to the specified ledger entry
- Check if entry has `boeElementAllocationId`
- If yes: Find all entries with same `boeElementAllocationId`
- Link risk to all found entries
- Log audit trail for each entry

#### 4.2 Unlink Risk Service
**File:** `backend/src/services/ledgerService.ts` or new `riskLinkingService.ts`

**New Method:** `unlinkRiskFromLedgerEntry(entryId, riskId, userId?)`
- Unlink risk from the specified ledger entry
- Check if entry has `boeElementAllocationId`
- If yes: Find all entries with same `boeElementAllocationId`
- Unlink risk from all found entries
- Log audit trail for each entry

#### 4.3 Get Risks with Metadata
**File:** `backend/src/services/ledgerService.ts`

**New Method:** `getRisksForLedgerEntry(entryId)`
- Get all risks linked to this entry
- Check if entry has `boeElementAllocationId`
- If yes: Count how many other entries share each risk
- Return risks with metadata: `{ risk, sharedWithCount }`

### Phase 5: Audit Trail Updates

**File:** `backend/src/services/ledgerAuditTrailService.ts`

**Enhancements:**
- Log risk linking/unlinking operations
- Track multiple risk links
- Indicate inherited vs. direct risk links in audit trail

### Phase 6: Migration Strategy

#### 6.1 Data Migration
**New Migration File**

**Steps:**
1. Create junction tables
2. Migrate existing `riskId` values to `LedgerEntryRisk` table
3. Mark `riskId` field as deprecated (keep for backward compatibility)
4. Add indexes for performance

#### 6.2 Backward Compatibility
- Keep `riskId` field in LedgerEntry (nullable)
- Update old API endpoints to work with new structure
- Gradually migrate frontend to use new endpoints

### Phase 7: Testing Considerations

1. **Unit Tests**
   - Risk inheritance logic
   - Multiple risk linking/unlinking
   - Allocation risk sync

2. **Integration Tests**
   - End-to-end risk linking flow
   - Risk inheritance on entry creation
   - Allocation risk changes propagate to entries

3. **UI Tests**
   - Modal displays inherited vs. direct risks
   - Search and link functionality
   - Risk creation flow

## Files to Create

1. `backend/src/entities/LedgerEntryRisk.ts` - Junction table for many-to-many
2. `backend/src/services/riskLinkingService.ts` - Service for propagation logic (optional, could be in ledgerService)
3. `backend/src/migrations/XXXXX-AddLedgerEntryRiskJunctionTable.ts`

## Files to Modify

1. `backend/src/entities/LedgerEntry.ts` - Add ManyToMany relationship
2. `backend/src/routes/ledger.ts` - Update link-risk endpoint, add new endpoints
3. `backend/src/services/ledgerService.ts` - Add propagation logic (or create riskLinkingService.ts)
4. `frontend/src/components/features/ledger/LinkToRiskModal/index.tsx` - Complete rewrite
5. `frontend/src/components/features/ledger/LedgerTable/Table.tsx` - Update menu item
6. `frontend/src/types/ledger.ts` - Update types for multiple risks

## Implementation Notes

1. **Performance**: Use efficient queries with proper joins and indexes
2. **User Experience**: Clear distinction between inherited and direct risks
3. **Data Integrity**: Ensure risk inheritance is consistent
4. **Backward Compatibility**: Maintain old API during transition period
5. **Audit Trail**: Comprehensive logging of all risk link changes

## Implementation Details

### Risk Propagation Logic Flow

**When Linking:**
1. User links risk to Entry A (which has `boeElementAllocationId = X`)
2. System finds all entries with `boeElementAllocationId = X`
3. Links risk to all found entries
4. Shows message: "Risk linked to this entry and 11 other entries in the allocation"

**When Unlinking:**
1. User unlinks risk from Entry A (which has `boeElementAllocationId = X`)
2. System finds all entries with `boeElementAllocationId = X`
3. Unlinks risk from all found entries
4. Shows confirmation: "This will remove the risk from 11 other entries. Continue?"

**For Entries Without Allocation:**
- Risk is only linked/unlinked to that specific entry
- No propagation occurs

## Success Criteria

1. Users can link multiple risks to ledger entries
2. Risks automatically propagate to all entries in the same allocation
3. UI clearly shows when risks are shared across allocation entries
4. Full risk creation modal is accessible from link modal
5. Menu item indicates when risks are linked (shows count)
6. Confirmation dialogs prevent accidental removal from multiple entries
7. All changes are logged in audit trail (for each affected entry)
8. Entries without allocations work independently (no propagation)

