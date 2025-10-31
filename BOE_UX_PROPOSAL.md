# BOE Overview Tab - UX Proposal & Implementation Plan

## Current Problems
1. **Overview Tab is useless for Draft BOEs**: Shows summary cards but user hasn't completed the work yet
2. **No clear workflow**: User doesn't know what steps to take after creating a BOE
3. **MR showing 15% default**: Even when no MR has been set
4. **Wrong element counts**: Counting all elements instead of just leaf elements
5. **Missing allocated cost**: Only showing estimated cost, not effective/allocated cost

## Proposed UX Flow

### Option A: Progress Tracker (Recommended) ⭐
Add a horizontal progress bar at the top of the BOE tabs:

```
[✓] Define WBS Structure  →  [⚠] Create Allocations  →  [⏸] Set MR  →  [✓] Review & Submit
     Details Tab              Details Tab              MR Tab        Overview Tab
```

**Status Indicators:**
- ✅ Complete (green checkmark)
- ⚠️ In Progress (yellow warning - some items done)
- ⏸️ Not Started (gray pause - can click to jump there)
- 🔒 Locked (gray lock - prerequisite not met)

**Behavior:**
- Each step is clickable and navigates to the relevant tab
- Progress updates automatically as user completes work
- Shows completion percentage (e.g., "75% Complete")

---

### Option B: Status-Based Overview Tab
**When BOE is Draft:**
- Replace summary cards with a **checklist/todo view**:
  ```
  📋 Complete Your BOE
  ┌─────────────────────────────────────┐
  │ ✓ Add WBS Elements                  │
  │   └─ 7 elements defined              │
  │                                      │
  │ ⚠️ Create Allocations                │
  │   └─ 3 of 7 elements allocated      │
  │   └─ [Go to Details →]              │
  │                                      │
  │ ⏸️ Set Management Reserve            │
  │   └─ No MR configured               │
  │   └─ [Set MR →]                     │
  │                                      │
  │ ⏸️ Review & Submit                  │
  │   └─ Complete above steps first     │
  └─────────────────────────────────────┘
  ```

**When BOE is ready for review (all steps done):**
- Show full summary cards with:
  - **Estimated Cost** (from initial estimates)
  - **Allocated Cost** (sum of all allocations - the "real" cost)
  - **Management Reserve**
  - **Total with MR**
  - Element counts (leaf elements only)
  - Cost breakdowns

---

### Option C: Guided Wizard Modal
After BOE creation, show a modal:
```
┌─────────────────────────────────────┐
│ 🎉 BOE Created Successfully!        │
│                                     │
│ Next Steps:                         │
│                                     │
│ [1] Add WBS Elements                │
│     → [Go to Details Tab]           │
│                                     │
│ [2] Create Allocations              │
│     → [Start Allocating]            │
│                                     │
│ [3] Set Management Reserve          │
│     → [Configure MR]                │
│                                     │
│ [4] Review & Submit                 │
│     → [Go to Overview]             │
│                                     │
│ [I'll do this later]                │
└─────────────────────────────────────┘
```

---

## Recommended Implementation: Hybrid Approach

### Phase 1: Fix Immediate Issues
1. ✅ Fix MR display (don't show if not set)
2. ✅ Fix element counts (use leaf elements only)
3. ✅ Add allocated cost to overview
4. ✅ Use same calculation service as Details tab

### Phase 2: Add Progress Tracker (Simple)
- Horizontal progress bar at top of tabs
- Click to navigate between steps
- Auto-updates as work is completed

### Phase 3: Enhanced Overview (If Needed)
- If progress < 100%, show checklist view
- If progress = 100%, show full summary cards
- Add "Ready to Submit" button when complete

---

## Implementation Details

### Progress Calculation Logic
```typescript
const calculateProgress = () => {
  const steps = {
    wbsStructure: hasWBSElements(), // Has at least 1 element
    allocations: hasAllocations(), // At least 1 allocation
    managementReserve: hasMR(), // MR is set
    readyForReview: isValid() // All validation passes
  };
  
  const completed = Object.values(steps).filter(Boolean).length;
  const total = Object.keys(steps).length;
  return { percentage: (completed / total) * 100, steps };
};
```

### Overview Tab Logic
```typescript
if (progress < 100% && status === 'Draft') {
  return <ChecklistView progress={progress} />;
} else {
  return <SummaryCardsView calculationResult={calculationResult} />;
}
```

---

## User Journey

1. **Create BOE** → Wizard completes → Navigate to **Details Tab**
2. **Details Tab** → Add WBS elements → Create allocations
3. **Progress Tracker** → Shows completion status
4. **MR Tab** → Set management reserve when ready
5. **Overview Tab** → Review everything → Submit for approval

---

## Questions to Consider
1. Should Overview be locked until WBS structure is complete?
2. Should there be validation before allowing MR to be set?
3. Should we show reconciliation warnings on Overview?
4. Should we add a "Submit for Approval" button on Overview?

