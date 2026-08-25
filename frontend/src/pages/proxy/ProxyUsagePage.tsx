import React from 'react';
import { Layers, TrendingUp, Globe, Activity, ArrowUpRight } from 'lucide-react';
import { proxyService } from '../../services/proxyService';
import { BandwidthCard } from '../../components/proxy/BandwidthCard';
import { ConnectionLimitCard } from '../../components/proxy/ConnectionLimitCard';

export const ProxyUsagePage: React.FC = () => {
  const usage = proxyService.getUsageStats();

  return (
    <div className="content-container">
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Bandwidth & Traffic Analytics
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
          Real-time telemetry on data consumption, request volume, TCP streams, and destination domains.
        </p>
      </div>

      {/* Top Usage Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <BandwidthCard
          usedGB={usage.totalGBUsed}
          totalLimitGB={usage.totalGBLimit}
          remainingGB={usage.remainingGB}
        />

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            Total Requests (7 Days)
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {usage.dailySeries.reduce((acc, curr) => acc + curr.requests, 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <TrendingUp size={13} />
            <span>Avg 35,420 requests / day</span>
          </div>
        </div>

        <ConnectionLimitCard
          activeStreams={usage.activeConcurrentStreams}
          maxThreads={5000}
        />
      </div>

      {/* Daily Usage Chart (CSS Bar Chart) */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Daily Bandwidth Consumption (GB)</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Traffic distribution across last 7 days</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', height: '180px', paddingTop: '1rem' }}>
          {usage.dailySeries.map((item) => {
            const maxGB = 80;
            const heightPct = (item.usageGB / maxGB) * 100;
            return (
              <div key={item.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  {item.usageGB} GB
                </span>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '45px',
                    height: `${heightPct}%`,
                    background: 'linear-gradient(180deg, var(--brand-primary) 0%, rgba(92, 60, 246, 0.4) 100%)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {item.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Domains Breakdown Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--bg-border)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Target Domain Distribution</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Top destinations by bandwidth volume</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.85rem 1.5rem' }}>Target Domain</th>
                <th style={{ padding: '0.85rem 1rem' }}>Traffic Share</th>
                <th style={{ padding: '0.85rem 1rem' }}>Total Requests</th>
                <th style={{ padding: '0.85rem 1.5rem', textAlign: 'right' }}>Bandwidth (GB)</th>
              </tr>
            </thead>
            <tbody>
              {usage.topDomains.map((dom) => (
                <tr key={dom.domain} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Globe size={15} color="var(--brand-primary)" />
                      <span>{dom.domain}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 120, height: 6, background: 'var(--bg-border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${dom.percentage}%`, height: '100%', background: 'var(--brand-primary)', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{dom.percentage}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary)' }}>
                    {dom.requests.toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {dom.bandwidthGB} GB
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
