import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, Copy, Check, ArrowRight } from 'lucide-react';
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

  const codeSnippets = {
    python: `import requests

proxies = {
    "http": "http://cp_72ab91:p_sec_99182a@pr.cloudpulse.net:8000",
    "https": "http://cp_72ab91:p_sec_99182a@pr.cloudpulse.net:8000"
}

response = requests.get("https://ipinfo.io/json", proxies=proxies)
print("Assigned Proxy IP:", response.json())`,
    curl: `curl -x http://cp_72ab91:p_sec_99182a@pr.cloudpulse.net:8000 "https://ipinfo.io/json"`,
    node: `const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

const agent = new HttpsProxyAgent('http://cp_72ab91:p_sec_99182a@pr.cloudpulse.net:8000');

async function run() {
  const res = await axios.get('https://ipinfo.io/json', { httpsAgent: agent });
  console.log('Proxy IP:', res.data);
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
	proxyURL, _ := url.Parse("http://cp_72ab91:p_sec_99182a@pr.cloudpulse.net:8000")
	client := &http.Client{Transport: &http.Transport{Proxy: http.ProxyURL(proxyURL)}}

	resp, _ := client.Get("https://ipinfo.io/json")
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

        {/* Code Box */}
        <div
          style={{
            position: 'relative',
            background: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8125rem',
            color: '#c9d1d9',
            overflowX: 'auto',
          }}
        >
          <button
            onClick={copyCode}
            style={{
              position: 'absolute',
              top: '0.75rem',
              right: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              background: '#21262d',
              border: '1px solid #30363d',
              color: '#c9d1d9',
              cursor: 'pointer',
            }}
          >
            {copiedCode ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
          </button>
          <pre style={{ margin: 0 }}>{codeSnippets[activeTab]}</pre>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {endpoints.slice(0, 3).map((ep) => (
            <ProxyCredentialCard
              key={ep.id}
              endpoint={ep}
              onDelete={handleDeleteEndpoint}
            />
          ))}
        </div>
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
