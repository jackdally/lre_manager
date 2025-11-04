<!-- e26ff791-b652-41bd-8e31-f548a3929ce4 e99abce6-41c0-494a-a753-ee980f757900 -->
# BOE Workflow Verification and UX Enhancement Plan

## Overview

This plan addresses BOE workflow verification and creates a comprehensive program setup experience that guides Program Managers through the initial program creation process, ensuring all critical components (BOE, Risk & Opportunity register, ledger baseline) are completed before showing the standard dashboard view.

## Phase 1: BOE Workflow Verification

### 1.1 Verify BOE Creation Workflow Logic

- **Files to review:**
- `backend/src/services/boeService.ts` - BOE creation logic
- `backend/src/routes/boe.ts` - BOE creation endpoints
- `frontend/src/components/features/boe/BOEWizard.tsx` - Frontend wizard flow
- `frontend/src/services/boeApi.ts` - API integration

- **Verification tasks:**
- Review BOE creation flow from wizard to database
- Verify all validation rules are properly enforced
- Check that BOE versions are created correctly
- Ensure proper error handling and user feedback
- Test edge cases (empty BOEs, invalid data, etc.)

### 1.2 Verify BOE Approval Workflow

- **Files to review:**
- `backend/src/services/approvalWorkflowService.ts` - Approval logic
- `backend/src/routes/boe.ts` - Approval endpoints
- `frontend/src/components/features/boe/BOEApprovalWorkflow.tsx` - UI component

- **Verification tasks:**
- Test Draft → Under Review → Approved/Rejected flow
- Verify approval levels are assigned correctly based on BOE amount
- Test approval progression (Level 1 → Level 2 → Level 3)
- Verify notifications are sent appropriately
- Check that approval status updates correctly in UI
- Test edge cases (rejection, escalation, etc.)

### 1.3 Verify BOE to Ledger Push

- **Files to review:**
- `backend/src/services/boeService.ts` - `pushBOEToLedger` method
- `backend/src/services/boeElementAllocationService.ts` - `pushToLedger` method
- `backend/src/routes/boe.ts` - Push to ledger endpoint
- `frontend/src/components/features/boe/BOEPage.tsx` - Push button handler

- **Verification tasks:**
- Verify allocations are correctly converted to ledger entries
- Check that monthly breakdowns are properly distributed
- Verify WBS elements are created/linked correctly
- Test that BOE status updates to "Baseline" after push
- Verify ledger entries have correct metadata (createdFromBOE flag, etc.)
- Test error handling for invalid BOE states

## Phase 2: Program Setup Flow Implementation

### 2.1 Create Program Setup Status Tracking ✅ COMPLETE

- **Completed files:**
- ✅ `backend/src/entities/ProgramSetupStatus.ts` - Entity to track setup completion
- ✅ `backend/src/services/programSetupService.ts` - Service for setup status management
- ✅ `backend/src/migrations/1700000000008-CreateProgramSetupStatus.ts` - Database migration
- ✅ `backend/src/routes/programSetup.ts` - Endpoint to get/update setup status

- **Setup status fields:**
- ✅ `programId`: Reference to program
- ✅ `boeCreated`: boolean (default: false)
- ✅ `boeApproved`: boolean (default: false)
- ✅ `boeBaselined`: boolean (default: false)
- ✅ `riskOpportunityRegisterCreated`: boolean (default: false)
- ✅ `setupComplete`: boolean (computed based on above)
- ✅ `createdAt`, `updatedAt`: timestamps

- **Backend changes:**
- ✅ Update `backend/src/routes/program.ts` - Add setup status check on program creation
- ✅ Update `backend/src/services/boeService.ts` - Update setup status when BOE is created/baselined
- ✅ Update `backend/src/services/approvalWorkflowService.ts` - Update setup status when BOE is approved
- ✅ Create `backend/src/routes/programSetup.ts` - Endpoint to get/update setup status

### 2.2 Create Program Setup Page Component ✅ COMPLETE

- **Completed files:**
- ✅ `frontend/src/components/features/programs/ProgramSetup/index.tsx` - Main setup page
- ✅ `frontend/src/components/features/programs/ProgramSetup/SetupProgress.tsx` - Progress indicator
- ✅ `frontend/src/services/programSetupApi.ts` - API service for setup status

- **Setup page structure:**
- ✅ Shows progress indicator at top
- ✅ Displays current step prominently
- ✅ Each step is a full-page experience (not a modal)
- ✅ Next step is disabled until current step is complete
- ✅ Auto-redirects to dashboard when setup is complete

### 2.3 Implement BOE Setup Step ✅ COMPLETE

- **Completed integration:**
- ✅ `frontend/src/components/features/programs/ProgramSetup/BOESetupStep.tsx` - BOE setup step component
- ✅ Embed BOE wizard directly in setup flow
- ✅ Auto-navigate to BOE creation when program is created
- ✅ Show BOE wizard as first step in setup page
- ✅ After BOE creation, automatically check for approval requirement
- ✅ If approval needed, show approval status and wait for approval
- ✅ Once approved (or if no approval needed), mark step complete
- ✅ Backend auto-updates setup status when BOE is created/approved

### 2.4 Implement Risk & Opportunity Register Setup Step ⏳ PENDING

- **Recommendation:** Create basic register structure (not full wizard)
- Create empty Risk entity with program association
- Create empty Opportunity entity with program association
- This creates the framework without requiring entries
- Users can add actual risks/opportunities later via the R&O tab
- Simple "Create Register" button that initializes the register

- **Backend changes needed:**
- Create `backend/src/routes/riskOpportunity.ts` - Basic CRUD endpoints
- Create `backend/src/services/riskOpportunityService.ts` - Service for R&O operations
- Add endpoint to initialize register: `POST /api/programs/:id/risk-opportunity/initialize`

- **Frontend changes needed:**
- Create `frontend/src/components/features/programs/ProgramSetup/RiskOpportunitySetupStep.tsx`
- Show simple explanation of what the register is
- Single "Create Risk & Opportunity Register" button
- On click, initialize register and mark step complete

### 2.5 Implement Baseline Step ✅ COMPLETE

- **Completed integration:**
- ✅ `frontend/src/components/features/programs/ProgramSetup/BaselineSetupStep.tsx` - Baseline step component
- ✅ Show current BOE status
- ✅ Button to push BOE to ledger
- ✅ Show confirmation when baseline is complete
- ✅ Mark step complete when BOE status is "Baseline"
- ✅ Backend auto-updates setup status when BOE is baselined

### 2.6 Update Program Dashboard Routing ✅ COMPLETE

- **Completed files:**
- ✅ `frontend/src/App.tsx` - Add route for program setup page (`/programs/:id/setup`)
- ✅ `frontend/src/components/features/programs/ProgramDashboard/index.tsx` - Check setup status on load

- **Completed logic:**
- ✅ When accessing `/programs/:id/dashboard`, check setup status first
- ✅ If setup not complete, redirect to `/programs/:id/setup`
- ✅ Setup page shows instead of dashboard until setup is complete
- ✅ Once complete, redirect to dashboard and show standard view

### 2.7 Update Program Creation Flow ✅ COMPLETE

- **Completed files:**
- ✅ `frontend/src/components/features/programs/ProgramDirectory/index.tsx` - After program creation, redirect to setup page

- **Completed behavior:**
- ✅ After creating program, redirect to `/programs/:id/setup` instead of dashboard
- ✅ Setup page is the first thing users see for new programs

## Phase 3: Monthly Actuals Upload Reminders

### 3.1 Create Monthly Reminder Service ⏳ PENDING

- **New files needed:**
- `backend/src/services/monthlyActualsReminderService.ts` - Service to handle reminders
- `backend/src/entities/MonthlyReminder.ts` - Track reminder status per program/month

- **Backend changes needed:**
- Create scheduled job (cron) that runs on 5th of each month
- Job checks all active programs
- For each program, check if actuals exist for previous month
- Create reminder records for programs missing actuals
- Send email notifications (placeholder for now, integrate with email service later)
- Create in-app notification records

### 3.2 Create Reminder API Endpoints ⏳ PENDING

- **New routes needed:**
- `GET /api/programs/:id/monthly-reminders` - Get reminders for a program
- `POST /api/programs/:id/monthly-reminders/:reminderId/dismiss` - Dismiss a reminder
- `GET /api/monthly-reminders/pending` - Get all pending reminders (for notification system)

### 3.3 Create In-App Notification System ⏳ PENDING

- **New files needed:**
- `frontend/src/components/common/MonthlyActualsReminder.tsx` - Reminder banner component
- `frontend/src/store/notificationStore.ts` - Store for managing notifications

- **Integration needed:**
- Add reminder banner to Program Dashboard
- Show reminder when user accesses program with missing actuals
- Banner includes link to actuals upload page
- User can dismiss reminder (updates backend)
- Reminder persists until actuals are uploaded or dismissed

### 3.4 Create Email Notification Template ⏳ PENDING

- **New files needed:**
- `backend/src/templates/monthlyActualsReminderEmail.ts` - Email template
- Integration with email service (placeholder for now)

- **Email content needed:**
- Subject: "Monthly Actuals Reminder - [Program Name]"
- Body includes program name, missing month, link to upload page
- Sent to program manager (when available)

## Phase 4: Additional UX Improvements

### 4.1 Program Health Indicators ✅ COMPLETE

- ✅ Add visual indicators on Program Dashboard for:
- ✅ Dynamic health concerns (VAC, SPI, CPI, Missing Actuals, BOE Age, BOE Variance)
- ✅ Missing actuals alerts
- ✅ Budget variance warnings
- ✅ Actionable metrics with quick navigation links
- ✅ Only displays when concerns exist (clean UI when healthy)

### 4.2 Navigation Improvements ✅ COMPLETE

- ✅ Update sidebar navigation to show setup status
- ✅ Add progress indicator in navigation for programs in setup
- ✅ Disable certain tabs until setup is complete (if appropriate)

### 4.3 Enhanced Error Messages ✅ COMPLETE

- ✅ Improve error messages throughout BOE workflow
- ✅ Add validation feedback in real-time
- ✅ Better error recovery suggestions

## Branch Strategy

Following the development guidelines in `.git-branch-strategy.md` and `FEATURE_DEVELOPMENT_GUIDE.md`, we will create feature branches from `develop` and merge them back incrementally. This allows for regular checkpoints and PR tracking.

### Completed Branches

1. ✅ `feature/program-setup-status-tracking` - Backend infrastructure for tracking program setup completion
2. ✅ `feature/program-setup-page-structure` - Frontend setup page component structure
3. ✅ `feature/boe-setup-step` - BOE creation as first step in program setup
4. ✅ `feature/baseline-setup-step` - Ledger baseline step in setup flow

### Remaining Branches

#### 5. `feature/risk-opportunity-register-setup` ⏳ NEXT

- **Purpose:** Risk & Opportunity register initialization
- **Scope:** Phase 2.4 - Basic R&O register backend and frontend setup step
- **Files:**
  - Backend: `backend/src/routes/riskOpportunity.ts`, `backend/src/services/riskOpportunityService.ts`
  - Frontend: `frontend/src/components/features/programs/ProgramSetup/RiskOpportunitySetupStep.tsx`
  - Basic Risk and Opportunity entities (if not already created)
- **Dependencies:** Requires `feature/program-setup-page-structure` merged ✅
- **Merge Strategy:** Merge to develop when register setup is complete

#### 6. `feature/monthly-actuals-reminder-backend` 

- **Purpose:** Backend infrastructure for monthly actuals reminders
- **Scope:** Phase 3.1-3.2 - Reminder service, entity, and API endpoints
- **Files:**
  - `backend/src/services/monthlyActualsReminderService.ts`
  - `backend/src/entities/MonthlyReminder.ts`
  - `backend/src/routes/monthlyReminders.ts`
  - Cron job setup (using node-cron or similar)
  - Database migration for MonthlyReminder
- **Merge Strategy:** Merge to develop when backend is complete and tested

#### 7. `feature/monthly-actuals-reminder-frontend`

- **Purpose:** Frontend notification system for monthly reminders
- **Scope:** Phase 3.3-3.4 - In-app banner and email template
- **Files:**
  - `frontend/src/components/common/MonthlyActualsReminder.tsx`
  - `frontend/src/store/notificationStore.ts`
  - `backend/src/templates/monthlyActualsReminderEmail.ts`
  - Integration into Program Dashboard
- **Dependencies:** Requires `feature/monthly-actuals-reminder-backend` merged
- **Merge Strategy:** Merge to develop when reminder notifications are functional

#### 8. `feature/program-health-indicators`

- **Purpose:** Additional UX improvements for program health
- **Scope:** Phase 4 - Health indicators, navigation improvements, error messages
- **Files:**
  - Updates to `frontend/src/components/features/programs/ProgramDashboard/index.tsx`
  - Navigation component updates
  - Error message improvements throughout BOE workflow
- **Dependencies:** Can be developed in parallel with other features
- **Merge Strategy:** Merge to develop when UX improvements are complete

### Implementation Order

1. ✅ **Phase 2.1:** Create setup status tracking - `feature/program-setup-status-tracking`
2. ✅ **Phase 2.2:** Create setup page structure - `feature/program-setup-page-structure`
3. ✅ **Phase 2.3:** Implement BOE setup step - `feature/boe-setup-step`
4. ✅ **Phase 2.5:** Implement baseline step - `feature/baseline-setup-step`
5. ✅ **Phase 2.6-2.7:** Update routing and program creation - Completed within setup step branches
6. ⏳ **Phase 2.4:** Implement Risk & Opportunity register setup - `feature/risk-opportunity-register-setup` **NEXT**
7. ⏳ **Phase 3.1-3.2:** Implement monthly reminders backend - `feature/monthly-actuals-reminder-backend`
8. ⏳ **Phase 3.3-3.4:** Implement monthly reminders frontend - `feature/monthly-actuals-reminder-frontend`
9. ⏳ **Phase 4:** Additional UX improvements - `feature/program-health-indicators`

## Testing Strategy

- Manual verification of BOE workflows
- Integration testing of setup flow
- Test setup flow with new programs
- Test reminder system (may need to manually trigger for testing)
- Verify all steps can be completed in order
- Test error handling and recovery

## Notes

- Risk & Opportunity register setup is intentionally simple (just creates structure)
- Full R&O management will be built out separately per the R&O implementation plan
- Monthly reminders use cron job (consider using node-cron or similar)
- Email notifications are placeholder until email service is integrated
- Setup flow replaces dashboard until complete, providing clear guidance

### To-dos

## Phase 1: Workflow Reordering

### Backend
- [ ] Update ProgramSetupStatus entity with initialMRSet, roAnalysisComplete (nullable), finalMRSet fields
- [ ] Create database migration for ProgramSetupStatus new fields
- [ ] Update programSetupService with markInitialMRSet, markROAnalysisComplete, markROAnalysisSkipped, markFinalMRSet methods
- [ ] Update programSetup routes to support new status fields and endpoints

### Frontend
- [ ] Update ProgramSetup/index.tsx with new step order (7 steps instead of 3)
- [ ] Create InitialMRSetupStep.tsx component with ManagementReserveCalculator
- [ ] Create ROAnalysisSetupStep.tsx optional step component
- [ ] Create FinalMRSetupStep.tsx component with Initial MR comparison
- [ ] Update BaselineSetupStep.tsx to require finalMRSet before allowing baseline
- [ ] Update SetupProgress.tsx with new step labels and optional step indicator
- [ ] Update programSetupApi.ts with new fields and API methods

### Testing
- [ ] Test complete setup flow with R&O analysis
- [ ] Test complete setup flow without R&O analysis (skip optional step)
- [ ] Verify Initial MR → Final MR workflow
- [ ] Test that setup cannot complete without final MR

## Phase 2: R&O-Driven MR Calculation

### Backend
- [ ] Create severity weight constants file (Low=0.5x, Medium=1.0x, High=1.5x, Critical=2.0x)
- [ ] Implement calculateRODrivenMR() method in boeService.ts
- [ ] Update riskOpportunityService.ts with getRisksForMRCalculation method
- [ ] Create POST /api/boe-versions/:boeVersionId/management-reserve/calculate-ro-driven endpoint
- [ ] Verify ManagementReserve entity supports 'R&O-Driven' calculation method

### Frontend
- [ ] Create roImpactCalculationService.ts with severity weights and calculation helpers
- [ ] Update ManagementReserveCalculator.tsx to fetch risks and show R&O-Driven option
- [ ] Update FinalMRSetupStep.tsx to enable R&O-Driven calculation
- [ ] Create ROImpactBreakdown.tsx component to display risk adjustments

### Testing
- [ ] Test with various risk scenarios (Low/Medium/High/Critical severity)
- [ ] Test with opportunities (verify they don't affect MR)
- [ ] Test edge cases (no risks, zero probability, zero cost impact)
- [ ] Test manual override functionality

## Phase 3: Move MR Utilization to R&O Page ✅ COMPLETE

### Backend
- [x] Update Risk entity with materializedAt, mrUtilizedAmount, mrUtilizationDate, mrUtilizationReason fields
- [x] Create database migration for Risk entity MR utilization fields
- [x] Implement utilizeMRForRisk() method in riskOpportunityService.ts
- [x] Create POST /api/risks/:riskId/utilize-mr endpoint
- [x] Verify Opportunity entity has realizedAt and cost impact fields (Note: Opportunity entity does not exist yet - will be implemented in future feature)

### Frontend
- [x] Create MRUtilizationRequest.tsx component with form for MR utilization
- [x] Update RiskOpportunityPage.tsx to add Request MR Utilization button and display history
- [x] Update ManagementReserveTab.tsx to hide utilization view after baselining and show MR Summary
- [x] Create MRUtilizationHistory.tsx component to display history with risk context

### Testing
- [ ] Test MR utilization from R&O page with valid risk (pending full R&O UI)
- [ ] Test with insufficient MR (should show error)
- [ ] Test opportunity tracking (separate from MR)
- [ ] Verify MR tab shows read-only summary after baselining
- [ ] Test end-to-end utilization workflow

## Phase 4: UI/UX Polish

- [ ] Update all setup step components with improved guidance text
- [ ] Add tooltips explaining Initial MR vs Final MR
- [ ] Add clear note about R&O analysis being optional
- [ ] Update MR calculator UI to clearly show R&O-Driven option
- [ ] Improve calculation breakdown display and comparison view
- [ ] Update R&O page to clearly separate risk MR utilization from opportunity tracking
- [ ] Improve MR utilization request form UI and utilization history display
- [ ] Update MANUAL_TESTING_GUIDE.md with new steps
- [ ] End-to-end testing of all workflows
- [ ] Code review and consistency check

