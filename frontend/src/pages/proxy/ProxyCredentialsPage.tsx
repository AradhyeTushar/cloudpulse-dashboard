import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Key, Globe, Shield, Zap, AlertCircle, Info } from 'lucide-react';
import { proxyService } from '../../services/proxyService';
import { ProxyEndpointConfig, ProxyType, ProxyProtocol, ProxyRotationMode, ProxyStatus } from '../../types';
import { ProxyCredentialCard } from '../../components/proxy/ProxyCredentialCard';
import { LocationSelector } from '../../components/proxy/LocationSelector';
import { SessionSettings } from '../../components/proxy/SessionSettings';
import { PlanUpgradeModal } from '../../components/proxy/PlanUpgradeModal';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { ProxyPlanConfig } from '../../config/proxyPlans';
import { detectDeviceIP } from '../../utils/deviceIp';

export const ProxyCredentialsPage: React.FC = () => {
  const { showToast } = useToast();
  const [endpoints, setEndpoints] = useState<ProxyEndpointConfig[]>(() => proxyService.getEndpoints());
  const [summary, setSummary] = useState(() => proxyService.getDashboardUsageSummary());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create Form State
  const [name, setName] = useState('');
  const [proxyType, setProxyType] = useState<ProxyType>('residential');
  const [protocol, setProtocol] = useState<ProxyProtocol>('http');
  const [rotationMode, setRotationMode] = useState<ProxyRotationMode>('rotating');
  const [sessionDurationMin, setSessionDurationMin] = useState(10);
  const [targetCountry, setTargetCountry] = useState('India');
  const [targetCountryCode, setTargetCountryCode] = useState('IN');
  const [ipWhitelist, setIpWhitelist] = useState<string[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);

  const refreshState = () => {
    setEndpoints(proxyService.getEndpoints());
    setSummary(proxyService.getDashboardUsageSummary());
  };

  // IP Checker & Multi-Proxy IP Block tool state
  const [testClientIP, setTestClientIP] = useState('110.227.184.49');
  const [showBulkIpModal, setShowBulkIpModal] = useState(false);
  const [bulkIpText, setBulkIpText] = useState('110.227.184.49');

  useEffect(() => {
    detectDeviceIP().then((ip) => {
      setTestClientIP(ip);
      setBulkIpText(ip);
    });

    const handlePlanUpdate = () => {
      refreshState();
    };
    const handleEndpointsUpdate = () => {
      refreshState();
    };
    window.addEventListener('cloudpulse_plan_updated', handlePlanUpdate);
    window.addEventListener('proxy_plan_updated', handlePlanUpdate);
    window.addEventListener('proxy_endpoints_updated', handleEndpointsUpdate);
    return () => {
      window.removeEventListener('cloudpulse_plan_updated', handlePlanUpdate);
      window.removeEventListener('proxy_plan_updated', handlePlanUpdate);
      window.removeEventListener('proxy_endpoints_updated', handleEndpointsUpdate);
    };
  }, []);

  const handleSelectPlan = (plan: ProxyPlanConfig) => {
    proxyService.upgradePlan(plan.id);
    refreshState();
    setShowUpgradeModal(false);
    showToast('Plan Upgraded', `Activated ${plan.name} plan. You now have ${plan.maxProxies} proxy slots.`, 'success');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreateError(null);

    try {
      const newEndpoint = proxyService.createEndpoint({
        name,
        proxyType,
        protocol,
        rotationMode,
        sessionDurationMin,
        country: targetCountry,
        countryCode: targetCountryCode,
        ipWhitelist,
      });

      refreshState();
      setShowCreateModal(false);
      showToast('Credentials Created', `Created proxy endpoint: ${newEndpoint.name}`, 'success');

      // Reset Form
      setName('');
      setRotationMode('rotating');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create proxy endpoint');
      showToast('Plan Limit Reached', err.message || 'Unable to create proxy slot', 'error');
    }
  };

  const handleDelete = (id: string, name: string) => {
    proxyService.deleteEndpoint(id);
    refreshState();
    showToast('Endpoint Deleted', `Deleted ${name}`, 'info');
  };

  const filtered = endpoints.filter((ep) => {
    const matchesSearch =
      ep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.username.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && (ep.status || 'Active').toLowerCase() === statusFilter.toLowerCase();
  });

  const handleApplyBulkIPWhitelist = (ipText: string) => {
    const parsed = ipText ? ipText.split(',').map((s) => s.trim()).filter(Boolean) : [];
    proxyService.bulkUpdateIPWhitelist([], parsed);
    refreshState();
    setShowBulkIpModal(false);
    showToast('IP Blocks Applied', `Updated IP whitelist across all ${endpoints.length} proxies.`, 'success');
  };

  const isAtSlotCapacity = summary.proxyUsage.available <= 0;

  return (
    <div className="content-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Proxy Credentials & Endpoints
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Generate authenticated proxy entry points, configure IP blocks / whitelists, and monitor active plan limits.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => setShowBulkIpModal(true)}>
            <Shield size={14} style={{ marginRight: '0.35rem' }} />
            Bulk IP Blocks
          </Button>
          <Button variant="secondary" onClick={() => setShowUpgradeModal(true)}>
            <Zap size={14} style={{ marginRight: '0.35rem' }} />
            Upgrade Plan
          </Button>
          <Button variant="primary" onClick={() => { setCreateError(null); setShowCreateModal(true); }}>
            <Plus size={15} style={{ marginRight: '0.4rem' }} />
            Create New Endpoint
          </Button>
        </div>
      </div>

      {/* Check My IP & IP Blocks Live Checker Tool */}
      <div
        className="card"
        style={{
          padding: '1.2rem',
          marginBottom: '1.25rem',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(92, 60, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
              <Globe size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  IP Blocks & Whitelist Inspector
                </span>
                <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 700, padding: '0.12rem 0.45rem', borderRadius: '4px' }}>
                  Live Checker
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Detected Device IP: <strong style={{ color: 'var(--brand-primary)' }}>{testClientIP}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleApplyBulkIPWhitelist(testClientIP)}
              style={{
                background: 'rgba(92, 60, 246, 0.1)',
                border: '1px solid rgba(92, 60, 246, 0.25)',
                color: 'var(--brand-primary)',
                fontSize: '0.775rem',
                fontWeight: 700,
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Whitelist My Device IP on All Proxies ({testClientIP})
            </button>
            <button
              type="button"
              onClick={() => handleApplyBulkIPWhitelist('')}
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontSize: '0.775rem',
                fontWeight: 600,
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Allow All IPs (Open Access)
            </button>
          </div>
        </div>

        {/* Live IP Test Input */}
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', background: 'var(--bg-subtle)', padding: '0.6rem 0.85rem', borderRadius: '6px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            Test Client IP / Block:
          </span>
          <input
            type="text"
            value={testClientIP}
            onChange={(e) => setTestClientIP(e.target.value)}
            placeholder="Enter Client IP to check authorization (e.g. 110.227.184.49)"
            style={{
              flex: 1,
              padding: '0.35rem 0.65rem',
              fontSize: '0.8rem',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="button"
            onClick={() => setTestClientIP('110.227.184.49')}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--brand-primary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Use My IP
          </button>
        </div>

        {/* Multi-Proxy Authorization Breakdown */}
        {testClientIP.trim() && endpoints.length > 0 && (
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {endpoints.map((ep) => {
              const testResult = proxyService.testClientIPAgainstWhitelist(testClientIP, ep.ipWhitelist || []);
              return (
                <div
                  key={ep.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.35rem 0.65rem',
                    background: testResult.allowed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                    borderLeft: testResult.allowed ? '3px solid #10b981' : '3px solid #ef4444',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{ep.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>({ep.username})</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Whitelist: {(!ep.ipWhitelist || ep.ipWhitelist.length === 0) ? 'None (Open)' : ep.ipWhitelist.join(', ')}
                    </span>
                  </div>
                  <span
                    style={{
                      fontWeight: 700,
                      padding: '0.12rem 0.45rem',
                      borderRadius: '4px',
                      background: testResult.allowed ? '#d1fae5' : '#fee2e2',
                      color: testResult.allowed ? '#065f46' : '#991b1b',
                    }}
                  >
                    {testResult.allowed ? '✓ ALLOWED' : '✗ BLOCKED'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Plan Capacity Banner */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: isAtSlotCapacity ? 'rgba(239, 68, 68, 0.04)' : 'var(--bg-card)',
          border: isAtSlotCapacity ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              background: 'rgba(92, 60, 246, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-primary)',
            }}
          >
            <Shield size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.925rem' }}>
                {summary.plan.name} Plan: {summary.proxyUsage.used} / {summary.proxyUsage.max} proxies used
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-full)',
                  background: summary.proxyUsage.available > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: summary.proxyUsage.available > 0 ? '#10b981' : '#ef4444',
                }}
              >
                {summary.proxyUsage.available} Slots Available
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {summary.plan.isFree
                ? 'Free proxies are limited to 50 MB and 12 hours validity each.'
                : `Plan valid for 28 days (${summary.plan.renewalDisplay}). Traffic limit: ${summary.trafficUsage.limitDisplay}.`}
            </div>
          </div>
        </div>

        {isAtSlotCapacity && (
          <Button variant="primary" onClick={() => setShowUpgradeModal(true)} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            <Zap size={13} style={{ marginRight: '0.3rem' }} />
            Upgrade for More Slots
          </Button>
        )}
      </div>

      {/* Search & Status Filter Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ maxWidth: '340px', width: '100%', position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search endpoints, countries, username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.4rem' }}
          />
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          {['all', 'active', 'disabled', 'expired', 'traffic limit reached'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: statusFilter === st ? 'var(--brand-primary)' : 'transparent',
                color: statusFilter === st ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Credentials */}
      {filtered.length === 0 ? (
        endpoints.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(92, 60, 246, 0.12), rgba(16, 185, 129, 0.12))',
                color: 'var(--brand-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                fontSize: '1.75rem',
              }}
            >
              🇮🇳
            </div>
            <div style={{ display: 'inline-block', marginBottom: '0.75rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                ● 11.2M+ Clean India IPs Active • 12ms Avg Latency
              </span>
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
              No Proxy Endpoints Deployed Yet
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 1.75rem auto', lineHeight: 1.6 }}>
              Deploy your first high-performance residential proxy endpoint in <strong>India</strong> (or 195+ global locations). Fully authenticated with HTTP/SOCKS5 support, IP whitelisting, and rotating IP sessions.
            </p>
            <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
              <Button
                variant="primary"
                onClick={() => {
                  setTargetCountry('India');
                  setTargetCountryCode('IN');
                  setShowCreateModal(true);
                }}
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem' }}
              >
                <Plus size={16} style={{ marginRight: '0.4rem' }} />
                Deploy India Proxy Endpoint
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowUpgradeModal(true)}
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem' }}
              >
                <Zap size={15} style={{ marginRight: '0.4rem' }} />
                View Proxy Plans
              </Button>
            </div>

            {/* Feature Capability Highlights */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                textAlign: 'left',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '1.75rem',
                maxWidth: '900px',
                margin: '0 auto',
              }}
            >
              <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-subtle)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  🇮🇳 India Peering
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Mumbai, Delhi & Bengaluru nodes with sub-15ms response latency.
                </div>
              </div>
              <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-subtle)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  🔒 IP Whitelist Shield
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Restrict credentials to your authorized client IP ({testClientIP || '110.227.184.49'}).
                </div>
              </div>
              <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-subtle)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  🔄 Dual Rotation Engines
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Maintain sticky sessions for 10-30 min or rotate on every HTTP request.
                </div>
              </div>
              <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-subtle)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  ⚡ Free Tier Slots
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  50 proxy test slots included with 50 MB / 12h per proxy allowance.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ margin: '0 0 1rem 0' }}>No proxy endpoints matching "{searchTerm || statusFilter}".</p>
            <Button
              variant="secondary"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              style={{ fontSize: '0.8rem' }}
            >
              Clear Filters
            </Button>
          </div>
        )
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((ep) => (
            <ProxyCredentialCard
              key={ep.id}
              endpoint={ep}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <Modal title="Create Proxy Endpoint" onClose={() => setShowCreateModal(false)} size="lg">
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {createError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: '#ef4444',
                  fontSize: '0.825rem',
                }}
              >
                <AlertCircle size={16} />
                <div style={{ flex: 1 }}>{createError}</div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => { setShowCreateModal(false); setShowUpgradeModal(true); }}
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                >
                  Upgrade
                </Button>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Endpoint Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Scraper Prod Cluster A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Network Type */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Proxy Network Type
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {(['residential', 'datacenter', 'mobile', 'isp'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setProxyType(t)}
                    style={{
                      padding: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-sm)',
                      border: proxyType === t ? '2px solid var(--brand-primary)' : '1px solid var(--bg-border)',
                      background: proxyType === t ? 'var(--brand-primary-light)' : 'var(--bg-subtle)',
                      color: proxyType === t ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Target Country
              </label>
              <LocationSelector
                selectedCountryCode={targetCountryCode}
                selectedCountry={targetCountry}
                onSelect={(country, code) => {
                  setTargetCountry(country);
                  setTargetCountryCode(code);
                }}
              />
            </div>

            {/* Session Settings */}
            <SessionSettings
              rotationMode={rotationMode}
              sessionDurationMin={sessionDurationMin}
              ipWhitelist={ipWhitelist}
              onChangeRotationMode={setRotationMode}
              onChangeDuration={setSessionDurationMin}
              onChangeWhitelist={setIpWhitelist}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Generate Credentials
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Plan Upgrade Modal */}
      {showUpgradeModal && (
        <PlanUpgradeModal
          currentPlanId={summary.plan.id}
          onClose={() => setShowUpgradeModal(false)}
          onSelectPlan={handleSelectPlan}
        />
      )}

      {/* Bulk IP Blocks Modal */}
      {showBulkIpModal && (
        <Modal
          isOpen={showBulkIpModal}
          onClose={() => setShowBulkIpModal(false)}
          title="Configure IP Blocks / Whitelist Across Multiple Proxies"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Apply authorized IP addresses and subnet CIDR blocks to <strong>all {endpoints.length} active proxies</strong>.
            </p>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Authorized IP List & CIDR Blocks:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const parts = bulkIpText ? bulkIpText.split(',').map((s) => s.trim()).filter(Boolean) : [];
                    if (!parts.includes(testClientIP)) {
                      setBulkIpText([...parts, testClientIP].join(', '));
                    }
                  }}
                  style={{
                    background: 'rgba(92, 60, 246, 0.1)',
                    border: 'none',
                    color: 'var(--brand-primary)',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  + Add My Device IP ({testClientIP})
                </button>
              </div>

              <textarea
                rows={4}
                className="input-field"
                placeholder="Comma-separated or newline e.g. 110.227.184.49, 192.168.1.0/24, 10.0.0.0/8"
                value={bulkIpText}
                onChange={(e) => setBulkIpText(e.target.value)}
                style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', padding: '0.65rem' }}
              />
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                Examples: <code>110.227.184.49</code> (single IP), <code>192.168.1.0/24</code> (256 IPs subnet), <code>10.0.0.0/16</code> (65,536 IPs block).
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button variant="secondary" onClick={() => setShowBulkIpModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleApplyBulkIPWhitelist(bulkIpText)}
              >
                Apply to All {endpoints.length} Proxies
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
