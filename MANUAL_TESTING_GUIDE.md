# Manual Testing Guide - Program Setup Flow

## Overview
This guide walks you through testing the complete program setup flow, from program creation to dashboard access.

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

## Step 4: Set Management Reserve (MR)

After allocations are created, you need to configure Management Reserve.

### Navigate to Management Reserve Tab:
- On the BOE page, click the **"Management Reserve"** tab
- You should see the MR calculator/configuration interface

### Configure Management Reserve:
1. **Select Calculation Method**: Choose one:
   - **Percentage of Estimated Cost**: Recommended for testing
   - **Fixed Amount**: Alternative option
   - **Custom**: Advanced option

2. **If using Percentage method:**
   - Enter percentage: `10%` (standard for testing)
   - Or use the default calculation
   - Review the calculated MR amount

3. **Provide Justification** (Required):
   - Enter justification text, e.g.:
     ```
     Standard 10% management reserve to cover unforeseen risks and opportunities
     for this program. Based on program complexity and historical data.
     ```

4. **Save/Apply Management Reserve**

### Expected Result:
- Management Reserve amount is calculated and displayed
- MR justification is saved
- BOE Progress tracker should show "Set MR" as complete
- Total with MR is updated in BOE overview

### Note:
- Management Reserve is required before submitting BOE for approval
- The justification field is mandatory - you cannot submit without it

---

## Step 5: Submit BOE for Approval

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

### Actions:
1. Review the BOE summary shown
2. Click **"Push to Ledger"** button
3. Wait for confirmation message
4. Should see: "Budget Baselined!" with number of ledger entries created
5. Step 2 (Baseline) should be marked complete

### Expected Result:
- BOE status changes to "Baseline"
- Ledger entries are created for each BOE allocation
- You can verify this by checking the Ledger page later

---

## Step 7: Initialize Risk & Opportunity Register

You should now see the **"Initialize Risk & Opportunity Register"** step.

### Actions:
1. Read the information about R&O register
2. Click **"Create Risk & Opportunity Register"** button
3. Should see confirmation: "Risk & Opportunity Register Initialized!"
4. Step 3 (R&O) should be marked complete

### Expected Result:
- R&O register is initialized
- All setup steps are now complete
- You should be automatically redirected to the Dashboard

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

- [x] Program created successfully
- [x] Redirected to setup page automatically
- [x] Setup progress indicator shows 0/3 steps
- [x] BOE created successfully with WBS structure (3 elements)
- [ ] Allocations created for all 3 elements with vendors
- [ ] Management Reserve configured with justification
- [ ] BOE submitted for approval
- [ ] BOE approved (or auto-approved if no workflow)
- [ ] BOE pushed to ledger successfully
- [ ] R&O register initialized
- [ ] Redirected to dashboard after setup complete
- [ ] Dashboard accessible (no redirect loop)
- [ ] All navigation tabs enabled
- [ ] Program Manager Email field visible and editable
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

1. **Setup page keeps showing**: Check if all steps are actually marked complete
2. **Can't create allocations**: Verify vendors exist in the database, check element selection
3. **MR justification required**: Make sure you've entered justification text in the MR tab
4. **BOE won't approve**: Check validation errors - ensure all required elements have allocations and MR is set
5. **Can't push to ledger**: Ensure BOE is in "Approved" status
6. **Navigation tabs disabled**: Check setup status in database or via API
7. **Email field missing**: Check if migration ran successfully

---

**Ready to test?** Start with Step 1 and work through each step sequentially!

