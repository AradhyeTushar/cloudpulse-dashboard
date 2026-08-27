import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Info,
  CreditCard,
  Plus,
  Home,
  Wallet,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { openRazorpayCheckout } from '../../services/paymentService';

export const PaymentMethodsView: React.FC = () => {
  const { showToast } = useToast();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [gatewayType, setGatewayType] = useState<'paypal' | 'razorpay' | 'card'>('paypal');
  const [isProcessing, setIsProcessing] = useState(false);

  const [methods, setMethods] = useState([
    {
      id: 'pm-paypal-default',
      email: 'ara***ar@gmail.com',
      provider: 'PayPal',
      isDefault: true,
    },
  ]);

  const handleAddPayment = async () => {
    setIsProcessing(true);
    try {
      if (gatewayType === 'razorpay') {
        const paymentResult = await openRazorpayCheckout({
          key: 'rzp_test_cloudpulse_live',
          amount: 100,
          currency: 'INR',
          name: 'Hostinger / CloudPulse',
          description: 'Link UPI / Card Payment Method',
        });
        setMethods((prev) => [
          ...prev,
          {
            id: `pm-rzp-${Date.now()}`,
            email: `razorpay_${paymentResult.razorpay_payment_id.slice(-6)}@bank.upi`,
            provider: 'Razorpay UPI',
            isDefault: false,
          },
        ]);
        showToast('Payment Method Added', 'Razorpay UPI linked successfully.', 'success');
      } else {
        setMethods((prev) => [
          ...prev,
          {
            id: `pm-pp-${Date.now()}`,
            email: 'user***@business.com',
            provider: 'PayPal',
            isDefault: false,
          },
        ]);
        showToast('Payment Method Added', 'PayPal account linked successfully.', 'success');
      }
      setAddModalOpen(false);
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to add payment method', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Breadcrumb matching Screenshot 3 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: '#6b7280', marginBottom: '1rem' }}>
        <Home size={14} color="#6b7280" />
        <span>›</span>
        <span>Billing</span>
        <span>›</span>
        <span style={{ color: '#111827', fontWeight: 600 }}>Payment Methods</span>
      </div>

      {/* Header with Balance Badge on Right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#111827', margin: 0 }}>
          Payment Methods
        </h1>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.85rem',
            borderRadius: '9999px',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            fontSize: '0.8125rem',
            color: '#111827',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <Wallet size={15} color="#5b21b6" />
          <span>Hostinger balance: <strong>₹ 0.00</strong></span>
          <Info size={13} color="#9ca3af" />
        </div>
      </div>

      {/* Active Methods Alert Banner Card matching Screenshot 3 */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#111827', fontSize: '0.875rem' }}>
          <CheckCircle2 size={18} color="#10b981" />
          <span>You have <strong>{methods.length} active</strong> payment methods</span>
        </div>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          style={{
            background: '#5b21b6',
            color: '#ffffff',
            border: 'none',
            padding: '0.55rem 1.25rem',
            borderRadius: '8px',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#4c1d95')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#5b21b6')}
        >
          Add payment method
        </button>
      </div>

      {/* Payment Method List Card matching Screenshot 3 */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0 0 1.25rem 0' }}>
          Payment method list
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {methods.map((pm) => (
            <div
              key={pm.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#0070ba',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1rem',
                  }}
                >
                  P
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>
                    {pm.email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#6b7280', marginTop: '0.15rem' }}>
                    <span>{pm.provider}</span>
                    {pm.isDefault && (
                      <>
                        <span>|</span>
                        <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.675rem' }}>DEFAULT METHOD</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <ChevronRight size={18} color="#5b21b6" />
            </div>
          ))}
        </div>
      </div>

      {/* Add Payment Modal */}
      {addModalOpen && (
        <Modal title="Add Payment Method" onClose={() => setAddModalOpen(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
              Select a payment method to connect for recurring renewals and proxy capacity upgrades.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setGatewayType('paypal')}
                style={{
                  padding: '0.85rem',
                  borderRadius: '8px',
                  border: gatewayType === 'paypal' ? '2px solid #5b21b6' : '1px solid #e5e7eb',
                  background: gatewayType === 'paypal' ? '#f3e8ff' : '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  color: gatewayType === 'paypal' ? '#5b21b6' : '#374151',
                }}
              >
                PayPal
              </button>

              <button
                type="button"
                onClick={() => setGatewayType('razorpay')}
                style={{
                  padding: '0.85rem',
                  borderRadius: '8px',
                  border: gatewayType === 'razorpay' ? '2px solid #5b21b6' : '1px solid #e5e7eb',
                  background: gatewayType === 'razorpay' ? '#f3e8ff' : '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  color: gatewayType === 'razorpay' ? '#5b21b6' : '#374151',
                }}
              >
                Razorpay (UPI / Cards)
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddPayment} disabled={isProcessing}>
                {isProcessing ? 'Connecting...' : 'Authorize & Save'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
