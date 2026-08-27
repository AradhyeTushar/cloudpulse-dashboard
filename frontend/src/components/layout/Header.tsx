import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  User,
  LogOut,
  Shield,
  Receipt,
  Sparkles,
  Gift,
  Sun,
  Moon,
  ChevronRight,
  Home,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Dropdown } from '../ui/Dropdown';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const { showToast } = useToast();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    showToast('Signed Out', 'You have been safely signed out.', 'info');
    navigate('/login');
  };

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') return [{ label: 'Dashboard', to: '/' }];
    if (path.startsWith('/billing')) {
      return [
        { label: 'Billing', to: '/billing' },
        { label: 'Subscriptions', to: '/billing' },
      ];
    }
    if (path.startsWith('/proxy')) {
      const parts = path.split('/').filter(Boolean);
      return [
        { label: 'Residential Proxy', to: '/proxy/overview' },
        { label: parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Overview', to: path },
      ];
    }
    if (path.startsWith('/account')) {
      const parts = path.split('/').filter(Boolean);
      return [
        { label: 'Account', to: '/account/profile' },
        { label: parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Profile', to: path },
      ];
    }
    return [{ label: 'Dashboard', to: '/' }];
  };

  const breadcrumbs = getBreadcrumbs();

  const userMenuItems = [
    {
      label: user?.name ? `${user.name} (${user.role || 'customer'})` : 'Account Profile',
      icon: <User size={15} />,
      onClick: () => navigate('/account/profile'),
    },
    {
      label: 'Subscriptions & Billing',
      icon: <Receipt size={15} />,
      onClick: () => navigate('/billing'),
    },
    {
      label: 'Security & 2FA',
      icon: <Shield size={15} />,
      onClick: () => navigate('/account/security'),
    },
    {
      label: 'Sign Out',
      icon: <LogOut size={15} />,
      onClick: handleLogout,
      danger: true,
      divider: true,
    },
  ];

  return (
    <header className="top-header">
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="mobile-menu-btn" onClick={onToggleSidebar} aria-label="Toggle Navigation">
          <Menu size={20} />
        </button>

        {/* Refer & Earn Banner */}
        <button
          type="button"
          onClick={() => showToast('Refer & Earn', 'Earn up to $180 by inviting friends!', 'success')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: '#f3e8ff',
            color: '#6b21a8',
            border: 'none',
            padding: '0.3rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.775rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Gift size={13} color="#7c3aed" />
          <span>Refer & earn up to $180</span>
        </button>

        {/* Breadcrumb Trail */}
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.to + idx}>
                {idx > 0 && <ChevronRight size={13} className="breadcrumb-separator" />}
                {isLast ? (
                  <span className="breadcrumb-item active">{crumb.label}</span>
                ) : (
                  <Link to={crumb.to} className="breadcrumb-item">
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Agent Button */}
        <button
          type="button"
          onClick={() => showToast('AI Agent', 'Hostinger AI Agent is active.', 'info')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '9999px',
            padding: '0.35rem 0.85rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          <Sparkles size={13} color="#7c3aed" />
          <span>Agent</span>
        </button>

        {/* Search Bar */}
        <button
          className="search-bar-trigger"
          onClick={() => showToast('Search', 'Search resources, proxies, and subscriptions', 'info')}
          aria-label="Search"
        >
          <Search size={15} />
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          className="header-icon-btn"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          title="Toggle color theme"
          aria-label="Toggle Theme"
        >
          {resolvedTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* User Avatar */}
        <Dropdown
          trigger={
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4b5563',
                cursor: 'pointer',
              }}
            >
              <User size={16} />
            </div>
          }
          items={userMenuItems}
          align="right"
        />
      </div>
    </header>
  );
};
