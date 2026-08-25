import React from 'react';
import { Key, Code2, Sparkles, Copy } from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';

export const SettingsApi: React.FC = () => {
  const { showToast } = useToast();

  const curlExample = `curl -X GET "https://api.nexuscloud.io/v1/vps" \\
  -H "Authorization: Bearer nxs_live_98a72c1e89b24" \\
  -H "Content-Type: application/json"`;

  const copyCode = () => {
    navigator.clipboard.writeText(curlExample);
    showToast('Code Copied', 'Example cURL snippet copied to clipboard.', 'success');
  };

  return (
    <div className="settings-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <h2 className="settings-section-title">Developer API & Webhooks</h2>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'var(--brand-primary-light)', color: 'var(--brand-primary-text)' }}>
          Coming Soon
        </span>
      </div>
      <p className="settings-section-desc">
        Programmatically provision VPS instances, trigger deployments, manage DNS records, and query real-time telemetry.
      </p>

      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(92, 60, 246, 0.08) 0%, rgba(139, 92, 246, 0.02) 100%)',
          border: '1px solid rgba(92, 60, 246, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'var(--brand-primary-light)', color: 'var(--brand-primary-text)' }}>
          <Sparkles size={20} />
        </div>
        <div>
          <h4 style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            API access is coming soon.
          </h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            Our REST API and official Go / TypeScript SDKs are currently in private beta. You will soon be able to generate scoped personal access tokens and integrate your CI/CD pipelines directly with your infrastructure.
          </p>
        </div>
      </div>

      {/* Code preview */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Preview API Request
          </span>
          <button
            onClick={copyCode}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--brand-primary-text)', fontWeight: 600 }}
          >
            <Copy size={13} />
            <span>Copy snippet</span>
          </button>
        </div>

        <div
          style={{
            background: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: '#58a6ff',
            overflowX: 'auto',
          }}
        >
          <pre style={{ margin: 0 }}>{curlExample}</pre>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="secondary"
          onClick={() => showToast('Waitlist Joined', 'You have been registered for early developer API access.', 'success')}
        >
          Request Early API Access
        </Button>
      </div>
    </div>
  );
};
