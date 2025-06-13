import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProgramDirectory from './components/ProgramDirectory';
import ProgramDashboard from './components/ProgramDashboard';
import LedgerPage from './components/LedgerPage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProgramDirectory />} />
        <Route path="/programs/:id/dashboard" element={<ProgramDashboard />} />
        <Route path="/programs/:id/ledger" element={<LedgerPage />} />
      </Routes>
    </Router>
  );
};

export default App; 