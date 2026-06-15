import React, { useState, useEffect } from 'react';
import { MOCK_BOND_LAUNCHES } from '../data/initialPortfolio';
import { 
  TrendingUp, 
  Award, 
  Percent, 
  ChevronRight,
  Sparkles,
  Building,
  X
} from 'lucide-react';
import type { BondLaunch } from '../types/portfolio';

interface SimulationRow {
  year: number;
  interestEarned: number;
  accumulated: number;
  totalValue: number;
}

interface SimulationState {
  launch: BondLaunch;
  capital: number;
  rows: SimulationRow[];
}

const formatPYG = new Intl.NumberFormat('es-PY', {
  style: 'decimal',
  maximumFractionDigits: 0,
});

const formatUSD = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (value: number, currency: 'PYG' | 'USD'): string => {
  if (currency === 'PYG') return `₲ ${formatPYG.format(value)}`;
  return `US$ ${formatUSD.format(value)}`;
};

const buildProjection = (capital: number, rate: number, years: number): SimulationRow[] => {
  const annualCoupon = capital * (rate / 100);
  const rows: SimulationRow[] = [];
  let accumulated = 0;
  for (let y = 1; y <= years; y++) {
    accumulated += annualCoupon;
    rows.push({
      year: y,
      interestEarned: annualCoupon,
      accumulated,
      totalValue: capital + accumulated,
    });
  }
  return rows;
};

export const BondLaunches: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'Abierta' | 'Próximamente'>('all');
  const [launches, setLaunches] = useState<BondLaunch[]>([]);
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [capitalInput, setCapitalInput] = useState<string>('');

  // ── Electron IPC loading logic (unchanged) ────────────────────────────
  const loadLaunches = async () => {
    if (window.electronAPI) {
      try {
        const cached = await window.electronAPI.getRealLaunches();
        if (cached && cached.length > 0) {
          setLaunches(cached);
        } else {
          await handleSync();
        }
      } catch (err) {
        console.error('Failed to load launches:', err);
        setLaunches(MOCK_BOND_LAUNCHES);
      }
    } else {
      setLaunches(MOCK_BOND_LAUNCHES);
    }
  };

  const handleSync = async () => {
    try {
      if (window.electronAPI) {
        const fresh = await window.electronAPI.syncRealLaunches();
        setLaunches(fresh);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLaunches(MOCK_BOND_LAUNCHES);
      }
    } catch (err) {
      console.error('Failed to sync launches:', err);
    }
  };

  useEffect(() => {
    loadLaunches();
    
    // Listen for badge updates (so when news are updated, launches are reloaded too!)
    const handleBadgeUpdate = () => {
      loadLaunches();
    };
    window.addEventListener('news-badge-update', handleBadgeUpdate);
    return () => {
      window.removeEventListener('news-badge-update', handleBadgeUpdate);
    };
  }, []);

  const filteredLaunches = launches.filter(launch => {
    return activeTab === 'all' || launch.status === activeTab;
  });

  // ── Simulation logic ──────────────────────────────────────────────────
  const openSimulation = (launch: BondLaunch) => {
    const defaultCapital = launch.currency === 'PYG' ? 25_000_000 : 5_000;
    const rows = buildProjection(defaultCapital, launch.interestRate, launch.maturityYears);
    setCapitalInput(String(defaultCapital));
    setSimulation({ launch, capital: defaultCapital, rows });
  };

  const recalculate = (rawInput: string) => {
    if (!simulation) return;
    setCapitalInput(rawInput);
    const parsed = Number(rawInput.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      const rows = buildProjection(parsed, simulation.launch.interestRate, simulation.launch.maturityYears);
      setSimulation({ ...simulation, capital: parsed, rows });
    }
  };

  const closeSimulation = () => {
    setSimulation(null);
    setCapitalInput('');
  };

  // ── SVG bar chart ─────────────────────────────────────────────────────
  const renderBarChart = (rows: SimulationRow[], _currency: 'PYG' | 'USD') => {
    if (rows.length === 0) return null;
    const maxVal = rows[rows.length - 1].totalValue;
    const chartW = 600;
    const chartH = 220;
    const barPad = 6;
    const barW = Math.max(12, Math.min(48, (chartW - 60) / rows.length - barPad));
    const leftPad = 20;
    const bottomPad = 30;
    const drawH = chartH - bottomPad - 10;

    return (
      <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} style={styles.svgChart}>
        {/* horizontal grid lines */}
        {[0.25, 0.5, 0.75, 1].map((pct) => {
          const y = 10 + drawH * (1 - pct);
          return (
            <line key={pct} x1={leftPad} y1={y} x2={chartW - 10} y2={y}
              stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          );
        })}

        {rows.map((r, i) => {
          const barH = maxVal > 0 ? (r.totalValue / maxVal) * drawH : 0;
          const x = leftPad + i * (barW + barPad) + barPad;
          const y = 10 + drawH - barH;

          // split bar into capital portion and interest portion
          const capPortion = maxVal > 0 ? (rows[0].totalValue - rows[0].accumulated) / maxVal * drawH : 0;
          const intH = barH - capPortion;

          return (
            <g key={r.year}>
              {/* capital portion */}
              <rect x={x} y={y + intH} width={barW} height={capPortion}
                rx={2} fill="rgba(0, 210, 196, 0.25)" />
              {/* interest portion */}
              <rect x={x} y={y} width={barW} height={Math.max(0, intH)}
                rx={2} fill="var(--color-pyg)" opacity={0.7} />
              {/* year label */}
              <text x={x + barW / 2} y={chartH - 8}
                textAnchor="middle" fill="var(--text-muted)"
                fontSize={10} fontFamily="inherit">
                {r.year}
              </text>
            </g>
          );
        })}

        {/* axis labels */}
        <text x={chartW / 2} y={chartH} textAnchor="middle" fill="var(--text-muted)"
          fontSize={9} fontFamily="inherit">Año</text>
      </svg>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in" style={styles.container}>
      {/* ── Simulation Modal ──────────────────────────────────────────── */}
      {simulation && (
        <div style={styles.modalOverlay} onClick={closeSimulation}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={styles.modalSubtitle}>Simulación de Inversión</span>
                <h2 style={styles.modalTitle}>{simulation.launch.issuer}</h2>
              </div>
              <button onClick={closeSimulation} style={styles.modalCloseBtn} aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>

            {/* Bond summary line */}
            <div style={styles.modalBondInfo}>
              <span>Tasa: <strong className="financial-num" style={{ color: 'var(--color-pyg)' }}>
                {simulation.launch.interestRate.toFixed(2)}%
              </strong></span>
              <span>Plazo: <strong>{simulation.launch.maturityYears} años</strong></span>
              <span>Frecuencia: <strong style={{ textTransform: 'capitalize' }}>{simulation.launch.paymentFrequency}</strong></span>
              <span>Calificación: <strong style={{ color: 'var(--accent-yellow)' }}>{simulation.launch.rating}</strong></span>
            </div>

            {/* Capital input */}
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Capital a Invertir ({simulation.launch.currency})</label>
              <input
                type="text"
                value={capitalInput}
                onChange={(e) => recalculate(e.target.value)}
                style={styles.capitalInput}
                className="financial-num"
                placeholder={simulation.launch.currency === 'PYG' ? '25000000' : '5000'}
              />
            </div>

            {/* Year-by-year table */}
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Año</th>
                    <th style={styles.th}>Interés Anual</th>
                    <th style={styles.th}>Acumulado</th>
                    <th style={styles.th}>Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {simulation.rows.map((r) => (
                    <tr key={r.year} style={styles.tr}>
                      <td style={styles.td} className="financial-num">{r.year}</td>
                      <td style={styles.tdRight} className="financial-num">
                        {formatCurrency(r.interestEarned, simulation.launch.currency)}
                      </td>
                      <td style={styles.tdRight} className="financial-num">
                        {formatCurrency(r.accumulated, simulation.launch.currency)}
                      </td>
                      <td style={{ ...styles.tdRight, color: 'var(--color-pyg)', fontWeight: 700 }} className="financial-num">
                        {formatCurrency(r.totalValue, simulation.launch.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SVG bar chart */}
            <div style={styles.chartSection}>
              <span style={styles.chartTitle}>Crecimiento Proyectado</span>
              {renderBarChart(simulation.rows, simulation.launch.currency)}
              <div style={styles.chartLegend}>
                <span style={styles.legendItem}>
                  <span style={{ ...styles.legendSwatch, background: 'rgba(0, 210, 196, 0.25)' }} />
                  Capital
                </span>
                <span style={styles.legendItem}>
                  <span style={{ ...styles.legendSwatch, background: 'var(--color-pyg)', opacity: 0.7 }} />
                  Intereses Acumulados
                </span>
              </div>
            </div>

            {/* Footer */}
            <div style={styles.modalFooter}>
              <span style={styles.disclaimerText}>
                * Esta simulación es meramente ilustrativa y no constituye una oferta ni compromiso de inversión.
              </span>
              <button onClick={closeSimulation} style={styles.closeBtn}>
                Cerrar Simulación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Info Panel */}
      <div className="glass-panel" style={styles.promoPanel}>
        <div style={styles.promoTextCol}>
          <div style={styles.sparkleRow}>
            <Sparkles size={16} color="var(--color-pyg)" />
            <span style={styles.sparkleLabel}>Recomendaciones Inteligentes</span>
          </div>
          <h2 style={styles.promoTitle}>Oportunidades de Emisión en Paraguay</h2>
          <p style={styles.promoDesc}>
            Nuestro motor analiza de manera permanente las ofertas de **Cadiem, Basa Capital, Investor** y la **Bolsa de Valores de Asunción (BVA)**. Evaluamos la relación riesgo/retorno cruzando la tasa nominal con la calificación de riesgo internacional y local (Fitch, FIX, PCR) para darte las mejores sugerencias.
          </p>
        </div>
        <div style={styles.promoIconCol}>
          <TrendingUp size={64} color="var(--color-pyg)" style={{ opacity: 0.15 }} />
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={styles.tabContainer}>
        <button 
          onClick={() => setActiveTab('all')}
          style={{ ...styles.tabBtn, borderBottom: activeTab === 'all' ? '2px solid var(--color-pyg)' : 'none', color: activeTab === 'all' ? 'var(--color-pyg)' : 'var(--text-secondary)' }}
        >
          Todas las Ofertas
        </button>
        <button 
          onClick={() => setActiveTab('Abierta')}
          style={{ ...styles.tabBtn, borderBottom: activeTab === 'Abierta' ? '2px solid var(--color-pyg)' : 'none', color: activeTab === 'Abierta' ? 'var(--color-pyg)' : 'var(--text-secondary)' }}
        >
          Período de Colocación (Abiertas)
        </button>
        <button 
          onClick={() => setActiveTab('Próximamente')}
          style={{ ...styles.tabBtn, borderBottom: activeTab === 'Próximamente' ? '2px solid var(--color-pyg)' : 'none', color: activeTab === 'Próximamente' ? 'var(--color-pyg)' : 'var(--text-secondary)' }}
        >
          Anunciados (Próximamente)
        </button>
      </div>

      {/* Grid of Offers */}
      <div style={styles.launchesGrid}>
        {filteredLaunches.map((launch) => {
          const scoreColor = launch.recommendationScore >= 90 ? 'var(--color-usd)' : launch.recommendationScore >= 80 ? 'var(--color-pyg)' : 'var(--accent-yellow)';
          
          return (
            <div key={launch.id} className="glass-panel" style={styles.launchCard}>
              <div style={styles.cardHeader}>
                <div style={styles.issuerCol}>
                  <Building size={16} color="var(--text-secondary)" />
                  <span style={styles.issuerName}>{launch.issuer}</span>
                </div>
                <span 
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: launch.status === 'Abierta' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: launch.status === 'Abierta' ? 'var(--color-usd)' : 'var(--accent-yellow)',
                    borderColor: launch.status === 'Abierta' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  }}
                >
                  {launch.status}
                </span>
              </div>

              {/* Numerical details row */}
              <div style={styles.financialRow}>
                {/* Interest Rate */}
                <div style={styles.finCol}>
                  <span style={styles.finLabel}>Tasa de Interés</span>
                  <div style={styles.rateContainer}>
                    <Percent size={14} color="var(--color-pyg)" />
                    <span style={styles.finValue} className="financial-num">{launch.interestRate.toFixed(2)}%</span>
                  </div>
                </div>

                {/* Rating */}
                <div style={styles.finCol}>
                  <span style={styles.finLabel}>Calificación</span>
                  <div style={styles.ratingContainer}>
                    <Award size={14} color="var(--accent-yellow)" />
                    <span style={styles.finValueRating} className="financial-num">{launch.rating}</span>
                  </div>
                </div>

                {/* Currency & Term */}
                <div style={styles.finCol}>
                  <span style={styles.finLabel}>Moneda y Plazo</span>
                  <span style={styles.finValueText}>
                    {launch.currency} — {launch.maturityYears} años
                  </span>
                </div>
              </div>

              {/* Recommendation analysis panel */}
              <div style={styles.recommendationPanel}>
                <div style={styles.scoreRow}>
                  <span style={styles.scoreText}>Recomendación del Consultor:</span>
                  <span style={{ ...styles.scoreValue, color: scoreColor }} className="financial-num">
                    {launch.recommendationScore} / 100
                  </span>
                </div>
                <p style={styles.recommendationText}>{launch.recommendationText}</p>
              </div>

              {/* Card Footer details */}
              <div style={styles.cardFooter}>
                <div style={styles.metaRow}>
                  <span style={styles.metaText}>Volumen de emisión: <strong style={{ color: '#fff' }} className="financial-num">{launch.amount}</strong></span>
                  <span style={styles.metaText}>Casa colocadora: <strong style={{ color: '#fff' }}>{launch.broker}</strong></span>
                </div>

                {launch.status === 'Abierta' && (
                  <button 
                    onClick={() => openSimulation(launch)}
                    style={styles.simBtn}
                  >
                    Simular Adquisición <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
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
  promoPanel: {
    padding: '30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(135deg, rgba(0, 210, 196, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
    borderColor: 'rgba(0, 210, 196, 0.2)',
  },
  promoTextCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sparkleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  sparkleLabel: {
    fontSize: '0.675rem',
    fontWeight: '800',
    color: 'var(--color-pyg)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  promoTitle: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#fff',
  },
  promoDesc: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    maxWidth: '850px',
  },
  promoIconCol: {
    paddingLeft: '30px',
  },
  tabContainer: {
    display: 'flex',
    gap: '24px',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '2px',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    padding: '10px 4px',
    fontSize: '0.9rem',
    fontWeight: '700',
    cursor: 'pointer',
    outline: 'none',
    transition: 'var(--transition-smooth)',
  },
  launchesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  launchCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    background: 'linear-gradient(135deg, rgba(12,15,23,0.7) 0%, rgba(7,9,14,0.7) 100%)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issuerCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  issuerName: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#fff',
  },
  statusBadge: {
    fontSize: '0.65rem',
    fontWeight: '800',
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid transparent',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  financialRow: {
    display: 'flex',
    gap: '40px',
    flexWrap: 'wrap',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '16px',
  },
  finCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  finLabel: {
    fontSize: '0.675rem',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  rateContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  ratingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  finValue: {
    fontSize: '1.25rem',
    fontWeight: '750',
    color: 'var(--color-pyg)',
  },
  finValueRating: {
    fontSize: '1.25rem',
    fontWeight: '750',
    color: 'var(--accent-yellow)',
  },
  finValueText: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#fff',
  },
  recommendationPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--border-glass)',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  scoreRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: 'var(--text-secondary)',
  },
  scoreValue: {
    fontSize: '1.05rem',
    fontWeight: '800',
  },
  recommendationText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    marginTop: '6px',
  },
  metaRow: {
    display: 'flex',
    gap: '24px',
    fontSize: '0.775rem',
    color: 'var(--text-secondary)',
  },
  metaText: {
    fontWeight: '500',
  },
  simBtn: {
    backgroundColor: 'rgba(0, 210, 196, 0.1)',
    border: '1px solid rgba(0, 210, 196, 0.3)',
    color: 'var(--color-pyg)',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'var(--transition-smooth)',
  },

  /* ── Modal styles ─────────────────────────────────────────────────── */
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 2000,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px',
  },
  modalContent: {
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-glass)',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '720px',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '32px',
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.6)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalSubtitle: {
    fontSize: '0.675rem',
    fontWeight: '800',
    color: 'var(--color-pyg)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  modalTitle: {
    fontSize: '1.35rem',
    fontWeight: '800',
    color: '#fff',
    margin: 0,
  },
  modalCloseBtn: {
    background: 'none',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '6px',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition-smooth)',
  },
  modalBondInfo: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  inputLabel: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  capitalInput: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#fff',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  tableWrapper: {
    overflowX: 'auto' as const,
    borderRadius: '10px',
    border: '1px solid var(--border-glass)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.82rem',
  },
  th: {
    textAlign: 'left' as const,
    padding: '10px 14px',
    fontSize: '0.675rem',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid var(--border-glass)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.03)',
  },
  td: {
    padding: '9px 14px',
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  tdRight: {
    padding: '9px 14px',
    color: '#fff',
    fontWeight: 600,
    textAlign: 'right' as const,
  },
  chartSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    border: '1px solid var(--border-glass)',
    borderRadius: '10px',
    padding: '16px',
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  chartTitle: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  svgChart: {
    width: '100%',
    height: 'auto',
  },
  chartLegend: {
    display: 'flex',
    gap: '18px',
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendSwatch: {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: '2px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    borderTop: '1px solid var(--border-glass)',
    paddingTop: '16px',
    flexWrap: 'wrap',
  },
  disclaimerText: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    flex: 1,
    minWidth: '200px',
  },
  closeBtn: {
    backgroundColor: 'rgba(0, 210, 196, 0.1)',
    border: '1px solid rgba(0, 210, 196, 0.3)',
    color: 'var(--color-pyg)',
    padding: '10px 24px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
    whiteSpace: 'nowrap',
  },
};
