import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Crown, History, CreditCard, Sparkles, Layers } from 'lucide-react';
import { SubscriptionsView } from '../../components/billing/SubscriptionsView';
import { PaymentHistoryView } from '../../components/billing/PaymentHistoryView';
import { PaymentMethodsView } from '../../components/billing/PaymentMethodsView';

type BillingTab = 'subscriptions' | 'history' | 'methods';

export const BillingLayoutPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = (searchParams.get('tab') as BillingTab) || 'subscriptions';

  const setTab = (tab: BillingTab) => {
    setSearchParams({ tab });
  };

  return (
    <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '0.25rem 0 2rem' }}>
      {/* Top Clean Billing Tab Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setTab('subscriptions')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'subscriptions' ? 'var(--bg-surface-hover)' : 'transparent',
              color: activeTab === 'subscriptions' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'subscriptions' ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <Crown size={16} color={activeTab === 'subscriptions' ? 'var(--brand-primary)' : 'currentColor'} />
            <span>Subscriptions</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('history')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'history' ? 'var(--bg-surface-hover)' : 'transparent',
              color: activeTab === 'history' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'history' ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <History size={16} color={activeTab === 'history' ? 'var(--brand-primary)' : 'currentColor'} />
            <span>Payment history</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('methods')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'methods' ? 'var(--bg-surface-hover)' : 'transparent',
              color: activeTab === 'methods' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'methods' ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <CreditCard size={16} color={activeTab === 'methods' ? 'var(--brand-primary)' : 'currentColor'} />
            <span>Payment methods</span>
          </button>
        </div>

        {/* Dedicated Plans Page Button */}
        <button
          type="button"
          onClick={() => navigate('/plans')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.45rem 1rem',
            borderRadius: '8px',
            background: 'rgba(92, 60, 246, 0.1)',
            color: 'var(--brand-primary)',
            border: '1px solid rgba(92, 60, 246, 0.25)',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Layers size={14} />
          <span>View All Proxy Plans</span>
        </button>
      </div>

      {/* Main Billing Active View */}
      <div>
        {activeTab === 'subscriptions' && <SubscriptionsView />}
        {activeTab === 'history' && <PaymentHistoryView />}
        {activeTab === 'methods' && <PaymentMethodsView />}
      </div>
    </div>
  );
};

export default BillingLayoutPage;
