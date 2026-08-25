import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Globe,
  Radio,
  Zap,
  Activity,
  Copy,
  Check,
  ShieldCheck,
  Server,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Layers,
} from 'lucide-react';
import { proxyService } from '../../services/proxyService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';

export const DashboardPage: React.FC = () => {
  const { showToast } = useToast();
  const usage = proxyService.getUsageStats();
  const endpoints = proxyService.getEndpoints();
  const sessions = proxyService.getStickySessions();
  const [activeTab, setActiveTab] = useState<'curl' | 'python' | 'node' | 'go'>('python');
  const [copied, setCopied] = useState(false);

  const codeSnippets = {
    python: `import requests

proxies = {
    'http': 'http://cp_usr_8921a:p_sec_991823ab@pr.cloudpulse.net:8000',
    'https': 'http://cp_usr_8921a:p_sec_991823ab@pr.cloudpulse.net:8000',
}

response = requests.get('https://api.ipify.org?format=json', proxies=proxies, timeout=10)
print('Current Exit IP:', response.json()['ip'])`,

    curl: `curl -x http://cp_usr_8921a:p_sec_991823ab@pr.cloudpulse.net:8000 \\
  https://api.ipify.org?format=json`,

    node: `import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

const agent = new HttpsProxyAgent('http://cp_usr_8921a:p_sec_991823ab@pr.cloudpulse.net:8000');

async function testProxy() {
  const { data } = await axios.get('https://api.ipify.org?format=json', { httpsAgent: agent });
  console.log('Current Exit IP:', data.ip);
}
testProxy();`,

    go: `package main

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
)

func main() {
	proxyURL, _ := url.Parse("http://cp_usr_8921a:p_sec_991823ab@pr.cloudpulse.net:8000")
	client := &http.Client{Transport: &http.Transport{Proxy: http.ProxyURL(proxyURL)}}
	resp, _ := client.Get("https://api.ipify.org?format=json")
	body, _ := io.ReadAll(resp.Body)
	fmt.Println("Current Exit IP:", string(body))
}`,
  };

  const copyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    showToast('Code Copied', 'Integration snippet copied to clipboard.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="content-container">
      {/* Hero / Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(92, 60, 246, 0.12) 0%, rgba(59, 130, 246, 0.05) 100%)',
          border: '1px solid rgba(92, 60, 246, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#10b981',
                background: 'rgba(16, 185, 129, 0.12)',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
              Gateway Online • 99.98% SLA
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ashburn Gateway Cluster</span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Proxy Infrastructure Control Hub
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.35rem', maxWidth: '600px' }}>
            Enterprise residential, datacenter, and mobile proxy networks with sub-30ms global latency and automated IP rotation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <NavLink to="/proxy-access">
            <Button variant="primary">
              <Zap size={15} style={{ marginRight: '0.4rem' }} />
              Configure Endpoints
            </Button>
          </NavLink>
          <NavLink to="/billing">
            <Button variant="secondary">
              <TrendingUp size={15} style={{ marginRight: '0.4rem' }} />
              Add Bandwidth
            </Button>
          </NavLink>
        </div>
      </div>

      {/* Top 4 Key Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {/* Metric 1: Bandwidth */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Bandwidth Consumed</span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', background: 'rgba(92, 60, 246, 0.12)', color: 'var(--brand-primary)' }}>
              <Layers size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            {usage.totalGBUsed} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ {usage.totalGBLimit} GB</span>
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: 6, background: 'var(--bg-border)', borderRadius: 3, overflow: 'hidden', marginBottom: '0.5rem' }}>
            <div style={{ width: `${(usage.totalGBUsed / usage.totalGBLimit) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #5c3cf6, #8b5cf6)', borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: '#10b981' }}>{usage.remainingGB} GB</strong> remaining balance
          </div>
        </div>

        {/* Metric 2: Active Sticky Sessions */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Active Sticky Sessions</span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Radio size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            {sessions.length} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10b981' }}>Live</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Activity size={13} color="#10b981" />
            <span>{usage.activeConcurrentStreams} concurrent TCP streams</span>
          </div>
        </div>

        {/* Metric 3: Requests Today */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Requests Today</span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
              <Activity size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            {usage.requestsToday.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <TrendingUp size={13} />
            <span>+14.8% vs yesterday</span>
          </div>
        </div>

        {/* Metric 4: Success Rate */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Success Rate</span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            99.82%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Zero-captcha delivery enabled
          </div>
        </div>
      </div>

      {/* Main Split Section: Quick Integration Snippets + Configured Endpoints */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Left: Quick Code Integration */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Quick Proxy Integration</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                Copy and paste production proxy client configurations into your scrapers or microservices.
              </p>
            </div>
            <button
              onClick={copyCode}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: copied ? '#10b981' : 'var(--brand-primary)',
                background: 'var(--brand-primary-light)',
                border: 'none',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy code'}</span>
            </button>
          </div>

          {/* Language Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--bg-border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            {(['python', 'curl', 'node', 'go'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveTab(lang)}
                style={{
                  padding: '0.35rem 0.8rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: activeTab === lang ? 'var(--brand-primary)' : 'transparent',
                  color: activeTab === lang ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Code block */}
          <div
            style={{
              background: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: 'var(--radius-md)',
              padding: '1.2rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8125rem',
              color: '#58a6ff',
              overflowX: 'auto',
              flex: 1,
            }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{codeSnippets[activeTab]}</pre>
          </div>
        </div>

        {/* Right: Active Endpoints Overview */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Configured Endpoints</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                Your entrypoint gateways & credentials.
              </p>
            </div>
            <NavLink to="/proxy-access">
              <Button variant="secondary" size="sm">
                View All
              </Button>
            </NavLink>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {endpoints.map((ep) => (
              <div
                key={ep.id}
                style={{
                  border: '1px solid var(--bg-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-subtle)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{ep.name}</span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: 'var(--radius-full)',
                        background: ep.proxyType === 'residential' ? 'rgba(92, 60, 246, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                        color: ep.proxyType === 'residential' ? 'var(--brand-primary)' : '#3b82f6',
                        textTransform: 'uppercase',
                      }}
                    >
                      {ep.proxyType}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {ep.host}:{ep.port} • {ep.protocol.toUpperCase()}
                  </div>
                </div>

                <NavLink to="/proxy-access" style={{ color: 'var(--text-muted)' }}>
                  <ArrowUpRight size={16} />
                </NavLink>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
