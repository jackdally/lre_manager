import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from './Layout';
import LedgerTable from './LedgerTable';

const LedgerPage: React.FC = () => {
  const { id } = useParams();
  const programId = Number(id);
  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Ledger</h1>
        <LedgerTable programId={programId} />
      </div>
    </Layout>
  );
};

export default LedgerPage; 