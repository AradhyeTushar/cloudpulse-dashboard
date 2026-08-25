import React from 'react';
import { Activity, Server, Cpu, Zap, Database, HardDrive, CheckCircle2 } from 'lucide-react';
import { proxyService } from '../../services/proxyService';

export const AdminHealthPage: React.FC = () => {
  const health = proxyService.getSystemHealth();

  return (
    <div className="content-container">
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', textTransform: 'uppercase' }}>
            Admin Portal
          </span>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          System Health & Cluster Telemetry
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
          Real-time health of 3proxy gateways, Redis session clusters, PostgreSQL query latency, and Prometheus metrics.
        </p>
      </div>

      {/* Health Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Gateway Throughput</span>
            <Activity size={18} color="var(--brand-primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {health.gatewayThroughputMBps} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>MB/s</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.35rem' }}>
            Operating at optimal line rate
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Active Tunnels</span>
            <Zap size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {health.totalActiveTunnels.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Across 14 gateway pods
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Redis Session Latency</span>
            <Database size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>
            {health.redisLatencyMs} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>ms</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            0 cache misses recorded
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>API Success Rate</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {health.apiSuccessRatePct}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.35rem' }}>
            PostgreSQL query: {health.postgresQueryTimeMs}ms
          </div>
        </div>
      </div>

      {/* Services Status Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Core Daemon Infrastructure</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {[
            { name: '3proxy Gateway Edge Mesh', region: 'Global Anycast', status: 'Healthy', ping: '12ms' },
            { name: 'Go API Control Plane (Port 8080)', region: 'Primary Cluster', status: 'Healthy', ping: '1ms' },
            { name: 'PostgreSQL 16 Multi-AZ', region: 'us-east-1', status: 'Healthy', ping: '1.4ms' },
            { name: 'Redis 7 Session Ring', region: 'us-east-1', status: 'Healthy', ping: '0.8ms' },
            { name: 'Prometheus Telemetry Scraper', region: 'Monitoring Node', status: 'Healthy', ping: '5ms' },
          ].map((svc, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--bg-border)',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{svc.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{svc.region}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{svc.ping}</span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    textTransform: 'uppercase',
                  }}
                >
                  {svc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
