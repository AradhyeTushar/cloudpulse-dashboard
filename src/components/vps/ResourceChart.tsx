import React, { useState } from 'react';
import { MetricTimePoint } from '../../types';

interface ResourceChartProps {
  title: string;
  currentValue: string;
  data: MetricTimePoint[];
  dataKey: 'cpu' | 'ram' | 'diskIO' | 'networkIn' | 'networkOut';
  secondaryKey?: 'networkOut';
  unit: string;
  color?: string;
  timeRange: '1h' | '24h' | '7d' | '30d';
  onTimeRangeChange: (range: '1h' | '24h' | '7d' | '30d') => void;
}

export const ResourceChart: React.FC<ResourceChartProps> = ({
  title,
  currentValue,
  data,
  dataKey,
  secondaryKey,
  unit,
  color = '#6366f1',
  timeRange,
  onTimeRangeChange,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  // Chart dimensions
  const width = 500;
  const height = 160;
  const padding = { top: 20, right: 15, bottom: 25, left: 35 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Max value calculation
  const maxVal = Math.max(
    ...data.map((d) => {
      const v1 = d[dataKey];
      const v2 = secondaryKey ? d[secondaryKey] : 0;
      return Math.max(v1, v2);
    }),
    unit === '%' ? 100 : 50
  );

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - (d[dataKey] / maxVal) * chartHeight;
    return { x, y, data: d };
  });

  // SVG path for line and area
  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  const hoveredPoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title-group">
          <h3>{title}</h3>
          <div className="chart-current-stat">{currentValue}</div>
        </div>

        <div className="chart-controls">
          {(['1h', '24h', '7d', '30d'] as const).map((r) => (
            <button
              key={r}
              className={`chart-time-btn ${timeRange === r ? 'active' : ''}`}
              onClick={() => onTimeRangeChange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="svg-chart-container">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="svg-chart"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const normalizedX = (mouseX / rect.width) * width;
            if (normalizedX >= padding.left && normalizedX <= width - padding.right) {
              const fraction = (normalizedX - padding.left) / chartWidth;
              const idx = Math.round(fraction * (data.length - 1));
              setHoverIndex(Math.max(0, Math.min(data.length - 1, idx)));
            }
          }}
        >
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid horizontal lines */}
          {[0, 0.5, 1].map((fraction, i) => {
            const y = padding.top + chartHeight * (1 - fraction);
            const labelVal = Math.round(maxVal * fraction);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="var(--border-subtle)"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  fill="var(--text-dim)"
                  fontSize="9"
                  textAnchor="end"
                  fontFamily="var(--font-mono)"
                >
                  {labelVal}
                  {unit}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill={`url(#grad-${dataKey})`} />

          {/* Line Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover Crosshair & Tooltip */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={padding.top}
                x2={hoveredPoint.x}
                y2={padding.top + chartHeight}
                stroke="var(--brand-primary)"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="4.5"
                fill="var(--bg-surface)"
                stroke={color}
                strokeWidth="2.5"
              />
              {/* Tooltip Card */}
              <g
                transform={`translate(${Math.min(
                  width - 95,
                  Math.max(padding.left + 5, hoveredPoint.x - 45)
                )}, ${Math.max(10, hoveredPoint.y - 38)})`}
              >
                <rect
                  width="90"
                  height="30"
                  rx="5"
                  fill="var(--bg-surface)"
                  stroke="var(--border-strong)"
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                />
                <text
                  x="45"
                  y="12"
                  textAnchor="middle"
                  fill="var(--text-dim)"
                  fontSize="8"
                  fontFamily="var(--font-mono)"
                >
                  {hoveredPoint.data.timestamp}
                </text>
                <text
                  x="45"
                  y="24"
                  textAnchor="middle"
                  fill="var(--text-primary)"
                  fontWeight="700"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  {hoveredPoint.data[dataKey]}
                  {unit}
                </text>
              </g>
            </g>
          )}

          {/* Bottom X-axis timestamps */}
          {points
            .filter((_, idx) => idx % Math.ceil(points.length / 5) === 0 || idx === points.length - 1)
            .map((pt, idx) => (
              <text
                key={idx}
                x={pt.x}
                y={height - 6}
                fill="var(--text-dim)"
                fontSize="9"
                textAnchor="middle"
                fontFamily="var(--font-mono)"
              >
                {pt.data.timestamp}
              </text>
            ))}
        </svg>
      </div>
    </div>
  );
};
