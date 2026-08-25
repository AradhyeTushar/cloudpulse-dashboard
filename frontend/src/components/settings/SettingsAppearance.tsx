import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

export const SettingsAppearance: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const themes = [
    { id: 'light', label: 'Light', desc: 'Clean, high-contrast light theme', icon: <Sun size={24} color="#f59e0b" /> },
    { id: 'dark', label: 'Dark', desc: 'Sleek, low-glare dark mode', icon: <Moon size={24} color="#6366f1" /> },
    { id: 'system', label: 'System', desc: 'Automatically match OS preference', icon: <Laptop size={24} color="#64748b" /> },
  ] as const;

  const handleSelect = (mode: 'light' | 'dark' | 'system') => {
    setTheme(mode);
    showToast('Theme Updated', `Switched theme to ${mode} mode.`, 'success');
  };

  return (
    <div className="settings-card">
      <h2 className="settings-section-title">Appearance & Theme</h2>
      <p className="settings-section-desc">Customize how the hosting control panel looks on your device.</p>

      <div className="theme-options-grid">
        {themes.map((t) => {
          const isActive = theme === t.id;
          return (
            <div
              key={t.id}
              className={`theme-option-card ${isActive ? 'active' : ''}`}
              onClick={() => handleSelect(t.id)}
            >
              <div className="theme-option-icon">{t.icon}</div>
              <div className="theme-option-label">{t.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{t.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
