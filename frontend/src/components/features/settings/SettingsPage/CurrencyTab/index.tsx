import React, { useState, useEffect } from 'react';
import { useSettingsStore, Currency, ExchangeRate } from '../../../../../store/settingsStore';
import Button from '../../../../common/Button';
import Modal from '../../../../common/Modal';

const CurrencyTab: React.FC = () => {
  const {
    currencies,
    isLoading,
    error,
    fetchCurrencies,
    createCurrencyApi,
    updateCurrencyApi,
    deleteCurrencyApi,
    updateExchangeRatesApi,
    setError
  } = useSettingsStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    isDefault: false,
    isActive: true,
    decimalPlaces: 2,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExchangeRateModal, setShowExchangeRateModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [exchangeRateForm, setExchangeRateForm] = useState({
    targetCurrencyId: '',
    rate: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    isManual: true,
    source: 'Manual Entry'
  });

  // Fetch currencies on component mount
  useEffect(() => {
    fetchCurrencies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handleOpenModal = (currency?: Currency) => {
    if (currency) {
      setEditingCurrency(currency);
      setFormData({
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        isDefault: currency.isDefault,
        isActive: currency.isActive,
        decimalPlaces: currency.decimalPlaces,
      });
    } else {
      setEditingCurrency(null);
      setFormData({
        code: '',
        name: '',
        symbol: '',
        isDefault: false,
        isActive: true,
        decimalPlaces: 2,
      });
    }
    setIsModalOpen(true);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.code.trim() || !formData.name.trim()) return;
    
    setIsSubmitting(true);
    try {
      if (editingCurrency) {
        await updateCurrencyApi(editingCurrency.id, formData);
      } else {
        await createCurrencyApi(formData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving currency:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this currency?')) {
      try {
        await deleteCurrencyApi(id);
      } catch (error) {
        console.error('Error deleting currency:', error);
      }
    }
  };

  const handleUpdateExchangeRates = async () => {
    try {
      const result = await updateExchangeRatesApi();
      alert(`Exchange rates updated: ${result.created} created, ${result.updated} updated, ${result.errors} errors`);
      if (result.errors > 0) {
        console.log('Errors:', result.errorsList);
      }
    } catch (error) {
      console.error('Error updating exchange rates:', error);
    }
  };

  const handleOpenExchangeRateModal = (currency: Currency) => {
    setSelectedCurrency(currency);
    setShowExchangeRateModal(true);
    // TODO: Fetch exchange rates for this currency
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Currencies</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage currencies and exchange rates for multi-currency support.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleUpdateExchangeRates} variant="secondary">
            Update Exchange Rates
          </Button>
          <Button onClick={() => handleOpenModal()}>
            Add Currency
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading currencies...</div>
        </div>
      )}

      {/* Currencies List */}
      {!isLoading && (
        <div className="space-y-4">
          {currencies.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">💱</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Currencies</h3>
              <p className="text-gray-600 mb-4">
                Add currencies to enable multi-currency support.
              </p>
              <Button onClick={() => handleOpenModal()}>
                Add Currency
              </Button>
            </div>
          ) : (
            currencies.map((currency) => (
              <div
                key={currency.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-medium">{currency.symbol}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{currency.name}</h3>
                        <p className="text-sm text-gray-500">{currency.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {currency.isDefault && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Default
                        </span>
                      )}
                      {!currency.isActive && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        {currency.decimalPlaces} decimal places
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleOpenExchangeRateModal(currency)}
                      variant="secondary"
                      size="sm"
                    >
                      Exchange Rates
                    </Button>
                    <Button
                      onClick={() => handleOpenModal(currency)}
                      variant="secondary"
                      size="sm"
                    >
                      Edit
                    </Button>
                    {!currency.isDefault && (
                      <Button
                        onClick={() => handleDelete(currency.id)}
                        variant="danger"
                        size="sm"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Currency Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCurrency ? 'Edit Currency' : 'Add Currency'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="USD"
                maxLength={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Symbol
              </label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="$"
                maxLength={10}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="US Dollar"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Decimal Places
              </label>
              <select
                value={formData.decimalPlaces}
                onChange={(e) => setFormData({ ...formData, decimalPlaces: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>0 (e.g., JPY)</option>
                <option value={1}>1</option>
                <option value={2}>2 (e.g., USD, EUR)</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Default Currency</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={() => setIsModalOpen(false)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.code.trim() || !formData.name.trim()}
            >
              {isSubmitting ? 'Saving...' : editingCurrency ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Exchange Rate Modal */}
      <Modal
        isOpen={showExchangeRateModal}
        onClose={() => setShowExchangeRateModal(false)}
        title={`Exchange Rates - ${selectedCurrency?.name}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Exchange rate management for {selectedCurrency?.name} ({selectedCurrency?.code})
          </p>
          
          {/* TODO: Add exchange rate management interface */}
          <div className="text-center py-8 text-gray-500">
            Exchange rate management interface coming soon...
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setShowExchangeRateModal(false)}
              variant="secondary"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CurrencyTab; 