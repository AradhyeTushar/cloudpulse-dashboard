import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, Copy, Check, ArrowRight, Zap } from 'lucide-react';
import { proxyService } from '../../services/proxyService';
import { ProxyUsageDashboard } from '../../components/proxy/ProxyUsageDashboard';
import { PlanUpgradeModal } from '../../components/proxy/PlanUpgradeModal';
import { ProxyEndpointCard } from '../../components/proxy/ProxyEndpointCard';
import { ProxyCredentialCard } from '../../components/proxy/ProxyCredentialCard';
import { ProxyPlanConfig } from '../../config/proxyPlans';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';

export const ProxyDashboardPage: React.FC = () => {
  const { showToast } = useToast();
  const [endpoints, setEndpoints] = useState(() => proxyService.getEndpoints());
  const [dashboardSummary, setDashboardSummary] = useState(() => proxyService.getDashboardUsageSummary());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'curl' | 'python' | 'node' | 'go'>('python');
  const [copiedCode, setCopiedCode] = useState(false);

  const refreshState = () => {
    setEndpoints(proxyService.getEndpoints());
    setDashboardSummary(proxyService.getDashboardUsageSummary());
  };

  useEffect(() => {
    const handlePlanUpdate = () => {
      refreshState();
    };
    window.addEventListener('cloudpulse_plan_updated', handlePlanUpdate);
    window.addEventListener('proxy_plan_updated', handlePlanUpdate);
    return () => {
      window.removeEventListener('cloudpulse_plan_updated', handlePlanUpdate);
      window.removeEventListener('proxy_plan_updated', handlePlanUpdate);
    };
  }, []);

  const handleSelectPlan = (plan: ProxyPlanConfig) => {
    proxyService.upgradePlan(plan.id);
    refreshState();
    setShowUpgradeModal(false);
    showToast('Plan Updated', `Successfully activated the ${plan.name} plan! Valid for ${plan.validityDisplay}.`, 'success');
  };

  const handleRenewPlan = () => {
    proxyService.renewPlan();
    refreshState();
    showToast('Subscription Renewed', 'Your plan has been extended by 28 days.', 'success');
  };

  const primaryEp = endpoints[0];
  const userCred = primaryEp ? `${primaryEp.username}:${primaryEp.password}` : 'USERNAME:PASSWORD';
  const proxyTarget = `${userCred}@${window.location.hostname || '200.234.41.58'}:8000`;

  const codeSnippets = {
    python: `import requests

proxies = {
    "http": "http://${proxyTarget}",
    "https": "http://${proxyTarget}"
}

response = requests.get("https://httpbin.org/ip", proxies=proxies)
print("Assigned Egress IP:", response.json())`,
    curl: `curl -x http://${proxyTarget} "https://httpbin.org/ip"`,
    node: `const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

const agent = new HttpsProxyAgent('http://${proxyTarget}');

async function run() {
  const res = await axios.get('https://httpbin.org/ip', { httpsAgent: agent });
  console.log('Assigned Egress IP:', res.data);
}
run();`,
    go: `package main

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
)

func main() {
	proxyURL, _ := url.Parse("http://${proxyTarget}")
	client := &http.Client{Transport: &http.Transport{Proxy: http.ProxyURL(proxyURL)}}

	resp, _ := client.Get("https://httpbin.org/ip")
	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}`,
  };

  const copyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopiedCode(true);
    showToast('Code Copied', 'Integration snippet copied to clipboard.', 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDeleteEndpoint = (id: string, name: string) => {
    proxyService.deleteEndpoint(id);
    refreshState();
    showToast('Endpoint Deleted', `Deleted ${name}`, 'info');
  };

  return (
    <div className="content-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Proxy Control Center
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            High-performance residential, datacenter, and mobile proxy infrastructure with global edge routing.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary" onClick={() => setShowUpgradeModal(true)}>
            View Plans
          </Button>
          <NavLink to="/proxy/credentials">
            <Button variant="primary">
              <Plus size={15} style={{ marginRight: '0.4rem' }} />
              Create Credentials
            </Button>
          </NavLink>
        </div>
      </div>

      {/* Primary Usage Dashboard Section */}
      <ProxyUsageDashboard
        summary={dashboardSummary}
        onOpenUpgradeModal={() => setShowUpgradeModal(true)}
        onRenewPlan={handleRenewPlan}
      />

      {/* Available Proxy Networks */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Proxy Networks & Pools</h2>
          <NavLink to="/proxy/locations" style={{ fontSize: '0.8rem', color: 'var(--brand-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
            <span>View 195+ Countries</span>
            <ArrowRight size={13} />
          </NavLink>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          <ProxyEndpointCard
            type="residential"
            title="Residential Proxy Network"
            poolSize="72M+ Clean IPs"
            host="pr.cloudpulse.net"
            port={8000}
            protocols={['HTTP', 'HTTPS', 'SOCKS5']}
            latencyAvg="22ms"
          />
          <ProxyEndpointCard
            type="datacenter"
            title="Datacenter Dedicated"
            poolSize="1.2M+ IPs (10Gbps)"
            host="dc.cloudpulse.net"
            port={8000}
            protocols={['HTTP', 'HTTPS']}
            latencyAvg="8ms"
          />
          <ProxyEndpointCard
            type="mobile"
            title="Mobile 5G/4G Carrier"
            poolSize="18M+ Real Carriers"
            host="mb.cloudpulse.net"
            port={8000}
            protocols={['HTTP', 'HTTPS']}
            latencyAvg="38ms"
          />
        </div>
      </div>

      {/* Quick Integration Code Snippets Card */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Quick Start Integration</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Plug into your scraper or HTTP client</span>
          </div>

          {/* Language Tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            {(['python', 'curl', 'node', 'go'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveTab(lang)}
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.75rem',
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
        </div>

        {/* Helper Banner when no proxies exist yet */}
        {!primaryEp && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              padding: '0.55rem 0.85rem',
              background: 'rgba(92, 60, 246, 0.08)',
              border: '1px solid rgba(92, 60, 246, 0.2)',
              borderRadius: '6px',
              marginBottom: '0.85rem',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
            }}
          >
            <span>
              🇮🇳 <strong>India Edge Gateway:</strong> Deploy your first proxy to automatically populate live authenticated credentials.
            </span>
            <NavLink to="/proxy/credentials" style={{ fontWeight: 700, color: 'var(--brand-primary)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              + Create India Proxy →
            </NavLink>
          </div>
        )}

        {/* Code Box */}
        <div
          style={{
            position: 'relative',
            background: '#090d16',
            border: '1px solid #232a3b',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          }}
        >
          {/* Terminal Window Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.85rem',
              background: '#111726',
              borderBottom: '1px solid #232a3b',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                {activeTab === 'python' ? 'scrape_india.py' : activeTab === 'curl' ? 'curl_test.sh' : activeTab === 'node' ? 'proxy_client.js' : 'main.go'}
              </span>
            </div>

            <button
              onClick={copyCode}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '4px',
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {copiedCode ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <pre
            style={{
              margin: 0,
              padding: '1.15rem 1.25rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.825rem',
              lineHeight: 1.6,
              color: '#e2e8f0',
              overflowX: 'auto',
            }}
          >
            {codeSnippets[activeTab]}
          </pre>
        </div>
      </div>

      {/* Active Endpoints List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Active Proxy Endpoints ({endpoints.length})</h2>
          <NavLink to="/proxy/credentials" style={{ fontSize: '0.8rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
            Manage All
          </NavLink>
        </div>

        {endpoints.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-color)',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'rgba(92, 60, 246, 0.1)',
                color: 'var(--brand-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Zap size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
              No Active Proxies Yet
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
              You haven't generated any proxy credentials yet. Create your first endpoint to start routing high-speed scraping or automation traffic through clean residential IPs.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <NavLink to="/proxy/credentials">
                <Button variant="primary">
                  <Plus size={15} style={{ marginRight: '0.4rem' }} />
                  Create Your First Proxy
                </Button>
              </NavLink>
              <Button variant="secondary" onClick={() => setShowUpgradeModal(true)}>
                View Proxy Plans
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {endpoints.slice(0, 3).map((ep) => (
              <ProxyCredentialCard
                key={ep.id}
                endpoint={ep}
                onDelete={handleDeleteEndpoint}
              />
            ))}
          </div>
        )}
      </div>

      {/* Plan Upgrade / Matrix Modal */}
      {showUpgradeModal && (
        <PlanUpgradeModal
          currentPlanId={dashboardSummary.plan.id}
          onClose={() => setShowUpgradeModal(false)}
          onSelectPlan={handleSelectPlan}
        />
      )}
    </div>
  );
};
