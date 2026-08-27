import React from 'react';
import { Check, Zap, Shield, Globe, Clock, ChevronRight, X } from 'lucide-react';
import { PROXY_PLANS, ProxyPlanConfig } from '../../config/proxyPlans';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface PlanUpgradeModalProps {
  currentPlanId: string;
  onClose: () => void;
  onSelectPlan: (plan: ProxyPlanConfig) => void;
}

export const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
  currentPlanId,
  onClose,
  onSelectPlan,
}) => {
  return (
    <Modal title="Choose Your Proxy Plan" onClose={onClose} size="lg">
      <div style={{ padding: '0.5rem 0' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Select a proxy plan tailored for your scraping, automation, or browsing workloads. Upgrades apply immediately and paid plans include 28 days of validity.
        </p>

        {/* Plans Table / Grid */}
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table" style={{ width: '100%', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Plan</th>
                <th style={{ padding: '0.85rem 1rem' }}>Proxies</th>
                <th style={{ padding: '0.85rem 1rem' }}>Traffic Limit</th>
                <th style={{ padding: '0.85rem 1rem' }}>Validity</th>
                <th style={{ padding: '0.85rem 1rem' }}>Price</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {PROXY_PLANS.map((plan) => {
                const isCurrent = plan.id === currentPlanId;
                return (
                  <tr
                    key={plan.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      background: isCurrent ? 'rgba(92, 60, 246, 0.04)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          {plan.name}
                        </strong>
                        {isCurrent && (
                          <span
                            style={{
                              fontSize: '0.675rem',
                              fontWeight: 700,
                              background: 'var(--brand-primary)',
                              color: '#fff',
                              padding: '0.1rem 0.45rem',
                              borderRadius: 'var(--radius-full)',
                              textTransform: 'uppercase',
                            }}
                          >
                            Current
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {plan.features[0]}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {plan.maxProxies === 50 && plan.isFree ? 'Up to 50' : `${plan.maxProxies} ${plan.maxProxies === 1 ? 'proxy' : 'proxies'}`}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {plan.trafficLimitDisplay}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                      {plan.validityDisplay}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        {plan.priceDisplay}
                      </span>
                      {!plan.isFree && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> / 28d</span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      {isCurrent ? (
                        <Button variant="secondary" disabled style={{ fontSize: '0.775rem', padding: '0.35rem 0.75rem' }}>
                          Active Plan
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          onClick={() => onSelectPlan(plan)}
                          style={{
                            fontSize: '0.775rem',
                            padding: '0.35rem 0.85rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <Zap size={13} />
                          <span>{plan.isFree ? 'Select Free' : 'Upgrade'}</span>
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};
