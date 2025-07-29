# Component Breakdown Checklist Template

This document provides a comprehensive, step-by-step checklist for breaking down large React components into maintainable subcomponents. Use this as a template for any large component refactor. This example uses `LedgerTable` as a reference, but the process is generalizable.

---

## Preparation
- [ ] Identify the large component to break down (e.g., `LedgerTable`)
- [ ] Review the component's responsibilities, props, and state
- [ ] List all UI sections and major logic blocks
- [ ] Outline the main pain points (e.g., file size, complexity, testability)

---

## Propose a Breakdown Plan
- [ ] List all proposed subcomponents, their responsibilities, and suggested file locations
- [ ] For each subcomponent, specify:
  - [ ] Name
  - [ ] Responsibility
  - [ ] Props
  - [ ] File location
- [ ] Suggest an extraction order (start with modals, then table structure, etc.)
- [ ] Review and approve the plan with the team

---

## Extraction Steps (Repeat for Each Subcomponent)
- [ ] Create the new subcomponent file in the appropriate directory
- [ ] Move relevant JSX, logic, and styles from the parent component
- [ ] Define and type the props interface
- [ ] Replace the extracted code in the parent with the new subcomponent
- [ ] Update imports and ensure no circular dependencies
- [ ] Test the UI and logic for regressions
- [ ] Commit the change with a clear message

---

## Example: LedgerTable Breakdown

### Subcomponents to Extract

- [ ] **LedgerTableHeader** (`LedgerTable/Header.tsx`)
  - Renders title, search, and action buttons
- [ ] **LedgerBulkEditModal** (`LedgerTable/BulkEditModal.tsx`)
  - Renders the bulk edit modal and form
- [ ] **LedgerBulkDeleteModal** (`LedgerTable/BulkDeleteModal.tsx`)
  - Renders the bulk delete confirmation modal
- [ ] **LedgerErrorModal** (`LedgerTable/ErrorModal.tsx`)
  - Renders error modal
- [ ] **LedgerTableTable** (`LedgerTable/Table.tsx`)
  - Renders the main table, header, and body
- [ ] **LedgerTableRow** (`LedgerTable/Row.tsx`)
  - Renders a single row, including editable cells
- [ ] **LedgerTableCell** (`LedgerTable/Cell.tsx`)
  - Renders a single cell, handling edit/view mode
- [ ] **LedgerPopover** (`LedgerTable/Popover.tsx`)
  - Renders the invoice link popover editor
- [ ] **LedgerPotentialMatchesModal** (`LedgerTable/PotentialMatchesModal.tsx`)
  - Renders the modal for potential/rejected matches
- [ ] **LedgerToast** (`LedgerTable/Toast.tsx`)
  - Renders the toast notification

---

## Extraction Order (Recommended)
- [ ] Modals (BulkEdit, BulkDelete, Error)
- [ ] Header
- [ ] Table (Table, Row, Cell)
- [ ] Popover
- [ ] PotentialMatchesModal
- [ ] Toast

---

## Post-Extraction
- [ ] Ensure the main component is &lt;300 lines and focused on orchestration/state
- [ ] Each subcomponent is &lt;200 lines and focused
- [ ] All logic is testable and UI/UX is unchanged
- [ ] Update this checklist, marking completed items
- [ ] Document any deviations or lessons learned

---

## Template for Future Breakdowns

**Copy this checklist and update the subcomponent names and responsibilities for your target component.**

---

## Success Criteria
- [ ] Main component is readable and maintainable
- [ ] Subcomponents are reusable and testable
- [ ] No regressions in UI/UX
- [ ] Team can easily onboard and contribute

---

*This checklist is designed for use by both humans and AI agents (e.g., Cursor AI) to ensure a consistent, high-quality component breakdown process.* 