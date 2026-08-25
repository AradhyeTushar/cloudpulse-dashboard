import React, { useState } from 'react';
import { Radio, ShieldAlert, XCircle, Search, RefreshCw } from 'lucide-react';
import { proxyService } from '../../services/proxyService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';

export const AdminSessionsPage: React.FC = () => {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState(() => proxyService.getStickySessions());

  const handleKillAll = () => {
    sessions.forEach((s) => proxyService.terminateSession(s.id));
    setSessions([]);
    showToast('Emergency Killswitch Executed', 'All live client proxy tunnels have been forcefully terminated.', 'error');
  };

  return (
    <div className="content-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', textTransform: 'uppercase' }}>
              Admin Portal
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Global Live Sessions & Traffic Monitor
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Real-time multi-tenant tunnel stream with active stream termination tools.
          </p>
        </div>

        <Button variant="danger" onClick={handleKillAll}>
          <ShieldAlert size={15} style={{ marginRight: '0.4rem' }} />
          Emergency Killswitch (All)
        </Button>
      </div>

      {/* Global Sessions Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Active Global Connections ({sessions.length})</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.85rem 1.5rem' }}>Session ID</th>
                <th style={{ padding: '0.85rem 1rem' }}>Endpoint / Tenant</th>
                <th style={{ padding: '0.85rem 1rem' }}>Exit IP Address</th>
                <th style={{ padding: '0.85rem 1rem' }}>Location</th>
                <th style={{ padding: '0.85rem 1rem' }}>Throughput</th>
                <th style={{ padding: '0.85rem 1.5rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No live sessions active across cluster.
                  </td>
                </tr>
              ) : (
                sessions.map((sess) => (
                  <tr key={sess.id} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                    <td style={{ padding: '1rem 1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--brand-primary)', fontWeight: 700 }}>
                      {sess.id}
                    </td>
                    <td style={{ padding: '1rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {sess.endpointName}
                    </td>
                    <td style={{ padding: '1rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {sess.exitIP}
                    </td>
                    <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary)' }}>
                      {sess.flag} {sess.city}
                    </td>
                    <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary)' }}>
                      ↓ {sess.bytesInMB} MB • ↑ {sess.bytesOutMB} MB
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          proxyService.terminateSession(sess.id);
                          setSessions(proxyService.getStickySessions());
                          showToast('Session Terminated', `Killed session ${sess.id}`, 'info');
                        }}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          border: 'none',
                          padding: '0.35rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Kill
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
