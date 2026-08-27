import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Receipt,
  Layers,
  CreditCard,
  User,
  Lock,
  Key,
  Shield,
  LogOut,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const isSuperUser = user?.role === 'admin' || user?.role === 'owner';

  const handleLogout = async () => {
    await logout();
    showToast('Signed Out', 'You have been safely signed out.', 'info');
    navigate('/login');
  };

  const isBillingActive =
    (location.pathname === '/settings/billing' &&
      (!location.search || location.search.includes('tab=subscriptions'))) ||
    location.pathname === '/settings/billing/subscriptions';

  const isHistoryActive =
    (location.pathname === '/settings/billing' && location.search.includes('tab=history')) ||
    location.pathname === '/settings/billing/history';

  const isMethodsActive =
    (location.pathname === '/settings/billing' && location.search.includes('tab=methods')) ||
    location.pathname === '/settings/billing/methods';

  const isProfileActive =
    location.pathname === '/settings/account' ||
    location.pathname === '/settings/account/profile';

  const isSecurityActive = location.pathname === '/settings/account/security';
  const isApiKeysActive = location.pathname === '/settings/account/api-keys';

  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Sidebar Header with Brand and Settings Badge */}
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: '#5c3cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 800,
              }}
            >
              <Shield size={16} />
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>CloudPulse</span>
              <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--brand-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Settings Hub
              </span>
            </div>
          </div>
        </div>

        {/* Prominent Back to Dashboard Button */}
        <div style={{ padding: '0.85rem 0.85rem 0.35rem 0.85rem' }}>
          <button
            type="button"
            onClick={() => {
              navigate('/');
              onClose();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(92, 60, 246, 0.25)',
              background: 'rgba(92, 60, 246, 0.08)',
              color: 'var(--brand-primary)',
              fontSize: '0.825rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(92, 60, 246, 0.16)';
              e.currentTarget.style.borderColor = 'var(--brand-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(92, 60, 246, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(92, 60, 246, 0.25)';
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Sidebar Content Navigation */}
        <div className="sidebar-content">
          {/* Group 1: Billing & Plans */}
          <div className="nav-group">
            <div
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Receipt size={13} />
              <span>Billing & Payments</span>
            </div>

            <NavLink
              to="/settings/billing"
              end
              className={() => `nav-item ${isBillingActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Layers className="nav-item-icon" />
              <span>Subscriptions & Plans</span>
            </NavLink>

            <NavLink
              to="/settings/billing/history"
              className={() => `nav-item ${isHistoryActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Receipt className="nav-item-icon" />
              <span>Payment History</span>
            </NavLink>

            <NavLink
              to="/settings/billing/methods"
              className={() => `nav-item ${isMethodsActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <CreditCard className="nav-item-icon" />
              <span>Payment Methods</span>
            </NavLink>
          </div>

          {/* Group 2: Account & Security */}
          <div className="nav-group" style={{ marginTop: '0.5rem' }}>
            <div
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <User size={13} />
              <span>Account & Security</span>
            </div>

            <NavLink
              to="/settings/account"
              className={() => `nav-item ${isProfileActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <User className="nav-item-icon" />
              <span>Profile & Workspace</span>
            </NavLink>

            <NavLink
              to="/settings/account/security"
              className={() => `nav-item ${isSecurityActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Lock className="nav-item-icon" />
              <span>Security & 2FA</span>
            </NavLink>

            <NavLink
              to="/settings/account/api-keys"
              className={() => `nav-item ${isApiKeysActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Key className="nav-item-icon" />
              <span>API Keys & Tokens</span>
            </NavLink>
          </div>

          {/* Group 3: Quick Proxy Plans Link */}
          <div className="nav-group" style={{ marginTop: '0.5rem' }}>
            <div
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Zap size={13} />
              <span>Proxy Infrastructure</span>
            </div>

            <NavLink
              to="/plans"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Zap className="nav-item-icon" />
              <span>Browse All Plans</span>
            </NavLink>
          </div>
        </div>

        {/* Sidebar Footer with User Profile and Logout */}
        <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', width: '100%' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden', cursor: 'pointer', flex: 1 }}
              onClick={() => {
                navigate('/settings/account');
                onClose();
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: isSuperUser ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  flexShrink: 0,
                }}
              >
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name || 'Alex Mercer'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {user?.role || 'Owner'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
export default SettingsSidebar;
