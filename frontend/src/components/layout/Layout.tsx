import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        {/* Page content */}
        <main style={{ flex: 1, transition: 'margin-left 0.2s' }} className="p-10 bg-gray-50 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 