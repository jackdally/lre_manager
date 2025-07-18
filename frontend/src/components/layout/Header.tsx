import React from 'react';
import { LREManagerIcon } from '../common/icons';

const Header: React.FC = () => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl text-primary-700 font-bold flex items-center gap-2">
          <LREManagerIcon />
          LRE Manager
        </span>
      </div>
      <div className="text-sm text-gray-500 font-medium">
        Program Manager Dashboard
      </div>
    </header>
  );
};

export default Header; 