import React from 'react';
import { useBOEStore } from '../../../store/boeStore';

interface BOEOverviewProps {
  programId: string;
}

const BOEOverview: React.FC<BOEOverviewProps> = ({ programId }) => {
  const {
    currentBOE,
    getTotalEstimatedCost,
    getManagementReserveAmount,
    getTotalWithMR,
    getElementCount,
    getRequiredElementCount,
    getOptionalElementCount,
  } = useBOEStore();

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
      <div className="boe-overview">
        <div className="alert alert-info">
          <h4>No BOE Found</h4>
          <p>This program doesn't have a Basis of Estimate yet.</p>
          <button className="btn btn-primary">Create BOE</button>
        </div>
      </div>
    );
  }

  return (
    <div className="boe-overview">
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>BOE Summary</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <div className="stat-item">
                    <label>Total Estimated Cost:</label>
                    <span className="stat-value">{formatCurrency(getTotalEstimatedCost())}</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="stat-item">
                    <label>Management Reserve:</label>
                    <span className="stat-value">{formatCurrency(getManagementReserveAmount())}</span>
                  </div>
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-6">
                  <div className="stat-item">
                    <label>Total with MR:</label>
                    <span className="stat-value">{formatCurrency(getTotalWithMR())}</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="stat-item">
                    <label>Status:</label>
                    <span className={`badge bg-${currentBOE.status === 'Approved' ? 'success' : currentBOE.status === 'Draft' ? 'secondary' : 'warning'}`}>
                      {currentBOE.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>Element Summary</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-4">
                  <div className="stat-item">
                    <label>Total Elements:</label>
                    <span className="stat-value">{getElementCount()}</span>
                  </div>
                </div>
                <div className="col-4">
                  <div className="stat-item">
                    <label>Required:</label>
                    <span className="stat-value">{getRequiredElementCount()}</span>
                  </div>
                </div>
                <div className="col-4">
                  <div className="stat-item">
                    <label>Optional:</label>
                    <span className="stat-value">{getOptionalElementCount()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-3">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5>BOE Details</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Version:</label>
                    <p className="form-control-static">{currentBOE.versionNumber}</p>
                  </div>
                  <div className="form-group">
                    <label>Name:</label>
                    <p className="form-control-static">{currentBOE.name}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Created:</label>
                    <p className="form-control-static">{new Date(currentBOE.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="form-group">
                    <label>Last Updated:</label>
                    <p className="form-control-static">{new Date(currentBOE.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Description:</label>
                <p className="form-control-static">{currentBOE.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOEOverview; 