import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../../layout';
import LedgerTable from '../LedgerTable/LedgerTable';
import BulkImportModal from '../BulkImport/BulkImportModal';
import axios from 'axios';

const LedgerPage: React.FC = () => {
  const { id } = useParams();
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'currentMonthPlanned' | 'emptyActuals'>('all');
  
  // New filter states for dropdown filters
  const [vendorFilter, setVendorFilter] = useState<string>('');
  const [wbsCategoryFilter, setWbsCategoryFilter] = useState<string>('');
  const [wbsSubcategoryFilter, setWbsSubcategoryFilter] = useState<string>('');
  
  // Dropdown options state
  const [dropdownOptions, setDropdownOptions] = useState<{
    vendors: string[];
    categories: string[];
    subcategories: string[];
  }>({ vendors: [], categories: [], subcategories: [] });

  const handleOptionsUpdate = useCallback((options: { vendors: string[], categories: string[], subcategories: string[] }) => {
    setDropdownOptions(options);
  }, []);

  if (!id) return <div>Missing program ID</div>;
  const programId = id;

  // Wrap setters to accept string | undefined
  const handleSetVendorFilter = (v: string | undefined) => setVendorFilter(v ?? '');
  const handleSetWbsCategoryFilter = (v: string | undefined) => setWbsCategoryFilter(v ?? '');
  const handleSetWbsSubcategoryFilter = (v: string | undefined) => setWbsSubcategoryFilter(v ?? '');



  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Ledger Page</h1>
          <button className="btn btn-primary" onClick={() => setShowBulkImportModal(true)}>Bulk Import</button>
        </div>
        
        <LedgerTable 
          programId={programId} 
          showAll 
          filterType={filterType}
          vendorFilter={vendorFilter}
          wbsCategoryFilter={wbsCategoryFilter}
          wbsSubcategoryFilter={wbsSubcategoryFilter}
          setFilterType={setFilterType}
          setVendorFilter={handleSetVendorFilter}
          setWbsCategoryFilter={handleSetWbsCategoryFilter}
          setWbsSubcategoryFilter={handleSetWbsSubcategoryFilter}
          onOptionsUpdate={handleOptionsUpdate}
        />
        
        <BulkImportModal
          show={showBulkImportModal}
          programId={programId}
          onClose={() => setShowBulkImportModal(false)}
        />
      </div>
    </Layout>
  );
};

export default LedgerPage; 