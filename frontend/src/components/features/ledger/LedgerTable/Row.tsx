import React from 'react';
import { InformationCircleIcon, DocumentMagnifyingGlassIcon, XCircleIcon } from '@heroicons/react/24/outline';
import LedgerTableCell from './Cell';
import type { LedgerEntry } from '../../../../types/ledger';

interface LedgerTableRowProps {
  entry: LedgerEntry;
  index: number;
  isSelected: boolean;
  isHighlighted: boolean;
  isNewRow: boolean;
  isEditing: boolean;
  editingField: string | null;
  cellEditValue: any;
  hasPotentialMatches: boolean;
  hasRejectedMatches: boolean;
  wbsElementOptions: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    level: number;
    parentId?: string;
  }>;
  vendorOptions: string[];
  costCategoryOptions: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    isActive: boolean;
  }>;
  formatCurrency: (val: any) => string;
  onSelect: (id: string) => void;
  onCellClick: (rowId: string, field: string, value: any) => void;
  onCellInputChange: (e: React.ChangeEvent<any>) => void;
  onCellInputBlur: (rowId: string, field: string, value?: string) => void;
  onCellInputKeyDown: (e: React.KeyboardEvent, rowId: string, field: string) => void;
  onPopoverOpen: (rowId: string, text: string | null | undefined, url: string | null | undefined, event: React.MouseEvent) => void;
  onShowPotentialMatches: (entryId: string) => void;
  highlightedRowRef?: React.RefObject<HTMLTableRowElement>;
}

const LedgerTableRow: React.FC<LedgerTableRowProps> = React.memo(({
  entry,
  index,
  isSelected,
  isHighlighted,
  isNewRow,
  isEditing,
  editingField,
  cellEditValue,
  hasPotentialMatches,
  hasRejectedMatches,
  wbsElementOptions,
  vendorOptions,
  costCategoryOptions,
  formatCurrency,
  onSelect,
  onCellClick,
  onCellInputChange,
  onCellInputBlur,
  onCellInputKeyDown,
  onPopoverOpen,
  onShowPotentialMatches,
  highlightedRowRef
}) => {

  const renderCell = (field: string, value: any, options?: string[]) => {
    const isEditingThisCell = isEditing && editingField === field;
    

    
    if (isEditingThisCell) {

      if (field === 'wbsElementId' || field === 'vendor_name' || field === 'costCategoryId') {

        return (
          <select
            className={`input input-xs w-full rounded-md ${cellEditValue ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
            value={cellEditValue ?? ''}
            onChange={(e) => {
              // For dropdowns, save immediately when selection changes
              console.log('🟡 Dropdown onChange:', { field, value: e.target.value, entryId: entry.id });
              // Save immediately and blur to exit edit mode
              onCellInputBlur(entry.id, field, e.target.value);
              // Force blur to exit edit mode
              e.target.blur();
            }}
            onKeyDown={e => onCellInputKeyDown(e, entry.id, field)}
            autoFocus
          >
            <option value="">-- Select --</option>
            {field === 'wbsElementId' && wbsElementOptions?.map(element => (
              <option key={element.id} value={element.id}>
                {element.code} - {element.name}
              </option>
            ))}
            {field === 'vendor_name' && options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            {field === 'costCategoryId' && costCategoryOptions?.map(category => (
              <option key={category.id} value={category.id}>
                {category.code} - {category.name}
              </option>
            ))}
          </select>
        );
      } else if (field === 'expense_description') {
        return (
          <textarea
            className={`input input-xs w-full min-h-24 rounded-md ${cellEditValue ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
            value={cellEditValue}
            onChange={onCellInputChange}
            onBlur={(e) => onCellInputBlur(entry.id, field, e.target.value)}
            onKeyDown={e => onCellInputKeyDown(e, entry.id, field)}
            autoFocus
          />
        );
      } else if (field.includes('_date')) {
        return (
          <input
            type="date"
            className={`input input-xs w-full rounded-md ${cellEditValue ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
            value={cellEditValue}
            onChange={onCellInputChange}
            onBlur={(e) => onCellInputBlur(entry.id, field, e.target.value)}
            onKeyDown={e => onCellInputKeyDown(e, entry.id, field)}
            autoFocus
          />
        );
      } else if (field.includes('_amount')) {
        return (
          <input
            type="number"
            className={`input input-xs w-full rounded-md ${cellEditValue ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
            value={cellEditValue}
            onChange={onCellInputChange}
            onBlur={(e) => onCellInputBlur(entry.id, field, e.target.value)}
            onKeyDown={e => onCellInputKeyDown(e, entry.id, field)}
            autoFocus
          />
        );
      } else {
        return (
          <input
            type="text"
            className={`input input-xs w-full rounded-md ${cellEditValue ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
            value={cellEditValue}
            onChange={onCellInputChange}
            onBlur={(e) => onCellInputBlur(entry.id, field, e.target.value)}
            onKeyDown={e => onCellInputKeyDown(e, entry.id, field)}
            autoFocus
          />
        );
      }
    }
    
    return value;
  };

  return (
    <tr
      ref={isHighlighted ? highlightedRowRef : null}
      className={
        isHighlighted
          ? 'bg-yellow-200 animate-pulse'
          : isNewRow
          ? 'bg-blue-50'
          : ''
      }
    >
      <td className="px-2 py-1">
        <input 
          type="checkbox" 
          checked={isSelected} 
          onChange={() => onSelect(entry.id)} 
        />
      </td>
      
      {/* WBS Element */}
      <td 
        className="px-2 py-1" 
        onClick={() => {
          console.log('🔵 WBS Element clicked:', { id: entry.id, value: entry.wbsElement?.code });
          onCellClick(entry.id, 'wbsElementId', entry.wbsElement?.id);
        }}
      >
        {renderCell('wbsElementId', entry.wbsElement ? `${entry.wbsElement.code} - ${entry.wbsElement.name}` : '', undefined)}
      </td>
      
      {/* Vendor */}
      <td 
        className="px-2 py-1" 
        onClick={() => {
          console.log('🔵 Vendor clicked:', { id: entry.id, value: entry.vendor_name });
          onCellClick(entry.id, 'vendor_name', entry.vendor_name);
        }}
      >
        {renderCell('vendor_name', entry.vendor_name, vendorOptions)}
      </td>
      
      {/* Description */}
      <td 
        className="px-2 py-1 w-64 max-w-xl" 
        onClick={() => {
          console.log('🔵 Description clicked:', { id: entry.id, value: entry.expense_description });
          onCellClick(entry.id, 'expense_description', entry.expense_description);
        }}
      >
        {renderCell('expense_description', entry.expense_description)}
      </td>
      
      {/* Cost Category */}
      <td 
        className="px-2 py-1 cursor-pointer" 
        onClick={(e) => {
          console.log('🔵 Cost Category clicked:', { id: entry.id, value: entry.costCategory?.code, costCategoryId: entry.costCategory?.id });
          e.stopPropagation();
          onCellClick(entry.id, 'costCategoryId', entry.costCategory?.id);
        }}
      >
        {renderCell('costCategoryId', entry.costCategory ? `${entry.costCategory.code} - ${entry.costCategory.name}` : '', undefined)}
      </td>
      
      {/* Invoice Link */}
      <td 
        className="px-2 py-1 w-28 max-w-[7rem] relative" 
        onClick={e => { 
          e.stopPropagation(); 
          onPopoverOpen(entry.id, entry.invoice_link_text ?? '', entry.invoice_link_url ?? '', e); 
        }}
      >
        {entry.invoice_link_text && entry.invoice_link_url ? (
          <a href={entry.invoice_link_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            {entry.invoice_link_text}
          </a>
        ) : (
          <span className="text-gray-400 italic">(add link)</span>
        )}
      </td>
      
      {/* Baseline Date */}
      <td 
        className="px-2 py-1 text-right" 
        onClick={() => {
          console.log('🔵 Baseline Date clicked:', { id: entry.id, value: entry.baseline_date });
          onCellClick(entry.id, 'baseline_date', entry.baseline_date);
        }}
      >
        {renderCell('baseline_date', entry.baseline_date)}
      </td>
      
      {/* Baseline Amount */}
      <td 
        className="px-2 py-1 text-right" 
        onClick={() => {
          console.log('🔵 Baseline Amount clicked:', { id: entry.id, value: entry.baseline_amount });
          onCellClick(entry.id, 'baseline_amount', entry.baseline_amount);
        }}
      >
        {renderCell('baseline_amount', formatCurrency(entry.baseline_amount))}
      </td>
      
      {/* Planned Date */}
      <td 
        className="px-2 py-1 text-right" 
        onClick={() => {
          console.log('🔵 Planned Date clicked:', { id: entry.id, value: entry.planned_date });
          onCellClick(entry.id, 'planned_date', entry.planned_date);
        }}
      >
        {renderCell('planned_date', entry.planned_date)}
      </td>
      
      {/* Planned Amount */}
      <td 
        className="px-2 py-1 text-right" 
        onClick={() => {
          console.log('🔵 Planned Amount clicked:', { id: entry.id, value: entry.planned_amount });
          onCellClick(entry.id, 'planned_amount', entry.planned_amount);
        }}
      >
        {renderCell('planned_amount', formatCurrency(entry.planned_amount))}
      </td>
      
      {/* Actual Date */}
      <td 
        className="px-2 py-1 text-right" 
        onClick={() => {
          console.log('🔵 Actual Date clicked:', { id: entry.id, value: entry.actual_date });
          onCellClick(entry.id, 'actual_date', entry.actual_date);
        }}
      >
        {renderCell('actual_date', entry.actual_date)}
      </td>
      
      {/* Actual Amount */}
      <td 
        className="px-2 py-1 text-right" 
        onClick={() => {
          console.log('🔵 Actual Amount clicked:', { id: entry.id, value: entry.actual_amount });
          onCellClick(entry.id, 'actual_amount', entry.actual_amount);
        }}
      >
        {renderCell('actual_amount', formatCurrency(entry.actual_amount))}
      </td>
      
      {/* Notes */}
      <td 
        className="px-2 py-1" 
        onClick={() => {
          console.log('🔵 Notes clicked:', { id: entry.id, value: entry.notes });
          onCellClick(entry.id, 'notes', entry.notes);
        }}
      >
        {renderCell('notes', entry.notes)}
      </td>
      
      {/* Upload Column */}
      <td className="px-2 py-1 text-center">
        <div className="flex items-center justify-center gap-1">
          {hasPotentialMatches && (
            <button
              className="btn btn-xs btn-outline btn-primary"
              onClick={() => onShowPotentialMatches(entry.id)}
              title="View potential matches"
            >
              <DocumentMagnifyingGlassIcon className="h-3 w-3" />
            </button>
          )}
          {hasRejectedMatches && (
            <button
              className="btn btn-xs btn-outline btn-error"
              onClick={() => onShowPotentialMatches(entry.id)}
              title="View rejected matches"
            >
              <XCircleIcon className="h-3 w-3" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo
  return (
    prevProps.entry.id === nextProps.entry.id &&
    prevProps.entry.costCategoryId === nextProps.entry.costCategoryId &&
    prevProps.entry.costCategory?.id === nextProps.entry.costCategory?.id &&
    prevProps.entry.costCategory?.code === nextProps.entry.costCategory?.code &&
    prevProps.entry.costCategory?.name === nextProps.entry.costCategory?.name &&
    prevProps.entry.wbsElementId === nextProps.entry.wbsElementId &&
    prevProps.entry.wbsElement?.id === nextProps.entry.wbsElement?.id &&
    prevProps.entry.wbsElement?.code === nextProps.entry.wbsElement?.code &&
    prevProps.entry.wbsElement?.name === nextProps.entry.wbsElement?.name &&
    prevProps.entry.vendor_name === nextProps.entry.vendor_name &&
    prevProps.entry.expense_description === nextProps.entry.expense_description &&
    prevProps.entry.baseline_date === nextProps.entry.baseline_date &&
    prevProps.entry.baseline_amount === nextProps.entry.baseline_amount &&
    prevProps.entry.planned_date === nextProps.entry.planned_date &&
    prevProps.entry.planned_amount === nextProps.entry.planned_amount &&
    prevProps.entry.actual_date === nextProps.entry.actual_date &&
    prevProps.entry.actual_amount === nextProps.entry.actual_amount &&
    prevProps.entry.notes === nextProps.entry.notes &&
    prevProps.entry.invoice_link_text === nextProps.entry.invoice_link_text &&
    prevProps.entry.invoice_link_url === nextProps.entry.invoice_link_url &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.editingField === nextProps.editingField &&
    prevProps.cellEditValue === nextProps.cellEditValue &&
    prevProps.hasPotentialMatches === nextProps.hasPotentialMatches &&
    prevProps.hasRejectedMatches === nextProps.hasRejectedMatches
  );
});

LedgerTableRow.displayName = 'LedgerTableRow';

export default LedgerTableRow; 