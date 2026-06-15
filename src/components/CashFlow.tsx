import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { BarChart } from './SVGCharts';
import { 
  CalendarRange, 
  CalendarDays,
  Search,
  Filter
} from 'lucide-react';

export const CashFlow: React.FC = () => {
  const { cashFlow, exchangeRate } = usePortfolio();
  
  const [hidePrincipal, setHidePrincipal] = useState<boolean>(false);
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'PYG' | 'USD'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const formatPYG = (val: number) => {
    return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(val);
  };

  const formatUSD = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val);
  };

  // 1. Prepare Bar Chart Data for the next 12 months starting from the current month
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  
  const months12List: { label: string; yearNum: number; monthNum: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(currentYear, currentMonth + i, 1);
    const lbl = d.toLocaleString('es-PY', { month: 'short' }).toUpperCase();
    months12List.push({
      label: `${lbl} ${d.getFullYear().toString().substring(2)}`,
      yearNum: d.getFullYear(),
      monthNum: d.getMonth()
    });
  }

  const chartData = months12List.map(m => {
    // Filter cash flow for this month and year
    const monthlyItems = cashFlow.filter(cf => {
      const d = new Date(cf.date);
      const isSameMonth = d.getMonth() === m.monthNum;
      const isSameYear = d.getFullYear() === m.yearNum;
      const isNotPrincipal = hidePrincipal ? !cf.isPrincipal : true;
      return isSameMonth && isSameYear && isNotPrincipal;
    });

    const pygSum = monthlyItems
      .filter(cf => cf.currency === 'PYG')
      .reduce((sum, cf) => sum + cf.amount, 0);

    const usdSum = monthlyItems
      .filter(cf => cf.currency === 'USD')
      .reduce((sum, cf) => sum + cf.amount, 0);

    return {
      label: m.label,
      valuePYG: pygSum,
      valueUSD: usdSum
    };
  });

  // 2. Filter scheduled payments list
  const filteredPayments = cashFlow.filter(cf => {
    const d = new Date(cf.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today
    if (d < today) return false;


    const termMatch = cf.issuer.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      cf.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const principalMatch = !hidePrincipal || !cf.isPrincipal;
    const currencyMatch = currencyFilter === 'all' || cf.currency === currencyFilter;

    return termMatch && principalMatch && currencyMatch;
  });

  return (
    <div className="animate-fade-in" style={styles.container}>
      {/* Chart Section */}
      <BarChart 
        data={chartData} 
        title="Proyección Mensual de Flujo de Caja (Próximos 12 meses)" 
        exchangeRate={exchangeRate}
      />

      {/* Calendar List Section */}
      <div className="glass-panel" style={styles.listPanel}>
        <div style={styles.listHeader}>
          <div style={styles.titleCol}>
            <CalendarRange size={24} color="var(--color-pyg)" />
            <h3 style={styles.title}>Calendario Detallado de Pagos</h3>
          </div>

          {/* Filtering controls */}
          <div style={styles.controls}>
            {/* Search Input */}
            <div style={styles.searchContainer}>
              <Search size={16} style={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Buscar por emisor o tipo..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            {/* Toggle Principal Amortizations */}
            <label style={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={hidePrincipal}
                onChange={(e) => setHidePrincipal(e.target.checked)}
                style={styles.checkbox}
              />
              Ocultar Amortizaciones de Capital
            </label>

            {/* Currency Filter */}
            <div style={styles.currencySelect}>
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              <button 
                onClick={() => setCurrencyFilter('all')}
                style={{ 
                  ...styles.currencyBtn, 
                  color: currencyFilter === 'all' ? 'var(--color-pyg)' : 'var(--text-secondary)',
                  borderBottom: currencyFilter === 'all' ? '2px solid var(--color-pyg)' : 'none'
                }}
              >
                Todos
              </button>
              <button 
                onClick={() => setCurrencyFilter('PYG')}
                style={{ 
                  ...styles.currencyBtn, 
                  color: currencyFilter === 'PYG' ? 'var(--color-pyg)' : 'var(--text-secondary)',
                  borderBottom: currencyFilter === 'PYG' ? '2px solid var(--color-pyg)' : 'none'
                }}
              >
                Gs
              </button>
              <button 
                onClick={() => setCurrencyFilter('USD')}
                style={{ 
                  ...styles.currencyBtn, 
                  color: currencyFilter === 'USD' ? 'var(--color-pyg)' : 'var(--text-secondary)',
                  borderBottom: currencyFilter === 'USD' ? '2px solid var(--color-pyg)' : 'none'
                }}
              >
                USD
              </button>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="table-wrapper" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Fecha de Pago</th>
                <th>Emisor</th>
                <th>Tipo de Activo</th>
                <th>Concepto</th>
                <th style={{ textAlign: 'right' }}>Monto Esperado</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.slice(0, 100).map((cf, idx) => {
                const isCapital = cf.isPrincipal;
                const formattedDate = new Date(cf.date).toLocaleDateString('es-PY', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                });
                
                return (
                  <tr key={`${cf.investmentId}-${cf.date}-${idx}`} style={{
                    backgroundColor: isCapital ? 'rgba(0, 210, 196, 0.02)' : 'transparent'
                  }}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: 'none', padding: '16px' }}>
                      <CalendarDays size={16} color="var(--text-muted)" />
                      <span className="financial-num" style={{ fontWeight: 600 }}>{formattedDate}</span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{cf.issuer}</td>
                    <td>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        backgroundColor: cf.type === 'bono' ? 'rgba(0, 210, 196, 0.05)' : cf.type === 'plazo_fijo' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                        color: cf.type === 'bono' ? 'var(--color-pyg)' : cf.type === 'plazo_fijo' ? '#3b82f6' : 'var(--color-usd)'
                      }}>
                        {cf.type === 'bono' ? 'BONO' : cf.type === 'plazo_fijo' ? 'PLAZO FIJO' : 'FONDO MUTUO'}
                      </span>
                    </td>
                    <td>
                      <span 
                        style={{
                          color: isCapital ? 'var(--color-pyg)' : 'var(--text-primary)',
                          fontWeight: isCapital ? '700' : '500',
                        }}
                      >
                        {isCapital ? '🔴 Devolución de Capital' : '🟢 Pago de Intereses / Cupón'}
                      </span>
                    </td>
                    <td 
                      className="financial-num" 
                      style={{ 
                        textAlign: 'right', 
                        color: cf.currency === 'USD' ? 'var(--color-usd)' : 'var(--color-pyg)',
                        fontWeight: 750,
                        fontSize: '0.975rem'
                      }}
                    >
                      {cf.currency === 'PYG' ? formatPYG(cf.amount) : formatUSD(cf.amount)}
                    </td>
                  </tr>
                );
              })}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    No se registran cobros programados para los criterios seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={styles.footnote}>
          * Mostrando los próximos cobros calendarizados desde {(() => {
            const label = new Date().toLocaleString('es-PY', { month: 'long', year: 'numeric' });
            return label.charAt(0).toUpperCase() + label.slice(1);
          })()}. Los fondos mutuos están calculados según devengamiento mensual teórico.
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
  listPanel: {
    padding: '24px',
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
    marginBottom: '10px',
  },
  titleCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#fff',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  searchContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '8px 12px 8px 36px',
    color: '#fff',
    fontSize: '0.85rem',
    outline: 'none',
    width: '220px',
    transition: 'var(--transition-smooth)',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    userSelect: 'none',
  },
  checkbox: {
    cursor: 'pointer',
    width: '16px',
    height: '16px',
    accentColor: 'var(--color-pyg)',
  },
  currencySelect: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '2px 8px',
  },
  currencyBtn: {
    background: 'none',
    border: 'none',
    padding: '4px 8px',
    fontSize: '0.775rem',
    fontWeight: '700',
    cursor: 'pointer',
    outline: 'none',
  },
  footnote: {
    fontSize: '0.725rem',
    color: 'var(--text-muted)',
    marginTop: '16px',
  },
};
