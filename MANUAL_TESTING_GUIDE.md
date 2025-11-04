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
- You should see "Submit for Approval" button
- Click "Submit for Approval"
- BOE status changes to "Under Review"

### Approval (if needed):
- If approval workflow is configured, you may need to approve it
- For testing, you can approve it yourself if you have permissions
- Once approved, BOE status becomes "Approved"
- Step 1 (BOE) should be marked complete

---

## Step 3: Baseline Budget to Ledger

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

## Step 4: Initialize Risk & Opportunity Register

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

## Step 5: Verify Dashboard Access

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

## Step 6: Verify Navigation

### Check Sidebar:
- ✅ No "Setup Progress" indicator (since setup is complete)
- ✅ No "Complete Setup" link
- ✅ All tabs are enabled (no "(Setup Required)" text)
- ✅ Clicking tabs works correctly

---

## Step 7: Verify Program Manager Email

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

- [ ] Program created successfully
- [ ] Redirected to setup page automatically
- [ ] Setup progress indicator shows 0/3 steps
- [ ] BOE created successfully
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
2. **BOE won't approve**: Check validation errors in the approval workflow
3. **Can't push to ledger**: Ensure BOE is in "Approved" status
4. **Navigation tabs disabled**: Check setup status in database or via API
5. **Email field missing**: Check if migration ran successfully

---

**Ready to test?** Start with Step 1 and work through each step sequentially!

