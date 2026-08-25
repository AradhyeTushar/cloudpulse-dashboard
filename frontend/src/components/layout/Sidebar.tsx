import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  Globe,
  Radio,
  BarChart2,
  Receipt,
  Key,
  User,
  Users,
  Layers,
  Server,
  ShieldAlert,
  Activity,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Shield,
  ArrowRightLeft,
  Lock,
} from 'lucide-react';
import { MOCK_USER } from '../../data/mock-user';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [proxyOpen, setProxyOpen] = useState(true);
  const [accountOpen, setAccountOpen] = useState(true);

  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <NavLink to="/" className="brand-link" onClick={onClose} title="Go to CloudPulse">
            <div className="brand-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m8 17 4 4 4-4" />
              </svg>
            </div>
            <span>CloudPulse</span>
          </NavLink>
        </div>

        {/* Portal Switcher Banner */}
        <div style={{ padding: '0.75rem 1rem 0.25rem 1rem' }}>
          <button
            onClick={() => {
              if (isAdmin) {
                navigate('/');
              } else {
                navigate('/admin/users');
              }
              onClose();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--bg-border)',
              background: isAdmin ? 'rgba(239, 68, 68, 0.08)' : 'rgba(92, 60, 246, 0.08)',
              color: isAdmin ? '#ef4444' : 'var(--brand-primary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Shield size={14} />
              <span>{isAdmin ? 'Admin Mode' : 'Customer Mode'}</span>
            </div>
            <ArrowRightLeft size={12} />
          </button>
        </div>

        {/* Sidebar Content Navigation */}
        <div className="sidebar-content">
          {isAdmin ? (
            /* =================================================================
               ADMIN PORTAL NAVIGATION
               ================================================================= */
            <div className="nav-group">
              <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Admin Controls
              </div>

              <NavLink
                to="/admin/users"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Users className="nav-item-icon" />
                <span>Users</span>
              </NavLink>

              <NavLink
                to="/admin/plans"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Layers className="nav-item-icon" />
                <span>Plans</span>
              </NavLink>

              <NavLink
                to="/admin/providers"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Server className="nav-item-icon" />
                <span>Providers</span>
              </NavLink>

              <NavLink
                to="/admin/sessions"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Radio className="nav-item-icon" />
                <span>Sessions</span>
              </NavLink>

              <NavLink
                to="/admin/abuse"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <ShieldAlert className="nav-item-icon" />
                <span>Abuse</span>
              </NavLink>

              <NavLink
                to="/admin/health"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Activity className="nav-item-icon" />
                <span>System Health</span>
              </NavLink>
            </div>
          ) : (
            /* =================================================================
               CUSTOMER PORTAL NAVIGATION
               ================================================================= */
            <div className="nav-group">
              {/* Dashboard */}
              <NavLink
                to="/"
                end
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <LayoutDashboard className="nav-item-icon" />
                <span>Dashboard</span>
              </NavLink>

              {/* PROXY SECTION */}
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setProxyOpen(!proxyOpen)}
                  className="nav-item"
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Zap className="nav-item-icon" />
                    <span style={{ fontWeight: 700 }}>Proxy</span>
                  </div>
                  {proxyOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {proxyOpen && (
                  <div style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.1rem', marginTop: '0.2rem' }}>
                    <NavLink
                      to="/proxy/overview"
                      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <LayoutDashboard size={14} className="nav-item-icon" />
                      <span>Overview</span>
                    </NavLink>

                    <NavLink
                      to="/proxy/credentials"
                      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Key size={14} className="nav-item-icon" />
                      <span>Credentials</span>
                    </NavLink>

                    <NavLink
                      to="/proxy/sessions"
                      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Radio size={14} className="nav-item-icon" />
                      <span>Sessions</span>
                    </NavLink>

                    <NavLink
                      to="/proxy/locations"
                      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Globe size={14} className="nav-item-icon" />
                      <span>Locations</span>
                    </NavLink>

                    <NavLink
                      to="/proxy/usage"
                      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <BarChart2 size={14} className="nav-item-icon" />
                      <span>Usage</span>
                    </NavLink>
                  </div>
                )}
              </div>

              {/* BILLING */}
              <div style={{ marginTop: '0.5rem' }}>
                <NavLink
                  to="/billing"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <Receipt className="nav-item-icon" />
                  <span>Billing</span>
                </NavLink>
              </div>

              {/* ACCOUNT SECTION */}
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setAccountOpen(!accountOpen)}
                  className="nav-item"
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <User className="nav-item-icon" />
                    <span style={{ fontWeight: 700 }}>Account</span>
                  </div>
                  {accountOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {accountOpen && (
                  <div style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.1rem', marginTop: '0.2rem' }}>
                    <NavLink
                      to="/account/profile"
                      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <User size={14} className="nav-item-icon" />
                      <span>Profile</span>
                    </NavLink>

                    <NavLink
                      to="/account/api-keys"
                      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Key size={14} className="nav-item-icon" />
                      <span>API Keys</span>
                    </NavLink>

                    <NavLink
                      to="/account/security"
                      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Lock size={14} className="nav-item-icon" />
                      <span>Security</span>
                    </NavLink>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button
            className="user-profile-btn"
            onClick={() => {
              navigate('/account/profile');
              onClose();
            }}
          >
            <div className="user-avatar">
              {MOCK_USER.name.charAt(0)}
            </div>
            <div className="user-info">
              <div className="user-name">{MOCK_USER.name}</div>
              <div className="user-role">{isAdmin ? 'Super Admin' : MOCK_USER.workspaceName}</div>
            </div>
            <MoreHorizontal size={16} color="var(--text-dim)" />
          </button>
        </div>
      </aside>
    </>
  );
};
