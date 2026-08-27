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
  ChevronDown,
  ChevronRight,
  Shield,
  ArrowRightLeft,
  Lock,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [proxyOpen, setProxyOpen] = useState(true);
  const [billingOpen, setBillingOpen] = useState(true);
  const [accountOpen, setAccountOpen] = useState(true);

  const isSuperUser = user?.role === 'admin' || user?.role === 'owner';
  const isAdminView = location.pathname.startsWith('/admin');

  const handleLogout = async () => {
    await logout();
    showToast('Signed Out', 'You have been safely signed out.', 'info');
    navigate('/login');
  };

  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Sidebar Header with Brand Logo */}
        <div className="sidebar-header">
          <NavLink to="/" className="brand-link" onClick={onClose} title="Go to Dashboard">
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
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>CloudPulse</span>
          </NavLink>
        </div>

        {/* Portal Switcher for Super Admins */}
        {isSuperUser && (
          <div style={{ padding: '0.75rem 1rem 0.25rem 1rem' }}>
            <button
              type="button"
              onClick={() => {
                if (isAdminView) {
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
                padding: '0.45rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: isAdminView ? 'rgba(239, 68, 68, 0.1)' : 'rgba(92, 60, 246, 0.1)',
                color: isAdminView ? '#ef4444' : '#5c3cf6',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'uppercase',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Shield size={13} />
                <span>{isAdminView ? 'Admin Portal' : 'Customer View'}</span>
              </div>
              <ArrowRightLeft size={12} />
            </button>
          </div>
        )}

        {/* Sidebar Content Navigation */}
        <div className="sidebar-content">
          {isAdminView && isSuperUser ? (
            /* Admin View */
            <div className="nav-group">
              <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Admin Management
              </div>

              <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <Users className="nav-item-icon" />
                <span>Users & Tenants</span>
              </NavLink>

              <NavLink to="/admin/plans" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <Layers className="nav-item-icon" />
                <span>Plans & Pricing</span>
              </NavLink>

              <NavLink to="/admin/providers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <Server className="nav-item-icon" />
                <span>Proxy Providers</span>
              </NavLink>

              <NavLink to="/admin/sessions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <Radio className="nav-item-icon" />
                <span>Active Sessions</span>
              </NavLink>

              <NavLink to="/admin/abuse" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <ShieldAlert className="nav-item-icon" />
                <span>Abuse & Security</span>
              </NavLink>

              <NavLink to="/admin/health" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <Activity className="nav-item-icon" />
                <span>Gateway Health</span>
              </NavLink>
            </div>
          ) : (
            /* Standard Customer View */
            <div className="nav-group">
              {/* Dashboard */}
              <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <LayoutDashboard className="nav-item-icon" />
                <span>Dashboard</span>
              </NavLink>

              {/* Residential Proxy */}
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setProxyOpen(!proxyOpen)}
                  className="nav-item"
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Zap className="nav-item-icon" />
                    <span style={{ fontWeight: 600 }}>Residential Proxy</span>
                  </div>
                  {proxyOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {proxyOpen && (
                  <div style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.1rem', marginTop: '0.2rem' }}>
                    <NavLink to="/proxy/overview" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                      <LayoutDashboard size={14} className="nav-item-icon" />
                      <span>Overview</span>
                    </NavLink>
                    <NavLink to="/proxy/credentials" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                      <Key size={14} className="nav-item-icon" />
                      <span>Credentials</span>
                    </NavLink>
                    <NavLink to="/proxy/sessions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                      <Radio size={14} className="nav-item-icon" />
                      <span>Sessions</span>
                    </NavLink>
                    <NavLink to="/proxy/locations" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                      <Globe size={14} className="nav-item-icon" />
                      <span>Locations (195+)</span>
                    </NavLink>
                    <NavLink to="/proxy/usage" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                      <BarChart2 size={14} className="nav-item-icon" />
                      <span>Usage Analytics</span>
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Billing & Plans */}
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setBillingOpen(!billingOpen)}
                  className="nav-item"
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Receipt className="nav-item-icon" />
                    <span style={{ fontWeight: 600 }}>Billing & Plans</span>
                  </div>
                  {billingOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {billingOpen && (
                  <div style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.1rem', marginTop: '0.2rem' }}>
                    <NavLink to="/plans" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                      <Layers size={14} className="nav-item-icon" />
                      <span>Proxy Plans</span>
                    </NavLink>
                    <NavLink
                      to="/billing?tab=subscriptions"
                      className={() => `nav-item ${location.pathname === '/billing' && (!location.search || location.search.includes('tab=subscriptions')) ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Receipt size={14} className="nav-item-icon" />
                      <span>Subscriptions</span>
                    </NavLink>
                    <NavLink
                      to="/billing?tab=history"
                      className={() => `nav-item ${location.pathname === '/billing' && location.search.includes('tab=history') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Server size={14} className="nav-item-icon" />
                      <span>Payment History</span>
                    </NavLink>
                    <NavLink
                      to="/billing?tab=methods"
                      className={() => `nav-item ${location.pathname === '/billing' && location.search.includes('tab=methods') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Key size={14} className="nav-item-icon" />
                      <span>Payment Methods</span>
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Account */}
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setAccountOpen(!accountOpen)}
                  className="nav-item"
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <User className="nav-item-icon" />
                    <span style={{ fontWeight: 600 }}>Account</span>
                  </div>
                  {accountOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {accountOpen && (
                  <div style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.1rem', marginTop: '0.2rem' }}>
                    <NavLink to="/account/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                      <User size={14} className="nav-item-icon" />
                      <span>Profile</span>
                    </NavLink>
                    <NavLink to="/account/api-keys" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                      <Key size={14} className="nav-item-icon" />
                      <span>API Keys</span>
                    </NavLink>
                    <NavLink to="/account/security" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                      <Lock size={14} className="nav-item-icon" />
                      <span>Security & 2FA</span>
                    </NavLink>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer with User Profile and Logout */}
        <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', width: '100%' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden', cursor: 'pointer', flex: 1 }}
              onClick={() => {
                navigate('/account/profile');
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
