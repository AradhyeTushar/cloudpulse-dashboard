import React, { useId } from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#5c3cf6',
  height = 42,
  width = 110,
}) => {
  const reactId = useId();
  // Safe valid SVG identifier
  const gradId = `sparkline-grad-${reactId.replace(/[^a-zA-Z0-9-_]/g, '')}`;

  if (!data || data.length < 2) return null;

  // Resolve CSS variables if passed
  const resolvedColor =
    color.startsWith('var(') || color.includes('primary')
      ? '#5c3cf6'
      : color;

  const min = Math.min(...data);
  const max = Math.max(...data, min + 1);
  const padding = 4;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / (max - min)) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `M ${points[0]} L ${points.join(' L ')} L ${(width - padding).toFixed(1)},${height} L ${padding},${height} Z`;

  return (
    <div className="sparkline-container" style={{ width: `${width}px`, height: `${height}px` }}>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={resolvedColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={resolvedColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={resolvedColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
