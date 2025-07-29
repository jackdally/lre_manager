import React from 'react';
import BOEApprovalWorkflow from './BOEApprovalWorkflow';

interface BOEApprovalProps {
  programId: string;
}

const BOEApproval: React.FC<BOEApprovalProps> = ({ programId }) => {
  return <BOEApprovalWorkflow programId={programId} />;
};

export default BOEApproval; 