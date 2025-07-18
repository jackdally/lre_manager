import React, { useState } from 'react';
import { useSettingsStore, Vendor } from '../../../../../store/settingsStore';
import Button from '../../../../common/Button';
import Modal from '../../../../common/Modal';

const VendorsTab: React.FC = () => {
  const vendors = useSettingsStore(state => state.vendors);
  const addVendor = useSettingsStore(state => state.addVendor);
  const updateVendor = useSettingsStore(state => state.updateVendor);
  const deleteVendor = useSettingsStore(state => state.deleteVendor);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    categories: [] as string[],
    performanceRating: 5,
    isActive: true,
  });

  const handleOpenModal = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name,
        contactPerson: vendor.contactPerson,
        email: vendor.email,
        phone: vendor.phone,
        categories: vendor.categories,
        performanceRating: vendor.performanceRating,
        isActive: vendor.isActive,
      });
    } else {
      setEditingVendor(null);
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        categories: [],
        performanceRating: 5,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (editingVendor) {
      updateVendor(editingVendor.id, formData);
    } else {
      const newVendor: Vendor = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addVendor(newVendor);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      deleteVendor(id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Vendors</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage vendor information and performance tracking.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          Add Vendor
        </Button>
      </div>

      {/* Vendors List */}
      <div className="space-y-4">
        {vendors.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏢</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Vendors</h3>
            <p className="text-gray-600 mb-4">
              Add vendors to track performance and manage relationships.
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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      ⭐ {vendor.performanceRating}/5
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{vendor.contactPerson} • {vendor.email}</p>
                  <div className="text-sm text-gray-500">
                    {vendor.categories.join(', ')} • 
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Person
            </label>
            <input
              type="text"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter contact person name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email address"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phone number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Performance Rating
            </label>
            <select
              value={formData.performanceRating}
              onChange={(e) => setFormData({ ...formData, performanceRating: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5].map(rating => (
                <option key={rating} value={rating}>{rating} Star{rating !== 1 ? 's' : ''}</option>
              ))}
            </select>
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
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name.trim() || !formData.email.trim()}
            >
              {editingVendor ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VendorsTab; 