import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { DonutChart } from './SVGCharts';
import { 
  Briefcase, 
  TrendingUp, 
  Coins, 
  Layers 
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { 
    investments, 
    exchangeRate, 
    averageRate, 
    monthlyPassiveIncome 
  } = usePortfolio();

  const [activeFilter, setActiveFilter] = useState<'all' | 'bono' | 'plazo_fijo' | 'fondo_mutuo'>('all');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'PYG' | 'USD'>('all');

  const formatPYG = (val: number) => {
    return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(val);
  };

  const formatUSD = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val);
  };

  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthLabel = nextMonth.toLocaleString('es-PY', { month: 'long' });
  const capitalizedNextMonth = nextMonthLabel.charAt(0).toUpperCase() + nextMonthLabel.slice(1);

  // 1. Calculate totals
  const totalBonds = investments
    .filter(i => i.type === 'bono')
    .reduce((sum, i) => sum + (i.currency === 'USD' ? i.capital * exchangeRate : i.capital), 0);

  const totalPlazoFijo = investments
    .filter(i => i.type === 'plazo_fijo')
    .reduce((sum, i) => sum + (i.currency === 'USD' ? i.capital * exchangeRate : i.capital), 0);

  const totalMutualFunds = investments
    .filter(i => i.type === 'fondo_mutuo')
    .reduce((sum, i) => sum + (i.currency === 'USD' ? i.capital * exchangeRate : i.capital), 0);

  const grandTotalPYG = totalBonds + totalPlazoFijo + totalMutualFunds;

  // 2. Prepare Donut Chart Data
  const assetDistributionData = [
    { label: 'Bonos (Bolsa)', value: totalBonds, color: 'var(--color-pyg)' },
    { label: 'Plazo Fijo (Coops)', value: totalPlazoFijo, color: 'var(--accent-blue)' },
    { label: 'Fondos Mutuos', value: totalMutualFunds, color: 'var(--color-usd)' }
  ];

  // 3. Filtered investments for the table
  const filteredInvestments = investments.filter(inv => {
    const typeMatch = activeFilter === 'all' || inv.type === activeFilter;
    const currencyMatch = currencyFilter === 'all' || inv.currency === currencyFilter;
    return typeMatch && currencyMatch;
  });

  return (
    <div className="animate-fade-in" style={styles.container}>
      {/* Top Cards Grid */}
      <div className="dashboard-grid">
        {/* Card 1: Total Valuation Gs */}
        <div className="glass-panel" style={styles.card}>
          <div style={styles.cardHeader}>
            <Briefcase size={22} color="var(--color-pyg)" />
            <span style={styles.cardLabel}>Valor Total del Portafolio</span>
          </div>
          <span style={styles.cardValue} className="financial-num">
            {formatPYG(grandTotalPYG)}
          </span>
          <span style={styles.cardFooter}>
            Tasa de cambio actual: <strong style={{ color: '#fff' }} className="financial-num">{exchangeRate.toLocaleString()} Gs</strong>
          </span>
        </div>

        {/* Card 2: Weighted Average Yield */}
        <div className="glass-panel" style={styles.card}>
          <div style={styles.cardHeader}>
            <TrendingUp size={22} color="var(--color-usd)" />
            <span style={styles.cardLabel}>Rendimiento Promedio Anual (Ponderado)</span>
          </div>
          <span style={{ ...styles.cardValue, color: 'var(--color-usd)' }} className="financial-num">
            {averageRate.toFixed(2)}%
          </span>
          <span style={styles.cardFooter}>
            Optimizado contra inflación local
          </span>
        </div>

        {/* Card 3: Next Month Income */}
        <div className="glass-panel" style={styles.card}>
          <div style={styles.cardHeader}>
            <Coins size={22} color="var(--accent-blue)" />
            <span style={styles.cardLabel}>Rendimiento Mensual Estimado ({capitalizedNextMonth})</span>
          </div>
          <span style={{ ...styles.cardValue, color: '#3b82f6' }} className="financial-num">
            {formatPYG(monthlyPassiveIncome)}
          </span>
          <span style={styles.cardFooter}>
            Ingreso pasivo neto proyectado
          </span>
        </div>
      </div>

      {/* Middle Charts & Allocation Section */}
      <div style={styles.middleRow}>
        <div className="glass-panel" style={styles.chartPanel}>
          <DonutChart 
            data={assetDistributionData}
            title="Distribución de Activos"
            centerLabel="Total Activos"
            centerValue={formatPYG(grandTotalPYG)}
          />
        </div>

        {/* Broker distribution panel */}
        <div className="glass-panel" style={styles.detailsPanel}>
          <h3 style={styles.sectionTitle}>Distribución por Casa de Bolsa / Entidad</h3>
          
          <div style={styles.entityList}>
            {/* Cadiem */}
            <div style={styles.entityRow}>
              <div style={styles.entityNameCol}>
                <Layers size={16} color="var(--color-pyg)" />
                <span style={styles.entityName}>CADIEM Casa de Bolsa</span>
              </div>
              <span style={styles.entityVal} className="financial-num">
                {formatPYG(
                  investments
                    .filter(i => i.broker === 'Cadiem')
                    .reduce((sum, i) => sum + (i.currency === 'USD' ? i.capital * exchangeRate : i.capital), 0)
                )}
              </span>
            </div>

            {/* Basa Capital */}
            <div style={styles.entityRow}>
              <div style={styles.entityNameCol}>
                <Layers size={16} color="var(--color-usd)" />
                <span style={styles.entityName}>Basa Capital</span>
              </div>
              <span style={styles.entityVal} className="financial-num">
                {formatPYG(
                  investments
                    .filter(i => i.broker === 'Basa Capital')
                    .reduce((sum, i) => sum + (i.currency === 'USD' ? i.capital * exchangeRate : i.capital), 0)
                )}
              </span>
            </div>

            {/* Cooperativas */}
            <div style={styles.entityRow}>
              <div style={styles.entityNameCol}>
                <Layers size={16} color="var(--accent-blue)" />
                <span style={styles.entityName}>Cooperativas de Ahorro y Crédito</span>
              </div>
              <span style={styles.entityVal} className="financial-num">
                {formatPYG(
                  investments
                    .filter(i => i.broker === 'Cooperativa')
                    .reduce((sum, i) => sum + i.capital, 0)
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Investments Table */}
      <div className="glass-panel" style={styles.tablePanel}>
        <div style={styles.tableHeader}>
          <h3 style={styles.sectionTitle}>Listado Detallado de Inversiones</h3>
          
          {/* Controls */}
          <div style={styles.controls}>
            {/* Filter by Type */}
            <div style={styles.filterGroup}>
              <button 
                onClick={() => setActiveFilter('all')}
                style={{ ...styles.filterBtn, backgroundColor: activeFilter === 'all' ? 'rgba(255,255,255,0.08)' : 'transparent' }}
              >
                Todos
              </button>
              <button 
                onClick={() => setActiveFilter('bono')}
                style={{ ...styles.filterBtn, backgroundColor: activeFilter === 'bono' ? 'rgba(255,255,255,0.08)' : 'transparent' }}
              >
                Bonos
              </button>
              <button 
                onClick={() => setActiveFilter('plazo_fijo')}
                style={{ ...styles.filterBtn, backgroundColor: activeFilter === 'plazo_fijo' ? 'rgba(255,255,255,0.08)' : 'transparent' }}
              >
                Plazos Fijos
              </button>
              <button 
                onClick={() => setActiveFilter('fondo_mutuo')}
                style={{ ...styles.filterBtn, backgroundColor: activeFilter === 'fondo_mutuo' ? 'rgba(255,255,255,0.08)' : 'transparent' }}
              >
                Fondos Mutuos
              </button>
            </div>

            {/* Filter by Currency */}
            <div style={styles.filterGroup}>
              <button 
                onClick={() => setCurrencyFilter('all')}
                style={{ ...styles.filterBtn, backgroundColor: currencyFilter === 'all' ? 'rgba(255,255,255,0.08)' : 'transparent' }}
              >
                Ambas Monedas
              </button>
              <button 
                onClick={() => setCurrencyFilter('PYG')}
                style={{ ...styles.filterBtn, backgroundColor: currencyFilter === 'PYG' ? 'rgba(255,255,255,0.08)' : 'transparent' }}
              >
                Gs
              </button>
              <button 
                onClick={() => setCurrencyFilter('USD')}
                style={{ ...styles.filterBtn, backgroundColor: currencyFilter === 'USD' ? 'rgba(255,255,255,0.08)' : 'transparent' }}
              >
                USD
              </button>
            </div>
          </div>
        </div>

        {/* Table Wrapper */}
        <div className="table-wrapper">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Emisor</th>
                <th>Clase de Activo</th>
                <th>ISIN / Serie</th>
                <th>Capital</th>
                <th>Tasa Anual</th>
                <th>Frecuencia Pago</th>
                <th>Calificación</th>
                <th>Vencimiento</th>
                <th>Entidad</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvestments.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 700 }}>{inv.issuer}</td>
                  <td>
                    <span 
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        backgroundColor: inv.type === 'bono' ? 'rgba(0, 210, 196, 0.1)' : inv.type === 'plazo_fijo' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: inv.type === 'bono' ? 'var(--color-pyg)' : inv.type === 'plazo_fijo' ? '#3b82f6' : 'var(--color-usd)',
                        border: `1px solid ${inv.type === 'bono' ? 'rgba(0, 210, 196, 0.2)' : inv.type === 'plazo_fijo' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                      }}
                    >
                      {inv.type === 'bono' ? 'BONO' : inv.type === 'plazo_fijo' ? 'PLAZO FIJO' : 'FONDO MUTUO'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{inv.isinOrSerie}</td>
                  <td className="financial-num" style={{ fontWeight: 700 }}>
                    {inv.currency === 'PYG' ? formatPYG(inv.capital) : formatUSD(inv.capital)}
                  </td>
                  <td className="financial-num" style={{ color: 'var(--color-usd)', fontWeight: 700 }}>
                    {inv.interestRate.toFixed(2)}%
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{inv.paymentFrequency}</td>
                  <td>
                    <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                      {inv.rating || 'N/A'}
                    </span>
                  </td>
                  <td className="financial-num">
                    {inv.maturityDate ? new Date(inv.maturityDate).toLocaleDateString('es-PY') : 'Líquido'}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{inv.broker}</td>
                </tr>
              ))}
              {filteredInvestments.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    No se encontraron inversiones con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
  card: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: 'linear-gradient(135deg, rgba(12,15,23,0.8) 0%, rgba(7,9,14,0.8) 100%)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  cardLabel: {
    fontSize: '0.8125rem',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  cardValue: {
    fontSize: '2rem',
    fontWeight: '800',
    color: 'var(--color-pyg)',
    textShadow: '0 0 16px rgba(0, 210, 196, 0.1)',
  },
  cardFooter: {
    fontSize: '0.725rem',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
  middleRow: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '24px',
    alignItems: 'stretch',
  },
  chartPanel: {
    flex: 1.2,
  },
  detailsPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '16px',
  },
  entityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '10px',
  },
  entityRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-glass)',
  },
  entityNameCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  entityName: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  entityVal: {
    fontSize: '0.95rem',
    fontWeight: '750',
    color: 'var(--text-primary)',
  },
  tablePanel: {
    padding: '24px',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  controls: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
    border: '1px solid var(--border-glass)',
    padding: '2px',
  },
  filterBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.775rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
};
