import React, { useState } from 'react';
import {
  ChevronRight,
  Home,
  ArrowLeft,
  Download,
  Info,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';

interface InvoiceItem {
  paymentId: string;
  invoiceId: string;
  subscriptionId: string;
  service: string;
  hostname: string;
  period: string;
  paidAt: string;
  subtotal: string;
  taxes: string;
  total: string;
}

export const PaymentHistoryView: React.FC = () => {
  const { showToast } = useToast();
  const [subTab, setSubTab] = useState<'history' | 'refund'>('history');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [checkedRows, setCheckedRows] = useState<Record<string, boolean>>({});

  const [invoices] = useState<InvoiceItem[]>(() => {
    try {
      const raw = localStorage.getItem('cloudpulse_invoices');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const toggleCheck = (id: string) => {
    setCheckedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDownloadInvoice = (inv: InvoiceItem) => {
    showToast('Downloading Invoice', `Invoice ${inv.invoiceId} PDF downloading...`, 'success');
  };

  if (selectedInvoice) {
    return (
      <div style={{ width: '100%' }}>
        <button
          onClick={() => setSelectedInvoice(null)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'none',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: '0.875rem',
            marginBottom: '1rem',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#111827', margin: '0 0 1.5rem 0' }}>
          Payment details
        </h1>

        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '1.75rem',
          }}
        >
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            <div>
              <span style={{ color: '#6b7280' }}>Payment ID: </span>
              <strong style={{ color: '#111827' }}>{selectedInvoice.paymentId}</strong>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Invoice ID: </span>
              <strong style={{ color: '#111827' }}>{selectedInvoice.invoiceId}</strong>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6', color: '#4b5563' }}>
                <th style={{ padding: '0.75rem 0', textAlign: 'left' }}>Services</th>
                <th style={{ padding: '0.75rem 0', textAlign: 'left' }}>Subscription ID</th>
                <th style={{ padding: '0.75rem 0', textAlign: 'left' }}>Period</th>
                <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '1rem 0', fontWeight: 600 }}>
                  {selectedInvoice.hostname} - {selectedInvoice.service} (billed every month)
                </td>
                <td style={{ padding: '1rem 0', color: '#5b21b6', fontFamily: 'monospace' }}>
                  {selectedInvoice.subscriptionId}
                </td>
                <td style={{ padding: '1rem 0', color: '#6b7280' }}>
                  {selectedInvoice.period}
                </td>
                <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 600 }}>
                  {selectedInvoice.subtotal}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: '2rem', maxWidth: '300px', marginLeft: 'auto' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Payment summary</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', color: '#4b5563' }}>
              <span>Subtotal</span>
              <span>{selectedInvoice.subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', color: '#4b5563' }}>
              <span>Taxes & fees</span>
              <span>{selectedInvoice.taxes}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 700, borderTop: '1px solid #e5e7eb' }}>
              <span>Total</span>
              <span>{selectedInvoice.total}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <Button
              variant="outline"
              onClick={() => handleDownloadInvoice(selectedInvoice)}
              icon={<Download size={14} />}
            >
              Download Invoice
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Breadcrumb matching Screenshot 2 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: '#6b7280', marginBottom: '1rem' }}>
        <Home size={14} color="#6b7280" />
        <span>›</span>
        <span>Billing</span>
        <span>›</span>
        <span>Payment History</span>
        <span>›</span>
        <span style={{ color: '#111827', fontWeight: 600 }}>Paid</span>
      </div>

      {/* Title */}
      <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#111827', margin: '0 0 1.25rem 0' }}>
        Payment History
      </h1>

      {/* Subtabs matching Screenshot 2 */}
      <div
        style={{
          display: 'flex',
          gap: '2rem',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '1.5rem',
        }}
      >
        <button
          type="button"
          onClick={() => setSubTab('history')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: subTab === 'history' ? '2px solid #5b21b6' : '2px solid transparent',
            padding: '0.65rem 0',
            color: subTab === 'history' ? '#5b21b6' : '#6b7280',
            fontWeight: subTab === 'history' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Payment history
        </button>

        <button
          type="button"
          onClick={() => setSubTab('refund')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: subTab === 'refund' ? '2px solid #5b21b6' : '2px solid transparent',
            padding: '0.65rem 0',
            color: subTab === 'refund' ? '#5b21b6' : '#6b7280',
            fontWeight: subTab === 'refund' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Refund history
        </button>
      </div>

      {/* Table Container */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f3f4f6', color: '#4b5563', fontSize: '0.8125rem' }}>
              <th style={{ padding: '0.85rem 1rem', width: '30px' }}>
                <input type="checkbox" style={{ cursor: 'pointer' }} />
              </th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Payment ID</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Subscription ID</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Service</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Paid at</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Amount</th>
              <th style={{ padding: '0.85rem 1rem', width: '30px' }}></th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#6b7280' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f3f4f6', color: '#9ca3af', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                    <Download size={20} />
                  </div>
                  <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>No Payment History</div>
                  <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Your invoices and transaction receipts will appear here after your first purchase.</div>
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
              <tr
                key={inv.paymentId}
                onClick={() => setSelectedInvoice(inv)}
                style={{
                  borderBottom: '1px solid #f3f4f6',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '1rem 1rem' }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={!!checkedRows[inv.paymentId]}
                    onChange={() => toggleCheck(inv.paymentId)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>

                <td style={{ padding: '1rem 1rem', fontWeight: 600, color: '#111827' }}>
                  {inv.paymentId}
                </td>

                <td style={{ padding: '1rem 1rem' }}>
                  <span style={{ color: '#5b21b6', fontFamily: 'monospace', fontWeight: 600 }}>
                    {inv.subscriptionId}
                  </span>
                </td>

                <td style={{ padding: '1rem 1rem' }}>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{inv.service}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{inv.hostname}</div>
                </td>

                <td style={{ padding: '1rem 1rem', color: '#4b5563', fontSize: '0.8125rem' }}>
                  {inv.paidAt}
                </td>

                <td style={{ padding: '1rem 1rem', fontWeight: 600, color: '#111827' }}>
                  {inv.total}
                </td>

                <td style={{ padding: '1rem 1rem', textAlign: 'right' }}>
                  <ChevronRight size={18} color="#5b21b6" />
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
