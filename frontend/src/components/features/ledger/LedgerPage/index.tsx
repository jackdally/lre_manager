import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../../layout';
import SummaryKpis from '../../../common/SummaryKpis';
import HelpCallout from '../../../common/HelpCallout';
import LedgerTable from '../LedgerTable/LedgerTable';
import BulkImportModal from '../BulkImport/BulkImportModal';
import axios from 'axios';

const LedgerPage: React.FC = () => {
  const { id } = useParams();
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'currentMonthPlanned' | 'emptyActuals'>('all');
  
  // New filter states for dropdown filters - initialize with undefined to match store
  const [vendorFilter, setVendorFilter] = useState<string | undefined>(undefined);
  const [wbsElementFilter, setWbsElementFilter] = useState<string | undefined>(undefined);
  const [costCategoryFilter, setCostCategoryFilter] = useState<string | undefined>(undefined);
  
  // Dropdown options state
  const [dropdownOptions, setDropdownOptions] = useState<{
    vendors: string[];
    wbsElements: Array<{
      id: string;
      code: string;
      name: string;
      description: string;
      level: number;
      parentId?: string;
    }>;
  }>({ vendors: [], wbsElements: [] });

  const handleOptionsUpdate = useCallback((options: { 
    vendors: string[], 
    wbsElements: Array<{
      id: string;
      code: string;
      name: string;
      description: string;
      level: number;
      parentId?: string;
    }>
  }) => {
    setDropdownOptions(options);
  }, []);

  if (!id) return <div>Missing program ID</div>;
  const programId = id;

  // Wrap setters to accept string | undefined - no need to convert empty strings
  const handleSetVendorFilter = (v: string | undefined) => setVendorFilter(v);
  const handleSetWbsElementFilter = (v: string | undefined) => setWbsElementFilter(v);



  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Ledger Page</h1>
          <button className="btn btn-primary" onClick={() => setShowBulkImportModal(true)}>Bulk Import</button>
        </div>
        <SummaryKpis programId={programId} />
        <HelpCallout />
        
        <LedgerTable 
          programId={programId} 
          showAll 
          filterType={filterType}
          vendorFilter={vendorFilter}
          wbsElementFilter={wbsElementFilter}
          costCategoryFilter={costCategoryFilter}
          setFilterType={setFilterType}
          setVendorFilter={handleSetVendorFilter}
          setWbsElementFilter={handleSetWbsElementFilter}
          setCostCategoryFilter={setCostCategoryFilter}
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