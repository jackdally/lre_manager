import React from 'react';

interface HelpCalloutProps {
  title?: string;
  children?: React.ReactNode;
}

const HelpCallout: React.FC<HelpCalloutProps> = ({ title = 'How to use the Ledger', children }) => {
  return (
    <div className="mb-6 border border-blue-200 bg-blue-50 rounded-lg p-4 text-sm text-blue-900">
      <div className="font-semibold mb-1">{title}</div>
      <div className="space-y-1 leading-relaxed">
        {children || (
          <>
            <p>
              The Ledger aggregates planned and actual costs by line. Use Search for keywords, Quick Filters for common states, and Advanced Filters for precise ranges and statuses.
            </p>
            <p>
              Save recurring filter sets as Presets. Link lines to Risks to track MR utilization and context.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default HelpCallout;


