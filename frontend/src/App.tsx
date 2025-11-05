import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProgramDirectory from './components/features/programs/ProgramDirectory';
import ProgramDashboard from './components/features/programs/ProgramDashboard';
import ProgramSetup from './components/features/programs/ProgramSetup';
import LedgerPage from './components/features/ledger/LedgerPage';
import ProgramSettingsPage from './components/features/programs/ProgramSettings';
import ActualsUploadPage from './components/features/actuals/ActualsUploadPage/index';
import UploadSessionDetails from './components/features/actuals/UploadSessionDetails/index';
import SettingsPage from './components/features/settings/SettingsPage';
import { BOEPage } from './components/features/boe';
import DocsPage from './components/features/docs/DocsPage';
import RiskOpportunityPage from './components/features/riskOpportunity/RiskOpportunityPage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProgramDirectory />} />
        <Route path="/programs/:id/setup" element={<ProgramSetup />} />
        <Route path="/programs/:id/dashboard" element={<ProgramDashboard />} />
        <Route path="/programs/:id/ledger" element={<LedgerPage />} />
        <Route path="/programs/:id/actuals" element={<ActualsUploadPage />} />
        <Route path="/programs/:id/boe" element={<BOEPage />} />
        <Route path="/programs/:id/risks" element={<RiskOpportunityPage />} />
        <Route path="/programs/:id/settings" element={<ProgramSettingsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/uploads/:id" element={<UploadSessionDetails />} />
        <Route path="/docs/*" element={<DocsPage />} />
      </Routes>
    </Router>
  );
};

export default App; 