import React from 'react';

interface LedgerTableHeaderProps {
  search: string;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  onAddEntry: () => void;
  selectedRows: string[];
  onBulkEdit: () => void;
  onBulkDelete: () => void;
  vendorFilter: string | undefined;
  setVendorFilter: (v: string | undefined) => void;
  wbsElementFilter: string | undefined;
  setWbsElementFilter: (v: string | undefined) => void;
  vendorOptions: string[];
  wbsElementOptions: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    level: number;
    parentId?: string;
  }>;
}

const LedgerTableHeader: React.FC<LedgerTableHeaderProps> = ({
  search,
  setSearch,
  setPage,
  onAddEntry,
  selectedRows,
  onBulkEdit,
  onBulkDelete,
  vendorFilter,
  setVendorFilter,
  wbsElementFilter,
  setWbsElementFilter,
  vendorOptions,
  wbsElementOptions,
}) => {
  return (
    <div className="flex flex-col gap-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium mb-1">Vendor</label>
          <select
            className="input input-sm w-full"
            value={vendorFilter || ''}
            onChange={e => setVendorFilter(e.target.value || undefined)}
          >
            <option value="">All Vendors</option>
            {(vendorOptions || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium mb-1">WBS Element</label>
          <select
            className="input input-sm w-full"
            value={wbsElementFilter || ''}
            onChange={e => setWbsElementFilter(e.target.value || undefined)}
          >
            <option value="">All WBS Elements</option>
            {(wbsElementOptions || []).map(element => (
              <option key={element.id} value={element.id}>
                {element.code} - {element.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium mb-1">Search</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search vendor..."
              className="input input-bordered input-sm w-full"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
            <button className="btn btn-primary btn-sm whitespace-nowrap" onClick={onAddEntry}>Add Entry</button>
          </div>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        {selectedRows.length > 0 && (
          <>
            <button className="btn btn-primary btn-sm" onClick={onBulkEdit}>Bulk Edit</button>
            <button className="btn btn-error btn-sm ml-2" onClick={onBulkDelete}>Delete</button>
          </>
        )}
      </div>
    </div>
  );
};

export default LedgerTableHeader; 