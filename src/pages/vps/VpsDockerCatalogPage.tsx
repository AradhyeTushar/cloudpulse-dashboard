import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, Search } from 'lucide-react';
import { vpsService } from '../../services/vpsService';
import { VpsInstance } from '../../types';
import { Button } from '../../components/ui/Button';
import { TerminalModal } from '../../components/vps/TerminalModal';
import { useToast } from '../../context/ToastContext';

export const VpsDockerCatalogPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [vps, setVps] = useState<VpsInstance | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadVps = async () => {
      if (!id) return;
      const found = await vpsService.getVpsById(id);
      setVps(found);
    };
    loadVps();
  }, [id]);

  const catalog = [
    { id: 'n8n', name: 'n8n Workflow Automation', desc: 'Self-hosted workflow automation with over 350+ integrations.', tag: 'AI & Automations', version: 'v1.45.0' },
    { id: 'wordpress', name: 'WordPress Stack', desc: 'World most popular CMS with MySQL 8 and automated SSL.', tag: 'CMS & Web', version: 'v6.5' },
    { id: 'postgres', name: 'PostgreSQL Database', desc: 'Enterprise SQL database with persistent volumes configured.', tag: 'Databases', version: 'v16.3' },
    { id: 'redis', name: 'Redis Cache', desc: 'Ultra-fast in-memory key-value cache and message broker.', tag: 'Databases', version: 'v7.2' },
    { id: 'strapi', name: 'Strapi Headless CMS', desc: 'Open-source Node.js headless CMS with customizable REST/GraphQL API.', tag: 'CMS & Web', version: 'v4.20' },
    { id: 'ollama', name: 'Ollama AI Engine', desc: 'Run Llama 3, Mistral, and DeepSeek models locally with REST API.', tag: 'AI & Automations', version: 'v0.3.4' },
  ];

  const filtered = catalog.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.tag.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="page-title-group">
          <h1>Application Catalog</h1>
        </div>

        <div>
          <button className="terminal-top-btn" onClick={() => setTerminalOpen(true)}>
            <span>Terminal</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem', maxWidth: '360px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search ready-to-deploy templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {filtered.map((item) => (
          <div key={item.id} className="catalog-card" style={{ minHeight: 'auto' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', background: 'var(--brand-primary-light)', color: 'var(--brand-primary-text)' }}>
                  {item.tag}
                </span>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                  {item.version}
                </span>
              </div>
              <h3 className="catalog-card-title">{item.name}</h3>
              <p className="catalog-card-desc" style={{ marginBottom: '1.25rem' }}>{item.desc}</p>
            </div>
            <div>
              <Button
                variant="primary"
                size="sm"
                className="btn-pill"
                onClick={() => showToast('Deploy Template', `Deploying ${item.name} on ${vps?.hostname || 'server'}...`, 'success')}
              >
                1-Click Deploy
              </Button>
            </div>
          </div>
        ))}
      </div>

      {vps && (
        <TerminalModal
          isOpen={terminalOpen}
          onClose={() => setTerminalOpen(false)}
          vps={vps}
        />
      )}
    </div>
  );
};
