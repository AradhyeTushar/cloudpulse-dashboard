import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="tabs-nav">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: 'var(--radius-full)',
                  background: isActive ? 'var(--brand-primary-light)' : 'var(--bg-subtle)',
                  color: isActive ? 'var(--brand-primary-text)' : 'var(--text-muted)',
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
