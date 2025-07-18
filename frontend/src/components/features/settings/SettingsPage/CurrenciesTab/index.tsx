import React from 'react';
import { useSettingsStore } from '../../../../../store/settingsStore';

const CurrenciesTab: React.FC = () => {
  const { currencies, defaultCurrency, setDefaultCurrency } = useSettingsStore();

  const handleSetDefault = (currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (currency) {
      setDefaultCurrency(currency);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Currencies</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage currencies and exchange rates for multi-currency support.
        </p>
      </div>

      <div className="space-y-4">
        {currencies.map((currency) => (
          <div
            key={currency.code}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{currency.symbol}</div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{currency.name}</h3>
                  <p className="text-sm text-gray-600">{currency.code}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-600">Exchange Rate</div>
                  <div className="font-medium">{currency.exchangeRate.toFixed(4)}</div>
                </div>
                {currency.isDefault ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Default
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetDefault(currency.code)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Currency Management</h3>
        <p className="text-sm text-blue-700">
          The default currency will be used for all calculations and displays. 
          Exchange rates are updated automatically from external APIs.
        </p>
      </div>
    </div>
  );
};

export default CurrenciesTab; 