import React from 'react';
import { useBOEStore } from '../../../store/boeStore';

interface BOEDetailsProps {
  programId: string;
}

const BOEDetails: React.FC<BOEDetailsProps> = ({ programId }) => {
  const { currentBOE, elements } = useBOEStore();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!currentBOE) {
    return (
      <div className="boe-details">
        <div className="alert alert-info">
          <h4>No BOE Found</h4>
          <p>This program doesn't have a Basis of Estimate yet.</p>
          <button className="btn btn-primary">Create BOE</button>
        </div>
      </div>
    );
  }

  return (
    <div className="boe-details">
      <div className="row mb-3">
        <div className="col">
          <h5>BOE Elements</h5>
          <p className="text-muted">Detailed breakdown of project costs and estimates</p>
        </div>
        <div className="col-auto">
          <button className="btn btn-primary">Add Element</button>
        </div>
      </div>

      {elements.length === 0 ? (
        <div className="alert alert-info">
          <h5>No Elements</h5>
          <p>This BOE doesn't have any elements yet. Add elements to start building your estimate.</p>
          <button className="btn btn-primary">Add First Element</button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Level</th>
                <th>Estimated Cost</th>
                <th>Actual Cost</th>
                <th>Variance</th>
                <th>Required</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {elements.map((element) => (
                <tr key={element.id}>
                  <td>{element.code}</td>
                  <td>{element.name}</td>
                  <td>{element.level}</td>
                  <td>{formatCurrency(element.estimatedCost)}</td>
                  <td>{formatCurrency(element.actualCost)}</td>
                  <td className={element.variance < 0 ? 'text-danger' : 'text-success'}>
                    {formatCurrency(element.variance)}
                  </td>
                  <td>
                    <span className={`badge bg-${element.isRequired ? 'danger' : 'secondary'}`}>
                      {element.isRequired ? 'Required' : 'Optional'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1">Edit</button>
                    <button className="btn btn-sm btn-outline-danger">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h6>Cost Summary</h6>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>Total Estimated Cost:</span>
                <strong>{formatCurrency(currentBOE.totalEstimatedCost)}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Management Reserve:</span>
                <strong>{formatCurrency(currentBOE.managementReserveAmount)}</strong>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <span>Total with MR:</span>
                <strong>{formatCurrency(currentBOE.totalEstimatedCost + currentBOE.managementReserveAmount)}</strong>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h6>Management Reserve Details</h6>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>MR Percentage:</span>
                <strong>{currentBOE.managementReservePercentage}%</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>MR Amount:</span>
                <strong>{formatCurrency(currentBOE.managementReserveAmount)}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Calculation Method:</span>
                <strong>Standard</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOEDetails; 