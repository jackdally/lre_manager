import React, { useState } from 'react';
import { LedgerEntry } from '../types';
import { formatCurrency, formatDate } from '../utils';
import Modal from '../../../../common/Modal';
import Button from '../../../../common/Button';

interface MissingActualsAlertProps {
  missingActuals: LedgerEntry[];
}

export const MissingActualsAlert: React.FC<MissingActualsAlertProps> = ({ missingActuals }) => {
  const [modalOpen, setModalOpen] = useState(false);
  if (missingActuals.length === 0) return null;

  return (
    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span style={{ fontSize: '2em', marginRight: '12px' }}>⚠️</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Missing Actuals Alert
          </h3>
          <p className="text-yellow-700 mb-4">
            {missingActuals.length} planned expense(s) are missing actual data for the selected reporting month. This may affect the accuracy of your project metrics.
          </p>
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)}>
            View Details
          </Button>
        </div>
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Missing Actuals Details" size="xl">
        <div className="bg-white rounded-lg p-2 max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-2 py-2 text-left">Vendor</th>
                <th className="px-2 py-2 text-left">Description</th>
                <th className="px-2 py-2 text-left">Planned Date</th>
                <th className="px-2 py-2 text-left">Planned Amount</th>
              </tr>
            </thead>
            <tbody>
              {missingActuals.map(entry => (
                <tr key={entry.id} className="border-b border-gray-100">
                  <td className="px-2 py-1">{entry.vendor_name}</td>
                  <td className="px-2 py-1">{entry.expense_description}</td>
                  <td className="px-2 py-1">{formatDate(entry.planned_date)}</td>
                  <td className="px-2 py-1">{formatCurrency(entry.planned_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}; 