import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { 
  BellRing, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  CalendarDays,
  ShieldCheck
} from 'lucide-react';

export const Alerts: React.FC = () => {
  const { investments } = usePortfolio();

  const currentDate = new Date(); // Always use the current real date

  const formatPYG = (val: number) => {
    return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(val);
  };

  const formatUSD = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val);
  };

  // 1. Gather all assets that have maturity dates (Bonds and Plazo Fijos)
  const maturityAssets = investments
    .filter(i => i.type === 'bono' || i.type === 'plazo_fijo')
    .map(inv => {
      const maturity = new Date(inv.maturityDate);
      const timeDiff = maturity.getTime() - currentDate.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      let status: 'critical' | 'warning' | 'healthy' = 'healthy';
      if (daysRemaining < 90) {
        status = 'critical';
      } else if (daysRemaining <= 365) {
        status = 'warning';
      }

      return {
        ...inv,
        daysRemaining,
        status,
        maturityFormatted: maturity.toLocaleDateString('es-PY', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        })
      };
    })
    .filter(asset => asset.daysRemaining >= 0)
    // Sort so most urgent are first
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  // 2. Count statuses
  const criticalCount = maturityAssets.filter(a => a.status === 'critical').length;
  const warningCount = maturityAssets.filter(a => a.status === 'warning').length;
  const healthyCount = maturityAssets.filter(a => a.status === 'healthy').length;

  return (
    <div className="animate-fade-in" style={styles.container}>
      {/* Metrics Row */}
      <div style={styles.alertSummaryRow}>
        <div className="glass-panel" style={{ ...styles.summaryCard, borderColor: 'rgba(255,107,107,0.3)' }}>
          <AlertTriangle size={24} color="var(--accent-coral)" />
          <div style={styles.summaryText}>
            <span style={styles.summaryValue} className="financial-num">{criticalCount}</span>
            <span style={styles.summaryLabel}>Críticos (&lt; 90 días)</span>
          </div>
        </div>

        <div className="glass-panel" style={{ ...styles.summaryCard, borderColor: 'rgba(245,158,11,0.3)' }}>
          <Clock size={24} color="var(--accent-yellow)" />
          <div style={styles.summaryText}>
            <span style={styles.summaryValue} className="financial-num">{warningCount}</span>
            <span style={styles.summaryLabel}>Advertencias (90-365 días)</span>
          </div>
        </div>

        <div className="glass-panel" style={{ ...styles.summaryCard, borderColor: 'rgba(16,185,129,0.3)' }}>
          <CheckCircle2 size={24} color="var(--color-usd)" />
          <div style={styles.summaryText}>
            <span style={styles.summaryValue} className="financial-num">{healthyCount}</span>
            <span style={styles.summaryLabel}>Saludables (&gt; 1 año)</span>
          </div>
        </div>
      </div>

      {/* Main Alerts Feed */}
      <div className="glass-panel" style={styles.alertsPanel}>
        <div style={styles.panelHeader}>
          <BellRing size={22} color="var(--color-pyg)" />
          <h3 style={styles.title}>Cronograma de Vencimientos de Activos</h3>
        </div>

        <div style={styles.alertList}>
          {maturityAssets.map((asset) => {
            const isCritical = asset.status === 'critical';
            const isWarning = asset.status === 'warning';
            
            let statusColor = 'var(--color-usd)';
            let statusBg = 'rgba(16, 185, 129, 0.05)';
            let statusBorder = 'rgba(16, 185, 129, 0.2)';
            let statusLabel = 'Saludable';
            
            if (isCritical) {
              statusColor = 'var(--accent-coral)';
              statusBg = 'rgba(255, 107, 107, 0.05)';
              statusBorder = 'rgba(255, 107, 107, 0.2)';
              statusLabel = 'Vencimiento Cercano';
            } else if (isWarning) {
              statusColor = 'var(--accent-yellow)';
              statusBg = 'rgba(245, 158, 11, 0.05)';
              statusBorder = 'rgba(245, 158, 11, 0.2)';
             const maturityYear = new Date(asset.maturityDate).getFullYear();
             const currentYear = new Date().getFullYear();
             statusLabel = maturityYear === currentYear ? 'Vence este año' : `Vence en ${maturityYear}`;
            }

            return (
              <div 
                key={asset.id} 
                className="glass-panel" 
                style={{ 
                  ...styles.alertItem, 
                  backgroundColor: statusBg,
                  borderColor: statusBorder
                }}
              >
                {/* Visual Status Indicator */}
                <div style={styles.statusCol}>
                  {isCritical ? (
                    <AlertTriangle size={24} color="var(--accent-coral)" />
                  ) : isWarning ? (
                    <Clock size={24} color="var(--accent-yellow)" />
                  ) : (
                    <ShieldCheck size={24} color="var(--color-usd)" />
                  )}
                  <span style={{ ...styles.statusLabel, color: statusColor }}>
                    {statusLabel}
                  </span>
                </div>

                {/* Details Column */}
                <div style={styles.detailsCol}>
                  <div style={styles.issuerRow}>
                    <span style={styles.issuerName}>{asset.issuer}</span>
                    <span style={styles.assetTypeBadge}>
                      {asset.type === 'bono' ? 'BONO BVA' : 'PLAZO FIJO'}
                    </span>
                  </div>
                  <span style={styles.description}>{asset.description} ({asset.isinOrSerie})</span>
                  
                  <div style={styles.metaRow}>
                    <div style={styles.metaItem}>
                      <CalendarDays size={14} color="var(--text-muted)" />
                      <span>Vence el: <strong style={{ color: '#fff' }}>{asset.maturityFormatted}</strong></span>
                    </div>
                    <span style={styles.capitalText}>
                      Capital: <strong>{asset.currency === 'PYG' ? formatPYG(asset.capital) : formatUSD(asset.capital)}</strong>
                    </span>
                  </div>
                </div>

                {/* Countdown Column */}
                <div style={styles.countdownCol}>
                  <span 
                    style={{ 
                      ...styles.countdownVal, 
                      color: statusColor,
                      textShadow: `0 0 10px ${statusColor}33`
                    }} 
                    className="financial-num"
                  >
                    {asset.daysRemaining}
                  </span>
                  <span style={styles.countdownUnit}>Días Restantes</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '40px',
    marginLeft: '280px',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  alertSummaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
  },
  summaryCard: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  summaryText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  summaryValue: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  alertsPanel: {
    padding: '24px',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '24px',
  },
  title: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#fff',
  },
  alertList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  alertItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderRadius: '12px',
    transition: 'var(--transition-smooth)',
  },
  statusCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    width: '120px',
  },
  statusLabel: {
    fontSize: '0.7rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    textAlign: 'center',
  },
  detailsCol: {
    flex: 1,
    padding: '0 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  issuerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  issuerName: {
    fontSize: '1rem',
    fontWeight: '800',
    color: '#fff',
  },
  assetTypeBadge: {
    fontSize: '0.625rem',
    fontWeight: '750',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-secondary)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  description: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    marginTop: '6px',
    fontSize: '0.775rem',
    color: 'var(--text-secondary)',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  capitalText: {
    fontSize: '0.775rem',
  },
  countdownCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '110px',
    borderLeft: '1px solid var(--border-glass)',
    paddingLeft: '24px',
  },
  countdownVal: {
    fontSize: '2.125rem',
    fontWeight: '800',
    lineHeight: 1,
  },
  countdownUnit: {
    fontSize: '0.65rem',
    color: 'var(--text-secondary)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: '4px',
  },
};
