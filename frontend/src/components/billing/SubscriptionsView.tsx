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
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSub, setSelectedSub] = useState<SubscriptionItem | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([
    {
      id: 'sub-1',
      name: 'KVM 2',
      domainOrHost: 'srv1920898.hstgr.cloud',
      expirationDate: '2026-09-21',
      autoRenewal: false,
      renewalPrice: '₹ 2,099.00',
      actionLabel: 'Renew',
      taxesAndFees: '₹ 377.82',
      subscriptionId: '16BgFIVSx2oS81xGC',
      billingPeriod: '1 month',
    },
    {
      id: 'sub-2',
      name: 'Reach 100 (Email marketing)',
      badge: 'Free trial',
      domainOrHost: 'cloudhost-app.io',
      expirationDate: '2027-08-21',
      autoRenewal: false,
      renewalPrice: '₹ 1,548.00',
      actionLabel: 'Upgrade',
      taxesAndFees: '₹ 278.64',
      subscriptionId: '29KhALMx9qP20zYT',
      billingPeriod: '12 months',
    },
    {
      id: 'sub-3',
      name: '.TECH Domain',
      domainOrHost: 'cloudhost-app.io',
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

  const filteredSubs = subscriptions.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.domainOrHost.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Page Title */}
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
        Subscriptions
      </h1>

      {/* Subscriptions Card Table matching Screenshot 1 */}
      <div className="card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
        {/* Search Toolbar */}
        <div style={{ padding: '1.25rem 1.5rem 0.75rem' }}>
          <div className="search-input-wrap" style={{ maxWidth: '100%' }}>
            <Search size={15} />
            <input
              type="text"
              className="search-input"
              placeholder="Search"
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
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => (
                  <tr
                    key={sub.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedSub(sub)}
                  >
                    {/* Subscription title & domain */}
                    <td>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                            {sub.name}
                          </span>
                          {sub.badge && (
                            <span style={{ padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', background: '#ecfdf5', color: '#059669', fontSize: '0.725rem', fontWeight: 700 }}>
                              {sub.badge}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          className="btn-pill"
                          onClick={() => showToast(sub.actionLabel, `Initiating ${sub.actionLabel} for ${sub.name}...`, 'info')}
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

        {/* Pagination Footer matching Screenshot 1 */}
        <div className="table-pagination-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Page size:</span>
            <select className="form-select" style={{ width: 'auto', padding: '0.2rem 1.75rem 0.2rem 0.6rem', fontSize: '0.775rem' }}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
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
          Slide-Over Drawer for Subscription Details (Screenshot 2)
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

              {/* Warning Notice Box matching Screenshot 2 */}
              <div className="drawer-warning-box">
                <div className="warning-box-top">
                  <div className="warning-box-icon">!</div>
                  <div>
                    <div className="warning-box-title">Subscription cancels on {selectedSub.expirationDate}</div>
                    <div className="warning-box-desc">You can keep using it until then. You won't be billed again.</div>
                  </div>
                </div>

                <div className="warning-box-actions">
                  <button
                    className="btn-resume-sub"
                    onClick={() => {
                      showToast('Subscription Resumed', `Automatic renewal reactivated for ${selectedSub.name}.`, 'success');
                      setSelectedSub(null);
                    }}
                  >
                    Resume subscription
                  </button>
                  <button
                    className="btn-renew-plain"
                    onClick={() => showToast('Renew', 'Generating renewal invoice...', 'info')}
                  >
                    Renew
                  </button>
                </div>
              </div>

              {/* Key Value Details matching Screenshot 2 */}
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

              {/* Upgrade Promo Link */}
              <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Need more resources?{' '}
                <a
                  href="#upgrade"
                  style={{ color: 'var(--brand-primary-text)', fontWeight: 600 }}
                  onClick={(e) => {
                    e.preventDefault();
                    showToast('Upgrade Tier', 'Choose a higher compute plan.', 'info');
                  }}
                >
                  Upgrade to a higher plan.
                </a>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
};
