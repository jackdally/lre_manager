import React from 'react';
import { useBOEStore } from '../../../store/boeStore';

interface BOEHistoryProps {
  programId: string;
}

const BOEHistory: React.FC<BOEHistoryProps> = ({ programId }) => {
  const { currentBOE, boeVersions } = useBOEStore();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-success';
      case 'Rejected':
        return 'bg-danger';
      case 'Under Review':
        return 'bg-warning';
      case 'Draft':
        return 'bg-secondary';
      case 'Archived':
        return 'bg-dark';
      default:
        return 'bg-secondary';
    }
  };

  if (!currentBOE) {
    return (
      <div className="boe-history">
        <div className="alert alert-info">
          <h4>No BOE Found</h4>
          <p>This program doesn't have a Basis of Estimate yet.</p>
          <button className="btn btn-primary">Create BOE</button>
        </div>
      </div>
    );
  }

  // Mock version history - in real implementation this would come from the store
  const mockVersions = [
    {
      id: currentBOE.id,
      versionNumber: currentBOE.versionNumber,
      name: currentBOE.name,
      status: currentBOE.status,
      totalEstimatedCost: currentBOE.totalEstimatedCost,
      managementReserveAmount: currentBOE.managementReserveAmount,
      createdAt: currentBOE.createdAt,
      updatedAt: currentBOE.updatedAt,
      createdBy: currentBOE.createdBy,
      isCurrent: true,
    },
    // Mock previous versions
    {
      id: 'prev-1',
      versionNumber: '0.9',
      name: 'Draft BOE v0.9',
      status: 'Archived',
      totalEstimatedCost: 45000,
      managementReserveAmount: 4500,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      createdBy: 'John Doe',
      isCurrent: false,
    },
    {
      id: 'prev-2',
      versionNumber: '0.8',
      name: 'Initial BOE v0.8',
      status: 'Archived',
      totalEstimatedCost: 40000,
      managementReserveAmount: 4000,
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z',
      createdBy: 'Jane Smith',
      isCurrent: false,
    },
  ];

  return (
    <div className="boe-history">
      <div className="row mb-3">
        <div className="col">
          <h5>Version History</h5>
          <p className="text-muted">Track changes and versions of this BOE</p>
        </div>
        <div className="col-auto">
          <button className="btn btn-primary">Create New Version</button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Version</th>
              <th>Name</th>
              <th>Status</th>
              <th>Total Cost</th>
              <th>MR Amount</th>
              <th>Created</th>
              <th>Created By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockVersions.map((version) => (
              <tr key={version.id} className={version.isCurrent ? 'table-primary' : ''}>
                <td>
                  <strong>{version.versionNumber}</strong>
                  {version.isCurrent && <span className="badge bg-primary ms-2">Current</span>}
                </td>
                <td>{version.name}</td>
                <td>
                  <span className={`badge ${getStatusBadgeClass(version.status)}`}>
                    {version.status}
                  </span>
                </td>
                <td>{formatCurrency(version.totalEstimatedCost)}</td>
                <td>{formatCurrency(version.managementReserveAmount)}</td>
                <td>{new Date(version.createdAt).toLocaleDateString()}</td>
                <td>{version.createdBy || 'System'}</td>
                <td>
                  <div className="btn-group btn-group-sm">
                    <button className="btn btn-outline-primary">View</button>
                    {!version.isCurrent && (
                      <>
                        <button className="btn btn-outline-secondary">Compare</button>
                        <button className="btn btn-outline-success">Restore</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h6>Version Comparison</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <label className="form-label">Compare From:</label>
                  <select className="form-select">
                    <option value="">Select version...</option>
                    {mockVersions.map((version) => (
                      <option key={`from-${version.id}`} value={version.id}>
                        {version.versionNumber} - {version.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label">Compare To:</label>
                  <select className="form-select">
                    <option value="">Select version...</option>
                    {mockVersions.map((version) => (
                      <option key={`to-${version.id}`} value={version.id}>
                        {version.versionNumber} - {version.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <button className="btn btn-primary">Compare Versions</button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h6>Change Summary</h6>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>Total Versions:</span>
                <strong>{mockVersions.length}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Latest Version:</span>
                <strong>{currentBOE.versionNumber}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>First Created:</span>
                <strong>{new Date(mockVersions[mockVersions.length - 1].createdAt).toLocaleDateString()}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Last Updated:</span>
                <strong>{new Date(currentBOE.updatedAt).toLocaleDateString()}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOEHistory; 