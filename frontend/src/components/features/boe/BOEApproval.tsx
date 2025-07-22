import React from 'react';
import { useBOEStore } from '../../../store/boeStore';

interface BOEApprovalProps {
  programId: string;
}

const BOEApproval: React.FC<BOEApprovalProps> = ({ programId }) => {
  const { currentBOE } = useBOEStore();

  if (!currentBOE) {
    return (
      <div className="boe-approval">
        <div className="alert alert-info">
          <h4>No BOE Found</h4>
          <p>This program doesn't have a Basis of Estimate yet.</p>
          <button className="btn btn-primary">Create BOE</button>
        </div>
      </div>
    );
  }

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
      default:
        return 'bg-secondary';
    }
  };

  return (
    <div className="boe-approval">
      <div className="row mb-3">
        <div className="col">
          <h5>Approval Workflow</h5>
          <p className="text-muted">Track the approval status and workflow for this BOE</p>
        </div>
        <div className="col-auto">
          {currentBOE.status === 'Draft' && (
            <button className="btn btn-primary">Submit for Approval</button>
          )}
        </div>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h6>Current Status</h6>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <span className="me-3">Status:</span>
                <span className={`badge ${getStatusBadgeClass(currentBOE.status)} fs-6`}>
                  {currentBOE.status}
                </span>
              </div>
              
              {currentBOE.status === 'Approved' && (
                <div className="alert alert-success">
                  <h6>Approved</h6>
                  <p>This BOE has been approved and is ready for use.</p>
                  {currentBOE.approvedBy && (
                    <small>Approved by: {currentBOE.approvedBy} on {currentBOE.approvedAt ? new Date(currentBOE.approvedAt).toLocaleDateString() : 'N/A'}</small>
                  )}
                </div>
              )}

              {currentBOE.status === 'Rejected' && (
                <div className="alert alert-danger">
                  <h6>Rejected</h6>
                  <p>This BOE has been rejected and requires updates.</p>
                  {currentBOE.rejectionReason && (
                    <p><strong>Reason:</strong> {currentBOE.rejectionReason}</p>
                  )}
                  {currentBOE.rejectedBy && (
                    <small>Rejected by: {currentBOE.rejectedBy} on {currentBOE.rejectedAt ? new Date(currentBOE.rejectedAt).toLocaleDateString() : 'N/A'}</small>
                  )}
                </div>
              )}

              {currentBOE.status === 'Under Review' && (
                <div className="alert alert-warning">
                  <h6>Under Review</h6>
                  <p>This BOE is currently under review by approvers.</p>
                </div>
              )}

              {currentBOE.status === 'Draft' && (
                <div className="alert alert-info">
                  <h6>Draft</h6>
                  <p>This BOE is in draft status and ready for submission.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h6>Approval Actions</h6>
            </div>
            <div className="card-body">
              {currentBOE.status === 'Draft' && (
                <div className="d-grid gap-2">
                  <button className="btn btn-primary">Submit for Review</button>
                  <button className="btn btn-outline-secondary">Save as Draft</button>
                </div>
              )}

              {currentBOE.status === 'Under Review' && (
                <div className="d-grid gap-2">
                  <button className="btn btn-success">Approve</button>
                  <button className="btn btn-danger">Reject</button>
                  <button className="btn btn-outline-secondary">Request Changes</button>
                </div>
              )}

              {currentBOE.status === 'Approved' && (
                <div className="d-grid gap-2">
                  <button className="btn btn-outline-primary">Create New Version</button>
                  <button className="btn btn-outline-secondary">Export BOE</button>
                </div>
              )}

              {currentBOE.status === 'Rejected' && (
                <div className="d-grid gap-2">
                  <button className="btn btn-primary">Update BOE</button>
                  <button className="btn btn-outline-secondary">Create New Version</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h6>Approval History</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Action</th>
                      <th>Approver</th>
                      <th>Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{new Date(currentBOE.createdAt).toLocaleDateString()}</td>
                      <td><span className="badge bg-secondary">Created</span></td>
                      <td>{currentBOE.createdBy || 'System'}</td>
                      <td>BOE created</td>
                    </tr>
                    {currentBOE.status === 'Approved' && currentBOE.approvedAt && (
                      <tr>
                        <td>{new Date(currentBOE.approvedAt).toLocaleDateString()}</td>
                        <td><span className="badge bg-success">Approved</span></td>
                        <td>{currentBOE.approvedBy}</td>
                        <td>BOE approved</td>
                      </tr>
                    )}
                    {currentBOE.status === 'Rejected' && currentBOE.rejectedAt && (
                      <tr>
                        <td>{new Date(currentBOE.rejectedAt).toLocaleDateString()}</td>
                        <td><span className="badge bg-danger">Rejected</span></td>
                        <td>{currentBOE.rejectedBy}</td>
                        <td>{currentBOE.rejectionReason}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOEApproval; 