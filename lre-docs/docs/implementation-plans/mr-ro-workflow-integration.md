# Management Reserve and Risk & Opportunity Workflow Integration Plan

## Overview

This plan addresses the integration of Management Reserve (MR) calculation with Risk & Opportunity (R&O) analysis, and the proper workflow sequencing for program setup. It also addresses moving MR utilization from the MR tab to the R&O page where it logically belongs.

## Decisions Made

1. **R&O Analysis**: Optional (best practice, but not required)
2. **Opportunity Credits**: Track impact separately - opportunities do NOT reduce MR
3. **MR Adjustment Approval**: BOE approval is sufficient (no separate approval needed)
4. **R&O-Driven Calculation**: Use standard severity weights; opportunity credits tracked separately
5. **MR Utilization Approval**: Simple Program Manager approval (no escalation)

## Proposed Workflow Structure

### Phase 1: Setup Workflow (Initial Program Creation)

**Revised Setup Sequence:**

1. **Create BOE** ✓ (Already implemented)
   - Define WBS structure
   - Create allocations
   - This establishes the base cost estimate

2. **Set Initial MR** ✓ (Already implemented, but needs adjustment)
   - **Purpose**: Set preliminary MR based on Standard/Risk-Based/Custom methods
   - **Status**: This is a "draft" MR that can be adjusted
   - **Calculation**: Based on allocated cost (once allocations complete)
   - **Note**: This is NOT the final MR - it's a starting point

3. **Initialize R&O Register** ✓ (Already implemented)
   - Create empty Risk & Opportunity register structure
   - This enables R&O analysis

4. **Analyze Risks & Opportunities** (New step - OPTIONAL)
   - Program Manager can optionally identify and enter risks/opportunities
   - Each risk/opportunity has:
     - Cost impact (min/most likely/max)
     - Probability/likelihood (0-100%)
     - Severity/priority (Low/Medium/High/Critical)
   - This data feeds into R&O-Driven MR calculation
   - **Note**: This step can be skipped - user can proceed to finalize MR

5. **Finalize MR** (New step - after optional R&O analysis)
   - **Option A**: Use R&O-Driven calculation method (if R&O data exists)
     - Automatically calculates MR based on identified risks
     - Shows breakdown: Base MR + Risk adjustments
     - Opportunities tracked separately (do not reduce MR)
   - **Option B**: Keep current method but adjust based on insights
     - Manually adjust Standard/Risk-Based/Custom MR
     - Justification should reference R&O analysis if available
   - **Option C**: Skip R&O analysis and use Initial MR
     - If R&O analysis was skipped, Initial MR becomes Final MR
   - **Status**: This becomes the "baseline" MR for approval

6. **Submit BOE for Approval** ✓ (Already implemented)
   - BOE includes final MR amount
   - Approval workflow proceeds as normal

7. **Baseline to Ledger** ✓ (Already implemented)
   - Push BOE and MR to ledger
   - MR becomes available for utilization

### Phase 2: Post-Setup MR Utilization (Program Execution)

**After BOE is baselined:**

1. **MR Utilization Location**: Move from MR tab to R&O page
   - **Rationale**: MR is utilized when risks materialize or opportunities are realized
   - **Workflow**: 
     - Risk materializes → Create/update risk entry → Request MR utilization
     - Opportunity is realized → Create/update opportunity entry → Track impact (separate from MR)
   - **Approval**: Simple Program Manager approval

2. **MR Tab Changes**:
   - **Calculator View**: Removed after baselining (MR is locked)
   - **Display View**: Read-only MR status and history
   - **Utilization View**: Removed (moved to R&O page)
   - **New View**: "MR Summary" - Shows current MR status, remaining amount, utilization summary

3. **R&O Page Integration**:
   - **Risk Management Tab**:
     - When risk materializes, show "Request MR Utilization" button
     - Link to risk entry with MR request
     - Track MR utilization per risk
   - **Opportunity Management Tab**:
     - When opportunity is realized, track cost impact separately
     - Do NOT link to MR utilization
     - Track opportunity impact independently
   - **MR Utilization History**: Show on R&O page with risk context

## Standard Severity Weights

For R&O-Driven MR calculation, use these standard severity multipliers:

| Severity | Multiplier | Description |
|----------|-----------|-------------|
| Low | 0.5x | Minor impact, low probability |
| Medium | 1.0x | Moderate impact, moderate probability |
| High | 1.5x | Significant impact, higher probability |
| Critical | 2.0x | Major impact, high probability |

**Calculation Formula:**
```
Expected Value = Probability × Most Likely Cost Impact × Severity Multiplier
Risk Adjustment = Sum of all risk expected values
Final MR = Base MR (Standard calculation) + Risk Adjustment
```

**Note**: No minimum MR percentage threshold - MR can be as low as calculated, but should be justified if significantly below standard percentages.

## Implementation Plan

### Phase 1: Workflow Reordering (Quick Win)

**Estimated Effort**: 1-2 days

**Tasks:**
- [ ] Update setup step order in `ProgramSetup/index.tsx`
- [ ] Split MR into two steps: Initial MR and Final MR
- [ ] Add R&O analysis step (optional, can be skipped)
- [ ] Update `ProgramSetupStatus` entity to track:
  - `initialMRSet`: boolean
  - `roAnalysisComplete`: boolean (optional, can be null)
  - `finalMRSet`: boolean
- [ ] Update `programSetupService.ts` to support new status fields
- [ ] Update setup status logic to make R&O analysis optional
- [ ] Update `BOESetupStep.tsx` to show Initial MR step
- [ ] Create `FinalMRSetupStep.tsx` component
- [ ] Create `ROAnalysisSetupStep.tsx` component (optional step)
- [ ] Update `BaselineSetupStep.tsx` to require final MR before baselining

**Files to Modify:**
- `frontend/src/components/features/programs/ProgramSetup/index.tsx`
- `frontend/src/components/features/programs/ProgramSetup/BOESetupStep.tsx`
- `frontend/src/components/features/programs/ProgramSetup/RiskOpportunitySetupStep.tsx`
- `frontend/src/components/features/programs/ProgramSetup/BaselineSetupStep.tsx`
- `backend/src/entities/ProgramSetupStatus.ts`
- `backend/src/services/programSetupService.ts`
- `backend/src/migrations/` - Create migration for new fields

### Phase 2: R&O-Driven MR Calculation

**Estimated Effort**: 3-5 days

**Tasks:**
- [ ] Create `calculateRODrivenMR()` method in `boeService.ts`
  - Fetch risks for program
  - Calculate expected value for each risk
  - Apply severity multipliers
  - Sum risk adjustments
  - Add to base MR (Standard calculation)
- [ ] Update `ManagementReserveCalculator.tsx` to:
  - Fetch risks from R&O service
  - Show R&O-Driven calculation option (if risks exist)
  - Display breakdown: Base MR + Risk adjustments
  - Show opportunity impact separately (informational only)
  - Allow manual override of R&O-Driven calculation
- [ ] Create `ROImpactCalculation` helper in `boeCalculationService.ts`
- [ ] Update backend API to support R&O-Driven calculation
- [ ] Add calculation breakdown display in UI
- [ ] Test with various risk scenarios

**Files to Modify:**
- `backend/src/services/boeService.ts`
- `backend/src/services/riskOpportunityService.ts`
- `frontend/src/components/features/boe/ManagementReserve/ManagementReserveCalculator.tsx`
- `frontend/src/services/boeCalculationService.ts` (or create new service)
- `backend/src/routes/boe.ts` - Add R&O-Driven calculation endpoint

**Dependencies**: Requires R&O entities to have:
- `costImpactMin`, `costImpactMostLikely`, `costImpactMax`
- `probability` (0-100%)
- `severity` (Low/Medium/High/Critical)

### Phase 3: Move MR Utilization to R&O Page

**Estimated Effort**: 3-4 days

**Tasks:**
- [ ] Update `RiskOpportunityPage.tsx` to:
  - Add "Request MR Utilization" button when risk is materialized
  - Show MR utilization form for risks
  - Display MR utilization history with risk context
  - Show opportunity impact tracking (separate from MR)
- [ ] Create `MRUtilizationRequest.tsx` component
  - Form to request MR utilization for a risk
  - Shows available MR amount
  - Links to risk entry
  - Simple Program Manager approval
- [ ] Update `riskOpportunityService.ts` to:
  - Add `utilizeMRForRisk(riskId, amount, reason)` method
  - Link MR utilization to risk entries
  - Track MR utilization per risk
- [ ] Update `ManagementReserveTab.tsx` to:
  - Hide "Utilization" view after BOE is baselined
  - Keep "Display" view as read-only summary
  - Add "MR Summary" view showing current status
  - Add link to R&O page for new utilization requests
- [ ] Update Risk entity to track:
  - `materializedAt`: Date
  - `mrUtilizedAmount`: Amount
  - `mrUtilizationDate`: Date
  - `mrUtilizationReason`: Reason
- [ ] Create database migration for Risk entity updates

**Files to Modify:**
- `frontend/src/components/features/riskOpportunity/RiskOpportunityPage.tsx`
- `frontend/src/components/features/boe/ManagementReserveTab.tsx`
- `backend/src/services/riskOpportunityService.ts`
- `backend/src/entities/Risk.ts` (or create if doesn't exist)
- `backend/src/routes/riskOpportunity.ts`
- `backend/src/migrations/` - Create migration for Risk entity updates

### Phase 4: UI/UX Polish

**Estimated Effort**: 2-3 days

**Tasks:**
- [ ] Update setup page text and guidance
- [ ] Add tooltips explaining Initial MR vs Final MR
- [ ] Add note about R&O analysis being optional
- [ ] Update MR calculator to clearly show R&O-Driven option
- [ ] Add comparison view: Initial MR vs Final MR
- [ ] Update R&O page to clearly separate risk MR utilization from opportunity tracking
- [ ] Add help text explaining opportunity impact tracking
- [ ] Test end-to-end workflows
- [ ] Update documentation

**Files to Modify:**
- All setup step components
- `ManagementReserveCalculator.tsx`
- `RiskOpportunityPage.tsx`
- `ManagementReserveTab.tsx`
- Update `MANUAL_TESTING_GUIDE.md`

## Data Model Changes

### ProgramSetupStatus Entity Updates
```typescript
initialMRSet: boolean (default: false)
roAnalysisComplete: boolean | null (default: null, optional)
finalMRSet: boolean (default: false)
```

### Risk Entity Updates (if not exists, create)
```typescript
materializedAt: Date | null
mrUtilizedAmount: number (default: 0)
mrUtilizationDate: Date | null
mrUtilizationReason: string | null
costImpactMin: number
costImpactMostLikely: number
costImpactMax: number
probability: number (0-100)
severity: 'Low' | 'Medium' | 'High' | 'Critical'
```

### Opportunity Entity Updates (if not exists, create)
```typescript
realizedAt: Date | null
costImpactMin: number
costImpactMostLikely: number
costImpactMax: number
probability: number (0-100)
// Note: No MR credit fields - tracked separately
```

## Workflow Diagrams

### Setup Workflow (New Programs)

```
1. Create Program
   ↓
2. Create BOE (WBS + Allocations)
   ↓
3. Set Initial MR (draft, Standard/Risk-Based/Custom)
   ↓
4. Initialize R&O Register
   ↓
5. [OPTIONAL] Analyze Risks & Opportunities
   - Enter risks with cost impact & probability
   - Enter opportunities with cost impact & probability
   ↓
6. Finalize MR
   - Option A: Use R&O-Driven calculation (if R&O data exists)
   - Option B: Adjust Initial MR based on insights
   - Option C: Use Initial MR as Final (if R&O skipped)
   ↓
7. Submit BOE for Approval
   - BOE includes final MR amount
   ↓
8. Approval Workflow (if needed)
   ↓
9. Baseline to Ledger
   - BOE and MR pushed to ledger
   - MR becomes available for utilization
   ↓
10. Program Dashboard (setup complete)
```

### Post-Setup MR Utilization Workflow

```
Risk Materializes:
1. Navigate to R&O page → Risk Management tab
2. Create/update risk entry (mark as "Materialized")
3. Click "Request MR Utilization"
4. Enter amount and reason
5. Submit for approval (Program Manager)
6. MR utilized → Update risk entry with MR utilization
7. MR remaining amount updated

Opportunity Realized:
1. Navigate to R&O page → Opportunity Management tab
2. Create/update opportunity entry (mark as "Realized")
3. Track cost impact separately (NOT linked to MR)
4. Track opportunity impact independently

MR Tab (Post-Baseline):
- Read-only MR summary
- Utilization history (with links to risk entries)
- Link to R&O page for new requests
```

## Implementation Checklist

### Phase 1: Workflow Reordering
- [ ] Update ProgramSetupStatus entity
- [ ] Create database migration
- [ ] Update programSetupService
- [ ] Split MR into Initial and Final steps
- [ ] Add optional R&O analysis step
- [ ] Update setup page routing
- [ ] Test setup flow

### Phase 2: R&O-Driven MR Calculation
- [ ] Implement calculateRODrivenMR() backend method
- [ ] Add severity weight constants
- [ ] Update MR calculator to fetch R&O data
- [ ] Add R&O-Driven calculation option
- [ ] Display calculation breakdown
- [ ] Allow manual override
- [ ] Test calculation logic

### Phase 3: MR Utilization on R&O Page
- [ ] Update Risk entity
- [ ] Create database migration
- [ ] Add MR utilization to risk service
- [ ] Create MRUtilizationRequest component
- [ ] Update RiskOpportunityPage
- [ ] Update ManagementReserveTab (remove utilization view)
- [ ] Add MR summary view
- [ ] Test utilization workflow

### Phase 4: UI/UX Polish
- [ ] Update all guidance text
- [ ] Add tooltips and help text
- [ ] Test end-to-end workflows
- [ ] Update documentation
- [ ] Code review

## Testing Strategy

1. **Setup Workflow Testing**
   - Test complete setup flow with R&O analysis
   - Test complete setup flow without R&O analysis (skip optional step)
   - Verify Initial MR → Final MR workflow
   - Test that setup can't complete without final MR

2. **R&O-Driven Calculation Testing**
   - Test with various risk scenarios (Low/Medium/High/Critical)
   - Test with multiple risks
   - Test with opportunities (verify they don't affect MR)
   - Test manual override functionality

3. **MR Utilization Testing**
   - Test MR utilization from R&O page
   - Verify MR utilization links to risk entries
   - Test opportunity tracking (separate from MR)
   - Verify MR tab shows read-only summary after baselining

4. **Integration Testing**
   - Test full workflow: Setup → R&O Analysis → Final MR → Approval → Baseline → Utilization
   - Test workflow without R&O: Setup → Final MR (skip R&O) → Approval → Baseline
   - Verify all data persists correctly

## Notes

- R&O analysis is optional - users can skip to finalize MR
- Opportunities do NOT reduce MR - they're tracked separately
- MR utilization approval is simple PM approval (no escalation)
- BOE approval is sufficient for MR changes (no separate approval)
- No minimum MR percentage threshold - MR can be as low as calculated

## Next Steps

1. Review and approve this plan
2. Create feature branch: `feature/mr-ro-workflow-integration-phase1`
3. Begin Phase 1 implementation (Workflow Reordering)
4. Test and iterate
5. Proceed to Phase 2 (R&O-Driven Calculation)
6. Continue through all phases
