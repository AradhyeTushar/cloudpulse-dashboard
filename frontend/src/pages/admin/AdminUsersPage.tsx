import React, { useState } from 'react';
import { Users, Shield, UserX, UserCheck, Search, Filter, MoreHorizontal, Layers } from 'lucide-react';
import { proxyService } from '../../services/proxyService';
import { AdminUser } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';

export const AdminUsersPage: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>(() => proxyService.getAdminUsers());
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleStatus = (userId: string, name: string) => {
    const updated = proxyService.toggleUserStatus(userId);
    setUsers(proxyService.getAdminUsers());
    showToast(
      'User Status Changed',
      `User ${name} is now ${updated.status}.`,
      updated.status === 'active' ? 'success' : 'warning'
    );
  };

  return (
    <div className="content-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', textTransform: 'uppercase' }}>
              Admin Portal
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Tenant & User Management
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Inspect client accounts, monitor allocated bandwidth quotas, and manage tenant privileges.
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
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Registered Tenants ({filteredUsers.length})</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.85rem 1.5rem' }}>Tenant Name</th>
                <th style={{ padding: '0.85rem 1rem' }}>Email & Role</th>
                <th style={{ padding: '0.85rem 1rem' }}>Subscription Tier</th>
                <th style={{ padding: '0.85rem 1rem' }}>Bandwidth Used</th>
                <th style={{ padding: '0.85rem 1rem' }}>Active Tunnels</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1.5rem', textAlign: 'right' }}>Actions</th>
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
                  <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary)' }}>
                    {user.plan}
                  </td>
                  <td style={{ padding: '1rem 1rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {user.bandwidthUsedGB} / {user.bandwidthLimitGB} GB
                    </div>
                    <div style={{ width: 100, height: 4, background: 'var(--bg-border)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
                      <div
                        style={{
                          width: `${(user.bandwidthUsedGB / user.bandwidthLimitGB) * 100}%`,
                          height: '100%',
                          background: user.bandwidthUsedGB / user.bandwidthLimitGB > 0.9 ? '#ef4444' : 'var(--brand-primary)',
                        }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {user.activeSessionsCount}
                  </td>
                  <td style={{ padding: '1rem 1rem' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        background: user.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: user.status === 'active' ? '#10b981' : '#ef4444',
                        textTransform: 'uppercase',
                      }}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
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
                      {user.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
