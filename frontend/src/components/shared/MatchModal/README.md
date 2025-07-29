# Shared Match Modal Components

This directory contains a flexible, reusable system for creating match modals that can handle both actuals upload and ledger table matching workflows.

## Overview

The shared match modal system provides:
- **Flexible data flow**: Supports both actuals→ledger and ledger→actuals matching
- **Consistent UX**: Unified design and interaction patterns
- **Modular components**: Reusable pieces that can be mixed and matched
- **Feature toggles**: Enable/disable features like split/re-forecast based on context

## Key Differences Between Use Cases

### Actuals Upload Modal (Transaction → Ledger)
- **Left Panel**: Upload Transaction details
- **Right Panel**: Ledger Entry details  
- **Features**: Split/Re-forecast options for mismatches
- **Data Flow**: Transaction-centric matching

### Ledger Table Modal (Ledger → Transaction)
- **Left Panel**: Ledger Entry details
- **Right Panel**: Upload Transaction details
- **Features**: Simple Confirm/Reject actions only
- **Data Flow**: Ledger-centric matching

## Components

### Core Modal Components

#### `MatchModal`
The main modal component that orchestrates all other components.

```tsx
import { MatchModal } from '../../../shared/MatchModal';

<MatchModal
  isOpen={isOpen}
  onClose={onClose}
  currentTab={currentTab}
  onTabChange={handleTabChange}
  currentIndex={currentIndex}
  totalCount={totalCount}
  onPrevious={handlePrevious}
  onNext={handleNext}
  potentialCount={potentialCount}
  rejectedCount={rejectedCount}
  onConfirm={handleConfirm}
  onReject={handleReject}
  onUndoReject={handleUndoReject}
  onSplit={handleSplit}
  onReForecast={handleReForecast}
  hasAmountMismatch={hasAmountMismatch}
  hasDateMismatch={hasDateMismatch}
  plannedAmount={plannedAmount}
  actualAmount={actualAmount}
  plannedDate={plannedDate}
  actualDate={actualDate}
  canSplit={canSplit}
  canReForecast={canReForecast}
  showSplitReForecast={true}
  formatCurrency={formatCurrency}
  title="Transaction Match"
  subtitle="Review and confirm matches"
  leftPanel={leftPanel}
  rightPanel={rightPanel}
  additionalContent={additionalContent}
/>
```

#### `MatchModalHeader`
Header component with title, subtitle, and close button.

#### `MatchModalTabs`
Tab navigation between potential and rejected matches with counts.

#### `MatchModalActions`
Action buttons (Confirm, Reject, Split, Re-forecast, Undo) with conditional rendering.

#### `MatchModalNavigation`
Pagination controls for multiple matches.

#### `MatchModalEmptyState`
Empty state display when no matches are found.

#### `MatchModalMismatchWarning`
Warning banner for amount/date mismatches with guidance.

### Content Panel Components

#### `UploadTransactionPanel`
Displays upload transaction details with confidence score.

```tsx
import { UploadTransactionPanel } from '../../../shared/MatchModal';

<UploadTransactionPanel
  transaction={modalTransaction}
  sessionFilename={sessionFilename}
/>
```

#### `LedgerEntryPanel`
Displays ledger entry details with mismatch highlighting.

```tsx
import { LedgerEntryPanel } from '../../../shared/MatchModal';

<LedgerEntryPanel
  ledgerEntry={ledgerEntry}
  isRejected={isRejected}
  hasAmountMismatch={hasAmountMismatch}
  hasDateMismatch={hasDateMismatch}
  actualAmount={actualAmount}
  actualDate={actualDate}
/>
```

#### `UploadTransactionMatchPanel`
Displays upload transaction details for ledger modal (right panel).

```tsx
import { UploadTransactionMatchPanel } from '../../../shared/MatchModal';

<UploadTransactionMatchPanel
  transaction={currentMatch}
  isRejected={currentTab === 'rejected'}
/>
```

## Implementation Examples

### Actuals Upload Modal Implementation

```tsx
import React, { useState } from 'react';
import { 
  MatchModal,
  UploadTransactionPanel,
  LedgerEntryPanel
} from '../../../shared/MatchModal';

const TransactionMatchModal = ({ modalTransaction, ledgerEntry, ...props }) => {
  // Mismatch detection
  const hasAmountMismatch = Math.abs(Number(modalTransaction.amount) - Number(ledgerEntry.planned_amount)) > 0.01;
  const hasDateMismatch = modalTransaction.transactionDate !== ledgerEntry.planned_date;
  
  // Determine actions
  const canSplit = hasAmountMismatch && Number(modalTransaction.amount) > Number(ledgerEntry.planned_amount);
  const canReForecast = hasAmountMismatch || hasDateMismatch;

  // Left panel (Upload Transaction)
  const leftPanel = (
    <UploadTransactionPanel
      transaction={modalTransaction}
      sessionFilename={modalTransaction.actualsUploadSession?.originalFilename}
    />
  );

  // Right panel (Ledger Entry)
  const rightPanel = (
    <LedgerEntryPanel
      ledgerEntry={ledgerEntry}
      hasAmountMismatch={hasAmountMismatch}
      hasDateMismatch={hasDateMismatch}
      actualAmount={modalTransaction.amount}
      actualDate={modalTransaction.transactionDate}
    />
  );

  return (
    <MatchModal
      {...props}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      hasAmountMismatch={hasAmountMismatch}
      hasDateMismatch={hasDateMismatch}
      canSplit={canSplit}
      canReForecast={canReForecast}
      showSplitReForecast={true}
      title="Transaction Match"
      subtitle="Review and confirm matches for uploaded transactions"
    />
  );
};
```

### Ledger Table Modal Implementation

```tsx
import React from 'react';
import { 
  MatchModal,
  LedgerEntryPanel,
  UploadTransactionMatchPanel
} from '../../../shared/MatchModal';

const LedgerMatchModal = ({ ledgerEntry, currentMatch, ...props }) => {
  // Left panel (Ledger Entry)
  const leftPanel = (
    <LedgerEntryPanel
      ledgerEntry={ledgerEntry}
      isRejected={false}
    />
  );

  // Right panel (Upload Transaction)
  const rightPanel = (
    <UploadTransactionMatchPanel
      transaction={currentMatch}
      isRejected={props.currentTab === 'rejected'}
    />
  );

  return (
    <MatchModal
      {...props}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      showSplitReForecast={false} // No split/re-forecast for ledger modal
      title="Potential Match"
      subtitle="Review and confirm matches for ledger entries"
    />
  );
};
```

## Configuration Options

### Feature Flags

- `showSplitReForecast`: Enable/disable split and re-forecast buttons
- `canSplit`: Show split button (when actual > planned)
- `canReForecast`: Show re-forecast button (when mismatches exist)

### Mismatch Detection

```tsx
// Amount mismatch
const hasAmountMismatch = Math.abs(Number(actualAmount) - Number(plannedAmount)) > 0.01;

// Date mismatch  
const hasDateMismatch = actualDate !== plannedDate;
```

### Action Handlers

```tsx
const handleConfirm = async () => {
  const result = await confirmMatch(transactionId, ledgerEntryId);
  if (result.success) {
    onClose();
  }
};

const handleReject = async () => {
  const result = await rejectMatch(transactionId, ledgerEntryId);
  if (result.success) {
    // Handle state updates
  }
};

const handleUndoReject = async () => {
  const result = await undoReject(transactionId, ledgerEntryId);
  if (result.success) {
    setTab('potential');
    setIndex(0);
  }
};
```

## Styling and Theming

All components use Tailwind CSS classes and follow the existing design system:

- **Colors**: Blue for primary actions, red for rejections, yellow for warnings
- **Spacing**: Consistent padding and margins using Tailwind spacing scale
- **Typography**: Standard font weights and sizes
- **Responsive**: Mobile-first design with responsive breakpoints

## State Management

The modal components are stateless and rely on props for all data and callbacks. This makes them flexible and easy to integrate with any state management system (Zustand, Redux, etc.).

## Error Handling

Components include built-in error handling:
- Loading states for async operations
- Error messages for failed actions
- Graceful fallbacks for missing data
- Validation for required props

## Accessibility

Components follow accessibility best practices:
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- High contrast support

## Testing

Each component can be tested independently:
- Unit tests for individual components
- Integration tests for modal workflows
- E2E tests for complete user journeys
- Visual regression tests for UI consistency 