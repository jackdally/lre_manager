import React from 'react';
import { InformationCircleIcon, DocumentMagnifyingGlassIcon, XCircleIcon } from '@heroicons/react/24/outline';
import LedgerTableCell from './Cell';
import { LedgerEntry } from './index';

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
  wbsCategoryOptions: string[];
  wbsSubcategoryOptions: string[];
  vendorOptions: string[];
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
  wbsCategoryOptions,
  wbsSubcategoryOptions,
  vendorOptions,
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
    
    console.log('🔵 renderCell:', { field, value, isEditing, editingField, isEditingThisCell, cellEditValue });
    
    if (isEditingThisCell) {
      console.log('🟢 Rendering edit input for field:', field);
      if (field === 'wbs_category' || field === 'wbs_subcategory' || field === 'vendor_name') {
        return (
          <select
            className={`input input-xs w-full rounded-md ${cellEditValue ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
            value={cellEditValue}
            onChange={onCellInputChange}
            onBlur={(e) => onCellInputBlur(entry.id, field, e.target.value)}
            onKeyDown={e => onCellInputKeyDown(e, entry.id, field)}
            autoFocus
          >
            <option value="">-- Select --</option>
            {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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
      
      {/* WBS Category */}
      <td 
        className="px-2 py-1" 
        onClick={() => {
          console.log('🔵 WBS Category clicked:', { id: entry.id, value: entry.wbs_category });
          onCellClick(entry.id, 'wbs_category', entry.wbs_category);
        }}
      >
        {renderCell('wbs_category', entry.wbs_category, wbsCategoryOptions)}
      </td>
      
      {/* WBS Subcategory */}
      <td 
        className="px-2 py-1" 
        onClick={() => {
          console.log('🔵 WBS Subcategory clicked:', { id: entry.id, value: entry.wbs_subcategory });
          onCellClick(entry.id, 'wbs_subcategory', entry.wbs_subcategory);
        }}
      >
        {renderCell('wbs_subcategory', entry.wbs_subcategory, wbsSubcategoryOptions)}
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