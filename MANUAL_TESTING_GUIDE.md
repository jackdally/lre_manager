# Manual Testing Guide - Program Setup Flow

## Overview
This guide walks you through testing the complete 7-step program setup flow, from program creation to dashboard access. The new workflow includes Initial MR, optional R&O Analysis, Final MR, and Baseline steps.

---

## Step 1: Create a Test Program

### Program Details:
- **Program Code**: `TEST.2025`
- **Program Name**: `Test Program 2025`
- **Description**: `Simple test program for setup flow verification`
- **Type**: `Annual`
- **Budget**: `$100,000`
- **Start Date**: `2025-01-01`
- **End Date**: `2025-12-31`
- **Program Manager**: `John Doe` (optional)
- **Program Manager Email**: `john.doe@example.com` (optional - for testing email reminders)

### Expected Result:
- Program is created
- You are automatically redirected to `/programs/{id}/setup`
- Setup page shows with progress indicator

---

## Step 2: Create BOE (Basis of Estimate)

You should see the **"Create Basis of Estimate"** step as the first step.

### BOE Details:
- **BOE Name**: `Test BOE v1.0`
- **Description**: `Initial BOE for test program`

### WBS Structure (Keep it simple):
Create just **2-3 elements**:

**Element 1:**
- **Code**: `1.0`
- **Name**: `Software Development`
- **Description**: `Core software development work`
- **Cost Category**: Select any available category
- **Estimated Cost**: `$60,000`
- **Required**: Yes

**Element 2:**
- **Code**: `2.0`
- **Name**: `Testing & QA`
- **Description**: `Quality assurance activities`
- **Cost Category**: Select any available category
- **Estimated Cost**: `$20,000`
- **Required**: Yes

**Element 3:**
- **Code**: `3.0`
- **Name**: `Project Management`
- **Description**: `Project management overhead`
- **Cost Category**: Select any available category
- **Estimated Cost**: `$20,000`
- **Required**: Yes

### After BOE Creation:
- BOE should be in "Draft" status
- You should see a message indicating BOE was created
- You should see a link/button to "Complete BOE Setup" or go to the BOE page
- Click the link to go to the BOE page to continue setup

---

## Step 3: Create Allocations for BOE Elements

After creating the BOE with WBS structure, you need to create allocations for each required element.

### Navigate to BOE Page:
- From the Program Setup page, click "Complete BOE Setup" or navigate to the BOE tab
- You should see the BOE Details page with your WBS structure

### Create Allocations:
For each of the 3 elements you created (Software Development, Testing & QA, Project Management):

1. **Select an element** (click on it in the WBS tree)
2. **Create an allocation:**
   - Click "Create Allocation" or the allocation section
   - **Select Vendor**: Choose from existing vendors in the database (e.g., "Acme Corp", "Tech Solutions", etc.)
     - If no vendors exist, you may need to create one first via the Vendors page
   - **Allocation Type**: Select "Linear" (easiest for testing)
   - **Start Date**: `2025-01-01`
   - **End Date**: `2025-12-31`
   - **Total Amount**: Match the element's estimated cost:
     - Software Development: `$60,000`
     - Testing & QA: `$20,000`
     - Project Management: `$20,000`
   - **Notes**: Optional - e.g., "Initial allocation for [element name]"
3. **Save the allocation**
4. **Repeat for all 3 elements**

### Expected Result:
- All 3 elements now have allocations
- BOE Progress tracker should show "Create Allocations" as complete
- You can see allocated amounts in the BOE overview

### Note:
- If you need to create vendors first, go to Settings → Vendors and add test vendors
- Common test vendors: "Acme Corporation", "Tech Solutions Inc", "Quality Services LLC"

---

## Step 4: Set Initial Management Reserve (MR)

After allocations are created, you need to set your **Initial Management Reserve**. This is your preliminary MR estimate that you can refine later.

### Navigate to Management Reserve Tab:
- On the BOE page, click the **"Management Reserve"** tab
- You should see the MR calculator/configuration interface

### Configure Initial Management Reserve:
1. **Select Calculation Method**: Choose one:
   - **Standard**: Industry standard percentage (10-15% based on project size)
   - **Risk-Based**: Adjust based on project complexity and risk factors
   - **Custom**: User-defined percentage
   - **R&O-Driven**: (Not available yet - requires risk data)

2. **For Standard method (recommended for testing):**
   - The system will calculate a standard percentage based on total cost
   - Review the calculated MR amount
   - For a $100,000 program, expect ~10-12% MR

3. **Provide Justification** (Required):
   - Enter justification text, e.g.:
     ```
     Initial Management Reserve set at standard 10% to cover preliminary 
     risk assessment. Will be refined in Final MR step after R&O analysis.
     ```

4. **Save/Apply Management Reserve**

### Expected Result:
- Initial Management Reserve amount is calculated and displayed
- MR justification is saved
- Setup Step 2 (Initial MR) should be marked complete
- You can proceed to Step 3 (Initialize R&O Register)

### Note:
- Initial MR is a preliminary estimate - you'll have a chance to refine it in Step 6
- The justification field is mandatory

---

## Step 5: Initialize Risk & Opportunity Register

You should now see the **"Initialize Risk & Opportunity Register"** step.

### Actions:
1. Read the information about R&O register initialization
2. Click **"Initialize Risk & Opportunity Register"** button
3. Should see confirmation: "Risk & Opportunity Register Initialized!"
4. Step 3 (R&O Register) should be marked complete

### Expected Result:
- R&O register is initialized for the program
- You can proceed to Step 4 (Optional R&O Analysis)

---

## Step 6: [OPTIONAL] Analyze Risks & Opportunities

This step is **completely optional**. You can skip it and proceed directly to Final MR.

### Option A: Skip R&O Analysis
1. Click **"Skip R&O Analysis"** button
2. Step 4 will be marked as skipped
3. Proceed directly to Step 5 (Finalize MR)

### Option B: Complete R&O Analysis
1. Click **"Go to R&O Page"** button
2. Navigate to the Risks & Opportunities page
3. Add risks with:
   - Cost impact estimates (min, most likely, max)
   - Probability (0-100%)
   - Severity levels (Low, Medium, High, Critical)
4. Return to setup page
5. Click **"Complete R&O Analysis"** button
6. Step 4 will be marked as complete

### Expected Result:
- If skipped: Step 4 marked as skipped, proceed to Final MR
- If completed: Step 4 marked as complete, R&O-Driven MR calculation available in next step

### Note:
- Completing R&O analysis enables the **R&O-Driven** calculation method in Final MR
- R&O-Driven uses actual risk data to calculate MR automatically

---

## Step 7: Finalize Management Reserve

Now you'll set your **Final Management Reserve** - the MR amount that will be baselined with your BOE.

### Navigate to Management Reserve Tab:
- Click **"Go to BOE to Finalize MR"** button
- Or navigate to BOE page → Management Reserve tab

### Configure Final Management Reserve:
1. **Review Initial MR** (shown for comparison):
   - See your Initial MR amount
   - Compare with Final MR you're about to set

2. **Select Calculation Method**:
   - **R&O-Driven** (if you completed R&O analysis):
     - Automatically calculates MR based on risk data
     - Shows breakdown of risk adjustments
     - Recommended if you have risk data
   - **Standard/Risk-Based/Custom**:
     - Adjust from Initial MR if needed
     - Use if you skipped R&O analysis or want manual control

3. **Review Calculated MR**:
   - Compare Final MR to Initial MR
   - See the difference and percentage change

4. **Provide Justification** (if changed):
   - Explain any adjustments from Initial MR

5. **Save/Apply Final Management Reserve**

6. **Return to Setup Page**:
   - Click **"Mark Final MR as Set"** button on setup page
   - Step 5 (Final MR) should be marked complete

### Expected Result:
- Final Management Reserve amount is calculated and displayed
- Comparison view shows Initial MR vs Final MR
- Setup Step 5 (Final MR) is marked complete
- You can proceed to Step 6 (Submit BOE for Approval)

---

## Step 8: Submit BOE for Approval

Now that WBS, Allocations, Initial MR, and Final MR are complete, you can submit the BOE for approval.

### Navigate to BOE Overview Tab:
- On the BOE page, go to the **"Overview"** tab
- Review the BOE summary

### Submit for Approval:
1. Click **"Submit for Approval"** button
2. Review any validation messages
3. Confirm submission

### Approval (if needed):
- If approval workflow is configured, you may need to approve it
- For testing, you can approve it yourself if you have permissions
- Once approved, BOE status becomes "Approved"
- Step 6 (BOE Approval) should be marked complete

### Expected Result:
- BOE status changes to "Under Review" or "Approved"
- Program Setup page updates to show BOE approval step as complete
- You can proceed to Step 7 (Baseline)

---

## Step 9: Baseline Budget to Ledger

Now that WBS, Allocations, and MR are complete, you can submit the BOE for approval.

### Navigate to BOE Overview Tab:
- On the BOE page, go to the **"Overview"** tab
- Review the BOE summary

### Submit for Approval:
1. Click **"Submit for Approval"** button
2. Review any validation messages
3. Confirm submission

### Approval (if needed):
- If approval workflow is configured, you may need to approve it
- For testing, you can approve it yourself if you have permissions
- Once approved, BOE status becomes "Approved"
- Step 1 (BOE) in Program Setup should be marked complete

### Expected Result:
- BOE status changes to "Under Review" or "Approved"
- BOE Progress tracker shows "Review & Submit" as complete
- Program Setup page updates to show BOE step as complete

---

## Step 6: Baseline Budget to Ledger

You should now see the **"Baseline Budget to Ledger"** step.

### Pre-Baseline Checklist:
The setup page will show a checklist verifying:
- ✅ BOE Created
- ✅ Initial MR Set
- ✅ BOE Approved (must be in "Approved" status)
- ✅ Final MR Set (required before baseline)

### Actions:
1. Review the pre-baseline checklist
2. Review the BOE summary shown
3. Review "What Happens When You Baseline" information
4. **Read the warning** - this action cannot be undone
5. Click **"Push to Ledger"** button
6. Wait for confirmation message
7. Should see: "Successfully Baselined!" with number of ledger entries created
8. Step 7 (Baseline) should be marked complete

### Expected Result:
- BOE status changes to "Baseline"
- Management Reserve is locked and available for utilization
- Ledger entries are created for each BOE allocation
- All setup steps are now complete
- You should be automatically redirected to the Dashboard
- MR utilization is now managed from the R&O page

---

## Step 8: Verify Dashboard Access

After setup is complete, you should be redirected to `/programs/{id}/dashboard`.

### What to Check:
- ✅ Dashboard loads without redirecting back to setup
- ✅ Program Health Indicators appear (if any concerns exist)
- ✅ Monthly Actuals Reminder appears (if any pending)
- ✅ All navigation tabs in sidebar are now enabled
- ✅ You can access:
  - Program Home (Dashboard)
  - Ledger
  - Upload Actuals
  - BOE
  - Risks & Opportunities
  - Program Settings

---

## Step 9: Verify Navigation

### Check Sidebar:
- ✅ No "Setup Progress" indicator (since setup is complete)
- ✅ No "Complete Setup" link
- ✅ All tabs are enabled (no "(Setup Required)" text)
- ✅ Clicking tabs works correctly

---

## Step 10: Verify Program Manager Email

### Check Program Settings:
1. Go to **Program Settings** from sidebar
2. Verify **Program Manager Email** field is visible
3. Edit the email if needed: `john.doe@example.com`
4. Save changes
5. Verify email is saved

### Check Monthly Reminder Service:
- The email should now be available for monthly reminder notifications
- When a reminder is created, it will use this email address

---

## Quick Verification Checklist

### Setup Steps (7 steps):
- [x] Program created successfully
- [x] Redirected to setup page automatically
- [x] Setup progress indicator shows 0/7 steps
- [x] Step 1: BOE created successfully with WBS structure (3 elements)
- [ ] Step 1: Allocations created for all 3 elements with vendors
- [ ] Step 2: Initial Management Reserve configured with justification
- [ ] Step 3: R&O register initialized
- [ ] Step 4: R&O analysis completed (optional) or skipped
- [ ] Step 5: Final Management Reserve finalized (with comparison to Initial MR)
- [ ] Step 6: BOE submitted for approval
- [ ] Step 6: BOE approved (or auto-approved if no workflow)
- [ ] Step 7: Pre-baseline checklist verified
- [ ] Step 7: BOE pushed to ledger successfully
- [ ] All 7 setup steps marked complete
- [ ] Redirected to dashboard after setup complete

### Post-Setup Verification:
- [ ] Dashboard accessible (no redirect loop)
- [ ] All navigation tabs enabled
- [ ] Program Manager Email field visible and editable
- [ ] MR utilization available on R&O page (not on BOE page)
- [ ] No errors in console

---

## Testing Notes

- **Keep it simple**: Use minimal data for testing
- **Watch for errors**: Check browser console and backend logs
- **Verify redirects**: Make sure you're being redirected correctly
- **Check status updates**: Watch for status changes in real-time

---

## Troubleshooting

If you encounter issues:

1. **Setup page keeps showing**: Check if all 7 steps are actually marked complete
2. **Can't create allocations**: Verify vendors exist in the database, check element selection
3. **Initial MR not set**: Make sure you've entered justification text and saved MR in the BOE page
4. **Final MR not set**: Ensure you've set Final MR and clicked "Mark Final MR as Set" button on setup page
5. **R&O-Driven not available**: Complete R&O analysis in Step 4 to enable this calculation method
6. **BOE won't approve**: Check validation errors - ensure all required elements have allocations and Final MR is set
7. **Can't push to ledger**: Ensure BOE is in "Approved" status and Final MR is set
8. **Navigation tabs disabled**: Check setup status in database or via API - all 7 steps must be complete
9. **Email field missing**: Check if migration ran successfully
10. **MR utilization not showing**: After baselining, MR utilization is only available on the R&O page, not the BOE page

---

**Ready to test?** Start with Step 1 and work through each step sequentially!

