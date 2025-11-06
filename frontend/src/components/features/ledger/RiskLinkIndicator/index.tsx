import React from 'react';

interface RiskLinkIndicatorProps {
  risk?: { id: string; title?: string } | null; // Legacy single risk
  risks?: Array<{ id: string; title?: string }>; // New multiple risks
}

const RiskLinkIndicator: React.FC<RiskLinkIndicatorProps> = ({ risk, risks }) => {
  // Use risks array if available, otherwise fall back to single risk
  const riskList = risks || (risk ? [risk] : []);
  
  if (riskList.length === 0) {
    return <span className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">None</span>;
  }
  
  if (riskList.length === 1) {
    const singleRisk = riskList[0];
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700" title={singleRisk.title || singleRisk.id}>
        {singleRisk.title || singleRisk.id}
      </span>
    );
  }
  
  // Multiple risks - show count
  const titles = riskList.map(r => r.title || r.id).join(', ');
  return (
    <span 
      className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700" 
      title={titles}
    >
      {riskList.length} risks
    </span>
  );
};

export default RiskLinkIndicator;


