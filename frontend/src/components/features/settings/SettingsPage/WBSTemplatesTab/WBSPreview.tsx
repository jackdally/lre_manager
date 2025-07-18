import React from 'react';
import { WBSElement } from '../../../../../store/settingsStore';

interface WBSPreviewProps {
  structure: WBSElement[];
  title?: string;
}

const WBSPreview: React.FC<WBSPreviewProps> = ({ structure, title = 'WBS Structure' }) => {
  const renderElement = (element: WBSElement, level: number = 0) => {
    const indent = level * 20;
    
    return (
      <div key={element.id} className="mb-1">
        <div 
          className="flex items-center py-1 hover:bg-gray-50 rounded px-2"
          style={{ marginLeft: `${indent}px` }}
        >
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm font-mono text-gray-600 min-w-[40px]">
              {element.code}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {element.name}
            </span>
          </div>
          {element.description && (
            <span className="text-xs text-gray-500 truncate max-w-[200px]">
              {element.description}
            </span>
          )}
        </div>
        
        {/* Render children */}
        {element.children && element.children.length > 0 && (
          <div>
            {element.children.map(child => renderElement(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-900 mb-3">{title}</h4>
      <div className="space-y-1">
        {structure.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">No WBS elements defined</p>
          </div>
        ) : (
          structure.map(element => renderElement(element))
        )}
      </div>
    </div>
  );
};

export default WBSPreview; 