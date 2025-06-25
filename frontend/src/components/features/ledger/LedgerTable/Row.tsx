import React from 'react';
import { InformationCircleIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
import LedgerTableCell from './Cell';
import { LedgerEntry } from './index';

interface LedgerTableRowProps {
  entry: LedgerEntry;
  index: number;
  editingCell: { rowId: string, field: string } | null;
  cellEditValue: any;
  selectedRows: string[];
  highlightId: string | null;
  newRowId: string | null;
  wbsCategoryOptions: string[];
  wbsSubcategoryOptions: string[];
  vendorOptions: string[];
  popover: { rowId: string | null, anchorEl: HTMLElement | null };
  entriesWithRejectedMatches: Set<string>;
  potentialMatchIds: string[];
  onCellClick: (rowId: string, field: string, value: any) => void;
  onCellChange: (e: React.ChangeEvent<any>) => void;
  onCellBlur: (rowId: string, field: string) => void;
  onCellKeyDown: (e: React.KeyboardEvent, rowId: string, field: string) => void;
  onSelectRow: (id: string) => void;
  onPopoverOpen: (rowId: string, text: string | null | undefined, url: string | null | undefined, event: React.MouseEvent) => void;
  onShowPotentialMatches: (entryId: string) => void;
  formatCurrency: (val: any) => string;
  highlightedRowRef: React.RefObject<HTMLTableRowElement>;
}

const LedgerTableRow: React.FC<LedgerTableRowProps> = ({
  entry,
  index,
  editingCell,
  cellEditValue,
  selectedRows,
  highlightId,
  newRowId,
  wbsCategoryOptions,
  wbsSubcategoryOptions,
  vendorOptions,
  popover,
  entriesWithRejectedMatches,
  potentialMatchIds,
  onCellClick,
  onCellChange,
  onCellBlur,
  onCellKeyDown,
  onSelectRow,
  onPopoverOpen,
  onShowPotentialMatches,
  formatCurrency,
  highlightedRowRef,
}) => {
  const isEditing = editingCell && editingCell.rowId === entry.id;
  const isHighlighted = entry.id === highlightId;
  const isNewRow = entry.id === newRowId;
  const isSelected = selectedRows.includes(entry.id);
  const hasRejectedMatches = entriesWithRejectedMatches.has(entry.id);
  const hasPotentialMatches = potentialMatchIds.includes(entry.id);

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
          onChange={() => onSelectRow(entry.id)} 
        />
      </td>
      
      {/* WBS Category */}
      <td className="px-2 py-1" onClick={() => onCellClick(entry.id, 'wbs_category', entry.wbs_category)}>
        <LedgerTableCell
          value={entry.wbs_category}
          editing={!!(isEditing && editingCell?.field === 'wbs_category')}
          field="wbs_category"
          rowId={entry.id}
          cellEditValue={cellEditValue}
          options={wbsCategoryOptions}
          onCellClick={onCellClick}
          onCellChange={onCellChange}
          onCellBlur={onCellBlur}
          onCellKeyDown={onCellKeyDown}
        />
      </td>

      {/* WBS Subcategory */}
      <td className="px-2 py-1" onClick={() => onCellClick(entry.id, 'wbs_subcategory', entry.wbs_subcategory)}>
        <LedgerTableCell
          value={entry.wbs_subcategory}
          editing={!!(isEditing && editingCell?.field === 'wbs_subcategory')}
          field="wbs_subcategory"
          rowId={entry.id}
          cellEditValue={cellEditValue}
          options={wbsSubcategoryOptions}
          onCellClick={onCellClick}
          onCellChange={onCellChange}
          onCellBlur={onCellBlur}
          onCellKeyDown={onCellKeyDown}
        />
      </td>

      {/* Vendor */}
      <td className="px-2 py-1" onClick={() => onCellClick(entry.id, 'vendor_name', entry.vendor_name)}>
        <LedgerTableCell
          value={entry.vendor_name}
          editing={!!(isEditing && editingCell?.field === 'vendor_name')}
          field="vendor_name"
          rowId={entry.id}
          cellEditValue={cellEditValue}
          options={vendorOptions}
          onCellClick={onCellClick}
          onCellChange={onCellChange}
          onCellBlur={onCellBlur}
          onCellKeyDown={onCellKeyDown}
        />
      </td>

      {/* Description */}
      <td className="px-2 py-1 w-64 max-w-xl" onClick={() => onCellClick(entry.id, 'expense_description', entry.expense_description)}>
        <LedgerTableCell
          value={entry.expense_description}
          editing={!!(isEditing && editingCell?.field === 'expense_description')}
          field="expense_description"
          rowId={entry.id}
          cellEditValue={cellEditValue}
          onCellClick={onCellClick}
          onCellChange={onCellChange}
          onCellBlur={onCellBlur}
          onCellKeyDown={onCellKeyDown}
        />
      </td>

      {/* Invoice Link */}
      <td className="px-2 py-1 w-28 max-w-[7rem] relative" onClick={e => { e.stopPropagation(); onPopoverOpen(entry.id, entry.invoice_link_text ?? '', entry.invoice_link_url ?? '', e); }}>
        {entry.invoice_link_text && entry.invoice_link_url ? (
          <a href={entry.invoice_link_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{entry.invoice_link_text}</a>
        ) : (
          <span className="text-gray-400 italic">(add link)</span>
        )}
        {popover.rowId === entry.id && popover.anchorEl && (
          <div className="absolute z-50 bg-white border rounded shadow-lg p-4 top-8 left-0 w-64" style={{ minWidth: 220 }} onClick={e => e.stopPropagation()}>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Link Text</label>
              <input
                type="text"
                className="input input-xs w-full"
                value={entry.invoice_link_text || ''}
                onChange={e => {/* Handle popover text change */}}
                onKeyDown={e => {/* Handle popover key down */}}
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">URL</label>
              <input
                type="url"
                className="input input-xs w-full"
                value={entry.invoice_link_url || ''}
                onChange={e => {/* Handle popover URL change */}}
                onKeyDown={e => {/* Handle popover key down */}}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn btn-xs btn-primary" onClick={() => {/* Handle popover save */}}>Save</button>
              <button className="btn btn-xs btn-ghost" onClick={() => {/* Handle popover close */}}>Cancel</button>
            </div>
          </div>
        )}
      </td>

      {/* Baseline Date */}
      <td className="px-2 py-1 text-right" onClick={() => onCellClick(entry.id, 'baseline_date', entry.baseline_date)}>
        <LedgerTableCell
          value={entry.baseline_date}
          editing={!!(isEditing && editingCell?.field === 'baseline_date')}
          field="baseline_date"
          rowId={entry.id}
          cellEditValue={cellEditValue}
          onCellClick={onCellClick}
          onCellChange={onCellChange}
          onCellBlur={onCellBlur}
          onCellKeyDown={onCellKeyDown}
        />
      </td>

      {/* Baseline Amount */}
      <td className="px-2 py-1 text-right" onClick={() => onCellClick(entry.id, 'baseline_amount', entry.baseline_amount)}>
        <LedgerTableCell
          value={entry.baseline_amount}
          editing={!!(isEditing && editingCell?.field === 'baseline_amount')}
          field="baseline_amount"
          rowId={entry.id}
          cellEditValue={cellEditValue}
          onCellClick={onCellClick}
          onCellChange={onCellChange}
          onCellBlur={onCellBlur}
          onCellKeyDown={onCellKeyDown}
          formatCurrency={formatCurrency}
        />
      </td>

      {/* Planned Date */}
      <td className="px-2 py-1 text-right" onClick={() => onCellClick(entry.id, 'planned_date', entry.planned_date)}>
        <LedgerTableCell
          value={entry.planned_date}
          editing={!!(isEditing && editingCell?.field === 'planned_date')}
          field="planned_date"
          rowId={entry.id}
          cellEditValue={cellEditValue}
          onCellClick={onCellClick}
          onCellChange={onCellChange}
          onCellBlur={onCellBlur}
          onCellKeyDown={onCellKeyDown}
        />
      </td>

      {/* Planned Amount */}
      <td className="px-2 py-1 text-right" onClick={() => onCellClick(entry.id, 'planned_amount', entry.planned_amount)}>
        <LedgerTableCell
          value={entry.planned_amount}
          editing={!!(isEditing && editingCell?.field === 'planned_amount')}
          field="planned_amount"
          rowId={entry.id}
          cellEditValue={cellEditValue}
          onCellClick={onCellClick}
          onCellChange={onCellChange}
          onCellBlur={onCellBlur}
          onCellKeyDown={onCellKeyDown}
          formatCurrency={formatCurrency}
        />
      </td>

      {/* Actual Date */}
      <td className="px-2 py-1 text-right" onClick={() => onCellClick(entry.id, 'actual_date', entry.actual_date)}>
        <LedgerTableCell
          value={entry.actual_date}
          editing={!!(isEditing && editingCell?.field === 'actual_date')}
          field="actual_date"
          rowId={entry.id}
          cellEditValue={cellEditValue}
          onCellClick={onCellClick}
          onCellChange={onCellChange}
          onCellBlur={onCellBlur}
          onCellKeyDown={onCellKeyDown}
        />
      </td>

      {/* Actual Amount */}
      <td className="px-2 py-1 text-right" onClick={() => onCellClick(entry.id, 'actual_amount', entry.actual_amount)}>
        <LedgerTableCell
          value={entry.actual_amount}
          editing={!!(isEditing && editingCell?.field === 'actual_amount')}
          field="actual_amount"
          rowId={entry.id}
          cellEditValue={cellEditValue}
          onCellClick={onCellClick}
          onCellChange={onCellChange}
          onCellBlur={onCellBlur}
          onCellKeyDown={onCellKeyDown}
          formatCurrency={formatCurrency}
        />
      </td>

      {/* Notes */}
      <td className="px-2 py-1" onClick={() => onCellClick(entry.id, 'notes', entry.notes)}>
        <LedgerTableCell
          value={entry.notes}
          editing={!!(isEditing && editingCell?.field === 'notes')}
          field="notes"
          rowId={entry.id}
          cellEditValue={cellEditValue}
          onCellClick={onCellClick}
          onCellChange={onCellChange}
          onCellBlur={onCellBlur}
          onCellKeyDown={onCellKeyDown}
        />
      </td>

      {/* Upload/Actions */}
      <td className="px-2 py-1">
        <div className="flex gap-1">
          {hasPotentialMatches && (
            <button
              className="btn btn-xs btn-primary"
              onClick={() => onShowPotentialMatches(entry.id)}
              title="View potential matches"
            >
              <DocumentMagnifyingGlassIcon className="w-3 h-3" />
            </button>
          )}
          {hasRejectedMatches && (
            <span className="text-red-600 text-xs flex items-center gap-1">
              <InformationCircleIcon className="w-3 h-3" />
              rejected
            </span>
          )}
        </div>
      </td>
    </tr>
  );
};

export default LedgerTableRow; 