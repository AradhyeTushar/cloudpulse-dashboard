import React, { useState } from 'react';
import { Plus, Search, Filter, Key, Globe, Shield } from 'lucide-react';
import { proxyService } from '../../services/proxyService';
import { ProxyEndpointConfig, ProxyType, ProxyProtocol, ProxyRotationMode } from '../../types';
import { ProxyCredentialCard } from '../../components/proxy/ProxyCredentialCard';
import { LocationSelector } from '../../components/proxy/LocationSelector';
import { SessionSettings } from '../../components/proxy/SessionSettings';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';

export const ProxyCredentialsPage: React.FC = () => {
  const { showToast } = useToast();
  const [endpoints, setEndpoints] = useState<ProxyEndpointConfig[]>(() => proxyService.getEndpoints());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Create Form State
  const [name, setName] = useState('');
  const [proxyType, setProxyType] = useState<ProxyType>('residential');
  const [protocol, setProtocol] = useState<ProxyProtocol>('http');
  const [rotationMode, setRotationMode] = useState<ProxyRotationMode>('rotating');
  const [sessionDurationMin, setSessionDurationMin] = useState(10);
  const [targetCountry, setTargetCountry] = useState('United States');
  const [targetCountryCode, setTargetCountryCode] = useState('US');
  const [ipWhitelist, setIpWhitelist] = useState<string[]>([]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

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

    setEndpoints(proxyService.getEndpoints());
    setShowCreateModal(false);
    showToast('Credentials Created', `Created proxy endpoint: ${newEndpoint.name}`, 'success');

    // Reset Form
    setName('');
    setRotationMode('rotating');
  };

  const handleDelete = (id: string, name: string) => {
    proxyService.deleteEndpoint(id);
    setEndpoints(proxyService.getEndpoints());
    showToast('Endpoint Deleted', `Deleted ${name}`, 'info');
  };

  const filtered = endpoints.filter(
    (ep) =>
      ep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="content-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Proxy Credentials & Endpoints
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Generate authenticated proxy entry points, configure geographic targeting, and export credentials.
          </p>
        </div>

        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={15} style={{ marginRight: '0.4rem' }} />
          Create New Endpoint
        </Button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1.5rem', maxWidth: '360px', position: 'relative' }}>
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

      {/* Grid of Credentials */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No proxy endpoints found matching your search.
        </div>
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
    </div>
  );
};
