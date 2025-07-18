# TODO List

## High Priority
- [ ] Task 10: Add proper error handling and user feedback for modal operations
- [ ] Task 11: Implement proper state synchronization between actuals and ledger stores
- [ ] Task 12: Add loading states and progress indicators for modal operations 
- [ ] Task 36: Update the Ledger Table UI/UX to be much more polished and modern. The in-line editing is good, but can be much better. The dropdowns do not match the theme and feel of the rest of the application. This needs to be upgraded in a big way. The WBS Element dropdown, for example, needs to be in a tree structure and the overall UX when editing cells needs to be cleaner and not shift around the sizing of the cells so much.
- [x] Task 37: Ask if we should be using the ledger routes for the bulk import template instead of the index file
  - **Decision**: Using index.ts template endpoint (simpler, no routing conflicts)
  - **Implementation**: Updated template to use `wbsElementCode` instead of `wbsElementId` for user-friendly imports
  - **Benefits**: Users can now use readable WBS codes (e.g., "1.1.1", "1.2.3") instead of UUIDs

## Medium Priority
- [ ] Task 13: Fix Counting bug on Actuals Upload sessions (rejected, matched, unmatched)
- [ ] Task 14: Add unit tests for the new actuals store
- [ ] Task 15: Optimize performance by implementing proper memoization

## Low Priority
- [ ] Task 16: Remove Clear All Uploads button for standard users. This is a dangerous button to have in the UI.
- [ ] Task 19: Add keyboard shortcuts for common actions
- [ ] Task 20: Implement auto-save functionality for form inputs
- [ ] Task 21: Fix 3 dot menu on Programs page hiding the pop-up menu within the container instead of being outside of the container.
- [ ] Task 22: Fix Programs card view showing the incorrect "Last Closed Month"
- [ ] Task 23: Add banner showing that program is missing actuals for most recent month (like the card view) into the table view

## Shared Settings & Modules Implementation Plan

### Phase 1: Global Configuration Foundation (Week 1-2)
- [x] **Task 24**: Create Settings page with navigation and basic layout
  - Add Settings route to App.tsx
  - Create SettingsPage component with tab navigation
  - Implement basic settings store with Zustand
- [x] **Task 25**: Implement WBS (Work Breakdown Structure) templates
  - Create WBS template CRUD operations
  - Design WBS template form with hierarchical structure
  - Add WBS template selection to program creation
  - Implement automatic copying of WBS template elements to program WBS categories
  - Remove WBS template display from program directory (templates are copied, not referenced)
- [ ] **Task 26**: Implement Cost Category standardization
  - Create cost category management interface
  - Add cost category validation across all forms
  - Implement cost category dropdowns in ledger and actuals

### Phase 2: Vendor Management System (Week 3-4)
- [ ] **Task 27**: Create vendor database structure
  - Design vendor data model (name, contact, categories, performance)
  - Implement vendor CRUD operations
  - Add vendor search and filtering capabilities
- [ ] **Task 28**: Implement vendor categorization and tagging
  - Create vendor category management
  - Add vendor tagging system
  - Implement vendor performance tracking
- [ ] **Task 29**: Integrate vendor dropdowns across the application
  - Add vendor selection to ledger entries
  - Implement vendor selection in actuals upload
  - Create vendor autocomplete components

### Phase 3: Advanced Configuration (Week 5-6)
- [ ] **Task 30**: Implement currency and exchange rate management
  - Create currency configuration interface
  - Add exchange rate API integration
  - Implement multi-currency support in calculations
- [ ] **Task 31**: Add fiscal year and reporting period settings
  - Create fiscal year configuration
  - Implement reporting period management
  - Add date range validation across the application
- [ ] **Task 32**: Implement user preference management
  - Create user settings interface
  - Add theme and display preferences
  - Implement user-specific defaults

### Phase 4: Integration and Polish (Week 7-8)
- [ ] **Task 33**: Integrate settings across all existing features
  - Update ledger forms to use new settings
  - Update actuals forms to use new settings
  - Update program forms to use new settings
- [ ] **Task 34**: Add settings validation and error handling
  - Implement settings validation rules
  - Add error handling for settings operations
  - Create settings backup and restore functionality
- [ ] **Task 35**: Create settings documentation and help
  - Add inline help for settings pages
  - Create settings user guide
  - Add settings migration tools

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
- [x] Task 2: Fix bug on Ledger that makes Upload column "Potential Matches" disappear when undoing a rejected match (COMPLETED)
  - **Fix #1**: Added refresh of potential match IDs after successful undo reject operation
  - **Fix #2**: Implemented atomic state updates with parallel API calls for potential and rejected match IDs
  - **Fix #3**: Removed hardcoded fallback IDs that were causing maintenance issues
  - **Fix #4**: Fixed critical timing issue where potential match refresh was skipped due to race condition
  - **Root Cause**: Initialization used 100ms timeout that fired before entries loaded, causing potential match refresh to be skipped
  - **Solution**: Changed to trigger potential match refresh immediately after entries are successfully loaded
  - **Files Modified**: `frontend/src/store/ledgerStore.ts`, `frontend/src/components/features/ledger/LedgerTable/Table.tsx`

---
*Last updated: [7/17/2025]* 