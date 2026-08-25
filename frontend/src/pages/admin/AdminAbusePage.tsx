import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Ban, Filter, Search } from 'lucide-react';
import { proxyService } from '../../services/proxyService';
import { AdminAbuseEvent } from '../../types';

export const AdminAbusePage: React.FC = () => {
  const [events] = useState<AdminAbuseEvent[]>(() => proxyService.getAdminAbuseEvents());

  return (
    <div className="content-container">
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', textTransform: 'uppercase' }}>
            Admin Portal
          </span>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Abuse Detection & Fraud Shield
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
          Real-time rate-limiter violations, credential stuffing attempts, and anomalous target domain blacklists.
        </p>
      </div>

      {/* Events Table Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--bg-border)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Triggered Security Violations</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.85rem 1.5rem' }}>Time</th>
                <th style={{ padding: '0.85rem 1rem' }}>Client IP & User</th>
                <th style={{ padding: '0.85rem 1rem' }}>Target Domain</th>
                <th style={{ padding: '0.85rem 1rem' }}>Reason</th>
                <th style={{ padding: '0.85rem 1rem' }}>Severity</th>
                <th style={{ padding: '0.85rem 1.5rem', textAlign: 'right' }}>Action Taken</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {ev.timestamp}
                  </td>
                  <td style={{ padding: '1rem 1rem' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>{ev.ip}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ev.userEmail}</div>
                  </td>
                  <td style={{ padding: '1rem 1rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {ev.targetDomain}
                  </td>
                  <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem', maxWidth: '300px' }}>
                    {ev.reason}
                  </td>
                  <td style={{ padding: '1rem 1rem' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        background: ev.severity === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: ev.severity === 'high' ? '#ef4444' : '#f59e0b',
                        textTransform: 'uppercase',
                      }}
                    >
                      {ev.severity}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 700, color: ev.actionTaken === 'Blocked' ? '#ef4444' : '#f59e0b' }}>
                    {ev.actionTaken}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
