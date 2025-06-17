import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from './Layout';
import LedgerTable from './LedgerTable';
import axios from 'axios';

const LedgerPage: React.FC = () => {
  const { id } = useParams();
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'currentMonthPlanned' | 'emptyActuals'>('all');

  if (!id) return <div>Missing program ID</div>;
  const programId = id;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('programId', programId);
    try {
      const res = await axios.post(`/api/programs/${programId}/import/ledger`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImportResult(res.data);
    } catch (err: any) {
      setImportResult({ error: err?.message || 'Import failed' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Ledger Page</h1>
          <button className="btn btn-primary" onClick={() => setShowImportModal(true)}>Import</button>
        </div>
        <div className="flex gap-4 mb-6">
          <button
            className={`btn px-4 py-2 rounded-md ${filterType === 'all' ? 'btn-primary' : 'btn-ghost border border-gray-300 bg-gray-100 text-gray-700'}`}
            onClick={() => setFilterType('all')}
          >
            Show All
          </button>
          <button
            className={`btn px-4 py-2 rounded-md ${filterType === 'currentMonthPlanned' ? 'btn-primary' : 'btn-ghost border border-gray-300 bg-gray-100 text-gray-700'}`}
            onClick={() => setFilterType('currentMonthPlanned')}
          >
            Show Current Month Planned Expenses
          </button>
          <button
            className={`btn px-4 py-2 rounded-md ${filterType === 'emptyActuals' ? 'btn-primary' : 'btn-ghost border border-gray-300 bg-gray-100 text-gray-700'}`}
            onClick={() => setFilterType('emptyActuals')}
          >
            Show Empty Actuals
          </button>
        </div>
        <LedgerTable programId={programId} showAll filterType={filterType} />
        {showImportModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
              <h3 className="text-xl font-bold mb-4">Import Ledger Data</h3>
              
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Required Format:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>File must be in Excel (.xlsx, .xls) or CSV format</li>
                  <li><b>Required columns:</b> vendor_name, expense_description, wbs_category, wbs_subcategory</li>
                  <li><b>Optional columns:</b> baseline_date, baseline_amount, planned_date, planned_amount, actual_date, actual_amount, notes, <b>invoice_link_text</b>, <b>invoice_link_url</b></li>
                  <li>Dates must be in YYYY-MM-DD format</li>
                  <li>Amounts must be numeric values</li>
                </ul>
              </div>

              <div className="mb-6">
                <a 
                  href="/api/ledger/template" 
                  className="text-blue-600 hover:text-blue-800 underline flex items-center gap-2"
                  download
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download Template
                </a>
              </div>

              <div className="mb-6">
                <input 
                  type="file" 
                  accept=".xlsx,.xls,.csv" 
                  onChange={handleFileChange} 
                  disabled={importing}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>

              {importing && <div className="mb-4 text-blue-600">Importing...</div>}
              
              {importResult && (
                <div className="mt-4 text-left">
                  {importResult.error ? (
                    <div className="text-red-600">Error: {importResult.error}</div>
                  ) : (
                    <>
                      <div className="text-green-700 font-semibold">Imported: {importResult.inserted ?? 0}</div>
                      <div className="text-yellow-700 font-semibold">Failed: {importResult.failed ?? 0}</div>
                      {importResult.errors && Array.isArray(importResult.errors) && importResult.errors.length > 0 && (
                        <div className="mt-2 max-h-32 overflow-y-auto text-xs">
                          <div className="font-bold mb-1">Errors:</div>
                          <ul>
                            {importResult.errors.map((err: any, idx: number) => (
                              <li key={idx}>Row {err.row}: {err.error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <button 
                  className="btn btn-primary" 
                  onClick={handleImport} 
                  disabled={!selectedFile || importing}
                >
                  {importing ? 'Importing...' : 'Import'}
                </button>
                <button 
                  className="btn btn-ghost" 
                  onClick={() => { setShowImportModal(false); setSelectedFile(null); setImportResult(null); }}
                  disabled={importing}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LedgerPage; 