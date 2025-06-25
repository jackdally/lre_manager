import React from 'react';

interface Program {
  id: string;
  code: string;
  name: string;
  description: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  totalBudget: number;
  type: "Annual" | "Period of Performance";
  program_manager?: string | null;
}

interface ProgramSelectorProps {
  programs: Program[];
  selectedProgramId: string;
  onProgramSelect: (programId: string) => void;
  isLoading: boolean;
}

const ProgramSelector: React.FC<ProgramSelectorProps> = ({
  programs,
  selectedProgramId,
  onProgramSelect,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Select Program</h2>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Select Program</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose a program for this upload
          </label>
          <select
            value={selectedProgramId}
            onChange={(e) => onProgramSelect(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a program...</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.code} - {program.name}
              </option>
            ))}
          </select>
        </div>

        {selectedProgramId && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Selected Program Details</h3>
            {(() => {
              const selectedProgram = programs.find(p => p.id === selectedProgramId);
              if (!selectedProgram) return null;
              
              return (
                <div className="space-y-2 text-sm text-blue-700">
                  <div>
                    <span className="font-medium">Code:</span> {selectedProgram.code}
                  </div>
                  <div>
                    <span className="font-medium">Name:</span> {selectedProgram.name}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {selectedProgram.type}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {selectedProgram.status}
                  </div>
                  {selectedProgram.program_manager && (
                    <div>
                      <span className="font-medium">Manager:</span> {selectedProgram.program_manager}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Total Budget:</span> ${selectedProgram.totalBudget.toLocaleString()}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramSelector; 