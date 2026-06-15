import type { Investment, NewsArticle, BondLaunch } from '../types/portfolio';

export const INITIAL_INVESTMENTS: Investment[] = [
  // 1. BONOS GUARANÍES - CADIEM
  {
    id: 'b-tecsul-tsu06g1',
    type: 'bono',
    issuer: 'TECSUL S.A.',
    description: 'PYTSU06F2391 - TECSUL-BONO',
    isinOrSerie: 'TSU06G1',
    capital: 50000000,
    currency: 'PYG',
    interestRate: 10.50,
    paymentFrequency: 'trimestral',
    issuanceDate: '2024-06-05',
    maturityDate: '2026-10-15',
    rating: 'A-py',
    broker: 'Cadiem'
  },
  {
    id: 'b-concepcion-fri07g3',
    type: 'bono',
    issuer: 'FRIGORÍFICO CONCEPCIÓN',
    description: 'PYFRI07F7392 - FRIGORIFICO CONCEPCION-BONOS',
    isinOrSerie: 'FRI07G3',
    capital: 35000000,
    currency: 'PYG',
    interestRate: 11.75,
    paymentFrequency: 'trimestral',
    issuanceDate: '2024-07-19',
    maturityDate: '2027-03-16',
    rating: 'Apy',
    broker: 'Cadiem'
  },
  {
    id: 'b-concepcion-fri10g3',
    type: 'bono',
    issuer: 'FRIGORÍFICO CONCEPCIÓN',
    description: 'PYFRI10F0780 - FRIGORIFICO CONCEPCION-BONO',
    isinOrSerie: 'FRI10G3',
    capital: 70000000,
    currency: 'PYG',
    interestRate: 11.00,
    paymentFrequency: 'trimestral',
    issuanceDate: '2025-06-05',
    maturityDate: '2027-06-03',
    rating: 'Apy',
    broker: 'Cadiem'
  },
  {
    id: 'b-concepcion-fri08g3',
    type: 'bono',
    issuer: 'FRIGORÍFICO CONCEPCIÓN',
    description: 'PYFRI08F9058 - FRIGORIFICO CONCEPCION-BONOS',
    isinOrSerie: 'FRI08G3',
    capital: 50000000,
    currency: 'PYG',
    interestRate: 12.00,
    paymentFrequency: 'trimestral',
    issuanceDate: '2024-11-27',
    maturityDate: '2027-11-23',
    rating: 'Apy',
    broker: 'Cadiem'
  },
  {
    id: 'b-finexpar-fin01g1',
    type: 'bono',
    issuer: 'FINANCIERA FINEXPAR S.A.E.C.A.',
    description: 'PYFIN01F5172 - FINANCIERA FINEXPAR-BONOS BF',
    isinOrSerie: 'FIN01G1',
    capital: 50000000,
    currency: 'PYG',
    interestRate: 10.50,
    paymentFrequency: 'trimestral',
    issuanceDate: '2024-06-05',
    maturityDate: '2028-05-16',
    rating: 'A-py',
    broker: 'Cadiem'
  },
  {
    id: 'b-cecon-cec03g1',
    type: 'bono',
    issuer: 'CECON S.A.E.',
    description: 'PYCEC03F1369 - CECON - BONOS',
    isinOrSerie: 'CEC03G1',
    capital: 35000000,
    currency: 'PYG',
    interestRate: 9.25,
    paymentFrequency: 'trimestral',
    issuanceDate: '2024-07-19',
    maturityDate: '2031-01-16',
    rating: 'AA-py',
    broker: 'Cadiem'
  },

  // 2. BONOS USD - BASA CAPITAL
  {
    id: 'b-comfar-pycmf01f2457',
    type: 'bono',
    issuer: 'COMFAR S.A.E.C.A.',
    description: 'COMFAR - USD - 8.25% - 04/12/2028',
    isinOrSerie: 'PYCMF01F2457',
    capital: 11000,
    currency: 'USD',
    interestRate: 8.25,
    paymentFrequency: 'trimestral',
    issuanceDate: '2025-12-04',
    maturityDate: '2028-12-04',
    rating: 'BBB+',
    broker: 'Basa Capital'
  },

  // 3. FONDOS MUTUOS
  {
    id: 'fm-cadiem-disponible',
    type: 'fondo_mutuo',
    issuer: 'CADIEM Administradora de Fondos',
    description: 'FONDO MUTUO DISPONIBLE RENTA FIJA EN GUARANÍES',
    isinOrSerie: 'Cuenta 7154',
    capital: 5330335,
    currency: 'PYG',
    interestRate: 5.5,
    paymentFrequency: 'diario',
    issuanceDate: '2025-01-01',
    maturityDate: '',
    rating: 'AAf py',
    broker: 'Cadiem'
  },
  {
    id: 'fm-cadiem-crecimiento',
    type: 'fondo_mutuo',
    issuer: 'CADIEM Administradora de Fondos',
    description: 'FONDO MUTUO CRECIMIENTO RENTA FIJA EN GUARANÍES',
    isinOrSerie: 'Cuenta 3937',
    capital: 116609883,
    currency: 'PYG',
    interestRate: 8.5,
    paymentFrequency: 'diario',
    issuanceDate: '2025-01-01',
    maturityDate: '',
    rating: 'AA-f py',
    broker: 'Cadiem'
  },
  {
    id: 'fm-basa-vista-usd',
    type: 'fondo_mutuo',
    issuer: 'BASA CAPITAL A.F.P.I.S.A.',
    description: 'FONDO MUTUO VISTA DÓLARES AMERICANOS',
    isinOrSerie: 'Vista USD',
    capital: 235.76,
    currency: 'USD',
    interestRate: 4.50,
    paymentFrequency: 'diario',
    issuanceDate: '2025-01-01',
    maturityDate: '',
    rating: 'Af py',
    broker: 'Basa Capital'
  },

  // 4. PLAZO FIJO (COOPERATIVAS)
  {
    id: 'pf-coop-univ',
    type: 'plazo_fijo',
    issuer: 'Coop Univ Pablo',
    description: 'Ahorro Plazo Fijo Cooperativa Universitaria',
    isinOrSerie: 'Ahorro PF',
    capital: 250022964,
    currency: 'PYG',
    interestRate: 10.56,
    paymentFrequency: 'mensual',
    issuanceDate: '2024-07-20',
    maturityDate: '2029-07-20',
    rating: 'Excelente',
    fixedMonthlyReturn: 2200000,
    broker: 'Cooperativa'
  },
  {
    id: 'pf-coop-lambare',
    type: 'plazo_fijo',
    issuer: 'Coop Lambare Emi',
    description: 'Ahorro Plazo Fijo Cooperativa Lambaré',
    isinOrSerie: 'Ahorro PF',
    capital: 262859265,
    currency: 'PYG',
    interestRate: 12.00,
    paymentFrequency: 'mensual',
    issuanceDate: '2023-07-08',
    maturityDate: '2028-07-08',
    rating: 'Excelente',
    fixedMonthlyReturn: 2630000,
    broker: 'Cooperativa'
  }
];

export const MOCK_NEWS: NewsArticle[] = [
  {
    id: 'news-1',
    date: '2026-05-25',
    source: 'MarketData Paraguay',
    title: 'Frigorífico Concepción registra incremento en exportaciones a mercados clave',
    summary: 'La firma paraguaya líder en exportación de carne reportó un aumento del 14% en volumen de despachos durante el primer cuatrimestre del 2026, consolidando su posición crediticia en la Bolsa de Asunción y manteniendo una perspectiva positiva sobre sus bonos corporativos vigentes.',
    url: 'https://marketdata.com.py/concepcion-reporte-2026',
    relatedCompanies: ['FRIGORÍFICO CONCEPCIÓN'],
    sentiment: 'positive'
  },
  {
    id: 'news-2',
    date: '2026-05-24',
    source: 'Diario 5Días',
    title: 'Cecon expande capacidad productiva con nueva planta en Villa Hayes',
    summary: 'Cementos del Cono Sur (CECON S.A.E.) inauguró su nuevo módulo de empaque, aumentando su capacidad de despacho en un 25%. Los analistas destacan la solidez del flujo de caja de la cementera paraguaya para cumplir con las amortizaciones y cupones de sus emisiones de bonos (series CEC03G1 y otras).',
    url: 'https://5dias.com.py/cecon-villa-hayes-expansion',
    relatedCompanies: ['CECON S.A.E.'],
    sentiment: 'positive'
  },
  {
    id: 'news-3',
    date: '2026-05-22',
    source: 'MarketData Paraguay',
    title: 'Finexpar S.A.E.C.A. consolida su posicionamiento en microfinanzas con buenos retornos',
    summary: 'La entidad financiera Finexpar S.A.E.C.A. presentó su balance del trimestre, exhibiendo una reducción de la cartera de mora y un incremento en el margen operativo neto. La calificación A-py se mantiene firme con perspectiva estable.',
    url: 'https://marketdata.com.py/finexpar-balance-trimestral',
    relatedCompanies: ['FINANCIERA FINEXPAR S.A.E.C.A.'],
    sentiment: 'positive'
  },
  {
    id: 'news-4',
    date: '2026-05-21',
    source: 'Valor Agro',
    title: 'Sector cárnico paraguayo se beneficia de la apertura definitiva del mercado de EE. UU.',
    summary: 'La aprobación final para el ingreso de cortes especiales dinamiza a los principales frigoríficos del país, impactando directamente en la solidez de emisores locales de bonos como Frigorífico Concepción, que espera refinanciar pasivos en mejores condiciones.',
    url: 'https://valoragro.com.py/carne-eeuu-exportaciones',
    relatedCompanies: ['FRIGORÍFICO CONCEPCIÓN'],
    sentiment: 'positive'
  },
  {
    id: 'news-5',
    date: '2026-05-18',
    source: 'Diario La Nación PY',
    title: 'Tecsul reporta avances significativos en obras civiles y viales adjudicadas por el MOPC',
    summary: 'La constructora Tecsul S.A. mantiene un ritmo de ejecución de obras del 95% en los principales tramos viales asignados. Su plan de repago de bonos de la serie TSU06G1 sigue avanzando en línea con el cronograma y sin demoras en los ingresos por certificaciones de obras.',
    url: 'https://lanacion.com.py/tecsul-obras-mopc',
    relatedCompanies: ['TECSUL S.A.'],
    sentiment: 'positive'
  },
  {
    id: 'news-6',
    date: '2026-05-15',
    source: 'Diario 5Días',
    title: 'Comfar S.A.E.C.A. amplía su red de distribución y farmacias aliadas a nivel nacional',
    summary: 'La farmacéutica y distribuidora de medicamentos Comfar S.A.E.C.A. reporta un incremento en ventas de la línea OTC. La empresa ratifica el cumplimiento riguroso del pago de cupones de sus bonos corporativos en dólares americanos, calificados como BBB+.',
    url: 'https://5dias.com.py/comfar-distribucion-nacional',
    relatedCompanies: ['COMFAR S.A.E.C.A.'],
    sentiment: 'neutral'
  }
];

export const MOCK_BOND_LAUNCHES: BondLaunch[] = [
  {
    id: 'launch-1',
    issuer: 'TELECEL S.A.E. (Tigo Paraguay)',
    rating: 'AAA py',
    currency: 'PYG',
    interestRate: 9.75,
    paymentFrequency: 'trimestral',
    maturityYears: 5,
    broker: 'Basa Capital',
    amount: '80.000.000.000 Gs.',
    recommendationScore: 94,
    recommendationText: 'La más alta calificación crediticia (AAA py) del mercado paraguayo. Respaldo de Millicom International. Tasa muy atractiva del 9.75% para una inversión de riesgo prácticamente nulo.',
    status: 'Abierta'
  },
  {
    id: 'launch-2',
    issuer: 'SUDAMERIS BANK S.A.E.C.A.',
    rating: 'AA+ py',
    currency: 'PYG',
    interestRate: 8.95,
    paymentFrequency: 'trimestral',
    maturityYears: 4,
    broker: 'Cadiem',
    amount: '150.000.000.000 Gs.',
    recommendationScore: 88,
    recommendationText: 'Excelente oportunidad en el sector bancario de Paraguay. Sudameris, tras su fusión con Regional, se consolida como el banco más grande del país. Rendimiento superior comparado con CDAs convencionales.',
    status: 'Abierta'
  },
  {
    id: 'launch-3',
    issuer: 'FRIGORÍFICO CONCEPCIÓN S.A.',
    rating: 'A py',
    currency: 'USD',
    interestRate: 7.75,
    paymentFrequency: 'trimestral',
    maturityYears: 3,
    broker: 'Investor',
    amount: '10.000.000 USD',
    recommendationScore: 82,
    recommendationText: 'Para inversores en dólares con moderada tolerancia al riesgo. Frigorífico Concepción ofrece un spread muy alto (7.75%) en moneda dura. Respaldado por sus fuertes flujos exportadores.',
    status: 'Próximamente'
  },
  {
    id: 'launch-4',
    issuer: 'BIOEXPORT S.A.',
    rating: 'BBB+ py',
    currency: 'PYG',
    interestRate: 11.50,
    paymentFrequency: 'trimestral',
    maturityYears: 5,
    broker: 'Basa Capital',
    amount: '15.000.000.000 Gs.',
    recommendationScore: 78,
    recommendationText: 'Rendimiento elevado (11.50%) que compensa la calificación BBB+. Bioexport es un jugador clave en la agroexportación no tradicional (sésamo, chía). Ideal para diversificar con un plus de tasa.',
    status: 'Abierta'
  },
  {
    id: 'launch-5',
    issuer: 'HIERRO MAT S.A.E.',
    rating: 'A- py',
    currency: 'PYG',
    interestRate: 10.75,
    paymentFrequency: 'trimestral',
    maturityYears: 6,
    broker: 'Cadiem',
    amount: '20.000.000.000 Gs.',
    recommendationScore: 85,
    recommendationText: 'Fuerte desempeño en el sector metalúrgico e inmobiliario. Excelente balance riesgo-retorno con una tasa del 10.75% a 6 años, pagos trimestrales estables.',
    status: 'Abierta'
  }
];
