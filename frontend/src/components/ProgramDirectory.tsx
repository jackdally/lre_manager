import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './Layout';
import { useNavigate } from 'react-router-dom';

interface Program {
  id: string;
  code: string;
  name: string;
  description: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  totalBudget: number;
  type: 'Annual' | 'Period of Performance';
}

const TOMORROW_LOGO = '/tomorrow-logo.png';

const ProgramDirectory: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editProgramId, setEditProgramId] = useState<string | null>(null);
  const [newProgram, setNewProgram] = useState<Partial<Program>>({
    type: 'Annual',
    status: 'Active',
  });
  const [status, setStatus] = useState('All Status');
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [cardModalProgram, setCardModalProgram] = useState<Program | null>(null);
  const [spinningCardId, setSpinningCardId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'budget' | 'status'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const navigate = useNavigate();

  const fetchPrograms = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/programs');
      setPrograms(response.data);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  let filteredPrograms = programs.filter((program) =>
    (status === 'All Status' || program.status === status) &&
    Object.values(program).some((value) =>
      value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Sort filteredPrograms
  filteredPrograms = [...filteredPrograms].sort((a, b) => {
    let aVal, bVal;
    switch (sortBy) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'code':
        aVal = a.code.toLowerCase();
        bVal = b.code.toLowerCase();
        break;
      case 'budget':
        aVal = a.totalBudget;
        bVal = b.totalBudget;
        break;
      case 'status':
        aVal = a.status.toLowerCase();
        bVal = b.status.toLowerCase();
        break;
      default:
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
    }
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleAddOrEditProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editMode && editProgramId !== null) {
        await axios.put(`http://localhost:4000/api/programs/${editProgramId}`, newProgram);
      } else {
        await axios.post('http://localhost:4000/api/programs', newProgram);
      }
      await fetchPrograms();
      setOpenDialog(false);
      setEditMode(false);
      setEditProgramId(null);
      setNewProgram({ type: 'Annual', status: 'Active' });
    } catch (error) {
      console.error('Error saving program:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProgram((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (program: Program) => {
    setEditMode(true);
    setEditProgramId(program.id);
    setNewProgram({ ...program });
    setOpenDialog(true);
    setDropdownOpen(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:4000/api/programs/${id}`);
      await fetchPrograms();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting program:', error);
    }
  };

  // Card click handler with spin animation
  const handleCardClick = (program: Program) => {
    setSpinningCardId(program.id);
    setTimeout(() => {
      setCardModalProgram(program);
      setSpinningCardId(null);
    }, 500); // 500ms spin duration
  };

  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-3xl font-bold text-gray-900">Program Manager</h1>
          {/* Icon Switcher */}
          <div className="flex gap-2">
            <button
              className={`p-2 rounded-full hover:bg-gray-100 border transition-colors ${viewMode === 'table' ? 'bg-primary-100 border-primary-500' : 'border-gray-200'}`}
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              title="Table view"
            >
              {/* Table icon (lines) */}
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="4" rx="1" strokeWidth="2" />
                <rect x="3" y="10" width="18" height="4" rx="1" strokeWidth="2" />
                <rect x="3" y="15" width="18" height="4" rx="1" strokeWidth="2" />
              </svg>
            </button>
            <button
              className={`p-2 rounded-full hover:bg-gray-100 border transition-colors ${viewMode === 'card' ? 'bg-primary-100 border-primary-500' : 'border-gray-200'}`}
              onClick={() => setViewMode('card')}
              aria-label="Card view"
              title="Card view"
            >
              {/* Card/grid icon (tiles) */}
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" />
                <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" />
                <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" />
                <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-gray-500 mb-8">Select a program to view its financial dashboard</p>

        {/* Card for search and filter + sort */}
        <div className="bg-white rounded-xl shadow p-6 mb-12 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search programs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="input-field md:w-48"
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="input-field md:w-36"
            >
              <option value="name">Sort by Name</option>
              <option value="code">Sort by Code</option>
              <option value="budget">Sort by Budget</option>
              <option value="status">Sort by Status</option>
            </select>
            <button
              type="button"
              className="p-2 rounded hover:bg-gray-100 border border-gray-200"
              onClick={() => setSortAsc((asc) => !asc)}
              title={sortAsc ? 'Ascending' : 'Descending'}
            >
              {sortAsc ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              )}
            </button>
          </div>
          <button
            className="btn-primary flex items-center gap-2 md:ml-auto"
            onClick={() => {
              setOpenDialog(true);
              setEditMode(false);
              setEditProgramId(null);
              setNewProgram({ type: 'Annual', status: 'Active' });
            }}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Program
          </button>
        </div>

        {/* Table View */}
        {viewMode === 'table' && filteredPrograms.length > 0 && (
          <div className="bg-white shadow rounded-lg overflow-x-auto mb-12">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPrograms.map((program) => (
                  <tr
                    key={program.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/programs/${program.id}/dashboard`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{program.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{program.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{program.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{program.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{program.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{program.startDate || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{program.endDate || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${program.totalBudget?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 relative">
                      <button
                        className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                        onClick={e => { e.stopPropagation(); setDropdownOpen(dropdownOpen === program.id ? null : program.id); }}
                        aria-label="Actions"
                      >
                        <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="5" cy="12" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="19" cy="12" r="2" />
                        </svg>
                      </button>
                      {dropdownOpen === program.id && (
                        <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-10">
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={e => { e.stopPropagation(); handleEdit(program); }}
                          >
                            Edit
                          </button>
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            onClick={e => { e.stopPropagation(); setDeleteConfirmId(program.id); setDropdownOpen(null); }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Card View */}
        {viewMode === 'card' && filteredPrograms.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-12">
            {filteredPrograms.map((program) => (
              <div
                key={program.id}
                className={`bg-white border-2 ${spinningCardId === program.id ? 'border-primary-500' : 'border-gray-200'} rounded-xl shadow p-4 flex flex-col items-stretch cursor-pointer transform transition-transform duration-500 hover:shadow-xl hover:border-primary-400 ${spinningCardId === program.id ? 'rotate-y-180' : ''}`}
                style={{ perspective: '1000px', minWidth: '340px', maxWidth: '420px', margin: '0 auto' }}
                onClick={() => handleCardClick(program)}
              >
                {/* Top row: logo left, info right */}
                <div className="flex flex-row justify-between items-start mb-2">
                  {/* Logo */}
                  <img
                    src={TOMORROW_LOGO}
                    alt="Program profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary-300 mr-2 mt-1"
                  />
                  {/* Info stack */}
                  <div className="flex flex-col items-end text-right flex-1">
                    <span className="font-semibold text-primary-700 text-sm leading-tight">{program.code}</span>
                    <span className="font-bold text-base leading-tight mt-0.5">{program.name}</span>
                    <span className={`px-2 py-0.5 mt-1 rounded text-xs font-medium ${program.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{program.status}</span>
                  </div>
                </div>
                {/* Budget center middle */}
                <div className="flex-1 flex flex-col justify-center items-center my-2">
                  <div className="text-gray-500 text-sm">Budget:</div>
                  <div className="font-semibold text-lg text-gray-900">${program.totalBudget?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                {/* ETC/VAC bottom center */}
                <div className="flex gap-8 mt-2 w-full justify-center border-t pt-2">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-400">ETC</span>
                    <span className="font-semibold text-gray-700">--</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-400">VAC</span>
                    <span className="font-semibold text-gray-700">--</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {filteredPrograms.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-32">
            <svg className="h-16 w-16 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M24 8v32M8 24h32" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 32l8-8 8 8" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No programs found</h2>
            <p className="text-gray-500 mb-6">Get started by creating your first program.</p>
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => {
                setOpenDialog(true);
                setEditMode(false);
                setEditProgramId(null);
                setNewProgram({ type: 'Annual', status: 'Active' });
              }}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Program
            </button>
          </div>
        )}

        {/* Modal for creating/editing a program */}
        {openDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
                onClick={() => { setOpenDialog(false); setEditMode(false); setEditProgramId(null); }}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">{editMode ? 'Edit Program' : 'Create New Program'}</h2>
              <form className="space-y-4" onSubmit={handleAddOrEditProgram}>
                <div>
                  <label className="form-label">Program Code</label>
                  <input
                    type="text"
                    name="code"
                    value={newProgram.code || ''}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                    disabled={editMode}
                  />
                </div>
                <div>
                  <label className="form-label">Program Name</label>
                  <input
                    type="text"
                    name="name"
                    value={newProgram.name || ''}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    value={newProgram.description || ''}
                    onChange={handleInputChange}
                    className="input-field"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="form-label">Type</label>
                  <select
                    name="type"
                    value={newProgram.type || 'Annual'}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="Annual">Annual</option>
                    <option value="Period of Performance">Period of Performance</option>
                  </select>
                </div>
                {newProgram.type === 'Period of Performance' && (
                  <>
                    <div>
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        name="startDate"
                        value={newProgram.startDate || ''}
                        onChange={handleInputChange}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        name="endDate"
                        value={newProgram.endDate || ''}
                        onChange={handleInputChange}
                        className="input-field"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="form-label">Total Budget</label>
                  <input
                    type="number"
                    name="totalBudget"
                    value={newProgram.totalBudget || ''}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => { setOpenDialog(false); setEditMode(false); setEditProgramId(null); }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? (editMode ? 'Saving...' : 'Creating...') : (editMode ? 'Save Changes' : 'Create Program')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Card Details Modal */}
        {cardModalProgram && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl relative animate-fade-in flex flex-col items-center">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
                onClick={() => setCardModalProgram(null)}
                aria-label="Close"
              >
                &times;
              </button>
              {/* Program photo */}
              <img
                src={TOMORROW_LOGO}
                alt="Program profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-primary-300 mb-4 shadow"
              />
              <h2 className="text-2xl font-bold mb-4 text-gray-900">{cardModalProgram.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-2"><span className="font-semibold">Code:</span> {cardModalProgram.code}</div>
                  <div className="mb-2"><span className="font-semibold">Status:</span> {cardModalProgram.status}</div>
                  <div className="mb-2"><span className="font-semibold">Type:</span> {cardModalProgram.type}</div>
                  <div className="mb-2"><span className="font-semibold">Budget:</span> ${cardModalProgram.totalBudget?.toLocaleString()}</div>
                  <div className="mb-2"><span className="font-semibold">Start Date:</span> {cardModalProgram.startDate || 'N/A'}</div>
                  <div className="mb-2"><span className="font-semibold">End Date:</span> {cardModalProgram.endDate || 'N/A'}</div>
                </div>
                <div>
                  <div className="mb-2"><span className="font-semibold">Description:</span></div>
                  <div className="text-gray-700 mb-4">{cardModalProgram.description}</div>
                  <div className="flex gap-6 mt-4">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-400">ETC</span>
                      <span className="font-semibold text-gray-700">--</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-400">VAC</span>
                      <span className="font-semibold text-gray-700">--</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                className="btn-primary mt-2"
                onClick={() => { setCardModalProgram(null); navigate(`/programs/${cardModalProgram.id}/dashboard`); }}
              >
                View Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Delete confirmation dialog */}
        {deleteConfirmId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Delete Program</h2>
              <p className="mb-6 text-gray-700">Are you sure you want to delete this program? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  className="btn-secondary"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary bg-red-600 hover:bg-red-700"
                  onClick={() => handleDelete(deleteConfirmId)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProgramDirectory; 