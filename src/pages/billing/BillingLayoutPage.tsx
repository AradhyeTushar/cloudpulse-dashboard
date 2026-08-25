import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { SubscriptionsView } from '../../components/billing/SubscriptionsView';
import { PaymentHistoryView } from '../../components/billing/PaymentHistoryView';
import { PaymentMethodsView } from '../../components/billing/PaymentMethodsView';

type BillingTab = 'subscriptions' | 'history' | 'methods';

export const BillingLayoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as BillingTab) || 'subscriptions';

  return (
    <div style={{ width: '100%' }}>
      {activeTab === 'subscriptions' && <SubscriptionsView />}
      {activeTab === 'history' && <PaymentHistoryView />}
      {activeTab === 'methods' && <PaymentMethodsView />}
    </div>
  );
};

export default BillingLayoutPage;
