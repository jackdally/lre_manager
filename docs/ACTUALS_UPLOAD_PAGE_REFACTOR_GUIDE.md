# Actuals Upload Page Refactor Guide (for Cursor AI Agents)

## Context

The `ActualsUploadPage.tsx` component is large and monolithic, but **the UI/UX, layout, sidebar, and tab navigation must remain 100% unchanged** during any refactor. The goal is to improve code organization and maintainability **without altering the user experience in any way**.

## Why This Approach?
- The page is business-critical and users are sensitive to any UI/UX changes.
- We want to extract logic and UI into smaller components and hooks for maintainability, but only if the output is pixel-perfect to the original.
- This approach allows for safe, incremental improvements with zero risk to the user experience.

## Refactor Process Template

**1. Start with a Wrapper**
- Ensure `index.tsx` simply imports and renders the original `ActualsUploadPage.tsx` component:
  ```tsx
  import OriginalActualsUploadPage from '../ActualsUploadPage';
  export default OriginalActualsUploadPage;
  ```
- This guarantees the UI/UX is unchanged.

**2. Plan the Extraction**
- Identify a small, self-contained piece of logic or UI (e.g., a section, a form, a modal, or a hook).
- Make sure extracting this piece will not affect the rendered output.

**3. Extract the Component/Hook**
- Move the code for the selected piece into a new file (e.g., `FileUploadSection.tsx`, `useUploadLogic.ts`).
- Import and use the new component/hook in the original file.

**4. Visual Verification**
- Build and run the app.
- Manually verify that the UI/UX is **identical** to the original (no layout, style, or behavior changes).
- Automated visual regression tests are recommended if available.

**5. Commit and Document**
- Commit the change with a message like: `refactor(actuals): extract FileUploadSection (no UI change)`
- Update this guide if you discover new best practices or edge cases.

**6. Repeat**
- Continue extracting small pieces, one at a time, always verifying the UI/UX after each change.
- Only when the entire component is safely modularized should you consider replacing the default export in `index.tsx`.

## Example Step

1. **Extract File Upload Section**
   - Move the file upload JSX and logic to `FileUploadSection.tsx`.
   - Import and use `<FileUploadSection ... />` in `ActualsUploadPage.tsx`.
   - Test visually.

2. **Extract Custom Hook**
   - Move upload logic to `useActualsUpload.ts`.
   - Use the hook in `ActualsUploadPage.tsx`.
   - Test visually.

## Key Rules
- **Never change the UI/UX, layout, or behavior.**
- **Test visually after every extraction.**
- **If in doubt, revert and try a smaller extraction.**
- **Document each step.**

---

This process ensures safe, incremental refactoring with zero risk to the user experience. If you have questions, consult this guide or ask for a review before merging changes. 