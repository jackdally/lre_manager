import React from 'react';

// Import the original large component to maintain exact functionality
import OriginalActualsUploadPage from '../ActualsUploadPage';

const ActualsUploadPage: React.FC = () => {
  // For now, return the original component to maintain exact functionality
  // This ensures the UI/UX stays exactly the same while we work on the hooks
  // Later, we can gradually replace parts of the original component with hooks
  // while keeping the exact same layout, tabs, and functionality
  return <OriginalActualsUploadPage />;
};

export default ActualsUploadPage; 