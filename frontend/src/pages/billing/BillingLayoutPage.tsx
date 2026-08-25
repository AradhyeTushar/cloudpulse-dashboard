import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layers, CreditCard, Receipt, ShieldCheck } from 'lucide-react';
import { SubscriptionsView } from '../../components/billing/SubscriptionsView';
import { PaymentHistoryView } from '../../components/billing/PaymentHistoryView';
import { PaymentMethodsView } from '../../components/billing/PaymentMethodsView';

type BillingTab = 'subscriptions' | 'methods' | 'history';

export const BillingLayoutPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as BillingTab) || 'subscriptions';

  const setTab = (tab: BillingTab) => {
    setSearchParams({ tab });
  };

  return (
    <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Top Billing Navigation Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Billing & Payment Center
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.35rem', marginBottom: 0 }}>
            Manage active proxy subscriptions, PayPal/Razorpay gateways, auto-renewals, and invoices.
          </p>
        </div>

        {/* Unified Tab Pill Switcher */}
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--bg-card)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => setTab('subscriptions')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'subscriptions' ? 'var(--brand-primary)' : 'transparent',
              color: activeTab === 'subscriptions' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Layers size={15} />
            <span>Subscriptions</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('methods')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'methods' ? 'var(--brand-primary)' : 'transparent',
              color: activeTab === 'methods' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <CreditCard size={15} />
            <span>Payment Methods</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('history')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'history' ? 'var(--brand-primary)' : 'transparent',
              color: activeTab === 'history' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Receipt size={15} />
            <span>Invoices & History</span>
          </button>
        </div>
      </div>

      {/* Render Active View */}
      {activeTab === 'subscriptions' && <SubscriptionsView />}
      {activeTab === 'methods' && <PaymentMethodsView />}
      {activeTab === 'history' && <PaymentHistoryView />}
    </div>
  );
};

export default BillingLayoutPage;
