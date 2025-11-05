import React from 'react';

interface RiskLinkIndicatorProps {
  risk?: { id: string; title?: string } | null;
}

const RiskLinkIndicator: React.FC<RiskLinkIndicatorProps> = ({ risk }) => {
  if (!risk) {
    return <span className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">None</span>;
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700" title={risk.title || risk.id}>
      {risk.title || risk.id}
    </span>
  );
};

export default RiskLinkIndicator;


