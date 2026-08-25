import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Info,
  CreditCard,
  Plus,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';

interface PaymentMethodItem {
  id: string;
  type: 'PayPal' | 'CreditCard' | 'UPI';
  title: string;
  isDefault: boolean;
}

export const PaymentMethodsView: React.FC = () => {
  const { showToast } = useToast();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'card' | 'paypal' | 'upi'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');

  const [methods, setMethods] = useState<PaymentMethodItem[]>([
    {
      id: 'pm-1',
      type: 'PayPal',
      title: 'pay***@example.com',
      isDefault: true,
    },
  ]);

  const handleAddMethod = (e: React.FormEvent) => {
    e.preventDefault();
    const newMethod: PaymentMethodItem = {
      id: `pm-${Date.now()}`,
      type: selectedType === 'card' ? 'CreditCard' : selectedType === 'paypal' ? 'PayPal' : 'UPI',
      title: selectedType === 'card' ? `•••• •••• •••• ${cardNumber.slice(-4) || '4242'}` : 'billing***@example.com',
      isDefault: false,
    };
    setMethods((prev) => [...prev, newMethod]);
    setAddModalOpen(false);
    setCardNumber('');
    showToast('Payment Method Added', 'New payment method added successfully.', 'success');
  };

  return (
    <div>
      {/* Top Header Row with Balance Badge matching Screenshot 5 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Payment Methods
        </h1>

        <div className="billing-balance-badge">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          <span>Cloudhost balance: <strong>₹ 0.00</strong></span>
          <Info size={13} color="var(--text-dim)" />
        </div>
      </div>

      {/* Active Methods Banner Card matching Screenshot 5 */}
      <div className="billing-status-banner">
        <div className="billing-banner-left">
          <CheckCircle2 size={18} fill="#059669" color="white" />
          <span>You have <strong>{methods.length} active</strong> payment methods</span>
        </div>

        <Button
          variant="primary"
          className="btn-pill"
          onClick={() => setAddModalOpen(true)}
        >
          Add payment method
        </Button>
      </div>

      {/* Payment Method List Card matching Screenshot 5 */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Payment method list
          </h2>
        </div>

        <div className="profile-row-list">
          {methods.map((method) => (
            <div
              key={method.id}
              className="social-integration-item"
              style={{ cursor: 'pointer' }}
              onClick={() => showToast('Payment Method', `Selected ${method.title}.`, 'info')}
            >
              <div className="social-left-info">
                {/* PayPal SVG / Card Icon */}
                <div className="social-logo-wrap" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#0079C1">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.807 1.614 1.353 1.18 1.907 2.87 1.646 5.025-.49 4.02-3.155 6.07-7.925 6.07H9.792l-1.464 8.628h-1.252z"/>
                  </svg>
                </div>

                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {method.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{method.type}</span>
                    {method.isDefault && (
                      <span style={{ padding: '0.1rem 0.45rem', borderRadius: '4px', background: 'var(--bg-subtle)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        DEFAULT METHOD
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

      {/* Add Payment Method Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Payment Method"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddMethod}>Save Method</Button>
          </>
        }
      >
        <form onSubmit={handleAddMethod} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={`resolver-chip-btn ${selectedType === 'card' ? 'active' : ''}`}
              onClick={() => setSelectedType('card')}
            >
              Credit/Debit Card
            </button>
            <button
              type="button"
              className={`resolver-chip-btn ${selectedType === 'paypal' ? 'active' : ''}`}
              onClick={() => setSelectedType('paypal')}
            >
              PayPal
            </button>
            <button
              type="button"
              className={`resolver-chip-btn ${selectedType === 'upi' ? 'active' : ''}`}
              onClick={() => setSelectedType('upi')}
            >
              UPI
            </button>
          </div>

          {selectedType === 'card' && (
            <>
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
            </>
          )}

          {selectedType === 'paypal' && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              You will be redirected to PayPal to authorize continuous recurring subscriptions securely.
            </p>
          )}

          {selectedType === 'upi' && (
            <div className="form-group">
              <label className="form-label">UPI ID / VPA</label>
              <input
                type="text"
                className="form-input"
                placeholder="user@okhdfcbank"
                required
              />
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};
