import React, { useState, useEffect } from 'react';
import { useBOEStore } from '../../../store/boeStore';
import { BOETemplate } from '../../../store/boeStore';

interface BOETemplateSelectorProps {
  onTemplateSelect: (template: BOETemplate) => void;
  selectedTemplateId?: string;
  showCreateNew?: boolean;
}

const BOETemplateSelector: React.FC<BOETemplateSelectorProps> = ({
  onTemplateSelect,
  selectedTemplateId,
  showCreateNew = true,
}) => {
  const {
    templates,
    templatesLoading,
    templatesError,
    setTemplates,
    setTemplatesLoading,
    setTemplatesError,
  } = useBOEStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPreview, setShowPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setTemplatesLoading(true);
        setTemplatesError(null);
        
        // TODO: Replace with actual API call
        // const templatesData = await boeApiService.templates.getTemplates();
        // setTemplates(templatesData);
        
        // Mock data for now
        const mockTemplates: BOETemplate[] = [
          {
            id: '1',
            name: 'Software Development Template',
            description: 'Standard template for software development projects',
            category: 'Software Development',
            version: '1.0',
            isActive: true,
            isDefault: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          {
            id: '2',
            name: 'Hardware Development Template',
            description: 'Template for hardware development and manufacturing projects',
            category: 'Hardware Development',
            version: '1.0',
            isActive: true,
            isDefault: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          {
            id: '3',
            name: 'Research & Development Template',
            description: 'Template for R&D projects with flexible structure',
            category: 'Research & Development',
            version: '1.0',
            isActive: true,
            isDefault: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ];
        
        setTemplates(mockTemplates);
        setTemplatesLoading(false);
      } catch (error) {
        console.error('Error loading templates:', error);
        setTemplatesError(error instanceof Error ? error.message : 'Failed to load templates');
        setTemplatesLoading(false);
      }
    };

    loadTemplates();
  }, [setTemplates, setTemplatesLoading, setTemplatesError]);

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  const handleTemplateSelect = (template: BOETemplate) => {
    onTemplateSelect(template);
  };

  const handlePreviewToggle = (templateId: string) => {
    setShowPreview(showPreview === templateId ? null : templateId);
  };

  if (templatesLoading) {
    return (
      <div className="template-selector">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading templates...</span>
          </div>
        </div>
      </div>
    );
  }

  if (templatesError) {
    return (
      <div className="template-selector">
        <div className="alert alert-danger">
          <h5>Error Loading Templates</h5>
          <p>{templatesError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="template-selector">
      <div className="row mb-3">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <i className="fas fa-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-4">
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          {showCreateNew && (
            <button className="btn btn-primary w-100">
              <i className="fas fa-plus me-1"></i>
              New Template
            </button>
          )}
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="alert alert-info">
          <h5>No Templates Found</h5>
          <p>No templates match your search criteria.</p>
        </div>
      ) : (
        <div className="row">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="col-md-6 col-lg-4 mb-3">
              <div className={`card h-100 ${selectedTemplateId === template.id ? 'border-primary' : ''}`}>
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">{template.name}</h6>
                  {template.isDefault && (
                    <span className="badge bg-success">Default</span>
                  )}
                </div>
                <div className="card-body">
                  <p className="card-text text-muted">{template.description}</p>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">Category: {template.category}</small>
                    <small className="text-muted">v{template.version}</small>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handlePreviewToggle(template.id)}
                    >
                      {showPreview === template.id ? 'Hide' : 'Preview'}
                    </button>
                    <button
                      className={`btn btn-sm ${selectedTemplateId === template.id ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      {selectedTemplateId === template.id ? 'Selected' : 'Select'}
                    </button>
                  </div>
                </div>
                
                {showPreview === template.id && (
                  <div className="card-footer">
                    <h6>Template Preview</h6>
                    <div className="template-preview">
                      <p><strong>Structure:</strong></p>
                      <ul className="list-unstyled">
                        <li>• Project Management</li>
                        <li>• Requirements Analysis</li>
                        <li>• Design & Development</li>
                        <li>• Testing & Validation</li>
                        <li>• Documentation</li>
                        <li>• Management Reserve</li>
                      </ul>
                      <p><strong>Default MR:</strong> 10%</p>
                      <p><strong>Estimated Elements:</strong> 15-25</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="row mt-3">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Showing {filteredTemplates.length} of {templates.length} templates
            </small>
            {selectedTemplateId && (
              <div className="alert alert-success mb-0 py-2">
                <i className="fas fa-check me-2"></i>
                Template selected
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOETemplateSelector; 