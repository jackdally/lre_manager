# TODO List

## High Priority
- [x] Task 2: Fix bug on Ledger that makes Upload column "Potential Matches" disappear when undoing a rejected match (COMPLETED)
  - **Fix #1**: Added refresh of potential match IDs after successful undo reject operation
  - **Fix #2**: Implemented atomic state updates with parallel API calls for potential and rejected match IDs
  - **Fix #3**: Removed hardcoded fallback IDs that were causing maintenance issues
  - **Fix #4**: Fixed critical timing issue where potential match refresh was skipped due to race condition
  - **Root Cause**: Initialization used 100ms timeout that fired before entries loaded, causing potential match refresh to be skipped
  - **Solution**: Changed to trigger potential match refresh immediately after entries are successfully loaded
  - **Files Modified**: `frontend/src/store/ledgerStore.ts`, `frontend/src/components/features/ledger/LedgerTable/Table.tsx`

## Medium Priority
- [ ] Task 10: Add proper error handling and user feedback for modal operations
- [ ] Task 11: Implement proper state synchronization between actuals and ledger stores
- [ ] Task 12: Add loading states and progress indicators for modal operations

## Low Priority
- [ ] Task 13: Fix Counting bug on Actuals Upload sessions (rejected, matched, unmatched)
- [ ] Task 14: Add unit tests for the new actuals store
- [ ] Task 15: Optimize performance by implementing proper memoization
- [ ] Task 16: Remove Clear All Uploads button for standard users. This is a dangerous button to have in the UI.

## Completed
- [x] Created actuals store with centralized state management
- [x] Refactored TransactionMatchModal to use store instead of local state
- [x] Refactored TransactionMatchingTable to use store actions
- [x] Simplified ActualsUploadPage by removing complex modal state management
- [x] Maintained backward compatibility with ledger store for shared match data
- [x] Fixed TransactionMatchingTable actions column logic to prevent blank actions after rejecting matches
- [x] Implemented proper status sorting in TransactionMatchingTable (Matched → Confirmed → Rejected → Unmatched → Replaced)
- [x] Added status filter dropdown to TransactionMatchingTable
- [x] Task 3: Fix Actuals Upload Transaction Matching modals and status (currently, when you reject a match, the actions column goes blank and doesn't allow you to bring up the modal. The status stays as "Matched" instead of "Rejected")
- [x] Task 4: Update the sort order on TransactionMatching so that "Matched" is first, "Confirmed" is second, "Rejected" is third, "Unmatched" is fourth, and "Replaced" is fifth
- [x] Task 5: Update the TransactionMatching to have a filter for status
- [x] Task 6: Fix bug on Ledger that still shows "Potential Match" in upload column for items that have all rejected matches
- [x] Task 7: Implement proper sorting in TransactionMatchingTable (show matched items first, then unmatched)
- [x] Task 8: Fix status display logic in TransactionMatchingTable to properly show "rejected" status
- [x] Task 9: Fix actions column logic to prevent it from going blank after rejecting matches
- [x] Task 1: Fix bug on Ledger that makes filters non-functional
- [x] Task 17: Fix Download Template button on Ledger Page

---
*Last updated: [7/7/2025]* 