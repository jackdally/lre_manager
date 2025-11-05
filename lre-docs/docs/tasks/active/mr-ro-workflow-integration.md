# MR & R&O Workflow Integration - Task Tracking

## Status: Planning Complete - Ready for Implementation

**Implementation Plan**: [docs/implementation-plans/mr-ro-workflow-integration.md](../implementation-plans/mr-ro-workflow-integration.md)

**Feature Branch**: TBD (will create per phase)

## Phase 1: Workflow Reordering ⏳

**Estimated Effort**: 1-2 days  
**Priority**: High (Quick Win)

### Backend Tasks
- [ ] **MR-RO-001**: Update ProgramSetupStatus entity
  - [ ] Add `initialMRSet: boolean` field
  - [ ] Add `roAnalysisComplete: boolean | null` field (optional)
  - [ ] Add `finalMRSet: boolean` field
  - [ ] Update entity definition

- [ ] **MR-RO-002**: Create database migration for ProgramSetupStatus updates
  - [ ] Create migration file
  - [ ] Add new columns to program_setup_status table
  - [ ] Test migration up and down

- [ ] **MR-RO-003**: Update programSetupService
  - [ ] Add `markInitialMRSet(programId)` method
  - [ ] Add `markROAnalysisComplete(programId)` method
  - [ ] Add `markROAnalysisSkipped(programId)` method
  - [ ] Add `markFinalMRSet(programId)` method
  - [ ] Update `setupComplete` logic to require finalMRSet

- [ ] **MR-RO-004**: Update programSetup routes
  - [ ] Add endpoints for new status updates
  - [ ] Update GET endpoint to return new fields
  - [ ] Test API endpoints

### Frontend Tasks
- [ ] **MR-RO-005**: Update ProgramSetup/index.tsx
  - [ ] Update step order and count
  - [ ] Add Initial MR step (Step 3)
  - [ ] Add R&O Analysis step (Step 4, optional)
  - [ ] Add Final MR step (Step 5)
  - [ ] Update step navigation logic
  - [ ] Handle optional step skipping

- [ ] **MR-RO-006**: Update BOESetupStep.tsx
  - [ ] Keep as Step 2 (Create BOE)
  - [ ] Ensure it still works correctly

- [ ] **MR-RO-007**: Create InitialMRSetupStep.tsx
  - [ ] Embed ManagementReserveCalculator
  - [ ] Allow Standard/Risk-Based/Custom methods
  - [ ] Mark as "Preliminary" or "Draft" MR
  - [ ] Add note: "This is preliminary MR. You'll finalize it after R&O analysis."
  - [ ] Call `markInitialMRSet` when MR is set
  - [ ] Allow proceeding to next step

- [ ] **MR-RO-008**: Update RiskOpportunitySetupStep.tsx
  - [ ] Keep as Step 4 (Initialize R&O Register)
  - [ ] Ensure it still works correctly

- [ ] **MR-RO-009**: Create ROAnalysisSetupStep.tsx (Optional Step)
  - [ ] Show link to R&O page
  - [ ] Show count of risks/opportunities entered
  - [ ] Mark as optional step
  - [ ] Allow skipping (mark as skipped)
  - [ ] Show guidance: "Enter risks and opportunities to inform MR calculation (optional)"
  - [ ] Call `markROAnalysisComplete` when complete
  - [ ] Call `markROAnalysisSkipped` when skipped

- [ ] **MR-RO-010**: Create FinalMRSetupStep.tsx
  - [ ] Embed ManagementReserveCalculator
  - [ ] Show Initial MR amount for comparison
  - [ ] Show R&O-Driven option (if R&O data exists)
  - [ ] Allow Standard/Risk-Based/Custom methods
  - [ ] Show comparison: Initial MR vs Final MR
  - [ ] Require justification for significant changes
  - [ ] Call `markFinalMRSet` when MR is finalized
  - [ ] Allow proceeding to approval step

- [ ] **MR-RO-011**: Update BaselineSetupStep.tsx
  - [ ] Verify it requires final MR before allowing baseline
  - [ ] Check finalMRSet status
  - [ ] Show error if final MR not set

- [ ] **MR-RO-012**: Update SetupProgress.tsx
  - [ ] Update step labels
  - [ ] Show optional indicator for R&O Analysis step
  - [ ] Update progress calculation

### Testing Tasks
- [ ] **MR-RO-013**: Test complete setup flow with R&O analysis
- [ ] **MR-RO-014**: Test complete setup flow without R&O analysis (skip)
- [ ] **MR-RO-015**: Verify Initial MR → Final MR workflow
- [ ] **MR-RO-016**: Test that setup can't complete without final MR
- [ ] **MR-RO-017**: Verify all status fields update correctly

## Phase 2: R&O-Driven MR Calculation ⏳

**Estimated Effort**: 3-5 days  
**Priority**: High  
**Dependencies**: Phase 1 complete, R&O entities must have required fields

### Backend Tasks
- [ ] **MR-RO-020**: Define severity weight constants
  - [ ] Low: 0.5x
  - [ ] Medium: 1.0x
  - [ ] High: 1.5x
  - [ ] Critical: 2.0x
  - [ ] Add to constants file or service

- [ ] **MR-RO-021**: Create calculateRODrivenMR() method in boeService.ts
  - [ ] Fetch risks for program/BOE
  - [ ] Calculate expected value for each risk: `Probability × Most Likely Cost Impact × Severity Multiplier`
  - [ ] Sum all risk adjustments
  - [ ] Calculate base MR using Standard method
  - [ ] Add risk adjustments to base MR
  - [ ] Return final MR amount and breakdown
  - [ ] Handle edge cases (no risks, zero probabilities, etc.)

- [ ] **MR-RO-022**: Update riskOpportunityService.ts
  - [ ] Add method to fetch risks for MR calculation
  - [ ] Ensure risks have required fields (cost impact, probability, severity)
  - [ ] Filter out closed/mitigated risks (if applicable)

- [ ] **MR-RO-023**: Create R&O-Driven calculation API endpoint
  - [ ] Add POST endpoint: `/api/boe-versions/:boeVersionId/management-reserve/calculate-ro-driven`
  - [ ] Accept boeVersionId
  - [ ] Call calculateRODrivenMR()
  - [ ] Return calculation breakdown
  - [ ] Handle errors

- [ ] **MR-RO-024**: Update ManagementReserve entity (if needed)
  - [ ] Verify calculationMethod supports 'R&O-Driven'
  - [ ] Add fields for calculation breakdown if needed

### Frontend Tasks
- [ ] **MR-RO-025**: Create ROImpactCalculation helper
  - [ ] Move to boeCalculationService.ts or create new service
  - [ ] Add severity weight constants
  - [ ] Add calculation helper functions
  - [ ] Add TypeScript types for breakdown

- [ ] **MR-RO-026**: Update ManagementReserveCalculator.tsx
  - [ ] Fetch risks from R&O service when component loads
  - [ ] Show R&O-Driven option only if risks exist
  - [ ] Call R&O-Driven calculation API when selected
  - [ ] Display calculation breakdown:
    - Base MR (Standard calculation)
    - Risk adjustments (list of risks with expected values)
    - Opportunity impact (informational only, separate section)
    - Final MR amount
  - [ ] Allow manual override of R&O-Driven calculation
  - [ ] Show comparison with Initial MR

- [ ] **MR-RO-027**: Update FinalMRSetupStep.tsx
  - [ ] Integrate R&O-Driven calculation option
  - [ ] Show calculation breakdown in UI
  - [ ] Allow switching between methods
  - [ ] Show opportunity impact separately (informational)

- [ ] **MR-RO-028**: Create ROImpactBreakdown component
  - [ ] Display risk list with expected values
  - [ ] Show severity multipliers
  - [ ] Show opportunity impact (separate section)
  - [ ] Format currency and percentages

### Testing Tasks
- [ ] **MR-RO-029**: Test with various risk scenarios
  - [ ] Test with Low severity risks
  - [ ] Test with Medium severity risks
  - [ ] Test with High severity risks
  - [ ] Test with Critical severity risks
  - [ ] Test with multiple risks of different severities

- [ ] **MR-RO-030**: Test with opportunities
  - [ ] Verify opportunities don't affect MR calculation
  - [ ] Verify opportunities are shown separately (informational)

- [ ] **MR-RO-031**: Test edge cases
  - [ ] No risks entered
  - [ ] Zero probability risks
  - [ ] Zero cost impact risks
  - [ ] Very high risk scenarios

- [ ] **MR-RO-032**: Test manual override
  - [ ] Verify R&O-Driven can be overridden
  - [ ] Verify override persists correctly

## Phase 3: Move MR Utilization to R&O Page ⏳

**Estimated Effort**: 3-4 days  
**Priority**: High  
**Dependencies**: Phase 1 complete, R&O entities exist

### Backend Tasks
- [ ] **MR-RO-040**: Update Risk entity
  - [ ] Add `materializedAt: Date | null`
  - [ ] Add `mrUtilizedAmount: number` (default: 0)
  - [ ] Add `mrUtilizationDate: Date | null`
  - [ ] Add `mrUtilizationReason: string | null`
  - [ ] Add relationship to ManagementReserve (if needed)

- [ ] **MR-RO-041**: Create database migration for Risk entity updates
  - [ ] Create migration file
  - [ ] Add new columns
  - [ ] Test migration up and down

- [ ] **MR-RO-042**: Update riskOpportunityService.ts
  - [ ] Add `utilizeMRForRisk(riskId, amount, reason)` method
  - [ ] Validate MR amount is available
  - [ ] Update MR utilization
  - [ ] Link MR utilization to risk entry
  - [ ] Update risk entity with utilization data
  - [ ] Handle errors (insufficient MR, invalid risk, etc.)

- [ ] **MR-RO-043**: Create MR utilization API endpoint
  - [ ] Add POST endpoint: `/api/risks/:riskId/utilize-mr`
  - [ ] Accept amount and reason
  - [ ] Call utilizeMRForRisk()
  - [ ] Return updated risk and MR
  - [ ] Handle errors

- [ ] **MR-RO-044**: Update Opportunity entity (if needed)
  - [ ] Ensure `realizedAt` field exists
  - [ ] Verify cost impact fields exist
  - [ ] Note: No MR credit fields needed

### Frontend Tasks
- [ ] **MR-RO-045**: Create MRUtilizationRequest.tsx component
  - [ ] Form to request MR utilization
  - [ ] Show available MR amount
  - [ ] Input for amount (with validation)
  - [ ] Input for reason (required)
  - [ ] Link to risk entry
  - [ ] Submit button with simple approval
  - [ ] Show success/error messages
  - [ ] Refresh MR and risk data after submission

- [ ] **MR-RO-046**: Update RiskOpportunityPage.tsx
  - [ ] Add "Request MR Utilization" button when risk is materialized
  - [ ] Show MR utilization form (using MRUtilizationRequest component)
  - [ ] Display MR utilization history with risk context
  - [ ] Show opportunity impact tracking (separate section)
  - [ ] Add link to MR tab for summary view
  - [ ] Update risk list to show MR utilization status

- [ ] **MR-RO-047**: Update ManagementReserveTab.tsx
  - [ ] Hide "Utilization" view after BOE is baselined
  - [ ] Keep "Display" view as read-only summary
  - [ ] Create "MR Summary" view:
    - Current MR status (baseline, adjusted, utilized, remaining)
    - Utilization history (with links to risk entries)
    - Link to R&O page for new utilization requests
  - [ ] Show note: "MR utilization is now managed on the R&O page"
  - [ ] Before baselining: Keep current functionality

- [ ] **MR-RO-048**: Update ManagementReserveUtilization.tsx (if needed)
  - [ ] Mark as deprecated or remove after baselining
  - [ ] Or keep for pre-baseline use only

- [ ] **MR-RO-049**: Create MRUtilizationHistory component
  - [ ] Display utilization history with risk context
  - [ ] Show risk name, date, amount, reason
  - [ ] Link to risk entry
  - [ ] Format currency and dates

### Testing Tasks
- [ ] **MR-RO-050**: Test MR utilization from R&O page
  - [ ] Test with valid risk
  - [ ] Test with insufficient MR
  - [ ] Test with invalid amount
  - [ ] Verify MR updates correctly
  - [ ] Verify risk entity updates correctly

- [ ] **MR-RO-051**: Test opportunity tracking
  - [ ] Verify opportunities tracked separately
  - [ ] Verify no MR linkage
  - [ ] Verify opportunity impact displays correctly

- [ ] **MR-RO-052**: Test MR tab after baselining
  - [ ] Verify utilization view is hidden
  - [ ] Verify summary view shows correctly
  - [ ] Verify links to R&O page work
  - [ ] Verify utilization history displays correctly

- [ ] **MR-RO-053**: Test end-to-end utilization workflow
  - [ ] Risk materializes → Request MR → Approve → Verify updates

## Phase 4: UI/UX Polish ⏳

**Estimated Effort**: 2-3 days  
**Priority**: Medium  
**Dependencies**: All previous phases complete

### Tasks
- [ ] **MR-RO-060**: Update setup page text and guidance
  - [ ] Add tooltips explaining Initial MR vs Final MR
  - [ ] Add note about R&O analysis being optional
  - [ ] Update step descriptions
  - [ ] Add help text where needed

- [ ] **MR-RO-061**: Update MR calculator UI
  - [ ] Clearly show R&O-Driven option (when available)
  - [ ] Improve calculation breakdown display
  - [ ] Add tooltips for calculation methods
  - [ ] Improve comparison view (Initial vs Final)

- [ ] **MR-RO-062**: Update R&O page UI
  - [ ] Clearly separate risk MR utilization from opportunity tracking
  - [ ] Add help text explaining opportunity impact tracking
  - [ ] Improve MR utilization request form
  - [ ] Improve utilization history display

- [ ] **MR-RO-063**: Update MR tab UI
  - [ ] Improve summary view
  - [ ] Add clear messaging about utilization location
  - [ ] Improve utilization history display
  - [ ] Add helpful links and guidance

- [ ] **MR-RO-064**: Update MANUAL_TESTING_GUIDE.md
  - [ ] Add steps for Initial MR
  - [ ] Add steps for R&O Analysis (optional)
  - [ ] Add steps for Final MR
  - [ ] Add steps for MR utilization from R&O page
  - [ ] Update verification checklist

- [ ] **MR-RO-065**: End-to-end testing
  - [ ] Test complete workflow with R&O
  - [ ] Test complete workflow without R&O
  - [ ] Test MR utilization workflow
  - [ ] Verify all UI text is correct
  - [ ] Verify all links work
  - [ ] Verify all data persists

- [ ] **MR-RO-066**: Code review
  - [ ] Review all changes
  - [ ] Check for consistency
  - [ ] Verify error handling
  - [ ] Check performance

## Documentation

- [ ] **MR-RO-070**: Update implementation plan with any learnings
- [ ] **MR-RO-071**: Create user guide for new workflow
- [ ] **MR-RO-072**: Update API documentation
- [ ] **MR-RO-073**: Update architecture diagrams if needed

## Notes

- All phases should be implemented and tested before moving to next phase
- Create feature branches per phase: `feature/mr-ro-workflow-phase1`, etc.
- Merge each phase to develop after completion and testing
- R&O analysis is optional - ensure UX makes this clear
- Opportunities do NOT affect MR - track separately
- MR utilization approval is simple PM approval (no escalation)

## Current Status

**Phase**: Planning Complete  
**Next Step**: Begin Phase 1 - Workflow Reordering  
**Branch**: TBD

