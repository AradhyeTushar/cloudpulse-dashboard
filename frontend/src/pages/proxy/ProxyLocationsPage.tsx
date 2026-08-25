import React, { useState } from 'react';
import { Globe, Search, Zap, Activity } from 'lucide-react';
import { proxyService } from '../../services/proxyService';
import { ProxyLocationNode } from '../../types';
import { ProxyStatusBadge } from '../../components/proxy/ProxyStatusBadge';

export const ProxyLocationsPage: React.FC = () => {
  const [locations] = useState<ProxyLocationNode[]>(() => proxyService.getLocations());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');

  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      loc.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.countryCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion === 'All' || loc.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  const regions = ['All', 'North America', 'Europe', 'Asia-Pacific', 'Latin America'];

  return (
    <div className="content-container">
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Global Locations & IP Pools
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
          Explore residential, datacenter, and mobile IP availability across 195+ countries with live latency metrics.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', minWidth: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search country or ISO code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {/* Region Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {regions.map((reg) => (
            <button
              key={reg}
              onClick={() => setSelectedRegion(reg)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: '1px solid var(--bg-border)',
                background: selectedRegion === reg ? 'var(--brand-primary)' : 'var(--bg-subtle)',
                color: selectedRegion === reg ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Locations */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {filteredLocations.map((loc) => (
          <div key={loc.id} className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.6rem' }}>{loc.flag}</span>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{loc.country}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{loc.region} • {loc.countryCode}</span>
                </div>
              </div>

              <ProxyStatusBadge status={loc.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', borderTop: '1px solid var(--bg-border)', paddingTop: '0.85rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Available IPs</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {(loc.availableIPs / 1000000).toFixed(1)}M
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Latency</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: loc.avgLatencyMs < 40 ? '#10b981' : '#f59e0b' }}>
                  {loc.avgLatencyMs} ms
                </div>
              </div>
            </div>

            <div style={{ marginTop: '0.85rem', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Zap size={12} color="var(--brand-primary)" />
              <span>{loc.activeNodes.toLocaleString()} edge gateway nodes online</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
