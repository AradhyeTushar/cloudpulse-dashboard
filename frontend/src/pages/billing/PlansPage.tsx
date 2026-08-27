import React, { useState, useEffect } from 'react';
import {
  Zap,
  Check,
  Shield,
  Clock,
  ArrowRight,
  Sparkles,
  HelpCircle,
  TrendingUp,
  Server,
  Globe,
  Radio,
} from 'lucide-react';
import { PROXY_PLANS, ProxyPlanConfig, getPlanConfig } from '../../config/proxyPlans';
import { proxyService } from '../../services/proxyService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';

export const PlansPage: React.FC = () => {
  const { showToast } = useToast();
  const [currentSub, setCurrentSub] = useState(proxyService.getUserSubscription());
  const [billingCycle, setBillingCycle] = useState<'28days' | 'annual'>('28days');

  useEffect(() => {
    const handlePlanUpdate = () => {
      setCurrentSub(proxyService.getUserSubscription());
    };
    window.addEventListener('cloudpulse_plan_updated', handlePlanUpdate);
    window.addEventListener('proxy_plan_updated', handlePlanUpdate);
    return () => {
      window.removeEventListener('cloudpulse_plan_updated', handlePlanUpdate);
      window.removeEventListener('proxy_plan_updated', handlePlanUpdate);
    };
  }, []);

  const handleSelectPlan = (plan: ProxyPlanConfig) => {
    if (plan.id === currentSub.planId) {
      showToast('Current Plan', `You are already on the ${plan.name} plan.`, 'info');
      return;
    }

    try {
      const updated = proxyService.upgradePlan(plan.id);
      setCurrentSub(updated);
      showToast(
        plan.isFree ? 'Switched to Free' : 'Plan Upgraded',
        `Successfully activated ${plan.name} (${plan.trafficLimitDisplay} traffic, ${plan.maxProxies} proxies).`,
        'success'
      );
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to update plan', 'error');
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', marginTop: '0.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(92, 60, 246, 0.1)',
            color: 'var(--brand-primary)',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.8125rem',
            fontWeight: 700,
            marginBottom: '0.85rem',
          }}
        >
          <Sparkles size={14} />
          <span>Centralized Proxy Plans & Quotas</span>
        </div>

        <h1
          style={{
            fontSize: '2.25rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: 0,
            letterSpacing: '-0.03em',
          }}
        >
          Transparent Proxy Plans for Any Scale
        </h1>
        <p
          style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            marginTop: '0.65rem',
            maxWidth: '680px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.5,
          }}
        >
          Choose from flexible free and paid residential proxy tiers. All paid plans include 28 days of validity, high-throughput rotation, and strict quota protection.
        </p>
      </div>

      {/* Plans Grid (7 Plans) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          marginBottom: '3rem',
        }}
      >
        {PROXY_PLANS.map((plan) => {
          const isCurrent = plan.id === currentSub.planId;
          const isFeatured = plan.slug === 'pro' || plan.slug === 'pro-plus';

          return (
            <div
              key={plan.id}
              style={{
                background: 'var(--bg-surface)',
                borderRadius: '16px',
                border: isCurrent
                  ? '2px solid var(--brand-primary)'
                  : isFeatured
                  ? '1px solid rgba(92, 60, 246, 0.4)'
                  : '1px solid var(--border-color)',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: isFeatured ? '0 10px 25px -5px rgba(92, 60, 246, 0.1)' : 'var(--shadow-sm)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {/* Badge for Featured or Current */}
              {isCurrent && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '16px',
                    background: 'var(--brand-primary)',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.65rem',
                    borderRadius: '9999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Active Plan
                </div>
              )}

              {!isCurrent && isFeatured && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '16px',
                    background: '#ec4899',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.65rem',
                    borderRadius: '9999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Popular
                </div>
              )}

              <div>
                {/* Plan Name & Scope */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {plan.name}
                  </h3>
                </div>

                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0', minHeight: '36px' }}>
                  {plan.features[0]} • {plan.trafficLimitDisplay}
                </p>

                {/* Price Display */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {plan.priceDisplay}
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {plan.isFree ? '/ 12 hours' : '/ 28 days'}
                  </span>
                </div>

                {/* Key Spec Badges */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      background: 'var(--bg-card)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Zap size={15} color="var(--brand-primary)" />
                    <span><strong>{plan.maxProxies}</strong> {plan.maxProxies === 1 ? 'Proxy Slot' : 'Max Proxies'}</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      background: 'var(--bg-card)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Radio size={15} color="#10b981" />
                    <span><strong>{plan.trafficLimitDisplay}</strong> Traffic Limit</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      background: 'var(--bg-card)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Clock size={15} color="#f59e0b" />
                    <span><strong>{plan.validityDisplay}</strong> Validity</span>
                  </div>
                </div>

                {/* Features List */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
                    Included Features
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <Check size={14} color="#10b981" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <Button
                variant={isCurrent ? 'secondary' : isFeatured ? 'primary' : 'outline'}
                onClick={() => handleSelectPlan(plan)}
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={isCurrent}
              >
                {isCurrent ? 'Current Active Plan' : plan.isFree ? 'Switch to Free' : `Activate ${plan.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Plan Feature Comparison Table */}
      <div className="card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Detailed Plan Matrix Comparison
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Compare proxy counts, bandwidth allocation, reset rules, and validity across all available plans.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Plan</th>
                <th style={{ textAlign: 'center' }}>Max Proxies</th>
                <th style={{ textAlign: 'center' }}>Traffic Limit</th>
                <th style={{ textAlign: 'center' }}>Traffic Scope</th>
                <th style={{ textAlign: 'center' }}>Validity</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {PROXY_PLANS.map((p) => {
                const isCurrent = p.id === currentSub.planId;
                return (
                  <tr key={p.id} style={{ background: isCurrent ? 'rgba(92, 60, 246, 0.04)' : 'transparent' }}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{p.name}</span>
                        {isCurrent && (
                          <span style={{ fontSize: '0.675rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--brand-primary)', color: '#fff' }}>
                            Current
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.maxProxies}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.trafficLimitDisplay}</td>
                    <td style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      {p.trafficScope === 'per_proxy' ? 'Per Proxy' : p.trafficScope === 'daily' ? 'Daily Reset (00:00 UTC)' : 'Total Period'}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.validityDisplay}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>{p.priceDisplay}</td>
                    <td style={{ textAlign: 'center' }}>
                      <Button
                        size="sm"
                        variant={isCurrent ? 'secondary' : 'primary'}
                        disabled={isCurrent}
                        onClick={() => handleSelectPlan(p)}
                      >
                        {isCurrent ? 'Active' : 'Select'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlansPage;
