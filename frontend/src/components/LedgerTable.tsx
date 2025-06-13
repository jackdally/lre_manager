import React, { useEffect, useState } from 'react';
import axios from 'axios';

export interface LedgerEntry {
  id: string;
  vendor_name: string;
  expense_description: string;
  wbs_category: string;
  wbs_subcategory: string;
  baseline_date: string;
  baseline_amount: number;
  planned_date: string;
  planned_amount: number;
  actual_date: string | null;
  actual_amount: number | null;
  notes: string | null;
}

interface LedgerTableProps {
  programId: number;
}

const PAGE_SIZE = 10;

const LedgerTable: React.FC<LedgerTableProps> = ({ programId }) => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [editRow, setEditRow] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<LedgerEntry>>({});
  const [adding, setAdding] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<LedgerEntry>>({});

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:4000/api/programs/${programId}/ledger`, {
        params: { page, pageSize: PAGE_SIZE, search },
      });
      setEntries(res.data.entries);
      setTotal(res.data.total);
    } catch (err) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line
  }, [programId, page, search]);

  const handleEdit = (entry: LedgerEntry) => {
    setEditRow(entry.id);
    setEditData(entry);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async () => {
    await axios.put(`http://localhost:4000/api/ledger/${editRow}`, editData);
    setEditRow(null);
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    await axios.delete(`http://localhost:4000/api/ledger/${id}`);
    fetchEntries();
  };

  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEntry((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSave = async () => {
    await axios.post(`http://localhost:4000/api/programs/${programId}/ledger`, newEntry);
    setAdding(false);
    setNewEntry({});
    fetchEntries();
  };

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Ledger</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search vendor..."
            className="input input-bordered input-sm"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>Add Entry</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-2 py-2">Vendor</th>
              <th className="px-2 py-2">Description</th>
              <th className="px-2 py-2">WBS Category</th>
              <th className="px-2 py-2">WBS Subcategory</th>
              <th className="px-2 py-2">Baseline Date</th>
              <th className="px-2 py-2">Baseline Amount</th>
              <th className="px-2 py-2">Planned Date</th>
              <th className="px-2 py-2">Planned Amount</th>
              <th className="px-2 py-2">Actual Date</th>
              <th className="px-2 py-2">Actual Amount</th>
              <th className="px-2 py-2">Notes</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {adding && (
              <tr className="bg-green-50">
                <td className="px-2 py-1"><input name="vendor_name" className="input input-xs" value={newEntry.vendor_name || ''} onChange={handleAddChange} /></td>
                <td className="px-2 py-1"><textarea name="expense_description" className="input input-xs" value={newEntry.expense_description || ''} onChange={handleAddChange} /></td>
                <td className="px-2 py-1"><input name="wbs_category" className="input input-xs" value={newEntry.wbs_category || ''} onChange={handleAddChange} /></td>
                <td className="px-2 py-1"><input name="wbs_subcategory" className="input input-xs" value={newEntry.wbs_subcategory || ''} onChange={handleAddChange} /></td>
                <td className="px-2 py-1"><input name="baseline_date" type="date" className="input input-xs" value={newEntry.baseline_date || ''} onChange={handleAddChange} /></td>
                <td className="px-2 py-1"><input name="baseline_amount" type="number" className="input input-xs" value={newEntry.baseline_amount || ''} onChange={handleAddChange} /></td>
                <td className="px-2 py-1"><input name="planned_date" type="date" className="input input-xs" value={newEntry.planned_date || ''} onChange={handleAddChange} /></td>
                <td className="px-2 py-1"><input name="planned_amount" type="number" className="input input-xs" value={newEntry.planned_amount || ''} onChange={handleAddChange} /></td>
                <td className="px-2 py-1"><input name="actual_date" type="date" className="input input-xs" value={newEntry.actual_date || ''} onChange={handleAddChange} /></td>
                <td className="px-2 py-1"><input name="actual_amount" type="number" className="input input-xs" value={newEntry.actual_amount || ''} onChange={handleAddChange} /></td>
                <td className="px-2 py-1"><textarea name="notes" className="input input-xs" value={newEntry.notes || ''} onChange={handleAddChange} /></td>
                <td className="px-2 py-1 flex gap-1">
                  <button className="btn btn-xs btn-success" onClick={handleAddSave}>Save</button>
                  <button className="btn btn-xs btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
                </td>
              </tr>
            )}
            {entries.map(entry => (
              <tr key={entry.id} className={editRow === entry.id ? 'bg-yellow-50' : ''}>
                {editRow === entry.id ? (
                  <>
                    <td className="px-2 py-1"><input name="vendor_name" className="input input-xs" value={editData.vendor_name || ''} onChange={handleEditChange} /></td>
                    <td className="px-2 py-1"><textarea name="expense_description" className="input input-xs" value={editData.expense_description || ''} onChange={handleEditChange} /></td>
                    <td className="px-2 py-1"><input name="wbs_category" className="input input-xs" value={editData.wbs_category || ''} onChange={handleEditChange} /></td>
                    <td className="px-2 py-1"><input name="wbs_subcategory" className="input input-xs" value={editData.wbs_subcategory || ''} onChange={handleEditChange} /></td>
                    <td className="px-2 py-1"><input name="baseline_date" type="date" className="input input-xs" value={editData.baseline_date || ''} onChange={handleEditChange} /></td>
                    <td className="px-2 py-1"><input name="baseline_amount" type="number" className="input input-xs" value={editData.baseline_amount || ''} onChange={handleEditChange} /></td>
                    <td className="px-2 py-1"><input name="planned_date" type="date" className="input input-xs" value={editData.planned_date || ''} onChange={handleEditChange} /></td>
                    <td className="px-2 py-1"><input name="planned_amount" type="number" className="input input-xs" value={editData.planned_amount || ''} onChange={handleEditChange} /></td>
                    <td className="px-2 py-1"><input name="actual_date" type="date" className="input input-xs" value={editData.actual_date || ''} onChange={handleEditChange} /></td>
                    <td className="px-2 py-1"><input name="actual_amount" type="number" className="input input-xs" value={editData.actual_amount || ''} onChange={handleEditChange} /></td>
                    <td className="px-2 py-1"><textarea name="notes" className="input input-xs" value={editData.notes || ''} onChange={handleEditChange} /></td>
                    <td className="px-2 py-1 flex gap-1">
                      <button className="btn btn-xs btn-success" onClick={handleEditSave}>Save</button>
                      <button className="btn btn-xs btn-ghost" onClick={() => setEditRow(null)}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-2 py-1">{entry.vendor_name}</td>
                    <td className="px-2 py-1">{entry.expense_description}</td>
                    <td className="px-2 py-1">{entry.wbs_category}</td>
                    <td className="px-2 py-1">{entry.wbs_subcategory}</td>
                    <td className="px-2 py-1">{entry.baseline_date}</td>
                    <td className="px-2 py-1">{entry.baseline_amount}</td>
                    <td className="px-2 py-1">{entry.planned_date}</td>
                    <td className="px-2 py-1">{entry.planned_amount}</td>
                    <td className="px-2 py-1">{entry.actual_date || ''}</td>
                    <td className="px-2 py-1">{entry.actual_amount ?? ''}</td>
                    <td className="px-2 py-1">{entry.notes}</td>
                    <td className="px-2 py-1 flex gap-1">
                      <button className="btn btn-xs btn-warning" onClick={() => handleEdit(entry)}>Edit</button>
                      <button className="btn btn-xs btn-error" onClick={() => handleDelete(entry.id)}>Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-xs" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span className="px-2">Page {page} of {Math.ceil(total / PAGE_SIZE) || 1}</span>
        <button className="btn btn-xs" disabled={page * PAGE_SIZE >= total} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
};

export default LedgerTable; 