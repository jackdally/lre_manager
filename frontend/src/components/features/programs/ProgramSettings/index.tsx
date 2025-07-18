import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Layout from '../../../layout';
import WbsTreeView from '../WbsTreeView';
import WbsRollupReport from '../WbsRollupReport';



const ProgramSettingsPage: React.FC = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingInfo, setSavingInfo] = useState(false);

  const [program, setProgram] = useState<any>(null);
  const [programForm, setProgramForm] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'info' | 'hierarchical-wbs' | 'wbs-reporting'>('info');
  const [selectedWbsElement, setSelectedWbsElement] = useState<any>(null);

  // Fetch program info
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const progRes = await axios.get(`/api/programs/${id}`);
        setProgram(progRes.data);
        setProgramForm({ ...(progRes.data as object) });
      } catch (err: any) {
        setError('Failed to load program data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Handlers for program info
  const handleProgramChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProgramForm((prev: any) => ({ ...prev, [name]: value }));
  };
  const handleSaveProgram = async () => {
    setSavingInfo(true);
    setError(null);
    try {
      await axios.put(`/api/programs/${id}`, programForm);
      setProgram({ ...program, ...programForm });
    } catch (err: any) {
      setError('Failed to save program info.');
    } finally {
      setSavingInfo(false);
    }
  };

  // Helper to format currency with no decimal points
  const formatCurrency = (val: number | string | undefined | null) => {
    if (val == null || val === '') return '';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(val));
  };



  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Program Settings</h1>
        {loading ? (
          <div className="text-gray-500 text-lg">Loading...</div>
        ) : error ? (
          <div className="text-red-600 text-lg mb-4">{error}</div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'info'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Program Info
                </button>

                <button
                  onClick={() => setActiveTab('hierarchical-wbs')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'hierarchical-wbs'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  WBS (Hierarchical)
                </button>
                <button
                  onClick={() => setActiveTab('wbs-reporting')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'wbs-reporting'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  WBS Reporting
                </button>
              </nav>
            </div>

            {/* Program Info Tab */}
            {activeTab === 'info' && (
              <section className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold mb-4">Program Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Program Name</label>
                  <input name="name" className="input-field" value={programForm.name || ''} onChange={handleProgramChange} />
                </div>
                <div>
                  <label className="form-label">Program Code</label>
                  <input name="code" className="input-field" value={programForm.code || ''} onChange={handleProgramChange} />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select name="status" className="input-field" value={programForm.status || ''} onChange={handleProgramChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Type</label>
                  <select name="type" className="input-field" value={programForm.type || ''} onChange={handleProgramChange}>
                    <option value="Annual">Annual</option>
                    <option value="Period of Performance">Period of Performance</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Start Date</label>
                  <input name="startDate" type="date" className="input-field" value={programForm.startDate ? programForm.startDate.slice(0,10) : ''} onChange={handleProgramChange} />
                </div>
                <div>
                  <label className="form-label">End Date</label>
                  <input name="endDate" type="date" className="input-field" value={programForm.endDate ? programForm.endDate.slice(0,10) : ''} onChange={handleProgramChange} />
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Description</label>
                  <textarea name="description" className="input-field" rows={3} value={programForm.description || ''} onChange={handleProgramChange} />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                  <input
                    name="totalBudget"
                    type="number"
                    className="input-field"
                    value={programForm.totalBudget || ''}
                    onChange={handleProgramChange}
                    onBlur={e => {
                      // Format as integer on blur
                      const val = e.target.value;
                      if (val) setProgramForm((prev: any) => ({ ...prev, totalBudget: Math.round(Number(val)) }));
                    }}
                  />
                  <div className="text-xs text-gray-500 mt-1">{formatCurrency(programForm.totalBudget)}</div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program Manager</label>
                  <input
                    type="text"
                    name="program_manager"
                    value={programForm.program_manager || ''}
                    onChange={handleProgramChange}
                    className="input-field"
                  />
                </div>
              </div>
              <button className="btn-primary mt-6" onClick={handleSaveProgram} disabled={savingInfo}>{savingInfo ? 'Saving...' : 'Save Program Info'}</button>
            </section>
            )}



            {/* Hierarchical WBS Tab */}
            {activeTab === 'hierarchical-wbs' && (
              <section className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-bold mb-4">Hierarchical WBS Structure</h2>
                <div className="mb-4 text-sm text-gray-600">
                  <p>This is the new hierarchical WBS structure that supports unlimited depth levels.</p>
                  <p className="mt-2">Features:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Tree-like expandable interface</li>
                    <li>Search by code or name</li>
                    <li>Unlimited hierarchy levels</li>
                    <li>Code-based organization (e.g., "1.1", "2.3.1")</li>
                    <li>Cost roll-up reporting</li>
                  </ul>
                </div>
                
                {selectedWbsElement && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <h3 className="font-medium text-blue-900">Selected Element:</h3>
                    <p className="text-sm text-blue-800">
                      <span className="font-mono">{selectedWbsElement.code}</span> - {selectedWbsElement.name}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">{selectedWbsElement.description}</p>
                  </div>
                )}

                <WbsTreeView
                  programId={id!}
                  onElementSelect={setSelectedWbsElement}
                  selectedElementId={selectedWbsElement?.id}
                />
              </section>
            )}

            {activeTab === 'wbs-reporting' && (
              <section className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-bold mb-4">WBS Cost Roll-up Report</h2>
                <div className="mb-4 text-sm text-gray-600">
                  <p>View cost roll-up reports for the hierarchical WBS structure with performance metrics.</p>
                </div>
                
                <WbsRollupReport programId={id!} />
              </section>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default ProgramSettingsPage; 