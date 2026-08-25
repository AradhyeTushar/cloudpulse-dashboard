import React, { useState } from 'react';
import { Radio, RefreshCw, XCircle, ShieldCheck, Activity, Globe, Zap } from 'lucide-react';
import { proxyService } from '../../services/proxyService';
import { ProxyStickySession } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';

export const SessionsPage: React.FC = () => {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<ProxyStickySession[]>(() => proxyService.getStickySessions());
  const [rotatingId, setRotatingId] = useState<string | null>(null);

  const handleRotate = (sessionId: string) => {
    setRotatingId(sessionId);
    setTimeout(() => {
      const updated = proxyService.rotateSessionIP(sessionId);
      setSessions(proxyService.getStickySessions());
      setRotatingId(null);
      showToast('IP Rotated', `Session ${sessionId} assigned new exit IP: ${updated.exitIP}`, 'success');
    }, 600);
  };

  const handleTerminate = (sessionId: string) => {
    proxyService.terminateSession(sessionId);
    setSessions(proxyService.getStickySessions());
    showToast('Session Terminated', `Session ${sessionId} has been disconnected.`, 'info');
  };

  return (
    <div className="content-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Sticky Proxy Sessions
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Monitor persistent proxy tunnels, view assigned exit IPs, and trigger on-demand IP rotation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="secondary"
            onClick={() => {
              setSessions(proxyService.getStickySessions());
              showToast('Refreshed', 'Session telemetry updated.', 'info');
            }}
          >
            <RefreshCw size={14} style={{ marginRight: '0.4rem' }} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Active Sessions Table Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Radio size={16} color="#10b981" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Active Sticky Tunnels ({sessions.length})</h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-syncing every 5s</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.85rem 1.5rem' }}>Session / Endpoint</th>
                <th style={{ padding: '0.85rem 1rem' }}>Exit IP Address</th>
                <th style={{ padding: '0.85rem 1rem' }}>Location</th>
                <th style={{ padding: '0.85rem 1rem' }}>Protocol</th>
                <th style={{ padding: '0.85rem 1rem' }}>Data Transferred</th>
                <th style={{ padding: '0.85rem 1rem' }}>Requests</th>
                <th style={{ padding: '0.85rem 1rem' }}>Started</th>
                <th style={{ padding: '0.85rem 1.5rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No active sticky sessions right now. Initiate a request with your sticky endpoint credentials to create one.
                  </td>
                </tr>
              ) : (
                sessions.map((sess) => (
                  <tr key={sess.id} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{sess.endpointName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{sess.id}</div>
                    </td>
                    <td style={{ padding: '1rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>{sess.exitIP}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>{sess.flag}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{sess.city}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1rem' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(92, 60, 246, 0.1)',
                          color: 'var(--brand-primary)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {sess.protocol}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      ↓ {sess.bytesInMB} MB • ↑ {sess.bytesOutMB} MB
                    </td>
                    <td style={{ padding: '1rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {sess.requestsCount.toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {sess.startedAt}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleRotate(sess.id)}
                          disabled={rotatingId === sess.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: 'var(--brand-primary-light)',
                            color: 'var(--brand-primary)',
                            border: 'none',
                            padding: '0.35rem 0.65rem',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                          }}
                          title="Rotate Exit IP immediately"
                        >
                          <RefreshCw size={12} className={rotatingId === sess.id ? 'spin' : ''} />
                          <span>Rotate IP</span>
                        </button>

                        <button
                          onClick={() => handleTerminate(sess.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: 'none',
                            padding: '0.35rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                          }}
                          title="Disconnect Session"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
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
