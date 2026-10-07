import React from 'react';

// --- 1. Horizontal Bar Chart ---
interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  color?: string;
  emptyMessage?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  color = 'var(--primary)',
  emptyMessage = 'No data available to display.',
}) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        {emptyMessage}
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      {data.map((item, idx) => {
        const percentage = Math.round((item.value / maxValue) * 100);
        return (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
              <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{item.label}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{item.value}</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                background: 'var(--chart-bar-bg)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${percentage}%`,
                  height: '100%',
                  background: color,
                  borderRadius: '4px',
                  transition: 'width 0.4s ease-in-out',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- 2. Donut / Distribution Chart ---
interface DonutChartProps {
  data: Array<{ label: string; value: number }>;
  colors?: string[];
  emptyMessage?: string;
}

const DEFAULT_PALETTE = ['#62836b', '#b2c78d', '#d7b575', '#bb7967', '#779da3', '#989284'];

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  colors = DEFAULT_PALETTE,
  emptyMessage = 'No data available to display.',
}) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        {emptyMessage}
      </div>
    );
  }

  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  if (total === 0) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        {emptyMessage}
      </div>
    );
  }

  // Calculate SVG circular stroke dashes

  const size = 140;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        {data.map((item, idx) => {
          const ratio = item.value / total;
          const strokeDasharray = `${ratio * circumference} ${circumference}`;
          const strokeDashoffset = -data.slice(0, idx).reduce((sum, entry) => sum + entry.value, 0) / total * circumference;
          const strokeColor = colors[idx % colors.length];

          return (
            <circle
              key={idx}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="butt"
            />
          );
        })}
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '150px' }}>
        {data.map((item, idx) => {
          const percentage = Math.round((item.value / total) * 100);
          const itemColor = colors[idx % colors.length];
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: itemColor,
                  display: 'inline-block',
                }}
              />
              <span style={{ color: 'var(--text-muted)', flex: 1 }}>{item.label}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                {item.value} ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- 3. Timeline / Activity Trend Line Chart ---
interface TimelineTrendProps {
  data: Array<{ date: string; count: number }>;
  color?: string;
  height?: number;
  emptyMessage?: string;
}

export const TimelineTrend: React.FC<TimelineTrendProps> = ({
  data,
  color = '#10b981',
  height = 120,
  emptyMessage = 'No activity over the selected period.',
}) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        {emptyMessage}
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const width = 500;
  const paddingX = 20;
  const paddingY = 20;

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * (width - 2 * paddingX);
    const y = height - paddingY - (d.count / maxVal) * (height - 2 * paddingY);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M ${points.join(' L ')} L ${width - paddingX},${height - paddingY} L ${paddingX},${height - paddingY} Z`;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: `${height}px`, display: 'block' }}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Fill area */}
        <path d={areaD} fill={`url(#grad-${color})`} />

        {/* Trend line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Coordinate points */}
        {data.map((d, i) => {
          const x = paddingX + (i / Math.max(data.length - 1, 1)) * (width - 2 * paddingX);
          const y = height - paddingY - (d.count / maxVal) * (height - 2 * paddingY);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="3.5" fill={color} />
              <text
                x={x}
                y={y - 8}
                textAnchor="middle"
                fontSize="10"
                fill="var(--text-muted)"
                fontWeight="500"
              >
                {d.count}
              </text>
            </g>
          );
        })}
      </svg>
      {/* Date labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <span>{data[0]?.date}</span>
        {data.length > 2 && <span>{data[Math.floor(data.length / 2)]?.date}</span>}
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
};

// --- 4. Interactive Park Hotspot Map ---
interface HotspotMapProps {
  parkName: string;
  items: Array<{
    id: string;
    label: string;
    type: string;
    coordinates?: { latitude: number; longitude: number };
    status?: string;
  }>;
}

export const HotspotMap: React.FC<HotspotMapProps> = ({ parkName, items }) => {
  const validCoordinates = items.filter(
    (item) => item.coordinates && item.coordinates.latitude && item.coordinates.longitude
  );

  return (
    <div
      style={{
        background: 'var(--bg-panel-alt)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '1.25rem',
        marginTop: '1rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
            🗺️ Geographic Incident & Activity Distribution
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Spatial coordinates logged for <strong>{parkName}</strong>
          </p>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            padding: '0.25rem 0.6rem',
            background: 'rgba(59, 130, 246, 0.15)',
            color: '#60a5fa',
            borderRadius: '9999px',
            border: '1px solid rgba(59, 130, 246, 0.3)',
          }}
        >
          {validCoordinates.length} Geo-tagged Records
        </span>
      </div>

      {validCoordinates.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No GPS coordinate pins recorded for this selection.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {validCoordinates.slice(0, 8).map((point, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-input)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                }}
              >
                📍
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {point.label || point.type}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {point.coordinates?.latitude.toFixed(4)}°N, {point.coordinates?.longitude.toFixed(4)}°E
                </div>
              </div>
              {point.status && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    background: 'var(--badge-neutral-bg)',
                    color: 'var(--text-dim)',
                  }}
                >
                  {point.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
