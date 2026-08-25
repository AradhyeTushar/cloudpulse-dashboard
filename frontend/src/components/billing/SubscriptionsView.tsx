import React, { useState } from 'react';
import {
  Search,
  ArrowUpDown,
  ChevronRight,
  X,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  Zap,
  Globe,
  CreditCard,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface SubscriptionItem {
  id: string;
  name: string;
  badge?: string;
  domainOrHost: string;
  expirationDate: string;
  autoRenewal: boolean;
  renewalPrice: string;
  actionLabel: 'Renew' | 'Upgrade';
  taxesAndFees: string;
  subscriptionId: string;
  billingPeriod: string;
}

export const SubscriptionsView: React.FC = () => {
  const { showToast } = useToast();
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSub, setSelectedSub] = useState<SubscriptionItem | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Checkout modal states
  const [checkoutSub, setCheckoutSub] = useState<SubscriptionItem | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<'razorpay' | 'paypal'>('razorpay');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [isProcessing, setIsProcessing] = useState(false);

  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([
    {
      id: 'sub-1',
      name: 'KVM 2 (India Residential Gateway)',
      domainOrHost: 'srv1920898.hstgr.cloud (200.234.41.58)',
      expirationDate: '2026-09-21',
      autoRenewal: true,
      renewalPrice: '₹ 2,099.00',
      actionLabel: 'Renew',
      taxesAndFees: '₹ 377.82',
      subscriptionId: '16BgFIVSx2oS81xGC',
      billingPeriod: '1 month',
    },
    {
      id: 'sub-2',
      name: 'Pro Residential 500GB Pool',
      badge: 'Active Grid',
      domainOrHost: 'cloudpulse.devtushar.uk',
      expirationDate: '2027-08-21',
      autoRenewal: true,
      renewalPrice: '₹ 1,548.00',
      actionLabel: 'Upgrade',
      taxesAndFees: '₹ 278.64',
      subscriptionId: '29KhALMx9qP20zYT',
      billingPeriod: '12 months',
    },
    {
      id: 'sub-3',
      name: '.TECH Domain (proxy.devtushar.uk)',
      domainOrHost: 'devtushar.uk',
      expirationDate: '2027-08-21',
      autoRenewal: false,
      renewalPrice: '₹ 6,199.00',
      actionLabel: 'Renew',
      taxesAndFees: '₹ 1,115.82',
      subscriptionId: '44WqPLBz5kL78vNB',
      billingPeriod: '12 months',
    },
  ]);

  const handleToggleAutoRenew = (subId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id === subId) {
          const next = !s.autoRenewal;
          showToast('Auto-Renewal', `Auto-renewal for ${s.name} set to ${next ? 'On' : 'Off'}.`, 'info');
          return { ...s, autoRenewal: next };
        }
        return s;
      })
    );
  };

  const handleCopyId = (idText: string) => {
    navigator.clipboard.writeText(idText);
    setCopiedId(true);
    showToast('Copied', 'Subscription ID copied to clipboard.', 'success');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleOpenCheckout = (sub: SubscriptionItem) => {
    setCheckoutSub(sub);
  };

  const handleExecutePayment = async () => {
    if (!checkoutSub) return;
    setIsProcessing(true);

    const authToken = token || localStorage.getItem('cloudpulse_auth_token') || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      if (selectedGateway === 'razorpay') {
        const res = await fetch('/api/v1/billing/razorpay/create-order', {
          method: 'POST',
          headers,
          body: JSON.stringify({ amount: 209900, currency: 'INR', plan_id: checkoutSub.id }),
        });
        const orderData = await res.json();

        // Verify order
        await fetch('/api/v1/billing/razorpay/verify-payment', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            razorpay_order_id: orderData?.data?.order_id || 'order_rzp_mock',
            razorpay_payment_id: `pay_rzp_${Date.now()}`,
            razorpay_signature: 'sig_mock_verified',
            plan_id: checkoutSub.id,
          }),
        });

        showToast('Payment Successful (Razorpay)', `Invoice for ${checkoutSub.name} settled via UPI / NetBanking.`, 'success');
      } else {
        const res = await fetch('/api/v1/billing/paypal/create-order', {
          method: 'POST',
          headers,
          body: JSON.stringify({ amount: 29.00, currency: 'USD', plan_id: checkoutSub.id }),
        });
        const ppData = await res.json();

        await fetch('/api/v1/billing/paypal/capture-order', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            order_id: ppData?.data?.order_id || 'PAYPAL-MOCK-ID',
            plan_id: checkoutSub.id,
          }),
        });

        showToast('Payment Successful (PayPal)', `Invoice for ${checkoutSub.name} captured via PayPal One-Click.`, 'success');
      }

      // Update subscription list immediately with extended renewal date
      setSubscriptions((prev) =>
        prev.map((s) => {
          if (s.id === checkoutSub.id) {
            return {
              ...s,
              expirationDate: '2027-09-25',
              autoRenewal: true,
            };
          }
          return s;
        })
      );

      setCheckoutSub(null);
    } catch {
      showToast('Payment Error', 'Unable to complete checkout transaction.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredSubs = subscriptions.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.domainOrHost.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Page Title */}
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
        Subscriptions & Resource Allocations
      </h1>

      {/* Subscriptions Card Table */}
      <div className="card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
        {/* Search Toolbar */}
        <div style={{ padding: '1.25rem 1.5rem 0.75rem' }}>
          <div className="search-input-wrap" style={{ maxWidth: '100%' }}>
            <Search size={15} />
            <input
              type="text"
              className="search-input"
              placeholder="Search active subscriptions, VPS instances, or proxy pools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table Structure */}
        <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>Subscription</span>
                    <ArrowUpDown size={12} color="var(--text-dim)" />
                  </div>
                </th>
                <th>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>Expiration date</span>
                    <ArrowUpDown size={12} color="var(--text-dim)" />
                  </div>
                </th>
                <th>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>Auto-renewal</span>
                    <ArrowUpDown size={12} color="var(--text-dim)" />
                  </div>
                </th>
                <th>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>Renewal price</span>
                    <Info size={12} color="var(--text-dim)" />
                    <ArrowUpDown size={12} color="var(--text-dim)" />
                  </div>
                </th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    No matching subscriptions found.
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => (
                  <tr
                    key={sub.id}
                    onClick={() => setSelectedSub(sub)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Subscription Name & Subtitle */}
                    <td>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                            {sub.name}
                          </span>
                          {sub.badge && (
                            <span style={{ padding: '0.1rem 0.45rem', borderRadius: '4px', background: 'rgba(129, 140, 248, 0.15)', fontSize: '0.65rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>
                              {sub.badge}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                          {sub.domainOrHost}
                        </div>
                      </div>
                    </td>

                    {/* Expiration Date */}
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                      {sub.expirationDate}
                    </td>

                    {/* Auto-Renewal Switch */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <label className="toggle-switch-wrap" style={{ width: '38px', height: '20px' }}>
                        <input
                          type="checkbox"
                          checked={sub.autoRenewal}
                          onChange={(e) => handleToggleAutoRenew(sub.id, e as any)}
                        />
                        <span className="toggle-switch-slider" />
                      </label>
                    </td>

                    {/* Renewal Price */}
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                      {sub.renewalPrice}
                    </td>

                    {/* Action Button + Chevron */}
                    <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          className="btn-pill"
                          onClick={() => handleOpenCheckout(sub)}
                        >
                          {sub.actionLabel}
                        </Button>
                        <button
                          className="btn-icon"
                          onClick={() => setSelectedSub(sub)}
                          aria-label="View subscription details"
                        >
                          <ChevronRight size={16} color="var(--brand-primary)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="table-pagination-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Page size:</span>
            <select className="form-select" style={{ width: 'auto', padding: '0.2rem 1.75rem 0.2rem 0.6rem', fontSize: '0.775rem' }}>
              <option value="10">10</option>
              <option value="25">25</option>
            </select>
            <span style={{ marginLeft: '0.5rem' }}>1 to {filteredSubs.length} of {filteredSubs.length}</span>
          </div>

          <div className="pagination-controls-group">
            <button className="pagination-arrow-btn" disabled><ChevronsLeft size={14} /></button>
            <button className="pagination-arrow-btn" disabled><ChevronLeft size={14} /></button>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Page 1 of 1</span>
            <button className="pagination-arrow-btn" disabled><ChevronRight size={14} /></button>
            <button className="pagination-arrow-btn" disabled><ChevronsRight size={14} /></button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          Slide-Over Drawer for Subscription Details
         ===================================================================== */}
      {selectedSub && (
        <>
          <div className="drawer-overlay-backdrop" onClick={() => setSelectedSub(null)} />
          <aside className="subscription-drawer">
            <div className="drawer-header">
              <span className="drawer-title">Subscription details</span>
              <button
                className="drawer-close-btn"
                onClick={() => setSelectedSub(null)}
                aria-label="Close drawer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="drawer-body">
              <div>
                <div className="drawer-service-title">{selectedSub.name}</div>
                <div className="drawer-service-subtitle">{selectedSub.domainOrHost}</div>
              </div>

              {/* Warning Notice Box */}
              <div className="drawer-warning-box">
                <div className="warning-box-top">
                  <div className="warning-box-icon">!</div>
                  <div>
                    <div className="warning-box-title">Subscription active until {selectedSub.expirationDate}</div>
                    <div className="warning-box-desc">Automated renewal billing via Razorpay / PayPal.</div>
                  </div>
                </div>

                <div className="warning-box-actions">
                  <button
                    className="btn-resume-sub"
                    onClick={() => {
                      showToast('Subscription Updated', `Auto-renewal active for ${selectedSub.name}.`, 'success');
                      setSelectedSub(null);
                    }}
                  >
                    Manage Gateway
                  </button>
                  <button
                    className="btn-renew-plain"
                    onClick={() => {
                      handleOpenCheckout(selectedSub);
                      setSelectedSub(null);
                    }}
                  >
                    Checkout Now
                  </button>
                </div>
              </div>

              {/* Key Value Details */}
              <div className="drawer-spec-list">
                <div className="drawer-spec-row">
                  <span className="drawer-spec-label">Status</span>
                  <div className="drawer-spec-value" style={{ color: '#059669' }}>
                    <CheckCircle2 size={15} />
                    <span>Active</span>
                  </div>
                </div>

                <div className="drawer-spec-row">
                  <span className="drawer-spec-label">Expiration date</span>
                  <span className="drawer-spec-value" style={{ fontFamily: 'var(--font-mono)' }}>
                    {selectedSub.expirationDate}
                  </span>
                </div>

                <div className="drawer-spec-row">
                  <span className="drawer-spec-label">Renewal price</span>
                  <span className="drawer-spec-value">{selectedSub.renewalPrice}</span>
                </div>

                <div className="drawer-spec-row">
                  <span className="drawer-spec-label">Taxes & fees</span>
                  <span className="drawer-spec-value">{selectedSub.taxesAndFees}</span>
                </div>

                <div className="drawer-spec-row">
                  <span className="drawer-spec-label">Subscription ID</span>
                  <div className="drawer-spec-value">
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedSub.subscriptionId}</span>
                    <button
                      className="cred-copy-icon"
                      onClick={() => handleCopyId(selectedSub.subscriptionId)}
                      title="Copy ID"
                    >
                      {copiedId ? <Check size={13} color="var(--status-running)" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                <div className="drawer-spec-row">
                  <span className="drawer-spec-label">Next billing period</span>
                  <span className="drawer-spec-value">{selectedSub.billingPeriod}</span>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* =====================================================================
          Razorpay & PayPal Interactive Checkout Modal
         ===================================================================== */}
      {checkoutSub && (
        <Modal
          isOpen={!!checkoutSub}
          onClose={() => setCheckoutSub(null)}
          title={`Checkout: ${checkoutSub.name}`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setCheckoutSub(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleExecutePayment}
                disabled={isProcessing}
              >
                {isProcessing
                  ? 'Processing Gateway...'
                  : selectedGateway === 'razorpay'
                  ? 'Pay with Razorpay (UPI / NetBanking)'
                  : 'Pay with PayPal (One-Click)'}
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Price Summary */}
            <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{checkoutSub.name}</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-primary)' }}>{checkoutSub.renewalPrice}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Includes GST & Gateway Processing Fees ({checkoutSub.taxesAndFees}) • {checkoutSub.billingPeriod} billing
              </div>
            </div>

            {/* Gateway Selection Tabs */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                Select Payment Gateway
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  className={`resolver-chip-btn ${selectedGateway === 'razorpay' ? 'active' : ''}`}
                  onClick={() => setSelectedGateway('razorpay')}
                  style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}
                >
                  <Zap size={16} color="#0284c7" />
                  <span>Razorpay (UPI / Cards)</span>
                </button>
                <button
                  type="button"
                  className={`resolver-chip-btn ${selectedGateway === 'paypal' ? 'active' : ''}`}
                  onClick={() => setSelectedGateway('paypal')}
                  style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}
                >
                  <Globe size={16} color="#0079C1" />
                  <span>PayPal (Global USD)</span>
                </button>
              </div>
            </div>

            {/* Gateway Highlights */}
            {selectedGateway === 'razorpay' ? (
              <div style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.2)', padding: '0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                ⚡ <strong>Instant Indian Banking:</strong> Pay via Google Pay, PhonePe, Paytm QR code, or all Indian Debit/Credit cards.
              </div>
            ) : (
              <div style={{ background: 'rgba(0, 121, 193, 0.08)', border: '1px solid rgba(0, 121, 193, 0.2)', padding: '0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                🌐 <strong>International Buyers:</strong> Automatic USD conversion, PayPal Buyer Protection, and seamless instant activation.
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
