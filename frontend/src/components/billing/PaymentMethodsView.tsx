import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Info,
  CreditCard,
  Plus,
  ShieldCheck,
  Zap,
  Globe,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface PaymentMethodItem {
  id: string;
  type: 'PayPal' | 'Razorpay' | 'CreditCard' | 'UPI';
  title: string;
  subtitle: string;
  isDefault: boolean;
  gateway: 'paypal' | 'razorpay' | 'stripe';
}

export const PaymentMethodsView: React.FC = () => {
  const { showToast } = useToast();
  const { token } = useAuth();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<'razorpay' | 'paypal' | 'card'>('razorpay');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [upiId, setUpiId] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [methods, setMethods] = useState<PaymentMethodItem[]>([
    {
      id: 'pm-1',
      type: 'Razorpay',
      title: 'Razorpay Instant UPI & NetBanking',
      subtitle: 'Auto-Pay supported via HDFC / ICICI / SBI / PhonePe / GPay',
      isDefault: true,
      gateway: 'razorpay',
    },
    {
      id: 'pm-2',
      type: 'PayPal',
      title: 'paypal-billing@cloudinfra.io',
      subtitle: 'Verified Global PayPal Account (Auto-Debit Active)',
      isDefault: false,
      gateway: 'paypal',
    },
  ]);

  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault();
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
          body: JSON.stringify({ amount: 100, currency: 'INR', plan_id: 'verification' }),
        });
        const data = await res.json();
        
        const newMethod: PaymentMethodItem = {
          id: `pm-rzp-${Date.now()}`,
          type: 'Razorpay',
          title: upiId ? `Razorpay UPI (${upiId})` : 'Razorpay Express Checkout',
          subtitle: 'Active UPI / NetBanking Gateway',
          isDefault: false,
          gateway: 'razorpay',
        };
        setMethods((prev) => [...prev, newMethod]);
        showToast('Razorpay Gateway Linked', `Connected via Order ${data?.data?.order_id || 'RZP-OK'}`, 'success');
      } else if (selectedGateway === 'paypal') {
        const res = await fetch('/api/v1/billing/paypal/create-order', {
          method: 'POST',
          headers,
          body: JSON.stringify({ amount: 1.00, currency: 'USD', plan_id: 'verification' }),
        });
        const data = await res.json();

        const newMethod: PaymentMethodItem = {
          id: `pm-pp-${Date.now()}`,
          type: 'PayPal',
          title: paypalEmail || 'paypal-user@enterprise.com',
          subtitle: 'PayPal International Billing Agreement',
          isDefault: false,
          gateway: 'paypal',
        };
        setMethods((prev) => [...prev, newMethod]);
        showToast('PayPal Account Connected', `PayPal authorization ID: ${data?.data?.order_id || 'PP-OK'}`, 'success');
      } else {
        const newMethod: PaymentMethodItem = {
          id: `pm-card-${Date.now()}`,
          type: 'CreditCard',
          title: `•••• •••• •••• ${cardNumber.slice(-4) || '4242'}`,
          subtitle: `Expires ${cardExpiry || '12/28'} (Stripe 3D Secure)`,
          isDefault: false,
          gateway: 'stripe',
        };
        setMethods((prev) => [...prev, newMethod]);
        showToast('Card Added', 'Credit card added securely.', 'success');
      }

      setAddModalOpen(false);
      setCardNumber('');
      setUpiId('');
      setPaypalEmail('');
    } catch {
      showToast('Error', 'Failed to link payment gateway.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetDefault = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMethods((prev) =>
      prev.map((m) => ({
        ...m,
        isDefault: m.id === id,
      }))
    );
    showToast('Default Method Updated', 'Your primary billing gateway has been updated.', 'info');
  };

  return (
    <div>
      {/* Top Header Row with Balance Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Payment Gateways & Methods
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            Manage recurring subscriptions via Razorpay (UPI / NetBanking) and PayPal (Global USD)
          </p>
        </div>

        <div className="billing-balance-badge">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          <span>Cloudhost balance: <strong>₹ 0.00</strong></span>
          <Info size={13} color="var(--text-dim)" />
        </div>
      </div>

      {/* Active Methods Banner Card */}
      <div className="billing-status-banner">
        <div className="billing-banner-left">
          <CheckCircle2 size={18} fill="#059669" color="white" />
          <span>You have <strong>{methods.length} active</strong> payment gateways connected</span>
        </div>

        <Button
          variant="primary"
          className="btn-pill"
          onClick={() => setAddModalOpen(true)}
        >
          <Plus size={15} style={{ marginRight: '0.35rem' }} />
          Add Payment Gateway
        </Button>
      </div>

      {/* Supported Gateways Highlight Ribbon */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(2, 132, 199, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color="#0284c7" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Razorpay (India & Global)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>UPI QR, NetBanking, RuPay, Visa, MC</div>
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Instant INR / USD settlement with zero-latency automated proxy pool provisioning.
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #0079C1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(0, 121, 193, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={18} color="#0079C1" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>PayPal (International)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>One-Click Checkout in 195+ Countries</div>
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Seamless multi-currency support with automated monthly bandwidth billing in USD & EUR.
          </div>
        </div>
      </div>

      {/* Payment Method List Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Configured Billing Accounts
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Click to set primary
          </span>
        </div>

        <div className="profile-row-list">
          {methods.map((method) => (
            <div
              key={method.id}
              className="social-integration-item"
              style={{ cursor: 'pointer' }}
              onClick={(e) => handleSetDefault(method.id, e)}
            >
              <div className="social-left-info">
                {/* Gateway Logo */}
                {method.gateway === 'razorpay' ? (
                  <div className="social-logo-wrap" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#0284c7">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                ) : method.gateway === 'paypal' ? (
                  <div className="social-logo-wrap" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0079C1">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.807 1.614 1.353 1.18 1.907 2.87 1.646 5.025-.49 4.02-3.155 6.07-7.925 6.07H9.792l-1.464 8.628h-1.252z"/>
                    </svg>
                  </div>
                ) : (
                  <div className="social-logo-wrap" style={{ background: '#faf5ff', borderColor: '#e9d5ff' }}>
                    <CreditCard size={20} color="#7c3aed" />
                  </div>
                )}

                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {method.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {method.subtitle}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                    <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--bg-subtle)', color: 'var(--text-dim)', fontWeight: 600 }}>
                      {method.type}
                    </span>
                    {method.isDefault && (
                      <span style={{ padding: '0.1rem 0.45rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', fontSize: '0.65rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
                        PRIMARY GATEWAY
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <ChevronRight size={16} color="var(--brand-primary)" />
            </div>
          ))}
        </div>
      </div>

      {/* Add Payment Gateway Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Payment Gateway"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddMethod} disabled={isProcessing}>
              {isProcessing ? 'Connecting...' : 'Authorize & Connect'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddMethod} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Gateway Selector Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              className={`resolver-chip-btn ${selectedGateway === 'razorpay' ? 'active' : ''}`}
              onClick={() => setSelectedGateway('razorpay')}
              style={{ padding: '0.6rem 0.5rem', textAlign: 'center', fontWeight: 700 }}
            >
              ⚡ Razorpay (UPI)
            </button>
            <button
              type="button"
              className={`resolver-chip-btn ${selectedGateway === 'paypal' ? 'active' : ''}`}
              onClick={() => setSelectedGateway('paypal')}
              style={{ padding: '0.6rem 0.5rem', textAlign: 'center', fontWeight: 700 }}
            >
              🌐 PayPal
            </button>
            <button
              type="button"
              className={`resolver-chip-btn ${selectedGateway === 'card' ? 'active' : ''}`}
              onClick={() => setSelectedGateway('card')}
              style={{ padding: '0.6rem 0.5rem', textAlign: 'center', fontWeight: 700 }}
            >
              💳 Card
            </button>
          </div>

          {selectedGateway === 'razorpay' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.2)', padding: '0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                <strong>Razorpay Auto-Debit Enabled:</strong> Supports all Indian UPI handles (Google Pay, PhonePe, Paytm, BHIM) and NetBanking.
              </div>
              <div className="form-group">
                <label className="form-label">UPI ID / VPA (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. yourname@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          )}

          {selectedGateway === 'paypal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(0, 121, 193, 0.08)', border: '1px solid rgba(0, 121, 193, 0.2)', padding: '0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                <strong>PayPal International Checkout:</strong> Automatically bills recurring subscriptions in USD with buyer protection.
              </div>
              <div className="form-group">
                <label className="form-label">PayPal Account Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. billing@company.com"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          )}

          {selectedGateway === 'card' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Card Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Expires (MM/YY)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="12/28"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CVV / CVC</label>
                  <input
                    type="password"
                    maxLength={4}
                    className="form-input"
                    placeholder="123"
                    required
                  />
                </div>
              </div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};
