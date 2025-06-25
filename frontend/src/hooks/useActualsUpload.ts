import { useState } from 'react';
import { ImportConfig } from '../types/actuals';

export const useActualsUpload = (programId: string) => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  // Replace upload states
  const [replaceMode, setReplaceMode] = useState(false);
  const [selectedSessionToReplace, setSelectedSessionToReplace] = useState<string>('');
  const [preserveConfirmedMatches, setPreserveConfirmedMatches] = useState(true);
  const [preserveAllMatches, setPreserveAllMatches] = useState(false);
  const [forceReplace, setForceReplace] = useState(false);
  const [showReplaceOptions, setShowReplaceOptions] = useState(false);
  const [showForceReplaceConfirm, setShowForceReplaceConfirm] = useState(false);
  const [pendingUploadData, setPendingUploadData] = useState<{
    file: File;
    description: string;
    config: any;
  } | null>(null);

  const performUpload = async (config: ImportConfig) => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);
      formData.append('config', JSON.stringify(config));

      let endpoint = `/api/import/${programId}/upload`;
      
      if (replaceMode && selectedSessionToReplace) {
        endpoint = `/api/import/${programId}/replace-upload`;
        formData.append('replaceSessionId', selectedSessionToReplace);
        formData.append('preserveConfirmedMatches', preserveConfirmedMatches.toString());
        formData.append('preserveAllMatches', preserveAllMatches.toString());
        formData.append('forceReplace', forceReplace.toString());
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setUploadResult(result);
        
        // Reset form
        setFile(null);
        setDescription('');
        setReplaceMode(false);
        setSelectedSessionToReplace('');
        setPreserveConfirmedMatches(true);
        setPreserveAllMatches(false);
        setForceReplace(false);
        setShowReplaceOptions(false);
        
        return result;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setUploadResult(null);
    setError(null);
  };

  const handleReplaceModeChange = (checked: boolean) => {
    setReplaceMode(checked);
    if (!checked) {
      setSelectedSessionToReplace('');
      setShowReplaceOptions(false);
    }
  };

  const handleSessionToReplaceChange = (sessionId: string) => {
    setSelectedSessionToReplace(sessionId);
    setShowReplaceOptions(!!sessionId);
  };

  const resetUploadForm = () => {
    setFile(null);
    setDescription('');
    setUploadResult(null);
    setError(null);
    setReplaceMode(false);
    setSelectedSessionToReplace('');
    setPreserveConfirmedMatches(true);
    setPreserveAllMatches(false);
    setForceReplace(false);
    setShowReplaceOptions(false);
  };

  return {
    file,
    setFile,
    description,
    setDescription,
    loading,
    setLoading,
    error,
    setError,
    uploadResult,
    setUploadResult,
    replaceMode,
    setReplaceMode,
    selectedSessionToReplace,
    setSelectedSessionToReplace,
    preserveConfirmedMatches,
    setPreserveConfirmedMatches,
    preserveAllMatches,
    setPreserveAllMatches,
    forceReplace,
    setForceReplace,
    showReplaceOptions,
    setShowReplaceOptions,
    showForceReplaceConfirm,
    setShowForceReplaceConfirm,
    pendingUploadData,
    setPendingUploadData,
    performUpload,
    handleFileChange,
    handleReplaceModeChange,
    handleSessionToReplaceChange,
    resetUploadForm
  };
}; 