import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ExternalLink,
  Info,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import { vpsService } from '../../services/vpsService';
import { VpsInstance } from '../../types';
import { TerminalModal } from '../../components/vps/TerminalModal';
import { useToast } from '../../context/ToastContext';

export const VpsServerUsagePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [vps, setVps] = useState<VpsInstance | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<'24h' | 'week' | 'month' | '6months'>('24h');

  // Collapse states
  const [cpuOpen, setCpuOpen] = useState(true);
  const [ramOpen, setRamOpen] = useState(true);
  const [diskOpen, setDiskOpen] = useState(true);

  // Hover state
  const [hoveredPoint, setHoveredPoint] = useState<{ chart: string; x: number; y: number; val: string } | null>(null);

  useEffect(() => {
    const loadVps = async () => {
      if (!id) return;
      const found = await vpsService.getVpsById(id);
      setVps(found);
    };
    loadVps();
  }, [id]);

  // Generate 32 points matching the screenshot graphs
  const cpuPoints = [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 2, 3, 2, 4, 8, 12, 24, 38, 44, 44, 44, 45, 47, 45, 36, 26,
  ];

  const ramPoints = [
    1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 2.3, 1.7, 1.7, 1.7, 1.6, 2.0, 2.0, 1.5, 2.0, 1.7, 1.9, 2.1, 2.3, 2.2, 2.2, 2.2, 2.2, 2.4, 2.7, 2.8,
  ];

  const renderSvgGraph = (
    data: number[],
    maxY: number,
    yUnit: string,
    yLabels: string[],
    chartKey: string
  ) => {
    const width = 900;
    const height = 150;
    const padL = 45;
    const padR = 20;
    const padT = 15;
    const padB = 25;

    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const coords = data.map((val, i) => {
      const x = padL + (i / (data.length - 1)) * plotW;
      const y = padT + plotH - (val / maxY) * plotH;
      return { x, y, val };
    });

    const pathD = coords.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
    }, '');

    return (
      <div className="chart-svg-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" preserveAspectRatio="none">
          {/* Horizontal Grid lines */}
          {yLabels.map((label, idx) => {
            const yPos = padT + (idx / (yLabels.length - 1)) * plotH;
            return (
              <g key={idx}>
                <text
                  x={padL - 10}
                  y={yPos + 4}
                  textAnchor="end"
                  fill="var(--text-dim)"
                  fontSize="11"
                  fontFamily="var(--font-sans)"
                >
                  {label}
                </text>
                <line
                  x1={padL}
                  y1={yPos}
                  x2={width - padR}
                  y2={yPos}
                  stroke="var(--border-subtle)"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Connected Polyline */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--brand-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots */}
          {coords.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r="3"
              fill="var(--brand-primary)"
              style={{ cursor: 'pointer', transition: 'r 0.15s' }}
              onMouseEnter={() => setHoveredPoint({ chart: chartKey, x: pt.x, y: pt.y, val: `${pt.val} ${yUnit}` })}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}

          {/* X Axis Time Labels */}
          {['5 AM', '11 AM', '5 PM', '11 PM'].map((time, idx) => {
            const xPos = padL + (idx / 3) * plotW;
            return (
              <text
                key={idx}
                x={xPos}
                y={height - 5}
                textAnchor="middle"
                fill="var(--text-dim)"
                fontSize="11"
                fontFamily="var(--font-sans)"
              >
                {time}
              </text>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && hoveredPoint.chart === chartKey && (
          <div
            style={{
              position: 'absolute',
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100 - 35}%`,
              transform: 'translateX(-50%)',
              background: '#111827',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              pointerEvents: 'none',
              zIndex: 10,
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            {hoveredPoint.val}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Top Header matching Screenshot 4 */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="page-title-group">
          <h1>Server Usage</h1>
        </div>

        <div>
          <button className="terminal-top-btn" onClick={() => setTerminalOpen(true)}>
            <span>Terminal</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {/* Time Filter Bar matching Screenshot 4 */}
      <div className="usage-filter-bar">
        <div className="usage-time-pills">
          <button
            type="button"
            className={`usage-time-pill ${timeRange === '24h' ? 'active' : ''}`}
            onClick={() => setTimeRange('24h')}
          >
            Last 24 hours
          </button>
          <button
            type="button"
            className={`usage-time-pill ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            Last week
          </button>
          <button
            type="button"
            className={`usage-time-pill ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            Last month
          </button>
          <button
            type="button"
            className={`usage-time-pill ${timeRange === '6months' ? 'active' : ''}`}
            onClick={() => setTimeRange('6months')}
          >
            Last 6 months
          </button>
        </div>

        <button className="btn-icon" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <SlidersHorizontal size={14} color="var(--text-secondary)" />
        </button>
      </div>

      {/* =====================================================================
          1. CPU USAGE CHART (Screenshot 4)
         ===================================================================== */}
      <div className="chart-card-container">
        <div className="chart-card-header" onClick={() => setCpuOpen(!cpuOpen)} style={{ cursor: 'pointer' }}>
          <div className="chart-title-group">
            <span>CPU Usage</span>
            <Info size={14} color="var(--text-dim)" />
          </div>
          <div>
            {cpuOpen ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
          </div>
        </div>

        {cpuOpen && renderSvgGraph(cpuPoints, 50, '%', ['50 %', '25 %', '0 %'], 'cpu')}
      </div>

      {/* =====================================================================
          2. RAM USAGE CHART (Screenshot 4)
         ===================================================================== */}
      <div className="chart-card-container">
        <div className="chart-card-header" onClick={() => setRamOpen(!ramOpen)} style={{ cursor: 'pointer' }}>
          <div className="chart-title-group">
            <span>RAM Usage</span>
            <Info size={14} color="var(--text-dim)" />
          </div>
          <div>
            {ramOpen ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
          </div>
        </div>

        {ramOpen && renderSvgGraph(ramPoints, 3, 'GB', ['3 GB', '2 GB', '1 GB', '0 GB'], 'ram')}
      </div>

      {/* =====================================================================
          3. DISK SPACE CHART (Screenshot 4)
         ===================================================================== */}
      <div className="chart-card-container">
        <div className="chart-card-header" onClick={() => setDiskOpen(!diskOpen)} style={{ cursor: 'pointer' }}>
          <div className="chart-title-group">
            <span>Disk Space</span>
            <Info size={14} color="var(--text-dim)" />
          </div>
          <div>
            {diskOpen ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
          </div>
        </div>

        {diskOpen && renderSvgGraph(
          [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
          100,
          'GB',
          ['100 GB', '50 GB', '0 GB'],
          'disk'
        )}
      </div>

      {/* Terminal Modal */}
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
