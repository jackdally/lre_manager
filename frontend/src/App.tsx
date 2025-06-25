import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProgramDirectory from './components/features/programs/ProgramDirectory';
import ProgramDashboard from './components/features/programs/ProgramDashboard';
import LedgerPage from './components/features/ledger/LedgerPage';
import ProgramSettingsPage from './components/features/programs/ProgramSettings';
import ActualsUploadPage from './components/features/actuals/ActualsUploadPage/index';
import UploadSessionDetails from './components/features/actuals/UploadSessionDetails';

// Placeholder components for BOE and Risks & Opportunities
const BOEPage = () => <div className="p-8"><h1 className="text-2xl font-bold mb-4">BOE Page</h1><p>This is a placeholder for the BOE page.</p></div>;
const RisksPage = () => <div className="p-8"><h1 className="text-2xl font-bold mb-4">Risks & Opportunities</h1><p>This is a placeholder for the Risks & Opportunities page.</p></div>;

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProgramDirectory />} />
        <Route path="/programs/:id/dashboard" element={<ProgramDashboard />} />
        <Route path="/programs/:id/ledger" element={<LedgerPage />} />
        <Route path="/programs/:id/actuals" element={<ActualsUploadPage />} />
        <Route path="/programs/:id/boe" element={<BOEPage />} />
        <Route path="/programs/:id/risks" element={<RisksPage />} />
        <Route path="/programs/:id/settings" element={<ProgramSettingsPage />} />
        <Route path="/uploads/:id" element={<UploadSessionDetails />} />
      </Routes>
    </Router>
  );
};

export default App; 