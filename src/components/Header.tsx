import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { RefreshCw, DollarSign, Wallet } from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    totalInvestedPYG, 
    totalInvestedUSD, 
    exchangeRate, 
    setExchangeRate 
  } = usePortfolio();

  const totalCapitalEquivalentPYG = totalInvestedPYG + (totalInvestedUSD * exchangeRate);
  const totalCapitalEquivalentUSD = totalInvestedUSD + (totalInvestedPYG / exchangeRate);

  // Format currency
  const formatPYG = (val: number) => {
    return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(val);
  };

  const formatUSD = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val);
  };

  const handleFxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0) {
      setExchangeRate(val);
    }
  };

  return (
    <header style={styles.header}>
      <div>
        <h1 style={styles.title}>Hola, Pablo Vidal</h1>
        <p style={styles.subtitle}>Panel de Control Financiero — Bolsa de Valores de Asunción</p>
      </div>

      <div style={styles.statsContainer}>
        {/* FX Rate Controller */}
        <div className="glass-panel" style={styles.fxPanel}>
          <div style={styles.fxLabelContainer}>
            <DollarSign size={16} color="var(--color-usd)" />
            <span style={styles.fxLabel}>Cambio BCP (Referencial)</span>
          </div>
          <div style={styles.fxInputContainer}>
            <span style={styles.fxSymbol}>USD/PYG</span>
            <input 
              type="number" 
              value={exchangeRate} 
              onChange={handleFxChange} 
              style={styles.fxInput}
              className="financial-num"
            />
            <button 
              onClick={() => setExchangeRate(7850)} 
              title="Restablecer Tasa" 
              style={styles.resetBtn}
            >
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        {/* Global Net Worth Equivalents */}
        <div className="glass-panel" style={styles.worthPanel}>
          <div style={styles.worthCol}>
            <div style={styles.worthHeader}>
              <Wallet size={16} color="var(--color-pyg)" />
              <span style={styles.worthLabel}>Patrimonio Neto (Gs Equiv)</span>
            </div>
            <span style={styles.worthValue} className="financial-num">
              {formatPYG(totalCapitalEquivalentPYG)}
            </span>
          </div>
          <div style={styles.worthDivider} />
          <div style={styles.worthCol}>
            <div style={styles.worthHeader}>
              <Wallet size={16} color="var(--color-usd)" />
              <span style={styles.worthLabel}>Patrimonio Neto (USD Equiv)</span>
            </div>
            <span style={styles.worthValueUSD} className="financial-num">
              {formatUSD(totalCapitalEquivalentUSD)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    marginLeft: '280px',
    height: '100px',
    borderBottom: '1px solid var(--border-glass)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 40px',
    backgroundColor: 'rgba(7, 9, 14, 0.5)',
    backdropFilter: 'blur(10px)',
    position: 'sticky',
    top: 0,
    zIndex: 90,
  },
  title: {
    fontSize: '1.625rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  statsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  fxPanel: {
    padding: '8px 16px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '200px',
  },
  fxLabelContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  fxLabel: {
    fontSize: '0.675rem',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  fxInputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  fxSymbol: {
    fontSize: '0.725rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
  },
  fxInput: {
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '1px dashed rgba(255, 255, 255, 0.2)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    width: '70px',
    padding: '2px 4px',
    outline: 'none',
    textAlign: 'right',
  },
  resetBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    transition: 'var(--transition-smooth)',
  },
  worthPanel: {
    padding: '10px 24px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    background: 'linear-gradient(135deg, rgba(12,15,23,0.85) 0%, rgba(7,9,14,0.85) 100%)',
    borderColor: 'rgba(0, 210, 196, 0.15)',
  },
  worthCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  worthHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  worthLabel: {
    fontSize: '0.675rem',
    color: 'var(--text-secondary)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  worthValue: {
    fontSize: '1.25rem',
    color: 'var(--color-pyg)',
    textShadow: '0 0 10px rgba(0, 210, 196, 0.25)',
  },
  worthValueUSD: {
    fontSize: '1.25rem',
    color: 'var(--color-usd)',
    textShadow: '0 0 10px rgba(16, 185, 129, 0.25)',
  },
  worthDivider: {
    width: '1px',
    height: '32px',
    backgroundColor: 'var(--border-glass)',
  },
};
