import React, { useState, useEffect } from 'react';
import { useSettingsStore, Vendor } from '../../../../../store/settingsStore';
import Button from '../../../../common/Button';
import Modal from '../../../../common/Modal';

const VendorsTab: React.FC = () => {
  const {
    vendors,
    isLoading,
    error,
    vendorsLoaded,
    fetchVendors,
    createVendorApi,
    updateVendorApi,
    deleteVendorApi,
    uploadVendorsApi,
    importFromNetSuiteApi,
    downloadVendorTemplateApi,
    setError
  } = useSettingsStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Fetch vendors on component mount
  useEffect(() => {
    if (!vendorsLoaded) {
      fetchVendors();
    }
  }, [fetchVendors, vendorsLoaded]);

  const handleOpenModal = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name,
        isActive: vendor.isActive,
      });
    } else {
      setEditingVendor(null);
      setFormData({
        name: '',
        isActive: true,
      });
    }
    setIsModalOpen(true);
    setError(null); // Clear any previous errors
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    
    setIsSubmitting(true);
    try {
      if (editingVendor) {
        await updateVendorApi(editingVendor.id, formData);
      } else {
        await createVendorApi(formData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving vendor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await deleteVendorApi(id);
      } catch (error) {
        console.error('Error deleting vendor:', error);
      }
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;
    
    setIsSubmitting(true);
    try {
      const result = await uploadVendorsApi(uploadFile);
      const message = result.count > 0 
        ? `Successfully uploaded ${result.count} vendor(s). ${result.skipped || 0} skipped, ${result.errors || 0} error(s).`
        : `No vendors were uploaded. ${result.skipped || 0} skipped (duplicates), ${result.errors || 0} error(s).`;
      
      if (result.errorsList && result.errorsList.length > 0) {
        const errorDetails = result.errorsList.slice(0, 5).join('\n');
        const moreErrors = result.errorsList.length > 5 ? `\n... and ${result.errorsList.length - 5} more errors` : '';
        alert(`${message}\n\nErrors:\n${errorDetails}${moreErrors}`);
      } else {
        alert(message);
      }
      
      setUploadFile(null);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Refresh vendors list
      fetchVendors();
    } catch (error: any) {
      console.error('Error uploading vendors:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to upload vendors';
      setError(errorMessage);
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNetSuiteImport = async () => {
    try {
      const result = await importFromNetSuiteApi();
      alert(`Successfully imported ${result.count} vendors from NetSuite: ${result.message}`);
      // Refresh vendors list
      fetchVendors();
    } catch (error) {
      console.error('Error importing from NetSuite:', error);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadVendorTemplateApi();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vendor_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  if (isLoading && !vendorsLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Vendors</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage vendor information and relationships.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownloadTemplate} variant="secondary">
            Download Template
          </Button>
          <Button onClick={handleNetSuiteImport} variant="secondary">
            Import from NetSuite
          </Button>
          <Button onClick={() => handleOpenModal()}>
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Bulk Upload</h3>
        <div className="flex gap-2 items-center">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            className="flex-1"
          />
          <Button 
            onClick={handleFileUpload} 
            disabled={!uploadFile || isSubmitting}
            variant="secondary"
          >
            {isSubmitting ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Vendors List */}
      <div className="space-y-4">
        {vendors.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏢</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Vendors</h3>
            <p className="text-gray-600 mb-4">
              Add vendors to manage relationships and track performance.
            </p>
            <Button onClick={() => handleOpenModal()}>
              Add Vendor
            </Button>
          </div>
        ) : (
          vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{vendor.name}</h3>
                    {vendor.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Updated {new Date(vendor.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenModal(vendor)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(vendor.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVendor ? 'Edit Vendor' : 'Add Vendor'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter vendor name"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name.trim() || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (editingVendor ? 'Update' : 'Create')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VendorsTab; 