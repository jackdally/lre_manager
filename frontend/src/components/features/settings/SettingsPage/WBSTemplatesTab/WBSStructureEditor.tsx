import React, { useState } from 'react';
import { WBSElement } from '../../../../../store/settingsStore';
import Button from '../../../../common/Button';

interface WBSStructureEditorProps {
  structure: WBSElement[];
  onChange: (structure: WBSElement[]) => void;
}

const WBSStructureEditor: React.FC<WBSStructureEditorProps> = ({ structure, onChange }) => {
  const [editingElement, setEditingElement] = useState<WBSElement | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newElement, setNewElement] = useState({
    code: '',
    name: '',
    description: '',
    level: 1,
    parentId: undefined as string | undefined,
  });

  // Ensure structure is always an array
  const safeStructure = structure || [];

  const addElement = () => {
    const element: WBSElement = {
      id: Date.now().toString(),
      ...newElement,
      children: [],
    };
    
    if (newElement.parentId) {
      // Add as child to existing element
      const updatedStructure = addChildToElement(safeStructure, newElement.parentId, element);
      onChange(updatedStructure);
    } else {
      // Add as top-level element
      onChange([...safeStructure, element]);
    }
    
    setNewElement({
      code: '',
      name: '',
      description: '',
      level: 1,
      parentId: undefined,
    });
    setShowAddForm(false);
  };

  const addChildToElement = (elements: WBSElement[], parentId: string, child: WBSElement): WBSElement[] => {
    return elements.map(element => {
      if (element.id === parentId) {
        return {
          ...element,
          children: [...(element.children || []), child],
        };
      }
      if (element.children) {
        return {
          ...element,
          children: addChildToElement(element.children, parentId, child),
        };
      }
      return element;
    });
  };

  const updateElement = (id: string, updates: Partial<WBSElement>) => {
    const updatedStructure = updateElementInStructure(safeStructure, id, updates);
    onChange(updatedStructure);
    setEditingElement(null);
  };

  const updateElementInStructure = (elements: WBSElement[], id: string, updates: Partial<WBSElement>): WBSElement[] => {
    return elements.map(element => {
      if (element.id === id) {
        return { ...element, ...updates };
      }
      if (element.children) {
        return {
          ...element,
          children: updateElementInStructure(element.children, id, updates),
        };
      }
      return element;
    });
  };

  const deleteElement = (id: string) => {
    const updatedStructure = deleteElementFromStructure(safeStructure, id);
    onChange(updatedStructure);
  };

  const deleteElementFromStructure = (elements: WBSElement[], id: string): WBSElement[] => {
    return elements.filter(element => {
      if (element.id === id) {
        return false;
      }
      if (element.children) {
        element.children = deleteElementFromStructure(element.children, id);
      }
      return true;
    });
  };

  const renderElement = (element: WBSElement, level: number = 0) => {
    const isEditing = editingElement?.id === element.id;
    
    return (
      <div key={element.id} className="border border-gray-200 rounded-lg mb-2">
        <div className="p-3 bg-gray-50">
                     {isEditing ? (
             <div className="space-y-3">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <input
                   type="text"
                   value={editingElement.code}
                   onChange={(e) => setEditingElement({ ...editingElement, code: e.target.value })}
                   className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                   placeholder="Code"
                 />
                 <input
                   type="text"
                   value={editingElement.name}
                   onChange={(e) => setEditingElement({ ...editingElement, name: e.target.value })}
                   className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                   placeholder="Name"
                 />
               </div>
               <textarea
                 value={editingElement.description}
                 onChange={(e) => setEditingElement({ ...editingElement, description: e.target.value })}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                 rows={2}
                 placeholder="Description"
               />
               <div className="flex gap-2">
                 <Button
                   size="sm"
                   onClick={() => updateElement(element.id, editingElement)}
                 >
                   Save
                 </Button>
                 <Button
                   variant="secondary"
                   size="sm"
                   onClick={() => setEditingElement(null)}
                 >
                   Cancel
                 </Button>
               </div>
             </div>
          ) : (
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-mono text-gray-600 min-w-[50px] font-medium">
                    {element.code}
                  </span>
                  <span className="text-sm text-gray-400">•</span>
                  <span className="text-sm font-medium text-gray-900">
                    {element.name}
                  </span>
                </div>
                {element.description && (
                  <p className="text-xs text-gray-600 ml-[50px]">{element.description}</p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingElement(element)}
                >
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setNewElement({
                      ...newElement,
                      level: level + 1,
                      parentId: element.id,
                    });
                    setShowAddForm(true);
                  }}
                >
                  Add Child
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => deleteElement(element.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Render children */}
        {element.children && element.children.length > 0 && (
          <div className="pl-4 border-l-2 border-gray-200">
            {element.children.map(child => renderElement(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-900">WBS Structure</h4>
        <Button
          size="sm"
          onClick={() => {
            setNewElement({
              code: '',
              name: '',
              description: '',
              level: 1,
              parentId: undefined,
            });
            setShowAddForm(true);
          }}
        >
          Add Element
        </Button>
      </div>

      {/* Add Element Form */}
      {showAddForm && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h5 className="text-sm font-medium text-gray-900 mb-3">
            {newElement.parentId ? 'Add Child Element' : 'Add Top-Level Element'}
          </h5>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={newElement.code}
                onChange={(e) => setNewElement({ ...newElement, code: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Code (e.g., 1.0, 1.1)"
              />
              <input
                type="text"
                value={newElement.name}
                onChange={(e) => setNewElement({ ...newElement, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Element Name"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={addElement}
                  disabled={!newElement.code.trim() || !newElement.name.trim()}
                >
                  Add Element
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
            <textarea
              value={newElement.description}
              onChange={(e) => setNewElement({ ...newElement, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Description (optional)"
            />
          </div>
        </div>
      )}

      {/* Structure Tree */}
      <div className="space-y-2">
        {safeStructure.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No WBS elements defined. Add your first element to get started.</p>
          </div>
        ) : (
          safeStructure.map(element => renderElement(element))
        )}
      </div>
    </div>
  );
};

export default WBSStructureEditor; 