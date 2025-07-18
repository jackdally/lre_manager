import React from 'react';

interface BulkEditModalProps {
  show: boolean;
  selectedCount: number;
  bulkEditFields: any;
  clearedFields: { [field: string]: boolean };
  wbsCategoryOptions: string[];
  wbsSubcategoryOptions: string[];
  vendorOptions: string[];
  isCleared: (field: string) => boolean;
  handleBulkEditFieldChange: (e: React.ChangeEvent<any>) => void;
  handleBulkEditClearToggle: (field: string) => void;
  handleBulkEditSave: () => void;
  onCancel: () => void;
}

const LedgerBulkEditModal: React.FC<BulkEditModalProps> = ({
  show,
  selectedCount,
  bulkEditFields,
  clearedFields,
  wbsCategoryOptions,
  wbsSubcategoryOptions,
  vendorOptions,
  isCleared,
  handleBulkEditFieldChange,
  handleBulkEditClearToggle,
  handleBulkEditSave,
  onCancel,
}) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl w-full text-left">
        <h3 className="text-2xl font-bold mb-4 text-blue-600">Bulk Edit</h3>
        <div className="mb-2 text-sm text-gray-600 flex flex-wrap gap-4 items-center">
          <span><span className="inline-block align-middle">🗑️</span> = Clear field for all selected rows</span>
          <span><span className="inline-block align-middle w-4 h-4 rounded bg-green-100 border border-green-400 mr-1" style={{ display: 'inline-block', verticalAlign: 'middle' }}></span> = Field will be updated</span>
        </div>
        <div className="mb-4 text-gray-800">Update fields for {selectedCount} selected rows. Leave blank to skip a field.</div>
        <form onSubmit={e => { e.preventDefault(); handleBulkEditSave(); }}>
          <div className="grid grid-cols-4 gap-x-6 gap-y-4 mb-6 items-center">
            <div>
              <label className="block font-medium text-left mb-1">WBS Category</label>
              <div className="flex items-center gap-2">
                <select
                  name="wbs_category"
                  className={`input input-xs w-full rounded-md ${isCleared('wbs_category') ? 'bg-green-100 border-green-400' : bulkEditFields.wbs_category ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                  value={isCleared('wbs_category') ? '' : bulkEditFields.wbs_category || ''}
                  onChange={handleBulkEditFieldChange}
                >
                  <option value="">-- Select --</option>
                  {wbsCategoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block font-medium text-left mb-1">WBS Subcategory</label>
              <div className="flex items-center gap-2">
                <select
                  name="wbs_subcategory"
                  className={`input input-xs w-full rounded-md ${isCleared('wbs_subcategory') ? 'bg-green-100 border-green-400' : bulkEditFields.wbs_subcategory ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                  value={isCleared('wbs_subcategory') ? '' : bulkEditFields.wbs_subcategory || ''}
                  onChange={handleBulkEditFieldChange}
                >
                  <option value="">-- Select --</option>
                  {wbsSubcategoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block font-medium text-left mb-1">Vendor</label>
              <div className="flex items-center gap-2">
                <select
                  name="vendor_name"
                  className={`input input-xs w-full rounded-md ${isCleared('vendor_name') ? 'bg-green-100 border-green-400' : bulkEditFields.vendor_name ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                  value={isCleared('vendor_name') ? '' : bulkEditFields.vendor_name || ''}
                  onChange={handleBulkEditFieldChange}
                >
                  <option value="">-- Select --</option>
                  {vendorOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
            <div></div>
            <div>
              <label className="block font-medium text-left mb-1">Invoice Link Text</label>
              <div className="flex items-center gap-2">
                <input
                  name="invoice_link_text"
                  type="text"
                  className={`input input-xs w-full rounded-md ${isCleared('invoice_link_text') ? 'bg-green-100 border-green-400' : bulkEditFields.invoice_link_text ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                  value={isCleared('invoice_link_text') ? '' : bulkEditFields.invoice_link_text || ''}
                  onChange={handleBulkEditFieldChange}
                />
                <button type="button" className={`ml-1 ${isCleared('invoice_link_text') ? 'text-green-600' : 'text-gray-400'} hover:text-red-500`} title="Clear" onClick={() => handleBulkEditClearToggle('invoice_link_text')}>🗑️</button>
              </div>
            </div>
            <div>
              <label className="block font-medium text-left mb-1">Invoice Link URL</label>
              <div className="flex items-center gap-2">
                <input
                  name="invoice_link_url"
                  type="text"
                  className={`input input-xs w-full rounded-md ${isCleared('invoice_link_url') ? 'bg-green-100 border-green-400' : bulkEditFields.invoice_link_url ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                  value={isCleared('invoice_link_url') ? '' : bulkEditFields.invoice_link_url || ''}
                  onChange={handleBulkEditFieldChange}
                />
                <button type="button" className={`ml-1 ${isCleared('invoice_link_url') ? 'text-green-600' : 'text-gray-400'} hover:text-red-500`} title="Clear" onClick={() => handleBulkEditClearToggle('invoice_link_url')}>🗑️</button>
              </div>
            </div>
            <div></div>
            <div></div>
            <div>
              <label className="block font-medium text-left mb-1">Baseline Date</label>
              <div className="flex items-center gap-2">
                <input
                  name="baseline_date"
                  type="date"
                  className={`input input-xs w-full rounded-md ${isCleared('baseline_date') ? 'bg-green-100 border-green-400' : bulkEditFields.baseline_date ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                  value={isCleared('baseline_date') ? '' : bulkEditFields.baseline_date || ''}
                  onChange={handleBulkEditFieldChange}
                />
                <button type="button" className={`ml-1 ${isCleared('baseline_date') ? 'text-green-600' : 'text-gray-400'} hover:text-red-500`} title="Clear" onClick={() => handleBulkEditClearToggle('baseline_date')}>🗑️</button>
              </div>
            </div>
            <div>
              <label className="block font-medium text-left mb-1">Baseline Amount</label>
              <div className="flex items-center gap-2">
                <input
                  name="baseline_amount"
                  type="number"
                  className={`input input-xs w-full rounded-md ${isCleared('baseline_amount') ? 'bg-green-100 border-green-400' : bulkEditFields.baseline_amount ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                  value={isCleared('baseline_amount') ? '' : bulkEditFields.baseline_amount ?? ''}
                  onChange={handleBulkEditFieldChange}
                />
                <button type="button" className={`ml-1 ${isCleared('baseline_amount') ? 'text-green-600' : 'text-gray-400'} hover:text-red-500`} title="Clear" onClick={() => handleBulkEditClearToggle('baseline_amount')}>🗑️</button>
              </div>
            </div>
            <div>
              <label className="block font-medium text-left mb-1">Planned Date</label>
              <div className="flex items-center gap-2">
                <input
                  name="planned_date"
                  type="date"
                  className={`input input-xs w-full rounded-md ${isCleared('planned_date') ? 'bg-green-100 border-green-400' : bulkEditFields.planned_date ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                  value={isCleared('planned_date') ? '' : bulkEditFields.planned_date || ''}
                  onChange={handleBulkEditFieldChange}
                />
                <button type="button" className={`ml-1 ${isCleared('planned_date') ? 'text-green-600' : 'text-gray-400'} hover:text-red-500`} title="Clear" onClick={() => handleBulkEditClearToggle('planned_date')}>🗑️</button>
              </div>
            </div>
            <div>
              <label className="block font-medium text-left mb-1">Planned Amount</label>
              <div className="flex items-center gap-2">
                <input
                  name="planned_amount"
                  type="number"
                  className={`input input-xs w-full rounded-md ${isCleared('planned_amount') ? 'bg-green-100 border-green-400' : bulkEditFields.planned_amount ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                  value={isCleared('planned_amount') ? '' : bulkEditFields.planned_amount ?? ''}
                  onChange={handleBulkEditFieldChange}
                />
                <button type="button" className={`ml-1 ${isCleared('planned_amount') ? 'text-green-600' : 'text-gray-400'} hover:text-red-500`} title="Clear" onClick={() => handleBulkEditClearToggle('planned_amount')}>🗑️</button>
              </div>
            </div>
            <div>
              <label className="block font-medium text-left mb-1">Actual Date</label>
              <div className="flex items-center gap-2">
                <input
                  name="actual_date"
                  type="date"
                  className={`input input-xs w-full rounded-md ${isCleared('actual_date') ? 'bg-green-100 border-green-400' : bulkEditFields.actual_date ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                  value={isCleared('actual_date') ? '' : bulkEditFields.actual_date || ''}
                  onChange={handleBulkEditFieldChange}
                />
                <button type="button" className={`ml-1 ${isCleared('actual_date') ? 'text-green-600' : 'text-gray-400'} hover:text-red-500`} title="Clear" onClick={() => handleBulkEditClearToggle('actual_date')}>🗑️</button>
              </div>
            </div>
            <div>
              <label className="block font-medium text-left mb-1">Actual Amount</label>
              <div className="flex items-center gap-2">
                <input
                  name="actual_amount"
                  type="number"
                  className={`input input-xs w-full rounded-md ${isCleared('actual_amount') ? 'bg-green-100 border-green-400' : bulkEditFields.actual_amount ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                  value={isCleared('actual_amount') ? '' : bulkEditFields.actual_amount ?? ''}
                  onChange={handleBulkEditFieldChange}
                />
                <button type="button" className={`ml-1 ${isCleared('actual_amount') ? 'text-green-600' : 'text-gray-400'} hover:text-red-500`} title="Clear" onClick={() => handleBulkEditClearToggle('actual_amount')}>🗑️</button>
              </div>
            </div>
            <div></div>
            <div></div>
            <div className="col-span-4 flex items-start gap-2">
              <label className="w-32 font-medium mt-2 text-left">Notes</label>
              <textarea
                name="notes"
                className={`input input-xs w-full min-h-24 rounded-md ${isCleared('notes') ? 'bg-green-100 border-green-400' : bulkEditFields.notes ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                value={isCleared('notes') ? '' : bulkEditFields.notes || ''}
                onChange={handleBulkEditFieldChange}
                style={{ marginLeft: 0 }}
              />
              <button type="button" className={`ml-1 ${isCleared('notes') ? 'text-green-600' : 'text-gray-400'} hover:text-red-500 mt-2`} title="Clear" onClick={() => handleBulkEditClearToggle('notes')}>🗑️</button>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LedgerBulkEditModal; 