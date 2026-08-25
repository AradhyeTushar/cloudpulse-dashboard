import React, { useState } from 'react';
import { Layers, Check, Plus, Edit2, Zap } from 'lucide-react';
import { proxyService } from '../../services/proxyService';
import { AdminPlan } from '../../types';
import { Button } from '../../components/ui/Button';

export const AdminPlansPage: React.FC = () => {
  const [plans] = useState<AdminPlan[]>(() => proxyService.getAdminPlans());

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
            Plan & Pricing Tier Manager
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Define bandwidth package prices ($/GB), concurrency thread caps, and pool access permissions.
          </p>
        </div>
      </div>

      {/* Grid of Plans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="card"
            style={{
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: plan.slug === 'enterprise-1tb' ? '2px solid var(--brand-primary)' : '1px solid var(--bg-border)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{plan.name}</h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                  }}
                >
                  Active Tier
                </span>
              </div>

              <div style={{ margin: '1rem 0' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)' }}>${plan.priceMonthly}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}> / month</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--brand-primary)', fontWeight: 700, marginTop: '0.2rem' }}>
                  ${plan.pricePerGB.toFixed(2)} per GB • {plan.bandwidthGB} GB included
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--bg-border)', paddingTop: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                  Technical Caps:
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  • Max Concurrent Threads: <strong>{plan.threadsLimit.toLocaleString()}</strong>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  • Dedicated IP Subnets: <strong>{plan.dedicatedPools ? 'Yes (Isolated)' : 'No (Shared Grid)'}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {plan.features.map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    <Check size={14} color="#10b981" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button variant="secondary" style={{ width: '100%' }}>
              <Edit2 size={14} style={{ marginRight: '0.4rem' }} />
              Edit Pricing & Limits
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
