import React from 'react';

interface LedgerTableCellProps {
  value: any;
  editing: boolean;
  field: string;
  rowId: string;
  cellEditValue: any;
  options?: string[];
  onCellClick: (rowId: string, field: string, value: any) => void;
  onCellChange: (e: React.ChangeEvent<any>) => void;
  onCellBlur: (rowId: string, field: string) => void;
  onCellKeyDown: (e: React.KeyboardEvent, rowId: string, field: string) => void;
  formatCurrency?: (val: any) => string;
}

const LedgerTableCell: React.FC<LedgerTableCellProps> = ({
  value,
  editing,
  field,
  rowId,
  cellEditValue,
  options = [],
  onCellClick,
  onCellChange,
  onCellBlur,
  onCellKeyDown,
  formatCurrency,
}) => {
  const handleClick = () => {
    onCellClick(rowId, field, value);
  };

  if (editing) {
    // Render edit mode based on field type
    if (field === 'vendor_name') {
      return (
        <select
          className={`input input-xs w-full rounded-md ${cellEditValue ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
          value={cellEditValue}
          onChange={onCellChange}
          onBlur={() => onCellBlur(rowId, field)}
          onKeyDown={e => onCellKeyDown(e, rowId, field)}
          autoFocus
        >
          <option value="">-- Select --</option>
          {(options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    } else if (field === 'expense_description') {
      return (
        <textarea
          className={`input input-xs w-full min-h-24 rounded-md ${cellEditValue ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
          value={cellEditValue}
          onChange={onCellChange}
          onBlur={() => onCellBlur(rowId, field)}
          onKeyDown={e => onCellKeyDown(e, rowId, field)}
          autoFocus
        />
      );
    } else if (field === 'baseline_amount' || field === 'planned_amount' || field === 'actual_amount') {
      return (
        <input
          type="number"
          className={`input input-xs w-full rounded-md ${cellEditValue ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
          value={cellEditValue}
          onChange={onCellChange}
          onBlur={() => onCellBlur(rowId, field)}
          onKeyDown={e => onCellKeyDown(e, rowId, field)}
          autoFocus
        />
      );
    } else if (field === 'baseline_date' || field === 'planned_date' || field === 'actual_date') {
      return (
        <input
          type="date"
          className={`input input-xs w-full rounded-md ${cellEditValue ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
          value={cellEditValue}
          onChange={onCellChange}
          onBlur={() => onCellBlur(rowId, field)}
          onKeyDown={e => onCellKeyDown(e, rowId, field)}
          autoFocus
        />
      );
    } else {
      return (
        <input
          type="text"
          className={`input input-xs w-full rounded-md ${cellEditValue ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
          value={cellEditValue}
          onChange={onCellChange}
          onBlur={() => onCellBlur(rowId, field)}
          onKeyDown={e => onCellKeyDown(e, rowId, field)}
          autoFocus
        />
      );
    }
  }

  // Render view mode
  if (field === 'baseline_amount' || field === 'planned_amount' || field === 'actual_amount') {
    return (
      <span className="text-right">
        {formatCurrency ? formatCurrency(value) : value}
      </span>
    );
  }

  return <span>{value}</span>;
};

export default LedgerTableCell; 