import React from 'react';

// Custom legend for bars and lines
export const CustomLegend = () => (
  <div style={{ marginTop: 12, marginBottom: 8 }}>
    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', gap: 16, marginBottom: 6 }}>
      <span style={{ fontWeight: 600, color: '#6B7280', marginRight: 8 }}>Bars:</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 18, height: 8, background: '#9CA3AF', display: 'inline-block', borderRadius: 2 }}></span>Baseline</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 18, height: 8, background: '#FCD34D', display: 'inline-block', borderRadius: 2 }}></span>Planned</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 18, height: 8, background: '#93C5FD', display: 'inline-block', borderRadius: 2 }}></span>Actual</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', gap: 16 }}>
      <span style={{ fontWeight: 600, color: '#6B7280', marginRight: 8 }}>Lines:</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 18, height: 0, borderTop: '3.75px solid #4B5563', display: 'inline-block' }}></span>Cumulative Baseline</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 18, height: 0, borderTop: '3px dashed #D97706', display: 'inline-block' }}></span>Cumulative Planned</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 18, height: 0, borderTop: '3.75px solid #2563EB', display: 'inline-block' }}></span>Cumulative Actual</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 18, height: 0, borderTop: '2.5px dashed #16A34A', display: 'inline-block' }}></span>Cumulative Projected</span>
    </div>
  </div>
); 