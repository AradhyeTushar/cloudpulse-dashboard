import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Home,
  Globe,
  Settings,
  MoreHorizontal,
  LayoutGrid,
  Box,
  Monitor,
  Shield,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  BookOpen,
  ArrowLeft,
  Server,
  Receipt,
  History,
  Wallet,
  User,
  Users,
  Activity,
  Bell,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { MOCK_USER } from '../../data/mock-user';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [dockerMenuOpen, setDockerMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [osMenuOpen, setOsMenuOpen] = useState(false);
  const [backupsMenuOpen, setBackupsMenuOpen] = useState(false);
  const [securityMenuOpen, setSecurityMenuOpen] = useState(false);

  // Check route contexts
  const vpsMatch = location.pathname.match(/^\/vps\/([^/]+)/);
  const currentVpsId = vpsMatch ? vpsMatch[1] : null;
  const isBillingContext = location.pathname.startsWith('/billing');
  const isSettingsContext = location.pathname.startsWith('/settings');

  const currentBillingTab = searchParams.get('tab') || 'subscriptions';
  const currentSettingsTab = searchParams.get('tab') || 'account-info';

  const handleBillingNav = (tab: string) => {
    navigate(`/billing?tab=${tab}`);
    onClose();
  };

  const handleSettingsNav = (tab: string) => {
    navigate(`/settings?tab=${tab}`);
    onClose();
  };

  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <NavLink to="/" className="brand-link" onClick={onClose} title="Go to Dashboard">
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

        {/* Sidebar Content */}
        <div className="sidebar-content">
          {/* =================================================================
              SCENARIO 1: Inside a Specific VPS
             ================================================================= */}
          {currentVpsId ? (
            <div className="nav-group">
              {/* Back Link to VPS List */}
              <button
                className="back-to-vps-link"
                onClick={() => {
                  navigate('/vps');
                  onClose();
                }}
              >
                <ArrowLeft size={13} />
                <span>All VPS servers</span>
              </button>

              {/* Overview */}
              <NavLink
                to={`/vps/${currentVpsId}`}
                end
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <LayoutGrid className="nav-item-icon" />
                <span>Overview</span>
              </NavLink>

              {/* Docker Manager */}
              <div>
                <button
                  className={`nav-item ${location.pathname.includes('/docker') ? 'active' : ''}`}
                  onClick={() => setDockerMenuOpen(!dockerMenuOpen)}
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Box className="nav-item-icon" />
                    <span>Docker Manager</span>
                  </div>
                  {dockerMenuOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {dockerMenuOpen && (
                  <div className="nav-submenu">
                    <NavLink
                      to={`/vps/${currentVpsId}/docker/applications`}
                      className={({ isActive }) =>
                        `nav-submenu-item ${isActive || location.pathname.endsWith('/docker') ? 'active' : ''}`
                      }
                      onClick={onClose}
                    >
                      Applications
                    </NavLink>
                    <NavLink
                      to={`/vps/${currentVpsId}/docker/credentials`}
                      className={({ isActive }) => `nav-submenu-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      Credentials
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Settings */}
              <div>
                <button
                  className={`nav-item ${location.pathname.includes('/settings') ? 'active' : ''}`}
                  onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Settings className="nav-item-icon" />
                    <span>Settings</span>
                  </div>
                  {settingsMenuOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {settingsMenuOpen && (
                  <div className="nav-submenu">
                    <NavLink
                      to={`/vps/${currentVpsId}/settings/main`}
                      className={({ isActive }) =>
                        `nav-submenu-item ${isActive || location.pathname.endsWith('/settings') ? 'active' : ''}`
                      }
                      onClick={onClose}
                    >
                      Main settings
                    </NavLink>
                    <NavLink
                      to={`/vps/${currentVpsId}/settings/ip-address`}
                      className={({ isActive }) => `nav-submenu-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      IP address
                    </NavLink>
                    <NavLink
                      to={`/vps/${currentVpsId}/settings/emergency-mode`}
                      className={({ isActive }) => `nav-submenu-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      Emergency mode
                    </NavLink>
                    <NavLink
                      to={`/vps/${currentVpsId}/settings/ssh-keys`}
                      className={({ isActive }) => `nav-submenu-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      SSH keys
                    </NavLink>
                  </div>
                )}
              </div>

              {/* OS & Panel */}
              <div>
                <button
                  className={`nav-item ${location.pathname.includes('/os-panel') ? 'active' : ''}`}
                  onClick={() => setOsMenuOpen(!osMenuOpen)}
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Monitor className="nav-item-icon" />
                    <span>OS & Panel</span>
                  </div>
                  {osMenuOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {osMenuOpen && (
                  <div className="nav-submenu">
                    <NavLink
                      to={`/vps/${currentVpsId}/os-panel/operating-system`}
                      className={({ isActive }) =>
                        `nav-submenu-item ${isActive || location.pathname.endsWith('/os-panel') ? 'active' : ''}`
                      }
                      onClick={onClose}
                    >
                      Operating System
                    </NavLink>
                    <NavLink
                      to={`/vps/${currentVpsId}/os-panel/licenses`}
                      className={({ isActive }) => `nav-submenu-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      Licenses
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Backups & Monitoring */}
              <div>
                <button
                  className={`nav-item ${location.pathname.includes('/backups') ? 'active' : ''}`}
                  onClick={() => setBackupsMenuOpen(!backupsMenuOpen)}
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <RefreshCw className="nav-item-icon" />
                    <span>Backups & Monitoring</span>
                  </div>
                  {backupsMenuOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {backupsMenuOpen && (
                  <div className="nav-submenu">
                    <NavLink
                      to={`/vps/${currentVpsId}/backups/snapshots`}
                      className={({ isActive }) =>
                        `nav-submenu-item ${isActive || location.pathname.endsWith('/backups') ? 'active' : ''}`
                      }
                      onClick={onClose}
                    >
                      Snapshots & Backups
                    </NavLink>
                    <NavLink
                      to={`/vps/${currentVpsId}/backups/usage`}
                      className={({ isActive }) => `nav-submenu-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      Server Usage
                    </NavLink>
                    <NavLink
                      to={`/vps/${currentVpsId}/backups/actions`}
                      className={({ isActive }) => `nav-submenu-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      Latest Actions
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Security */}
              <div>
                <button
                  className={`nav-item ${location.pathname.includes('/security') ? 'active' : ''}`}
                  onClick={() => setSecurityMenuOpen(!securityMenuOpen)}
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Shield className="nav-item-icon" />
                    <span>Security</span>
                  </div>
                  {securityMenuOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {securityMenuOpen && (
                  <div className="nav-submenu">
                    <NavLink
                      to={`/vps/${currentVpsId}/security/firewall`}
                      className={({ isActive }) =>
                        `nav-submenu-item ${isActive || location.pathname.endsWith('/security') ? 'active' : ''}`
                      }
                      onClick={onClose}
                    >
                      Firewall
                    </NavLink>
                    <NavLink
                      to={`/vps/${currentVpsId}/security/malware`}
                      className={({ isActive }) => `nav-submenu-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      Malware Scanner
                    </NavLink>
                  </div>
                )}
              </div>

              {/* DNS Manager */}
              <NavLink
                to={`/vps/${currentVpsId}/dns-manager`}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Globe className="nav-item-icon" />
                <span>DNS Manager</span>
              </NavLink>
            </div>
          ) : isBillingContext ? (
            /* =================================================================
               SCENARIO 2: Inside Billing Section (Screenshot 1)
             ================================================================= */
            <div className="nav-group">
              {/* Back to Dashboard */}
              <button
                className="back-to-vps-link"
                onClick={() => {
                  navigate('/');
                  onClose();
                }}
              >
                <ArrowLeft size={13} />
                <span>Back to Dashboard</span>
              </button>

              <button
                className={`nav-item ${currentBillingTab === 'subscriptions' ? 'active' : ''}`}
                onClick={() => handleBillingNav('subscriptions')}
              >
                <Receipt className="nav-item-icon" />
                <span>Subscriptions</span>
              </button>

              <button
                className={`nav-item ${currentBillingTab === 'history' ? 'active' : ''}`}
                onClick={() => handleBillingNav('history')}
              >
                <History className="nav-item-icon" />
                <span>Payment history</span>
              </button>

              <button
                className={`nav-item ${currentBillingTab === 'methods' ? 'active' : ''}`}
                onClick={() => handleBillingNav('methods')}
              >
                <Wallet className="nav-item-icon" />
                <span>Payment methods</span>
              </button>
            </div>
          ) : isSettingsContext ? (
            /* =================================================================
               SCENARIO 3: Inside Profile / Settings
             ================================================================= */
            <div className="nav-group">
              {/* Back to Dashboard */}
              <button
                className="back-to-vps-link"
                onClick={() => {
                  navigate('/');
                  onClose();
                }}
              >
                <ArrowLeft size={13} />
                <span>Back to Dashboard</span>
              </button>

              <button
                className={`nav-item ${currentSettingsTab === 'account-info' ? 'active' : ''}`}
                onClick={() => handleSettingsNav('account-info')}
              >
                <User className="nav-item-icon" />
                <span>Account information</span>
              </button>

              <button
                className={`nav-item ${currentSettingsTab === 'account-sharing' ? 'active' : ''}`}
                onClick={() => handleSettingsNav('account-sharing')}
              >
                <Users className="nav-item-icon" />
                <span>Account sharing</span>
              </button>

              <button
                className={`nav-item ${currentSettingsTab === 'security' ? 'active' : ''}`}
                onClick={() => handleSettingsNav('security')}
              >
                <Shield className="nav-item-icon" />
                <span>Security</span>
              </button>

              <button
                className={`nav-item ${currentSettingsTab === 'activity' ? 'active' : ''}`}
                onClick={() => handleSettingsNav('activity')}
              >
                <Activity className="nav-item-icon" />
                <span>Account activity</span>
              </button>

              <button
                className={`nav-item ${currentSettingsTab === 'notifications' ? 'active' : ''}`}
                onClick={() => handleSettingsNav('notifications')}
              >
                <Bell className="nav-item-icon" />
                <span>Notification settings</span>
              </button>
            </div>
          ) : (
            /* =================================================================
               SCENARIO 4: Primary Platform Navigation
             ================================================================= */
            <div className="nav-group">
              <NavLink
                to="/"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
                end
              >
                <Home className="nav-item-icon" />
                <span>Home</span>
              </NavLink>

              <NavLink
                to="/vps"
                className={({ isActive }) =>
                  `nav-item ${isActive || location.pathname.startsWith('/vps') ? 'active' : ''}`
                }
                onClick={onClose}
              >
                <Server className="nav-item-icon" />
                <span>VPS</span>
              </NavLink>

              <NavLink
                to="/billing"
                className={({ isActive }) =>
                  `nav-item ${isActive || location.pathname.startsWith('/billing') ? 'active' : ''}`
                }
                onClick={onClose}
              >
                <Receipt className="nav-item-icon" />
                <span>Subscriptions</span>
              </NavLink>

              <NavLink
                to="/settings"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Settings className="nav-item-icon" />
                <span>Settings</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button
            className="user-profile-btn"
            onClick={() => {
              navigate('/settings');
              onClose();
            }}
          >
            <div className="user-avatar">
              {MOCK_USER.name.charAt(0)}
            </div>
            <div className="user-info">
              <div className="user-name">{MOCK_USER.name}</div>
              <div className="user-role">{MOCK_USER.workspaceName}</div>
            </div>
            <MoreHorizontal size={16} color="var(--text-dim)" />
          </button>
        </div>
      </aside>
    </>
  );
};
