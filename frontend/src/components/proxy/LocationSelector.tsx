import React from 'react';
import { Check } from 'lucide-react';
import { MOCK_LOCATIONS } from '../../data/mock-proxy';
import { ProxyLocationNode } from '../../types';

interface LocationSelectorProps {
  selectedCountryCode: string;
  selectedCountry?: string;
  onSelect: (country: string, countryCode: string) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedCountryCode,
  selectedCountry,
  onSelect,
}) => {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.75rem',
          color: '#10b981',
          marginBottom: '0.5rem',
          fontWeight: 600,
        }}
      >
        <span style={{ fontSize: '1rem' }}>🇮🇳</span>
        <span>Dedicated India Network (All Foreign Locations Removed)</span>
      </div>

      <div
        style={{
          maxHeight: '220px',
          overflowY: 'auto',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-subtle)',
        }}
      >
        {MOCK_LOCATIONS.map((loc: ProxyLocationNode) => {
          const isSelected = selectedCountry
            ? loc.country === selectedCountry
            : (loc.countryCode === selectedCountryCode || loc.id === 'loc_in');

          return (
            <div
              key={loc.id}
              onClick={() => onSelect(loc.country, loc.countryCode)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.6rem 0.85rem',
                cursor: 'pointer',
                background: isSelected ? 'var(--brand-primary-light)' : 'transparent',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '0.8125rem',
                transition: 'background 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.25rem' }}>{loc.flag}</span>
                <div>
                  <div style={{ fontWeight: isSelected ? 700 : 600, color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                    {loc.country}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {(loc.availableIPs / 1000000).toFixed(1)}M Clean IPs • {loc.activeNodes} Nodes
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: '#10b981',
                    fontWeight: 700,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.1)',
                  }}
                >
                  {loc.avgLatencyMs}ms
                </span>
                {isSelected && <Check size={16} color="var(--brand-primary)" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
