import { useState } from 'react';

interface ImportConfig {
  programCodeColumn: string;
  vendorColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  dateColumn: string;
  periodColumn?: string;
  categoryColumn?: string;
  subcategoryColumn?: string;
  invoiceColumn?: string;
  referenceColumn?: string;
  transactionIdColumn?: string;
  dateFormat?: string;
  amountTolerance?: number;
  matchThreshold?: number;
}

interface SavedConfig {
  id: string;
  name: string;
  description: string;
  columnMapping: ImportConfig;
  isDefault: boolean;
  isGlobal: boolean;
  program?: any;
  createdAt: string;
  updatedAt: string;
}

export const useActualsConfig = (programId: string, savedConfigs: SavedConfig[]) => {
  const [config, setConfig] = useState<ImportConfig>({
    programCodeColumn: 'Program Code',
    vendorColumn: 'Vendor Name',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    dateColumn: 'Transaction Date',
    periodColumn: 'Period',
    categoryColumn: 'Category',
    subcategoryColumn: 'Subcategory',
    invoiceColumn: 'Invoice Number',
    referenceColumn: 'Reference Number',
    transactionIdColumn: 'Transaction ID',
    dateFormat: 'MM/DD/YYYY',
    amountTolerance: 0.01,
    matchThreshold: 0.7
  });

  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [showSaveConfig, setShowSaveConfig] = useState(false);
  const [showCopyConfig, setShowCopyConfig] = useState(false);
  const [configName, setConfigName] = useState('');
  const [configDescription, setConfigDescription] = useState('');
  const [isDefaultConfig, setIsDefaultConfig] = useState(false);
  const [isGlobalConfig, setIsGlobalConfig] = useState(false);
  const [copyTargetProgramId, setCopyTargetProgramId] = useState('');
  const [copyConfigName, setCopyConfigName] = useState('');
  const [copyConfigDescription, setCopyConfigDescription] = useState('');
  const [copyIsDefault, setCopyIsDefault] = useState(false);
  const [selectedConfigForCopy, setSelectedConfigForCopy] = useState<SavedConfig | null>(null);
  const [selectedConfigForSave, setSelectedConfigForSave] = useState<SavedConfig | null>(null);

  const handleConfigSelect = async (configId: string) => {
    setSelectedConfigId(configId);
    const selectedConfig = savedConfigs.find(c => c.id === configId);
    if (selectedConfig) {
      setConfig(selectedConfig.columnMapping);
    }
  };

  const handleSaveConfig = async () => {
    try {
      const endpoint = selectedConfigForSave
        ? `/api/import/config/${selectedConfigForSave.id}`
        : `/api/import/${programId}/config`;

      const response = await fetch(endpoint, {
        method: selectedConfigForSave ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: configName,
          description: configDescription,
          columnMapping: config,
          isDefault: isDefaultConfig,
          isGlobal: isGlobalConfig,
        }),
      });

      if (response.ok) {
        setShowSaveConfig(false);
        setConfigName('');
        setConfigDescription('');
        setIsDefaultConfig(false);
        setIsGlobalConfig(false);
        setSelectedConfigForSave(null);
        // Refresh configs list
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  };

  const handleCopyConfig = async () => {
    try {
      const response = await fetch(`/api/import/config/${selectedConfigForCopy?.id}/copy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetProgramId: copyTargetProgramId,
          name: copyConfigName,
          description: copyConfigDescription,
          isDefault: copyIsDefault,
        }),
      });

      if (response.ok) {
        setShowCopyConfig(false);
        setCopyTargetProgramId('');
        setCopyConfigName('');
        setCopyConfigDescription('');
        setCopyIsDefault(false);
        setSelectedConfigForCopy(null);
        // Refresh configs list
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to copy config:', err);
    }
  };

  const resetConfigForm = () => {
    setConfigName('');
    setConfigDescription('');
    setIsDefaultConfig(false);
    setIsGlobalConfig(false);
    setSelectedConfigForSave(null);
  };

  const resetCopyForm = () => {
    setCopyTargetProgramId('');
    setCopyConfigName('');
    setCopyConfigDescription('');
    setCopyIsDefault(false);
    setSelectedConfigForCopy(null);
  };

  return {
    config,
    setConfig,
    selectedConfigId,
    setSelectedConfigId,
    showSaveConfig,
    setShowSaveConfig,
    showCopyConfig,
    setShowCopyConfig,
    configName,
    setConfigName,
    configDescription,
    setConfigDescription,
    isDefaultConfig,
    setIsDefaultConfig,
    isGlobalConfig,
    setIsGlobalConfig,
    copyTargetProgramId,
    setCopyTargetProgramId,
    copyConfigName,
    setCopyConfigName,
    copyConfigDescription,
    setCopyConfigDescription,
    copyIsDefault,
    setCopyIsDefault,
    selectedConfigForCopy,
    setSelectedConfigForCopy,
    selectedConfigForSave,
    setSelectedConfigForSave,
    handleConfigSelect,
    handleSaveConfig,
    handleCopyConfig,
    resetConfigForm,
    resetCopyForm
  };
}; 