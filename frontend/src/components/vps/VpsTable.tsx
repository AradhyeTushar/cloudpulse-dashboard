import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Copy,
  Check,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import { VpsInstance } from '../../types';
import { StatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Dropdown } from '../ui/Dropdown';
import { useToast } from '../../context/ToastContext';
import { copyToClipboard } from '../../utils/clipboard';

interface VpsTableProps {
  vpsList: VpsInstance[];
  onRestart?: (vps: VpsInstance) => void;
  onStop?: (vps: VpsInstance) => void;
  onDelete?: (vps: VpsInstance) => void;
  onSnapshot?: (vps: VpsInstance) => void;
  onRenew?: (vps: VpsInstance) => void;
  onUpgrade?: (vps: VpsInstance) => void;
  onGrantAccess?: (vps: VpsInstance) => void;
}

export const VpsTable: React.FC<VpsTableProps> = ({
  vpsList,
  onRenew,
  onUpgrade,
  onGrantAccess,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Expanded rows state (by default first row is expanded matching screenshot)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
    'srv-1': true,
    'srv1920898': true,
  });

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyIp = async (ip: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await copyToClipboard(ip);
    setCopiedId(id);
    showToast('IP Copied', `${ip} copied to clipboard.`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getOsIcon = (os: string) => {
    switch (os.toLowerCase()) {
      case 'ubuntu':
        return (
          <div className="os-icon ubuntu" title="Ubuntu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="5.5" r="1.8" />
              <circle cx="6.5" cy="15.5" r="1.8" />
              <circle cx="17.5" cy="15.5" r="1.8" />
            </svg>
          </div>
        );
      case 'debian':
        return (
          <div className="os-icon debian" title="Debian">
            <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>D</span>
          </div>
        );
      default:
        return (
          <div className="os-icon almalinux" title="AlmaLinux / Linux">
            <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>L</span>
          </div>
        );
    }
  };

  const filteredList = vpsList.filter((vps) => {
    const matchesSearch =
      vps.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vps.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vps.ipAddress.includes(searchQuery);

    const matchesStatus = statusFilter === 'ALL' || vps.status.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="table-container">
      {/* Table Toolbar */}
      <div className="table-controls">
        <div className="search-input-wrap">
          <Search size={15} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by server name or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="RUNNING">Running</option>
            <option value="STOPPED">Stopped</option>
            <option value="PROVISIONING">Provisioning</option>
          </select>
        </div>
      </div>

      {/* Table Structure matching screenshot */}
      <div style={{ overflowX: 'auto' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '36px' }}></th>
              <th>
                <div className="th-content">
                  <span>Details</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th>
                <div className="th-content">
                  <span>IP address</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th>
                <div className="th-content">
                  <span>Status</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th>
                <div className="th-content">
                  <span>Expiration date</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    No VPS instances found
                  </div>
                  <div style={{ fontSize: '0.8125rem' }}>
                    {searchQuery ? 'Try adjusting your search criteria.' : 'Create your first VPS instance to get started.'}
                  </div>
                </td>
              </tr>
            ) : (
              filteredList.map((vps) => {
                const isCopied = copiedId === vps.id;
                const isExpanded = !!expandedRows[vps.id];

                const menuItems = [
                  {
                    label: 'Settings',
                    onClick: () => navigate(`/vps/${vps.id}/settings`),
                  },
                  {
                    label: 'Server usage',
                    onClick: () => navigate(`/vps/${vps.id}`),
                  },
                  {
                    label: 'OS & Panel settings',
                    onClick: () => navigate(`/vps/${vps.id}/os-panel`),
                  },
                  {
                    label: 'Renew',
                    onClick: () => {
                      if (onRenew) onRenew(vps);
                      else showToast('Renew VPS', `Renewal invoice generated for ${vps.hostname}.`, 'success');
                    },
                  },
                  {
                    label: 'Upgrade',
                    onClick: () => {
                      if (onUpgrade) onUpgrade(vps);
                      else showToast('Upgrade VPS', `Select a higher compute plan for ${vps.hostname}.`, 'info');
                    },
                  },
                  {
                    label: 'Grant access',
                    onClick: () => {
                      if (onGrantAccess) onGrantAccess(vps);
                      else showToast('Grant Access', `Invite a team member or client to manage ${vps.hostname}.`, 'info');
                    },
                  },
                ];

                return (
                  <React.Fragment key={vps.id}>
                    {/* Main Server Row */}
                    <tr
                      style={{ cursor: 'pointer', borderBottom: isExpanded ? 'none' : undefined }}
                      onClick={() => navigate(`/vps/${vps.id}`)}
                    >
                      <td onClick={(e) => toggleExpand(vps.id, e)} style={{ width: '36px', paddingRight: '0' }}>
                        <button
                          className="btn-icon"
                          style={{ width: '26px', height: '26px', border: 'none', background: 'transparent' }}
                          aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                        >
                          {isExpanded ? (
                            <ChevronUp size={16} color="var(--brand-primary)" />
                          ) : (
                            <ChevronDown size={16} color="var(--text-dim)" />
                          )}
                        </button>
                      </td>

                      {/* Details: OS icon + Hostname + Plan */}
                      <td>
                        <div className="server-cell">
                          {getOsIcon(vps.os)}
                          <div>
                            <div className="server-info-title">{vps.hostname}</div>
                            <div className="server-info-sub">{vps.plan}</div>
                          </div>
                        </div>
                      </td>

                      {/* IP Address + Copy Icon */}
                      <td>
                        <div className="ip-cell">
                          <span>{vps.ipAddress}</span>
                          <button
                            className="copy-btn"
                            title="Copy IP Address"
                            onClick={(e) => handleCopyIp(vps.ipAddress, vps.id, e)}
                          >
                            {isCopied ? <Check size={14} color="var(--status-running)" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td>
                        <StatusBadge status={vps.status} />
                      </td>

                      {/* Expiration Date */}
                      <td>
                        <span
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--bg-subtle)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.775rem',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          {vps.expiresAt}
                        </span>
                      </td>

                      {/* Manage Button + Kebab Menu */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="actions-cell">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="btn-pill"
                            onClick={() => navigate(`/vps/${vps.id}`)}
                          >
                            Manage
                          </Button>

                          <Dropdown
                            align="right"
                            trigger={
                              <button className="btn-icon" style={{ width: '32px', height: '32px' }} aria-label="More options">
                                <MoreVertical size={16} />
                              </button>
                            }
                            items={menuItems}
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Telemetry Tray Row matching Screenshot */}
                    {isExpanded && (
                      <tr className="table-expand-row">
                        <td colSpan={6}>
                          <div className="vps-row-metrics-tray">
                            {/* CPU usage */}
                            <div className="tray-metric-item">
                              <span className="tray-metric-label">CPU usage</span>
                              <div className="tray-progress-row">
                                <div className="tray-progress-track">
                                  <div className="tray-progress-bar" style={{ width: '12%' }} />
                                </div>
                                <span className="tray-metric-val">12%</span>
                              </div>
                            </div>

                            {/* Memory usage */}
                            <div className="tray-metric-item">
                              <span className="tray-metric-label">Memory usage</span>
                              <div className="tray-progress-row">
                                <div className="tray-progress-track">
                                  <div className="tray-progress-bar" style={{ width: '24%' }} />
                                </div>
                                <span className="tray-metric-val">24%</span>
                              </div>
                            </div>

                            {/* Disk usage */}
                            <div className="tray-metric-item">
                              <span className="tray-metric-label">Disk usage</span>
                              <div className="tray-progress-row">
                                <div className="tray-progress-track">
                                  <div className="tray-progress-bar" style={{ width: '28%' }} />
                                </div>
                                <span className="tray-metric-val">28%</span>
                              </div>
                            </div>

                            {/* Bandwidth usage */}
                            <div className="tray-metric-item">
                              <span className="tray-metric-label">Bandwidth usage</span>
                              <div className="tray-progress-row">
                                <div className="tray-progress-track">
                                  <div className="tray-progress-bar" style={{ width: '0.09%' }} />
                                </div>
                                <span className="tray-metric-val">0.09%</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
