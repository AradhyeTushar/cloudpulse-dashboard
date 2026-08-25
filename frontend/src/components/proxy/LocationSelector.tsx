import React, { useState } from 'react';
import { Globe, Search, Check } from 'lucide-react';
import { MOCK_LOCATIONS } from '../../data/mock-proxy';
import { ProxyLocationNode } from '../../types';

interface LocationSelectorProps {
  selectedCountryCode: string;
  onSelect: (country: string, countryCode: string) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedCountryCode,
  onSelect,
}) => {
  const [search, setSearch] = useState('');

  const filtered = MOCK_LOCATIONS.filter(
    (l: ProxyLocationNode) =>
      l.country.toLowerCase().includes(search.toLowerCase()) ||
      l.countryCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
        <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="input-field"
          placeholder="Filter country or ISO code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: '2.2rem', fontSize: '0.8125rem' }}
        />
      </div>

      <div
        style={{
          maxHeight: '180px',
          overflowY: 'auto',
          border: '1px solid var(--bg-border)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-subtle)',
        }}
      >
        {filtered.map((loc: ProxyLocationNode) => {
          const isSelected = loc.countryCode === selectedCountryCode;
          return (
            <div
              key={loc.id}
              onClick={() => onSelect(loc.country, loc.countryCode)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                background: isSelected ? 'var(--brand-primary-light)' : 'transparent',
                borderBottom: '1px solid var(--bg-border)',
                fontSize: '0.8125rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>{loc.flag}</span>
                <span style={{ fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                  {loc.country}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({loc.countryCode})</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>{loc.avgLatencyMs}ms</span>
                {isSelected && <Check size={14} color="var(--brand-primary)" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
