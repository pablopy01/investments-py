import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import type { Investment, InvestmentType, Currency, PaymentFrequency } from '../types/portfolio';
import { 
  PlusCircle, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  Briefcase,
  AlertCircle
} from 'lucide-react';

export const InvestmentManager: React.FC = () => {
  const { 
    investments, 
    addInvestment, 
    editInvestment, 
    deleteInvestment
  } = usePortfolio();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form States
  const [type, setType] = useState<InvestmentType>('bono');
  const [issuer, setIssuer] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isinOrSerie, setIsinOrSerie] = useState<string>('');
  const [capital, setCapital] = useState<number>(0);
  const [currency, setCurrency] = useState<Currency>('PYG');
  const [interestRate, setInterestRate] = useState<number>(0);
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>('trimestral');
  const [issuanceDate, setIssuanceDate] = useState<string>('');
  const [maturityDate, setMaturityDate] = useState<string>('');
  const [rating, setRating] = useState<string>('');
  const [fixedMonthlyReturn, setFixedMonthlyReturn] = useState<number>(0);
  const [broker, setBroker] = useState<'Cadiem' | 'Basa Capital' | 'Cooperativa'>('Cadiem');

  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetForm = () => {
    setType('bono');
    setIssuer('');
    setDescription('');
    setIsinOrSerie('');
    setCapital(0);
    setCurrency('PYG');
    setInterestRate(0);
    setPaymentFrequency('trimestral');
    setIssuanceDate('');
    setMaturityDate('');
    setRating('');
    setFixedMonthlyReturn(0);
    setBroker('Cadiem');
    setFormError(null);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEditClick = (inv: Investment) => {
    setIsEditing(true);
    setEditingId(inv.id);
    setType(inv.type);
    setIssuer(inv.issuer);
    setDescription(inv.description);
    setIsinOrSerie(inv.isinOrSerie);
    setCapital(inv.capital);
    setCurrency(inv.currency);
    setInterestRate(inv.interestRate);
    setPaymentFrequency(inv.paymentFrequency);
    setIssuanceDate(inv.issuanceDate);
    setMaturityDate(inv.maturityDate);
    setRating(inv.rating || '');
    setFixedMonthlyReturn(inv.fixedMonthlyReturn || 0);
    setBroker(inv.broker);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!issuer || !description || capital <= 0 || interestRate <= 0) {
      setFormError('Por favor completa todos los campos requeridos (Emisor, Descripción, Capital mayor a 0 y Tasa mayor a 0).');
      return;
    }

    if (type !== 'fondo_mutuo' && !maturityDate) {
      setFormError('Los bonos y plazos fijos requieren una fecha de vencimiento.');
      return;
    }

    const payload = {
      type,
      issuer,
      description,
      isinOrSerie,
      capital: Number(capital),
      currency,
      interestRate: Number(interestRate),
      paymentFrequency,
      issuanceDate: issuanceDate || new Date().toISOString().split('T')[0],
      maturityDate: type === 'fondo_mutuo' ? '' : maturityDate,
      rating: rating || undefined,
      fixedMonthlyReturn: type === 'plazo_fijo' && fixedMonthlyReturn > 0 ? Number(fixedMonthlyReturn) : undefined,
      broker
    };

    if (isEditing && editingId) {
      editInvestment({
        id: editingId,
        ...payload
      });
      setSuccessMsg('Inversión actualizada correctamente.');
    } else {
      addInvestment(payload);
      setSuccessMsg('Inversión agregada al portafolio con éxito.');
    }

    resetForm();
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleDelete = (id: string, issuerName: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la inversión en ${issuerName} de tu portafolio?`)) {
      deleteInvestment(id);
      setSuccessMsg('Inversión eliminada correctamente.');
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const formatPYG = (val: number) => {
    return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(val);
  };

  const formatUSD = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val);
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      {/* Messages */}
      {successMsg && (
        <div className="glass-panel animate-fade-in" style={styles.successPanel}>
          <Check size={18} color="var(--color-usd)" />
          <span style={styles.successText}>{successMsg}</span>
        </div>
      )}

      <div style={styles.splitLayout}>
        {/* Form Column */}
        <div className="glass-panel" style={styles.formPanel}>
          <div style={styles.formHeader}>
            <Briefcase size={20} color="var(--color-pyg)" />
            <h3 style={styles.panelTitle}>
              {isEditing ? 'Editar Inversión' : 'Agregar Nueva Inversión'}
            </h3>
            {isEditing && (
              <button onClick={resetForm} style={styles.cancelBtn}>
                <X size={16} /> Cancelar
              </button>
            )}
          </div>

          {formError && (
            <div style={styles.errorAlert}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Asset Type Selector */}
            <div style={styles.formRow}>
              <div style={styles.formCol}>
                <label style={styles.label}>Clase de Activo</label>
                <select 
                  value={type} 
                  onChange={(e) => {
                    const newType = e.target.value as InvestmentType;
                    setType(newType);
                    if (newType === 'plazo_fijo') {
                      setPaymentFrequency('mensual');
                      setBroker('Cooperativa');
                    } else if (newType === 'fondo_mutuo') {
                      setPaymentFrequency('diario');
                      setBroker('Cadiem');
                    } else {
                      setPaymentFrequency('trimestral');
                      setBroker('Cadiem');
                    }
                  }} 
                  style={styles.select}
                >
                  <option value="bono">Bono Corporativo / Financiero</option>
                  <option value="plazo_fijo">Ahorro Plazo Fijo</option>
                  <option value="fondo_mutuo">Fondo Mutuo</option>
                </select>
              </div>

              <div style={styles.formCol}>
                <label style={styles.label}>Emisor</label>
                <input 
                  type="text" 
                  placeholder="Ej. FRIGORÍFICO CONCEPCIÓN, Coop Univ" 
                  value={issuer} 
                  onChange={(e) => setIssuer(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            {/* Description and ISIN */}
            <div style={styles.formRow}>
              <div style={styles.formCol}>
                <label style={styles.label}>Descripción</label>
                <input 
                  type="text" 
                  placeholder="Ej. PYFRI07F7392 - CONCEPCION-BONOS" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formCol}>
                <label style={styles.label}>ISIN o Nro. Cuenta</label>
                <input 
                  type="text" 
                  placeholder="Ej. FRI07G3, Cuenta 7154..." 
                  value={isinOrSerie} 
                  onChange={(e) => setIsinOrSerie(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            {/* Currency and Capital */}
            <div style={styles.formRow}>
              <div style={styles.formCol}>
                <label style={styles.label}>Moneda</label>
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value as Currency)} 
                  style={styles.select}
                >
                  <option value="PYG">Guaraníes (PYG)</option>
                  <option value="USD">Dólares (USD)</option>
                </select>
              </div>

              <div style={styles.formCol}>
                <label style={styles.label}>Capital Invertido</label>
                <input 
                  type="number" 
                  placeholder="Monto" 
                  value={capital || ''} 
                  onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            {/* Rate and Payment Frequency */}
            <div style={styles.formRow}>
              <div style={styles.formCol}>
                <label style={styles.label}>Tasa Nominal Anual (%)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="Ej. 10.5" 
                  value={interestRate || ''} 
                  onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formCol}>
                <label style={styles.label}>Frecuencia de Cobro</label>
                <select 
                  value={paymentFrequency} 
                  onChange={(e) => setPaymentFrequency(e.target.value as PaymentFrequency)} 
                  style={styles.select}
                  disabled={type === 'fondo_mutuo'}
                >
                  <option value="mensual">Mensual</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                  <option value="al_vencimiento">Al Vencimiento</option>
                  <option value="diario">Líquido Diario (Fondos Mutuos)</option>
                </select>
              </div>
            </div>

            {/* Dates row */}
            <div style={styles.formRow}>
              <div style={styles.formCol}>
                <label style={styles.label}>Fecha de Operación</label>
                <input 
                  type="date" 
                  value={issuanceDate} 
                  onChange={(e) => setIssuanceDate(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formCol}>
                <label style={styles.label}>Fecha de Vencimiento</label>
                <input 
                  type="date" 
                  value={maturityDate} 
                  onChange={(e) => setMaturityDate(e.target.value)}
                  style={styles.input}
                  disabled={type === 'fondo_mutuo'}
                />
              </div>
            </div>

            {/* Risk rating and Broker */}
            <div style={styles.formRow}>
              <div style={styles.formCol}>
                <label style={styles.label}>Calificación de Riesgo</label>
                <input 
                  type="text" 
                  placeholder="Ej. AA-py, BBB+, Excelente" 
                  value={rating} 
                  onChange={(e) => setRating(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formCol}>
                <label style={styles.label}>Entidad Custodia</label>
                <select 
                  value={broker} 
                  onChange={(e) => setBroker(e.target.value as 'Cadiem' | 'Basa Capital' | 'Cooperativa')} 
                  style={styles.select}
                >
                  <option value="Cadiem">CADIEM Casa de Bolsa / AF</option>
                  <option value="Basa Capital">Basa Capital</option>
                  <option value="Cooperativa">Cooperativa</option>
                </select>
              </div>
            </div>

            {/* Specific Coop Fixed Return */}
            {type === 'plazo_fijo' && (
              <div style={styles.formCol}>
                <label style={styles.label}>Retorno Fijo Mensual Cobrado (Gs.)</label>
                <input 
                  type="number" 
                  placeholder="Ej. 2200000" 
                  value={fixedMonthlyReturn || ''} 
                  onChange={(e) => setFixedMonthlyReturn(parseFloat(e.target.value) || 0)}
                  style={styles.input}
                />
                <span style={styles.inputNote}>
                  * Completa solo si la cooperativa te liquida un monto neto fijo exacto mensualmente.
                </span>
              </div>
            )}

            <button type="submit" className="btn-primary" style={styles.submitBtn}>
              <PlusCircle size={18} />
              <span>{isEditing ? 'Guardar Cambios' : 'Registrar Inversión'}</span>
            </button>
          </form>
        </div>

        {/* List Column */}
        <div className="glass-panel" style={styles.listPanel}>
          <h3 style={styles.panelTitle}>Mis Colocaciones Activas</h3>
          
          <div style={styles.tableScroll}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Emisor</th>
                  <th>Monto</th>
                  <th>Tasa</th>
                  <th>Broker</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {investments.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <div style={styles.issuerCell}>
                        <span style={styles.listIssuer}>{inv.issuer}</span>
                        <span style={styles.listType}>{inv.type.replace('_', ' ').toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="financial-num" style={{ fontWeight: 700 }}>
                      {inv.currency === 'PYG' ? formatPYG(inv.capital) : formatUSD(inv.capital)}
                    </td>
                    <td className="financial-num" style={{ color: 'var(--color-usd)' }}>
                      {inv.interestRate.toFixed(2)}%
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{inv.broker}</td>
                    <td>
                      <div style={styles.actions}>
                        <button 
                          onClick={() => handleEditClick(inv)} 
                          style={styles.editBtn} 
                          title="Editar"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(inv.id, inv.issuer)} 
                          style={styles.deleteBtn} 
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
  splitLayout: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 1fr',
    gap: '24px',
    alignItems: 'start',
  },
  formPanel: {
    padding: '24px',
  },
  listPanel: {
    padding: '24px',
    height: '100%',
  },
  formHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '16px',
  },
  panelTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  cancelBtn: {
    background: 'none',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-secondary)',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  errorAlert: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    border: '1px solid rgba(255, 107, 107, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    color: 'var(--accent-coral)',
    fontSize: '0.8rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
  },
  formCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  label: {
    fontSize: '0.725rem',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '0.85rem',
    outline: 'none',
    width: '100%',
  },
  select: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '0.85rem',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  inputNote: {
    fontSize: '0.675rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  submitBtn: {
    marginTop: '10px',
    width: '100%',
    justifyContent: 'center',
  },
  tableScroll: {
    maxHeight: '620px',
    overflowY: 'auto',
    marginTop: '16px',
    border: '1px solid var(--border-glass)',
    borderRadius: '12px',
  },
  issuerCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  listIssuer: {
    fontWeight: '800',
    color: '#fff',
  },
  listType: {
    fontSize: '0.625rem',
    color: 'var(--text-secondary)',
    fontWeight: '700',
    letterSpacing: '0.02em',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
  },
  editBtn: {
    background: 'rgba(0, 210, 196, 0.1)',
    border: '1px solid rgba(0, 210, 196, 0.2)',
    color: 'var(--color-pyg)',
    padding: '6px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition-smooth)',
  },
  deleteBtn: {
    background: 'rgba(255, 107, 107, 0.1)',
    border: '1px solid rgba(255, 107, 107, 0.2)',
    color: 'var(--accent-coral)',
    padding: '6px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition-smooth)',
  },
  successPanel: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '12px',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)',
  },
  successText: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#fff',
  },
};
