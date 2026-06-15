import React, { useState } from 'react';

// --- DONUT CHART COMPONENTS ---
interface DonutData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutData[];
  title: string;
  centerLabel: string;
  centerValue: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, title, centerLabel, centerValue }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 70;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  
  let currentOffset = 0;

  return (
    <div style={donutStyles.container}>
      <h3 style={donutStyles.title}>{title}</h3>
      <div style={donutStyles.chartWrapper}>
        <div style={donutStyles.svgContainer}>
          <svg width="220" height="220" viewBox="0 0 200 200" style={donutStyles.svg}>
            {/* Background ring */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.03)"
              strokeWidth={strokeWidth}
            />
            {data.map((item, idx) => {
              if (item.value <= 0) return null;
              
              const percentage = item.value / total;
              const dashArray = `${percentage * circumference} ${circumference}`;
              const dashOffset = -currentOffset;
              
              currentOffset += percentage * circumference;
              
              const isHovered = hoveredIdx === idx;
              
              return (
                <circle
                  key={item.label}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 100 100)"
                  style={{
                    transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                    opacity: hoveredIdx === null || isHovered ? 1 : 0.65,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>
          <div style={donutStyles.centerText}>
            <span style={donutStyles.centerVal} className="financial-num">{centerValue}</span>
            <span style={donutStyles.centerLbl}>{centerLabel}</span>
          </div>
        </div>

        {/* Legend */}
        <div style={donutStyles.legend}>
          {data.map((item, idx) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            const isHovered = hoveredIdx === idx;
            return (
              <div 
                key={item.label} 
                style={{
                  ...donutStyles.legendItem,
                  backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div style={{ ...donutStyles.colorIndicator, backgroundColor: item.color }} />
                <div style={donutStyles.legendTextCol}>
                  <span style={donutStyles.legendLabel}>{item.label}</span>
                  <span style={donutStyles.legendVal} className="financial-num">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- BAR CHART COMPONENTS ---
interface BarData {
  label: string;
  valuePYG: number;
  valueUSD: number;
}

interface BarChartProps {
  data: BarData[];
  title: string;
  exchangeRate: number;
}

export const BarChart: React.FC<BarChartProps> = ({ data, title, exchangeRate }) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const maxVal = Math.max(
    ...data.map(item => item.valuePYG + (item.valueUSD * exchangeRate)),
    10000000 // min ceiling for empty
  );

  // Formatting utility
  const formatCompact = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toString();
  };

  const formatPYG = (val: number) => {
    return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="glass-panel" style={barStyles.container}>
      <div style={barStyles.header}>
        <h3 style={barStyles.title}>{title}</h3>
        <div style={barStyles.chartKeys}>
          <div style={barStyles.keyItem}>
            <div style={{ ...barStyles.keyDot, backgroundColor: 'var(--color-pyg)' }} />
            <span style={barStyles.keyText}>PYG</span>
          </div>
          <div style={barStyles.keyItem}>
            <div style={{ ...barStyles.keyDot, backgroundColor: 'var(--color-usd)' }} />
            <span style={barStyles.keyText}>USD</span>
          </div>
        </div>
      </div>

      <div style={barStyles.chartArea}>
        {/* Y Axis Guide Lines */}
        <div style={barStyles.gridLines}>
          {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
            <div key={ratio} style={barStyles.gridLineRow}>
              <span style={barStyles.axisText} className="financial-num">
                {formatCompact(maxVal * ratio)}
              </span>
              <div style={barStyles.line} />
            </div>
          ))}
        </div>

        {/* Bars Container */}
        <div style={barStyles.barsContainer}>
          {data.map((item, idx) => {
            const pygVal = item.valuePYG;
            const usdVal = item.valueUSD * exchangeRate;
            const totalVal = pygVal + usdVal;
            
            const pygPct = totalVal > 0 ? (pygVal / maxVal) * 100 : 0;
            const usdPct = totalVal > 0 ? (usdVal / maxVal) * 100 : 0;
            
            const isHovered = activeIdx === idx;
            
            return (
              <div 
                key={item.label} 
                style={barStyles.barCol}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
              >
                {/* Tooltip */}
                {isHovered && totalVal > 0 && (
                  <div style={barStyles.tooltip}>
                    <span style={barStyles.tooltipTitle}>{item.label}</span>
                    {pygVal > 0 && (
                      <div style={barStyles.tooltipRow}>
                        <div style={{ ...barStyles.tooltipDot, backgroundColor: 'var(--color-pyg)' }} />
                        <span style={barStyles.tooltipText}>PYG: {formatPYG(pygVal)}</span>
                      </div>
                    )}
                    {item.valueUSD > 0 && (
                      <div style={barStyles.tooltipRow}>
                        <div style={{ ...barStyles.tooltipDot, backgroundColor: 'var(--color-usd)' }} />
                        <span style={barStyles.tooltipText}>
                          USD: ${item.valueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    <div style={barStyles.tooltipTotal}>
                      <span>Total: {formatPYG(totalVal)}</span>
                    </div>
                  </div>
                )}

                {/* The Bar Stack */}
                <div style={barStyles.barTrack}>
                  {/* USD portion */}
                  <div 
                    style={{
                      ...barStyles.barSegment,
                      backgroundColor: isHovered ? 'var(--color-usd)' : 'rgba(16, 185, 129, 0.8)',
                      height: `${usdPct}%`,
                      borderTopLeftRadius: '4px',
                      borderTopRightRadius: '4px',
                      borderBottomLeftRadius: pygVal === 0 ? '4px' : '0px',
                      borderBottomRightRadius: pygVal === 0 ? '4px' : '0px',
                    }}
                  />
                  {/* PYG portion */}
                  <div 
                    style={{
                      ...barStyles.barSegment,
                      backgroundColor: isHovered ? 'var(--color-pyg)' : 'rgba(0, 210, 196, 0.8)',
                      height: `${pygPct}%`,
                      borderTopLeftRadius: usdVal === 0 ? '4px' : '0px',
                      borderTopRightRadius: usdVal === 0 ? '4px' : '0px',
                      borderBottomLeftRadius: '4px',
                      borderBottomRightRadius: '4px',
                    }}
                  />
                </div>

                {/* X Axis Label */}
                <span style={{
                  ...barStyles.xLabel,
                  color: isHovered ? 'var(--color-pyg)' : 'var(--text-secondary)',
                  fontWeight: isHovered ? '750' : '500',
                }}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- STYLES ---
const donutStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    height: '100%',
  },
  title: {
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '-0.01em',
  },
  chartWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  svgContainer: {
    position: 'relative',
    width: '220px',
    height: '220px',
  },
  svg: {
    transform: 'rotate(-90deg)',
  },
  centerText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    width: '130px',
  },
  centerVal: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    lineHeight: 1.1,
  },
  centerLbl: {
    fontSize: '0.65rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: '2px',
  },
  legend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flex: 1,
    minWidth: '150px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 12px',
    borderRadius: '8px',
    transition: 'var(--transition-smooth)',
    cursor: 'pointer',
  },
  colorIndicator: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  legendTextCol: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    gap: '8px',
  },
  legendLabel: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  legendVal: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
};

const barStyles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  chartKeys: {
    display: 'flex',
    gap: '12px',
  },
  keyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  keyDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  keyText: {
    fontSize: '0.725rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  chartArea: {
    height: '240px',
    position: 'relative',
    marginTop: '8px',
  },
  gridLines: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  gridLineRow: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: '0px',
  },
  axisText: {
    fontSize: '0.675rem',
    color: 'var(--text-muted)',
    width: '50px',
    textAlign: 'left',
    fontWeight: '600',
  },
  line: {
    flex: 1,
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  barsContainer: {
    position: 'absolute',
    left: '50px',
    right: 0,
    top: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '220px',
  },
  barCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    flex: 1,
    position: 'relative',
    maxWidth: '45px',
  },
  barTrack: {
    width: '18px',
    height: '200px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '4px',
    transition: 'var(--transition-smooth)',
    cursor: 'pointer',
  },
  barSegment: {
    width: '100%',
    transition: 'height 0.3s ease-out, background-color 0.2s ease',
  },
  xLabel: {
    fontSize: '0.7rem',
    marginTop: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
    transition: 'var(--transition-smooth)',
  },
  tooltip: {
    position: 'absolute',
    bottom: '215px',
    backgroundColor: 'rgba(12, 15, 23, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '10px 14px',
    width: '200px',
    zIndex: 10,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    pointerEvents: 'none',
  },
  tooltipTitle: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: '4px',
  },
  tooltipRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  tooltipDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  tooltipText: {
    fontSize: '0.725rem',
    color: 'var(--text-secondary)',
    fontWeight: '600',
  },
  tooltipTotal: {
    fontSize: '0.775rem',
    fontWeight: '700',
    color: 'var(--color-pyg)',
    marginTop: '2px',
    borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
    paddingTop: '4px',
  },
};
