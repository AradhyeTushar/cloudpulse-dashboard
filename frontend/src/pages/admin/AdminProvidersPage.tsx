import React, { useState } from 'react';
import { Server, Activity, CheckCircle, Zap, Shield, Plus } from 'lucide-react';
import { proxyService } from '../../services/proxyService';
import { AdminProvider } from '../../types';
import { Button } from '../../components/ui/Button';

export const AdminProvidersPage: React.FC = () => {
  const [providers] = useState<AdminProvider[]>(() => proxyService.getAdminProviders());

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
            Upstream Proxy Suppliers & Infrastructure
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Monitor upstream transit providers, residential peer grids, and 3proxy routing cluster health.
          </p>
        </div>
      </div>

      {/* Provider Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {providers.map((prov) => (
          <div key={prov.id} className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>{prov.name}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prov.type}</span>
              </div>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  textTransform: 'uppercase',
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />
                {prov.status}
              </span>
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Coverage: <strong>{prov.region}</strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', borderTop: '1px solid var(--bg-border)', paddingTop: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Active Nodes</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {prov.activeNodes.toLocaleString()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Transit Ping</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>
                  {prov.latencyMs} ms
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Uptime</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>
                  {prov.uptimePct}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
