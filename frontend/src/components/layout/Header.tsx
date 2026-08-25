import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronRight,
  User,
  LogOut,
  Shield,
  Receipt,
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
    showToast('Signed Out', 'You have been safely signed out of CloudPulse.', 'info');
    navigate('/login');
  };

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') {
      return [{ label: 'Dashboard', to: '/' }];
    }
    if (path.startsWith('/admin')) {
      const parts = path.split('/').filter(Boolean);
      return [
        { label: 'Admin Portal', to: '/admin/users' },
        { label: parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Overview', to: path },
      ];
    }
    if (path.startsWith('/proxy')) {
      const parts = path.split('/').filter(Boolean);
      return [
        { label: 'Proxy Suite', to: '/proxy/overview' },
        { label: parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Overview', to: path },
      ];
    }
    if (path.startsWith('/billing')) {
      return [
        { label: 'Billing', to: '/billing' },
        { label: 'Subscriptions', to: '/billing' },
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
      label: 'Proxy Overview',
      icon: <Home size={15} />,
      onClick: () => navigate('/proxy/overview'),
    },
    {
      label: 'Subscriptions & Billing',
      icon: <Receipt size={15} />,
      onClick: () => navigate('/billing'),
    },
    {
      label: 'Security & API Keys',
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
      <div className="header-left">
        <button className="mobile-menu-btn" onClick={onToggleSidebar} aria-label="Toggle Navigation">
          <Menu size={20} />
        </button>

        <nav className="breadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.to + idx}>
                {idx > 0 && <ChevronRight size={14} className="breadcrumb-separator" />}
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

      <div className="header-right">
        {/* Quick Search Bar */}
        <button
          className="search-bar-trigger"
          onClick={() => showToast('Search', 'Search proxy endpoints, sessions, or user plans', 'info')}
        >
          <Search size={14} />
          <span style={{ display: 'none', minWidth: '80px' }} className="d-md-inline">
            Search...
          </span>
          <span className="kbd-shortcut">⌘K</span>
        </button>

        {/* Notifications Icon with Indicator */}
        <button
          className="header-icon-btn"
          onClick={() => showToast('System Telemetry', 'All 5 gateway clusters operating at nominal latency.', 'info')}
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span className="notification-dot" />
        </button>

        {/* Theme Quick Switcher */}
        <button
          className="header-icon-btn"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle Theme"
          title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {resolvedTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* User Account Avatar Dropdown */}
        <Dropdown
          align="right"
          trigger={
            <button className="header-icon-btn" style={{ background: 'var(--bg-subtle)' }} aria-label="User Menu">
              <User size={17} />
            </button>
          }
          items={userMenuItems}
        />
      </div>
    </header>
  );
};
