export type InvestmentType = 'bono' | 'plazo_fijo' | 'fondo_mutuo';
export type Currency = 'PYG' | 'USD';
export type PaymentFrequency = 'mensual' | 'trimestral' | 'semestral' | 'anual' | 'al_vencimiento' | 'diario';

export interface Investment {
  id: string;
  type: InvestmentType;
  issuer: string;          // e.g. "TECSUL", "FRIGORIFICO CONCEPCION", "Coop Univ Pablo"
  description: string;     // e.g. "PYTSU06F2391-TECSUL-BONO"
  isinOrSerie: string;     // e.g. "TSU06G1", "PYCMF01F2457", "Cuenta 7154"
  capital: number;         // Amount invested
  currency: Currency;
  interestRate: number;    // Annual percentage rate (e.g. 10.5)
  paymentFrequency: PaymentFrequency;
  issuanceDate: string;    // YYYY-MM-DD (Date of operation)
  maturityDate: string;    // YYYY-MM-DD (Vencimiento)
  rating?: string;         // Risk rating (e.g. "BBB+", "AA-py")
  fixedMonthlyReturn?: number; // Specific for Coop Plazo Fijos
  broker: 'Cadiem' | 'Basa Capital' | 'Cooperativa';
}

export interface CashFlowPeriod {
  date: string;            // YYYY-MM-DD
  monthName: string;       // e.g., "Jun 2026"
  investmentId: string;
  issuer: string;
  type: InvestmentType;
  currency: Currency;
  amount: number;          // Expected payment amount
  isPrincipal: boolean;    // True if capital amortization at maturity
}

export interface NewsArticle {
  id: string;
  date: string;
  source: string;
  title: string;
  summary: string;
  url: string;
  relatedCompanies: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  isFromX?: boolean;
}

export interface BondLaunch {
  id: string;
  issuer: string;
  rating: string;
  currency: Currency;
  interestRate: number;
  paymentFrequency: PaymentFrequency;
  maturityYears: number;
  broker: string;
  amount: string;
  recommendationScore: number; // 0-100
  recommendationText: string;
  status: 'Abierta' | 'Próximamente' | 'Cerrada';
}

declare global {
  interface Window {
    electronAPI?: {
      getVersion: () => Promise<string>;
      platform: string;
      getRealNews: () => Promise<NewsArticle[]>;
      syncRealNews: (issuers: string[]) => Promise<NewsArticle[]>;
      getRealLaunches: () => Promise<BondLaunch[]>;
      syncRealLaunches: () => Promise<BondLaunch[]>;
      getLiveExchangeRate?: () => Promise<number>;
      openExternalLink: (url: string) => void;
    };
  }
}

