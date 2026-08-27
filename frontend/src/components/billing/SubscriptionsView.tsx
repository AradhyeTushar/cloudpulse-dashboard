import React, { useState, useEffect } from 'react';
import {
  Search,
  ArrowUpDown,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Info,
  AlertCircle,
  Home,
  Zap,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { PlanUpgradeModal } from '../proxy/PlanUpgradeModal';
import { proxyService } from '../../services/proxyService';
import { ProxyPlanConfig, getPlanConfig } from '../../config/proxyPlans';

interface SubscriptionRow {
  id: string;
  name: string;
  badge?: string;
  subtitle: string;
  expirationDate: string;
  autoRenewal: boolean;
  renewalPrice: string;
  actionType: 'setup' | 'renew' | 'upgrade';
  statusText?: string;
  isProxyPlan?: boolean;
}

export const SubscriptionsView: React.FC = () => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [currentSub, setCurrentSub] = useState(proxyService.getUserSubscription());

  const buildSubscriptions = (sub: typeof currentSub): SubscriptionRow[] => {
    const plan = getPlanConfig(sub.planId);
    const expiryFormatted = sub.expiresAt ? sub.expiresAt.split('T')[0] : '2026-09-23';

    return [
      {
        id: 'sub-active-proxy-plan',
        name: `${plan.name} Residential Proxy Plan`,
        badge: plan.isFree ? 'Free Tier' : 'Active Plan',
        subtitle: `${plan.trafficLimitDisplay} traffic • Max ${plan.maxProxies} ${plan.maxProxies === 1 ? 'proxy' : 'proxies'} • ${plan.validityDisplay}`,
        expirationDate: expiryFormatted,
        autoRenewal: sub.autoRenew,
        renewalPrice: plan.priceDisplay,
        actionType: 'upgrade',
        isProxyPlan: true,
      },
      {
        id: 'sub-hosting-trial',
        name: 'Premium Web Hosting',
        badge: 'Free trial',
        subtitle: '—',
        expirationDate: '2027-08-25',
        autoRenewal: true,
        renewalPrice: '₹ 2,628.00',
        actionType: 'setup',
        statusText: 'Pending setup',
      },
      {
        id: 'sub-kvm-2',
        name: 'KVM 2',
        subtitle: 'srv1920898.hstgr.cloud',
        expirationDate: '2026-09-21',
        autoRenewal: false,
        renewalPrice: '₹ 2,099.00',
        actionType: 'renew',
      },
      {
        id: 'sub-reach-100',
        name: 'Reach 100 (Email marketing)',
        badge: 'Free trial',
        subtitle: 'vpsphere.tech',
        expirationDate: '2027-08-21',
        autoRenewal: false,
        renewalPrice: '₹ 1,548.00',
        actionType: 'upgrade',
      },
      {
        id: 'sub-tech-domain',
        name: '.TECH Domain',
        subtitle: 'vpsphere.tech',
        expirationDate: '2027-08-21',
        autoRenewal: false,
        renewalPrice: '₹ 6,199.00',
        actionType: 'renew',
      },
    ];
  };

  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>(() =>
    buildSubscriptions(currentSub)
  );

  useEffect(() => {
    const handlePlanUpdate = () => {
      const updated = proxyService.getUserSubscription();
      setCurrentSub(updated);
      setSubscriptions(buildSubscriptions(updated));
    };

    window.addEventListener('cloudpulse_plan_updated', handlePlanUpdate);
    window.addEventListener('proxy_plan_updated', handlePlanUpdate);
    return () => {
      window.removeEventListener('cloudpulse_plan_updated', handlePlanUpdate);
      window.removeEventListener('proxy_plan_updated', handlePlanUpdate);
    };
  }, []);

  const handleToggleAutoRenew = (subId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id === subId) {
          const next = !s.autoRenewal;
          showToast('Auto-renewal', `Auto-renewal for ${s.name} set to ${next ? 'On' : 'Off'}.`, 'info');
          return { ...s, autoRenewal: next };
        }
        return s;
      })
    );
  };

  const handleAction = (sub: SubscriptionRow) => {
    if (sub.actionType === 'upgrade' || sub.isProxyPlan) {
      setShowUpgradeModal(true);
    } else if (sub.actionType === 'renew') {
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, expirationDate: '2027-09-21' } : s))
      );
      showToast('Subscription Renewed', `${sub.name} renewed successfully. Valid through 2027-09-21.`, 'success');
    } else {
      showToast('Setup Pending', `Opening setup wizard for ${sub.name}...`, 'info');
    }
  };

  const handleSelectUpgradePlan = (plan: ProxyPlanConfig) => {
    const updated = proxyService.upgradePlan(plan.id);
    setCurrentSub(updated);
    setSubscriptions(buildSubscriptions(updated));
    setShowUpgradeModal(false);
    showToast('Plan Upgraded', `Successfully upgraded to ${plan.name} (${plan.trafficLimitDisplay})`, 'success');
  };

  const filteredSubs = subscriptions.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ width: '100%' }}>
      {/* Breadcrumb matching Screenshot 1 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: '#6b7280', marginBottom: '1rem' }}>
        <Home size={14} color="#6b7280" />
        <span>›</span>
        <span>Billing</span>
        <span>›</span>
        <span style={{ color: '#111827', fontWeight: 600 }}>Subscriptions</span>
      </div>

      {/* Title */}
      <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#111827', margin: '0 0 1.5rem 0' }}>
        Subscriptions
      </h1>

      {/* White Card Container */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          overflow: 'hidden',
        }}
      >
        {/* Full-width Search Field */}
        <div style={{ padding: '1.25rem 1.5rem 1rem' }}>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '0.875rem',
              color: '#111827',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Table Structure */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6', color: '#4b5563', fontSize: '0.8125rem' }}>
                <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>Subscription</span>
                    <ArrowUpDown size={12} color="#9ca3af" />
                  </div>
                </th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>Expiration date</span>
                    <ArrowUpDown size={12} color="#9ca3af" />
                  </div>
                </th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>Auto-renewal</span>
                    <ArrowUpDown size={12} color="#9ca3af" />
                  </div>
                </th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>Renewal price</span>
                    <Info size={12} color="#9ca3af" />
                    <ArrowUpDown size={12} color="#9ca3af" />
                  </div>
                </th>
                <th style={{ padding: '0.85rem 1.5rem', textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredSubs.map((sub) => (
                <tr
                  key={sub.id}
                  style={{
                    borderBottom: '1px solid #f3f4f6',
                    transition: 'background 0.15s ease',
                    background: sub.isProxyPlan ? 'rgba(92, 60, 246, 0.02)' : 'transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = sub.isProxyPlan ? 'rgba(92, 60, 246, 0.02)' : 'transparent')
                  }
                >
                  {/* Subscription Name & Subtitle & Badge */}
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, color: '#111827' }}>{sub.name}</span>
                      {sub.badge && (
                        <span
                          style={{
                            fontSize: '0.675rem',
                            fontWeight: 700,
                            padding: '0.12rem 0.45rem',
                            borderRadius: '4px',
                            background: sub.isProxyPlan ? '#ede9fe' : '#e0e7ff',
                            color: sub.isProxyPlan ? '#6b21a8' : '#4338ca',
                          }}
                        >
                          {sub.badge}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.2rem' }}>
                      {sub.subtitle}
                    </div>
                  </td>

                  {/* Expiration Date */}
                  <td style={{ padding: '1rem 1rem', color: '#111827', fontSize: '0.8125rem' }}>
                    {sub.expirationDate}
                  </td>

                  {/* Auto-Renewal Toggle */}
                  <td style={{ padding: '1rem 1rem' }}>
                    <div
                      onClick={(e) => handleToggleAutoRenew(sub.id, e)}
                      style={{
                        width: '36px',
                        height: '20px',
                        borderRadius: '10px',
                        background: sub.autoRenewal ? '#5b21b6' : '#9ca3af',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          position: 'absolute',
                          top: '2px',
                          left: sub.autoRenewal ? '18px' : '2px',
                          transition: 'left 0.2s ease',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                        }}
                      />
                    </div>
                  </td>

                  {/* Renewal Price */}
                  <td style={{ padding: '1rem 1rem', fontWeight: 600, color: '#111827' }}>
                    {sub.renewalPrice}
                  </td>

                  {/* Actions Column */}
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.85rem' }}>
                      {sub.statusText && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#d97706', fontSize: '0.8125rem', fontWeight: 600 }}>
                          <AlertCircle size={15} color="#d97706" />
                          <span>{sub.statusText}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleAction(sub)}
                        style={{
                          background:
                            sub.actionType === 'setup'
                              ? '#f59e0b'
                              : sub.actionType === 'upgrade'
                              ? '#5b21b6'
                              : '#5b21b6',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.45rem 1.1rem',
                          borderRadius: '9999px',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        }}
                      >
                        {sub.actionType === 'setup' ? 'Set up' : sub.actionType === 'upgrade' ? 'Upgrade' : 'Renew'}
                      </button>

                      <ChevronRight size={18} color="#6b7280" style={{ cursor: 'pointer' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid #f3f4f6',
            fontSize: '0.8125rem',
            color: '#6b7280',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Page size:</span>
            <select
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '0.2rem 0.6rem',
                fontSize: '0.8125rem',
                color: '#111827',
                background: '#ffffff',
              }}
            >
              <option value="10">10</option>
              <option value="25">25</option>
            </select>
            <span style={{ marginLeft: '0.5rem' }}>1 to {filteredSubs.length} of {filteredSubs.length}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'not-allowed' }} disabled>
              <ChevronsLeft size={14} />
            </button>
            <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'not-allowed' }} disabled>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontWeight: 600, color: '#111827' }}>Page 1 of 1</span>
            <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'not-allowed' }} disabled>
              <ChevronRight size={14} />
            </button>
            <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'not-allowed' }} disabled>
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Plan Upgrade / Selection Modal */}
      {showUpgradeModal && (
        <PlanUpgradeModal
          currentPlanId={currentSub.planId}
          onClose={() => setShowUpgradeModal(false)}
          onSelectPlan={handleSelectUpgradePlan}
        />
      )}
    </div>
  );
};
