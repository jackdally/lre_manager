import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProgramDirectory from './components/ProgramDirectory';
import ProgramDashboard from './components/ProgramDashboard';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProgramDirectory />} />
        <Route path="/programs/:id/dashboard" element={<ProgramDashboard />} />
      </Routes>
    </Router>
  );
};

export default App; 