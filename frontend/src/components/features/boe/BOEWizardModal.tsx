import React from 'react';
import { useBOEStore } from '../../../store/boeStore';
import BOEWizard from './BOEWizard';

const BOEWizardModal: React.FC = () => {
  const { showWizard, wizardProgramId, currentBOE, closeWizard } = useBOEStore();

  if (!showWizard || !wizardProgramId) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New BOE</h2>
          <p className="text-gray-600 mt-1">Follow the steps below to create a new Basis of Estimate</p>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <BOEWizard
            key="centralized-wizard"
            programId={wizardProgramId}
            currentBOE={currentBOE}
            sourceBOE={currentBOE}
            onComplete={(boeData) => {
              console.log('BOE created:', boeData);
              closeWizard();
              // Refresh the page to show the new BOE
              window.location.reload();
            }}
            onCancel={() => {
              closeWizard();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default BOEWizardModal; 