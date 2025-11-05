import React, { useState, useEffect, useRef } from 'react';
import { riskOpportunityApi } from '../../../services/riskOpportunityApi';
import { formatCurrency } from '../../../utils/currencyUtils';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface RiskMatrixProps {
  programId: string;
}

interface SelectedCell {
  severity: string;
  probabilityRange: string;
}

const RiskMatrix: React.FC<RiskMatrixProps> = ({ programId }) => {
  const [matrixData, setMatrixData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
  const [exporting, setExporting] = useState(false);
  const matrixRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMatrix();
  }, [programId]);

  const loadMatrix = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await riskOpportunityApi.getRiskMatrix(programId);
      setMatrixData(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load risk matrix');
    } finally {
      setLoading(false);
    }
  };

  const severityLevels = ['Critical', 'High', 'Medium', 'Low'];
  const probabilityRanges = ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'];

  // Standard risk matrix color coding based on severity and probability intersection
  // All cells in the same section have the same color regardless of count
  const getCellColor = (severity: string, probabilityRange: string, count: number, isSelected: boolean) => {
    // Severity levels: Critical=0, High=1, Medium=2, Low=3 (lower index = higher severity)
    // We need to invert this so higher severity = higher value
    const severityIndex = severityLevels.indexOf(severity);
    const severityValue = 3 - severityIndex; // Critical=3, High=2, Medium=1, Low=0
    
    // Probability ranges: 0-20%=0, 21-40%=1, 41-60%=2, 61-80%=3, 81-100%=4 (higher index = higher probability)
    const probabilityIndex = probabilityRanges.indexOf(probabilityRange);
    
    // Risk level: Critical (3) + High probability (4) = 7 (worst)
    //             Low (0) + Low probability (0) = 0 (best)
    // Scale from 0 (Low/Low) to 7 (Critical/High)
    const riskLevel = severityValue + probabilityIndex;
    
    // Color gradient: Green (low risk) → Yellow → Orange → Red (high risk)
    // All cells use the same color based on their position, not count
    let bgColor = '';
    let textColor = 'text-gray-900';
    
    if (riskLevel <= 1) {
      // Low risk: Green (Low/Low or Low/Medium-Low)
      bgColor = 'bg-green-300';
    } else if (riskLevel <= 3) {
      // Medium-Low risk: Light Yellow
      bgColor = 'bg-yellow-300';
    } else if (riskLevel <= 5) {
      // Medium-High risk: Orange
      bgColor = 'bg-orange-400';
    } else {
      // High risk: Red (Critical/High or High/High probability)
      bgColor = 'bg-red-500';
      textColor = 'text-white';
    }
    
    if (isSelected) {
      return `${bgColor} border-2 border-blue-600 ring-2 ring-blue-300 ${textColor}`;
    }
    
    return `${bgColor} hover:ring-2 hover:ring-blue-200 cursor-pointer transition-all ${textColor}`;
  };

  const isCellSelected = (severity: string, probabilityRange: string): boolean => {
    return selectedCells.some(
      (cell) => cell.severity === severity && cell.probabilityRange === probabilityRange
    );
  };

  const handleCellClick = (severity: string, probabilityRange: string) => {
    setSelectedCells((prev) => {
      const isSelected = prev.some(
        (cell) => cell.severity === severity && cell.probabilityRange === probabilityRange
      );
      
      if (isSelected) {
        // Deselect
        return prev.filter(
          (cell) => !(cell.severity === severity && cell.probabilityRange === probabilityRange)
        );
      } else {
        // Select (add to array for multi-select)
        return [...prev, { severity, probabilityRange }];
      }
    });
  };

  const clearFilters = () => {
    setSelectedCells([]);
  };

  const handleExportPNG = async () => {
    if (!matrixData) return;
    
    setExporting(true);
    try {
      // Create a fixed-size export container with 1:1.75 aspect ratio (height:width)
      // Use 1200px height = 2100px width (1200 * 1.75 = 2100)
      const exportHeight = 1200;
      const exportWidth = exportHeight * 1.75; // 2100px
      
      // Create temporary export container
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'fixed';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';
      exportContainer.style.width = `${exportWidth}px`;
      exportContainer.style.height = `${exportHeight}px`;
      exportContainer.style.backgroundColor = 'white';
      exportContainer.style.padding = '40px';
      exportContainer.style.boxSizing = 'border-box';
      document.body.appendChild(exportContainer);

      // Create the matrix content for export
      const matrixTable = document.createElement('table');
      matrixTable.style.width = '100%';
      matrixTable.style.borderCollapse = 'collapse';
      matrixTable.style.fontSize = '28px'; // Larger font for high-res export
      
      // Create header row
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      // First header cell
      const firstHeader = document.createElement('th');
      firstHeader.style.border = '2px solid #6b7280';
      firstHeader.style.padding = '16px';
      firstHeader.style.fontSize = '28px';
      firstHeader.style.fontWeight = '600';
      firstHeader.style.color = '#374151';
      firstHeader.style.backgroundColor = '#f9fafb';
      firstHeader.textContent = 'Severity \\ Probability';
      headerRow.appendChild(firstHeader);
      
      // Probability range headers
      probabilityRanges.forEach((range) => {
        const th = document.createElement('th');
        th.style.border = '2px solid #6b7280';
        th.style.padding = '16px';
        th.style.fontSize = '28px';
        th.style.fontWeight = '600';
        th.style.color = '#374151';
        th.style.backgroundColor = '#f9fafb';
        th.style.minWidth = '200px';
        th.textContent = range;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      matrixTable.appendChild(thead);
      
      // Create body rows
      const tbody = document.createElement('tbody');
      severityLevels.forEach((severity) => {
        const row = document.createElement('tr');
        
        // Severity label cell
        const severityCell = document.createElement('td');
        severityCell.style.border = '2px solid #6b7280';
        severityCell.style.padding = '16px';
        severityCell.style.fontSize = '28px';
        severityCell.style.fontWeight = '600';
        severityCell.style.color = '#374151';
        severityCell.style.backgroundColor = '#f9fafb';
        severityCell.textContent = severity;
        row.appendChild(severityCell);
        
        // Probability range cells
        probabilityRanges.forEach((range) => {
          const cell = document.createElement('td');
          const count = matrixData.matrix?.[severity]?.[range] || 0;
          
          // Calculate cell color (same logic as display)
          const severityIndex = severityLevels.indexOf(severity);
          const severityValue = 3 - severityIndex;
          const probabilityIndex = probabilityRanges.indexOf(range);
          const riskLevel = severityValue + probabilityIndex;
          
          let bgColor = '#86efac'; // green-300
          let textColor = '#1f2937'; // gray-900
          
          if (riskLevel <= 1) {
            bgColor = '#86efac'; // green-300
          } else if (riskLevel <= 3) {
            bgColor = '#fde047'; // yellow-300
          } else if (riskLevel <= 5) {
            bgColor = '#fb923c'; // orange-400
          } else {
            bgColor = '#ef4444'; // red-500
            textColor = '#ffffff'; // white
          }
          
          cell.style.border = '2px solid #6b7280';
          cell.style.padding = '32px';
          cell.style.textAlign = 'center';
          cell.style.backgroundColor = bgColor;
          cell.style.color = textColor;
          cell.style.fontSize = count > 0 ? '48px' : '36px';
          cell.style.fontWeight = count > 0 ? 'bold' : 'normal';
          cell.style.minWidth = '200px';
          cell.textContent = count > 0 ? count.toString() : '—';
          
          row.appendChild(cell);
        });
        
        tbody.appendChild(row);
      });
      matrixTable.appendChild(tbody);
      
      exportContainer.appendChild(matrixTable);
      
      // Wait for layout to settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Capture the export container
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(exportContainer, {
        useCORS: true,
        background: '#ffffff',
      });
      
      // Clean up
      document.body.removeChild(exportContainer);
      
      // Download
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `risk-matrix-${timestamp}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error exporting matrix:', err);
      alert('Failed to export matrix as PNG. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Filter risks based on selected cells
  const filteredRisks = matrixData?.risks?.filter((risk: any) => {
    if (selectedCells.length === 0) return true;
    
    return selectedCells.some(
      (cell) =>
        risk.severity === cell.severity &&
        risk.probabilityRange === cell.probabilityRange
    );
  }) || [];

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading risk matrix...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!matrixData) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Risk Matrix (5x5)</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={handleExportPNG}
            disabled={exporting || !matrixData}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export matrix as PNG"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export PNG'}
          </button>
          {selectedCells.length > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear Filters ({selectedCells.length})
            </button>
          )}
          <p className="text-sm text-gray-600">
            {selectedCells.length > 0
              ? `Showing ${filteredRisks.length} of ${matrixData.totalRisks || 0} risks`
              : `Total Risks: ${matrixData.totalRisks || 0}`}
          </p>
        </div>
      </div>

      <div ref={matrixRef} className="bg-white border border-gray-200 rounded-lg p-4 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2 text-xs font-medium text-gray-700 bg-gray-50">
                Severity \ Probability
              </th>
              {probabilityRanges.map((range) => (
                <th
                  key={range}
                  className="border border-gray-300 p-2 text-xs font-medium text-gray-700 bg-gray-50 min-w-[100px]"
                >
                  {range}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {severityLevels.map((severity) => (
              <tr key={severity}>
                <td className="border border-gray-300 p-2 text-xs font-medium text-gray-700 bg-gray-50">
                  {severity}
                </td>
                {probabilityRanges.map((range) => {
                  const count = matrixData.matrix?.[severity]?.[range] || 0;
                  const isSelected = isCellSelected(severity, range);
                  return (
                    <td
                      key={`${severity}-${range}`}
                      onClick={() => handleCellClick(severity, range)}
                      className={`border border-gray-300 p-4 text-center min-w-[100px] ${getCellColor(
                        severity,
                        range,
                        count,
                        isSelected
                      )}`}
                      title={`${severity} severity, ${range} probability: ${count} risk(s). Click to filter.`}
                    >
                      {count > 0 ? (
                        <>
                          <div className="font-bold text-lg">{count}</div>
                          <div className="text-xs mt-1 opacity-75">
                            {count} {count === 1 ? 'risk' : 'risks'}
                          </div>
                        </>
                      ) : (
                        <div className="text-lg text-gray-400">—</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Risk List */}
      {selectedCells.length === 0 && matrixData.risks && matrixData.risks.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-2">Risk Details</h4>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {matrixData.risks.map((risk: any) => (
                <div
                  key={risk.id}
                  className="bg-white border border-gray-200 rounded p-2 text-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">{risk.title}</span>
                      <span className="ml-2 text-gray-500">
                        ({risk.severity} / {risk.probabilityRange || `${Number(risk.probability || 0).toFixed(1)}%`})
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600">
                        {formatCurrency(risk.expectedValue)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Number(risk.probability || 0).toFixed(1)}% probability
                      </div>
                      {risk.riskScore && (
                        <div className="text-xs text-gray-500">
                          Score: {formatCurrency(risk.riskScore)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filtered Risk List */}
      {selectedCells.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-2">
            Risk Details (Filtered)
          </h4>
          {filteredRisks.length > 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {filteredRisks.map((risk: any) => (
                <div
                  key={risk.id}
                  className="bg-white border border-gray-200 rounded p-2 text-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">{risk.title}</span>
                      <span className="ml-2 text-gray-500">
                        ({risk.severity} / {risk.probabilityRange || `${Number(risk.probability || 0).toFixed(1)}%`})
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600">
                        {formatCurrency(risk.expectedValue)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Number(risk.probability || 0).toFixed(1)}% probability
                      </div>
                      {risk.riskScore && (
                        <div className="text-xs text-gray-500">
                          Score: {formatCurrency(risk.riskScore)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500">
              No risks match the selected filters. Click on different matrix cells to filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RiskMatrix;

