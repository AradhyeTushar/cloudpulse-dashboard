import React from 'react';
import { Layers, Activity, Calendar, ShieldCheck, Zap, ArrowUpRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { ProxyUsageDashboardSummary } from '../../types';
import { Button } from '../ui/Button';

interface ProxyUsageDashboardProps {
  summary: ProxyUsageDashboardSummary;
  onOpenUpgradeModal: () => void;
  onRenewPlan: () => void;
}

export const ProxyUsageDashboard: React.FC<ProxyUsageDashboardProps> = ({
  summary,
  onOpenUpgradeModal,
  onRenewPlan,
}) => {
  const { plan, proxyUsage, trafficUsage } = summary;

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* 3 Top Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* 1. Plan Overview Card */}
        <div
          className="card"
          style={{
            padding: '1.35rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    background: 'rgba(92, 60, 246, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-primary)',
                  }}
                >
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Current Subscription
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {plan.name} Plan
                  </h3>
                </div>
              </div>

              <span
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  background: plan.isFree ? 'rgba(16, 185, 129, 0.12)' : 'rgba(92, 60, 246, 0.12)',
                  color: plan.isFree ? '#10b981' : 'var(--brand-primary)',
                  textTransform: 'uppercase',
                }}
              >
                {plan.isFree ? 'Free Tier' : 'Active Paid'}
              </span>
            </div>

            {/* Plan Metrics List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Plan Price:</span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                  {plan.priceDisplay}
                  {!plan.isFree && <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}> / 28 days</span>}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Renewal / Expiry:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{plan.renewalDisplay}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Validity Period:</span>
                <span style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{plan.validityDisplay}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button
              variant="primary"
              onClick={onOpenUpgradeModal}
              style={{ flex: 1, fontSize: '0.8rem', padding: '0.45rem 0.75rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
            >
              <Zap size={14} />
              <span>{plan.isFree ? 'Upgrade to Paid Plan' : 'Change Plan'}</span>
            </Button>

            {!plan.isFree && (
              <Button
                variant="secondary"
                onClick={onRenewPlan}
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                title="Extend plan validity by 28 days"
              >
                <RefreshCw size={13} />
                <span>Renew (+28d)</span>
              </Button>
            )}
          </div>
        </div>

        {/* 2. Proxy Usage Card */}
        <div
          className="card"
          style={{
            padding: '1.35rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3b82f6',
                  }}
                >
                  <Layers size={18} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Proxy Allocation
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {proxyUsage.used} / {proxyUsage.max} proxies used
                  </h3>
                </div>
              </div>

              <span
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  background: proxyUsage.available > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: proxyUsage.available > 0 ? '#10b981' : '#ef4444',
                }}
              >
                {proxyUsage.available} Available Slots
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{ margin: '1rem 0 0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                <span>Slot Capacity:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{proxyUsage.usagePercent}% Consumed</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${proxyUsage.usagePercent}%`,
                    height: '100%',
                    background: proxyUsage.usagePercent >= 100 ? '#ef4444' : 'var(--brand-primary)',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* Sub-counts Breakdown */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                padding: '0.75rem',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                marginTop: '0.75rem',
                textAlign: 'center',
              }}
            >
              <div>
                <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>
                  {proxyUsage.activeCount}
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Active
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: 800, color: '#94a3b8' }}>
                  {proxyUsage.disabledCount}
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Disabled
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: 800, color: '#ef4444' }}>
                  {proxyUsage.expiredCount}
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Expired
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Traffic Usage Card */}
        <div
          className="card"
          style={{
            padding: '1.35rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f59e0b',
                  }}
                >
                  <Activity size={18} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Bandwidth Telemetry
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {trafficUsage.usedDisplay} used
                  </h3>
                </div>
              </div>

              <span
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#f59e0b',
                }}
              >
                {trafficUsage.limitDisplay} Limit
              </span>
            </div>

            {/* Traffic Progress Bar */}
            <div style={{ margin: '1rem 0 0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                <span>Remaining: <strong style={{ color: '#10b981' }}>{trafficUsage.remainingDisplay}</strong></span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{trafficUsage.usagePercent}% Used</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${trafficUsage.usagePercent}%`,
                    height: '100%',
                    background: trafficUsage.usagePercent >= 100 ? '#ef4444' : trafficUsage.usagePercent > 80 ? '#f59e0b' : 'var(--brand-primary)',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* Telemetry Details */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
                padding: '0.75rem',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                marginTop: '0.75rem',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Reset Schedule:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{trafficUsage.resetInfo}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Enforcement Policy:</span>
                <span style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>Auto-disable on limit</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
