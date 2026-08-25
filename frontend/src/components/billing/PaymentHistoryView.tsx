import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
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
  period: string;
  paidAt: string;
  subtotal: string;
  taxes: string;
  total: string;
}

export const PaymentHistoryView: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'payment' | 'refund'>('payment');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

  const invoices: InvoiceItem[] = [
    {
      paymentId: 'H_49242497',
      invoiceId: 'HSG-9259769',
      subscriptionId: '16BgFIVSx2oS81xGC',
      service: 'KVM 2',
      period: '2026-08-21 - 2026-09-21',
      paidAt: '2026-08-21',
      subtotal: '₹ 1,039.20',
      taxes: '₹ 187.06',
      total: '₹ 1,226.26',
    },
  ];

  const handleToggleRow = (paymentId: string) => {
    setSelectedRows((prev) => ({
      ...prev,
      [paymentId]: !prev[paymentId],
    }));
  };

  const handleDownloadInvoice = (inv: InvoiceItem) => {
    showToast('Downloading Invoice', `Invoice ${inv.invoiceId} PDF downloading...`, 'success');
  };

  // If user clicked an invoice, show Payment details (Screenshot 4)
  if (selectedInvoice) {
    return (
      <div>
        {/* Back Button */}
        <button
          className="back-to-vps-link"
          style={{ marginBottom: '1rem', cursor: 'pointer' }}
          onClick={() => setSelectedInvoice(null)}
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>

        {/* Page Title */}
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
          Payment details
        </h1>

        {/* Payment Details Card matching Screenshot 4 */}
        <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Payment ID: </span>
              <strong style={{ color: 'var(--text-primary)' }}>{selectedInvoice.paymentId}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Invoice ID: </span>
              <strong style={{ color: 'var(--text-primary)' }}>{selectedInvoice.invoiceId}</strong>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Services</th>
                  <th>Subscription ID</th>
                  <th>Period</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    srv1920898.hstgr.cloud - {selectedInvoice.service} (billed every month)
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-primary-text)' }}>
                    {selectedInvoice.subscriptionId}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                    {selectedInvoice.period}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {selectedInvoice.subtotal}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment summary Box matching Screenshot 4 */}
          <div className="payment-summary-box">
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Payment summary
            </div>
            <div className="payment-summary-row">
              <span>Subtotal</span>
              <span>{selectedInvoice.subtotal}</span>
            </div>
            <div className="payment-summary-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>Taxes & fees</span>
                <Info size={13} color="var(--text-dim)" />
              </div>
              <span>{selectedInvoice.taxes}</span>
            </div>
            <div className="payment-summary-row total">
              <span>Total</span>
              <span>{selectedInvoice.total}</span>
            </div>
          </div>

          {/* Download Invoice Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <Button
              variant="outline"
              className="btn-pill"
              icon={<Download size={14} />}
              onClick={() => handleDownloadInvoice(selectedInvoice)}
            >
              Download Invoice
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Payment History List Table (Screenshot 3)
  return (
    <div>
      {/* Page Title */}
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
        Payment History
      </h1>

      {/* Tabs */}
      <div className="card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1.5rem', padding: '0 1.5rem' }}>
          <button
            style={{
              padding: '0.85rem 0',
              background: 'none',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: activeTab === 'payment' ? 'var(--brand-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'payment' ? '2px solid var(--brand-primary)' : '2px solid transparent',
              cursor: 'pointer',
            }}
            onClick={() => setActiveTab('payment')}
          >
            Payment history
          </button>
          <button
            style={{
              padding: '0.85rem 0',
              background: 'none',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: activeTab === 'refund' ? 'var(--brand-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'refund' ? '2px solid var(--brand-primary)' : '2px solid transparent',
              cursor: 'pointer',
            }}
            onClick={() => setActiveTab('refund')}
          >
            Refund history
          </button>
        </div>

        {activeTab === 'refund' ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No refund records found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input type="checkbox" style={{ accentColor: 'var(--brand-primary)' }} />
                  </th>
                  <th>Payment ID</th>
                  <th>Subscription ID</th>
                  <th>Service</th>
                  <th>Paid at</th>
                  <th>Amount</th>
                  <th style={{ textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.paymentId}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedInvoice(inv)}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={!!selectedRows[inv.paymentId]}
                        onChange={() => handleToggleRow(inv.paymentId)}
                        style={{ accentColor: 'var(--brand-primary)' }}
                      />
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                      {inv.paymentId}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-primary-text)', fontSize: '0.8125rem' }}>
                      {inv.subscriptionId}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                        {inv.service}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                        srv1920898.hstgr.cloud
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      {inv.paidAt}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                      {inv.total}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <ChevronRight size={16} color="var(--brand-primary)" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
