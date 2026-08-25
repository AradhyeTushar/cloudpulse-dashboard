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
  Sliders,
  Receipt,
  Home,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Dropdown } from '../ui/Dropdown';
import { MOCK_USER } from '../../data/mock-user';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const { showToast } = useToast();

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') {
      return [{ label: 'Dashboard', to: '/' }];
    }
    if (path.startsWith('/vps')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length === 1) {
        return [
          { label: 'Dashboard', to: '/' },
          { label: 'VPS', to: '/vps' },
        ];
      }
      return [
        { label: 'Dashboard', to: '/' },
        { label: 'VPS', to: '/vps' },
        { label: parts[1], to: `/vps/${parts[1]}` },
      ];
    }
    if (path.startsWith('/billing')) {
      return [
        { label: 'Dashboard', to: '/' },
        { label: 'Billing', to: '/billing' },
        { label: 'Subscriptions', to: '/billing' },
      ];
    }
    if (path.startsWith('/settings') || path.startsWith('/profile')) {
      return [
        { label: 'Dashboard', to: '/' },
        { label: 'Profile', to: '/settings' },
        { label: 'Account information', to: '/settings' },
      ];
    }
    return [{ label: 'Dashboard', to: '/' }];
  };

  const breadcrumbs = getBreadcrumbs();

  const userMenuItems = [
    {
      label: 'Dashboard',
      icon: <Home size={15} />,
      onClick: () => navigate('/'),
    },
    {
      label: 'Account information',
      icon: <User size={15} />,
      onClick: () => navigate('/settings'),
    },
    {
      label: 'Subscriptions & Billing',
      icon: <Receipt size={15} />,
      onClick: () => navigate('/billing'),
    },
    {
      label: 'Two-Factor Authentication',
      icon: <Shield size={15} />,
      onClick: () => navigate('/settings?tab=security'),
    },
    {
      label: 'Sign Out',
      icon: <LogOut size={15} />,
      onClick: () => showToast('Session Ended', 'You have been logged out (mock action).', 'info'),
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
          onClick={() => showToast('Command Palette', 'Search servers, domains, and actions (⌘K)', 'info')}
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
          onClick={() => showToast('Notifications', 'All server operations running smoothly.', 'info')}
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
