import React from 'react';

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SchedulerPanel({ status }) {
  if (!status) return null;

  return (
    <div className="panel">
      <div className="panel-title">Scheduler</div>
      <div className="scheduler-row">
        <span className="scheduler-key">Status</span>
        <span className="scheduler-value">
          <span className={`status-dot ${status.isRefreshing ? 'active' : ''}`} />
          {status.isRefreshing ? 'Refreshing…' : 'Idle'}
        </span>
      </div>
      <div className="scheduler-row">
        <span className="scheduler-key">Schedule</span>
        <span className="scheduler-value">{status.schedule || 'Daily at 7:00 AM'}</span>
      </div>
      <div className="scheduler-row">
        <span className="scheduler-key">Next run</span>
        <span className="scheduler-value">{formatDate(status.nextRunTime)}</span>
      </div>
      <div className="scheduler-row">
        <span className="scheduler-key">Last run</span>
        <span className="scheduler-value">{formatDate(status.lastRefreshed)}</span>
      </div>
    </div>
  );
}
