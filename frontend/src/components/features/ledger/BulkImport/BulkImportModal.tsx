import React, { useState } from 'react';
import axios from 'axios';

interface BulkImportModalProps {
  show: boolean;
  programId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({
  show,
  programId,
  onClose,
  onSuccess
}) => {
  const [bulkImportResult, setBulkImportResult] = useState<any>(null);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setBulkImportResult(null);
  };

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      const response = await axios.get('/api/ledger/template', {
        responseType: 'blob',
      });
      
      // Create a blob URL and trigger download
      const blob = new Blob([response.data as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ledger_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Failed to download template. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleBulkImport = async () => {
    if (!selectedFile) return;
    setBulkImporting(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('programId', programId);
    try {
      const res = await axios.post(`/api/programs/${programId}/import/ledger`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setBulkImportResult(res.data);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setBulkImportResult({ error: err?.message || 'Bulk Import failed' });
    } finally {
      setBulkImporting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setBulkImportResult(null);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <h3 className="text-xl font-bold mb-4">Bulk Import Ledger Data</h3>
        
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Required Format:</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>File must be in Excel (.xlsx, .xls) or CSV format</li>
            <li><b>Required columns:</b> vendor_name, expense_description, wbsElementCode</li>
            <li><b>Optional columns:</b> costCategoryCode, baseline_date, baseline_amount, planned_date, planned_amount, actual_date, actual_amount, notes, <b>invoice_link_text</b>, <b>invoice_link_url</b></li>
            <li>Dates must be in YYYY-MM-DD format</li>
            <li>Amounts must be numeric values</li>
            <li>wbsElementCode must be a valid WBS Element code from the program's WBS structure (e.g., "1.1.1", "1.2.3")</li>
            <li>costCategoryCode must be a valid cost category code (e.g., "LABOR", "MATERIALS", "EQUIPMENT")</li>
          </ul>
        </div>

        <div className="mb-6">
          <button 
            onClick={handleDownloadTemplate}
            disabled={downloading}
            className="text-blue-600 hover:text-blue-800 underline flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {downloading ? 'Downloading...' : 'Download Template'}
          </button>
        </div>

        <div className="mb-6">
          <input 
            type="file" 
            accept=".xlsx,.xls,.csv" 
            onChange={handleFileChange} 
            disabled={bulkImporting}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        {bulkImporting && <div className="mb-4 text-blue-600">Bulk Importing...</div>}
        
        {bulkImportResult && (
          <div className="mt-4 text-left">
            {bulkImportResult.error ? (
              <div className="text-red-600">Error: {bulkImportResult.error}</div>
            ) : (
              <>
                <div className="text-green-700 font-semibold">Bulk Imported: {bulkImportResult.inserted ?? 0}</div>
                <div className="text-yellow-700 font-semibold">Failed: {bulkImportResult.failed ?? 0}</div>
                {bulkImportResult.errors && Array.isArray(bulkImportResult.errors) && bulkImportResult.errors.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto text-xs">
                    <div className="font-bold mb-1">Errors:</div>
                    <ul>
                      {bulkImportResult.errors.map((err: any, idx: number) => (
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
            onClick={handleBulkImport} 
            disabled={!selectedFile || bulkImporting}
          >
            {bulkImporting ? 'Bulk Importing...' : 'Bulk Import'}
          </button>
          <button 
            className="btn btn-ghost" 
            onClick={handleClose}
            disabled={bulkImporting}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal; 