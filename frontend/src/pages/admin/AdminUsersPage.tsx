import React, { useState } from 'react';
import { Users, Shield, UserX, UserCheck, Search, Filter, MoreHorizontal, Layers, RefreshCw, Edit3, Key } from 'lucide-react';
import { proxyService } from '../../services/proxyService';
import { AdminUser } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ProxyStatusBadge } from '../../components/proxy/ProxyStatusBadge';

export const AdminUsersPage: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>(() => proxyService.getAdminUsers());
  const [search, setSearch] = useState('');

  // Plan Assignment Modal State
  const [selectedUserForPlan, setSelectedUserForPlan] = useState<AdminUser | null>(null);
  const [newPlan, setNewPlan] = useState('pro-500gb');

  // Reset Credential State
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);

  const filteredUsers = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleStatus = (userId: string, name: string) => {
    const updated = proxyService.toggleUserStatus(userId);
    setUsers(proxyService.getAdminUsers());
    showToast(
      'User Status Changed',
      `Tenant '${name}' is now ${updated.status}.`,
      updated.status === 'active' ? 'success' : 'warning'
    );
  };

  const handleAssignPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPlan) return;

    let limit = 500;
    if (newPlan === 'starter-100gb') limit = 100;
    if (newPlan === 'enterprise-1tb') limit = 1000;

    const updated = users.map((u) => {
      if (u.id === selectedUserForPlan.id) {
        return {
          ...u,
          plan: newPlan,
          bandwidthLimitGB: limit,
        };
      }
      return u;
    });

    setUsers(updated);
    localStorage.setItem('cloudpulse_admin_users', JSON.stringify(updated));
    showToast('Plan Assigned', `Assigned ${newPlan} (${limit} GB) to ${selectedUserForPlan.name}`, 'success');
    setSelectedUserForPlan(null);
  };

  const handleResetCredentials = (user: AdminUser) => {
    setResettingUserId(user.id);
    setTimeout(() => {
      const endpoints = proxyService.getEndpoints();
      const userEndpoints = endpoints.filter((e) => e.name.toLowerCase().includes(user.name.toLowerCase().split(' ')[0]) || endpoints.length > 0);
      if (userEndpoints.length > 0) {
        const target = userEndpoints[0];
        const newPass = 'p_sec_' + Math.random().toString(36).substring(2, 10);
        target.password = newPass;
        localStorage.setItem('cloudpulse_proxy_endpoints', JSON.stringify(endpoints));
        showToast('Credentials Reset', `Reset proxy password for ${user.name} to: ${newPass}`, 'success');
      } else {
        showToast('Credentials Reset', `Regenerated authentication secrets for ${user.name}`, 'info');
      }
      setResettingUserId(null);
    }, 500);
  };

  return (
    <div className="content-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', textTransform: 'uppercase' }}>
              Admin Operations
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Tenant User Management
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Inspect client accounts, disable tenants, assign bandwidth tiers, and reset proxy credentials.
          </p>
        </div>

        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search tenant name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.4rem' }}
          />
        </div>
      </div>

      {/* Users Table Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Registered Customer Accounts ({filteredUsers.length})</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.85rem 1.5rem' }}>Tenant Name</th>
                <th style={{ padding: '0.85rem 1rem' }}>Email & Role</th>
                <th style={{ padding: '0.85rem 1rem' }}>Assigned Plan</th>
                <th style={{ padding: '0.85rem 1rem' }}>Bandwidth Usage</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1.5rem', textAlign: 'right' }}>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {user.name}
                  </td>
                  <td style={{ padding: '1rem 1rem' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>{user.email}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 600, textTransform: 'capitalize' }}>
                      {user.role}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.plan}</span>
                      <button
                        onClick={() => { setSelectedUserForPlan(user); setNewPlan(user.plan); }}
                        style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', padding: '0.2rem' }}
                        title="Change Plan Tier"
                      >
                        <Edit3 size={13} />
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
                      {user.bandwidthUsedGB} / {user.bandwidthLimitGB} GB
                    </div>
                    <div style={{ width: 110, height: 5, background: 'var(--bg-border)', borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
                      <div
                        style={{
                          width: `${(user.bandwidthUsedGB / user.bandwidthLimitGB) * 100}%`,
                          height: '100%',
                          background: user.bandwidthUsedGB / user.bandwidthLimitGB > 0.9 ? '#ef4444' : 'var(--brand-primary)',
                        }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1rem' }}>
                    <ProxyStatusBadge status={user.status} />
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      {/* Reset Credentials Action */}
                      <button
                        onClick={() => handleResetCredentials(user)}
                        disabled={resettingUserId === user.id}
                        style={{
                          padding: '0.35rem 0.6rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--bg-border)',
                          background: 'var(--bg-subtle)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                        title="Reset Proxy Credentials"
                      >
                        <Key size={12} />
                        <span>Reset Credentials</span>
                      </button>

                      {/* Suspend / Activate Toggle */}
                      <button
                        onClick={() => handleToggleStatus(user.id, user.name)}
                        style={{
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          background: user.status === 'active' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: user.status === 'active' ? '#ef4444' : '#10b981',
                          cursor: 'pointer',
                        }}
                      >
                        {user.status === 'active' ? 'Disable User' : 'Enable User'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Assignment Modal */}
      {selectedUserForPlan && (
        <Modal title={`Assign Plan to ${selectedUserForPlan.name}`} onClose={() => setSelectedUserForPlan(null)}>
          <form onSubmit={handleAssignPlan} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Select Subscription Tier
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {[
                  { slug: 'starter-100gb', title: 'Starter Plan', cap: '100 GB Included • 250 Threads', price: '$49/mo' },
                  { slug: 'pro-500gb', title: 'Pro Plan', cap: '500 GB Included • 1,000 Threads', price: '$199/mo' },
                  { slug: 'enterprise-1tb', title: 'Enterprise Plan', cap: '1,000 GB (1TB) • 5,000 Threads', price: '$499/mo' },
                ].map((p) => (
                  <div
                    key={p.slug}
                    onClick={() => setNewPlan(p.slug)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: newPlan === p.slug ? '2px solid var(--brand-primary)' : '1px solid var(--bg-border)',
                      background: newPlan === p.slug ? 'var(--brand-primary-light)' : 'var(--bg-subtle)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: newPlan === p.slug ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.cap}</div>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{p.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button variant="secondary" type="button" onClick={() => setSelectedUserForPlan(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Apply Plan
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
