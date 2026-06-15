import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Investment, CashFlowPeriod } from '../types/portfolio';
import { INITIAL_INVESTMENTS } from '../data/initialPortfolio';

interface PortfolioContextProps {
  investments: Investment[];
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
  addInvestment: (inv: Omit<Investment, 'id'>) => void;
  editInvestment: (inv: Investment) => void;
  deleteInvestment: (id: string) => void;
  cashFlow: CashFlowPeriod[];
  totalInvestedPYG: number;
  totalInvestedUSD: number;
  averageRate: number;
  monthlyPassiveIncome: number;
}

const PortfolioContext = createContext<PortfolioContextProps | undefined>(undefined);

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

// Paraguay public holidays (fixed + Easter-based)
const PARAGUAY_HOLIDAYS_FIXED = [
  '01-01', // Año Nuevo
  '05-01', // Día del Trabajador
  '05-14', // Día de la Independencia Nacional
  '05-15', // Día de la Independencia Nacional
  '06-12', // Paz del Chaco
  '08-15', // Fundación de Asunción
  '09-29', // Batalla de Boquerón
  '12-08', // Virgen de Caacupé
  '12-25', // Navidad
];

// Calculate Easter Sunday for a given year (Anonymous Gregorian algorithm)
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function isParaguayHoliday(date: Date): boolean {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const mmdd = `${month}-${day}`;
  
  // Check fixed holidays
  if (PARAGUAY_HOLIDAYS_FIXED.includes(mmdd)) return true;
  
  // Check Easter-based holidays (Jueves Santo, Viernes Santo)
  const year = date.getFullYear();
  const easter = getEasterSunday(year);
  const holyThursday = new Date(easter);
  holyThursday.setDate(holyThursday.getDate() - 3);
  const goodFriday = new Date(easter);
  goodFriday.setDate(goodFriday.getDate() - 2);
  
  if (date.getTime() === holyThursday.getTime()) return true;
  if (date.getTime() === goodFriday.getTime()) return true;
  
  return false;
}

function isBusinessDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  // 0 = Sunday, 6 = Saturday
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;
  return !isParaguayHoliday(date);
}

function getNextBusinessDay(date: Date): Date {
  const result = new Date(date);
  while (!isBusinessDay(result)) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

function getFirstBusinessDayOfMonth(year: number, month: number): Date {
  const firstDay = new Date(year, month, 1);
  return getNextBusinessDay(firstDay);
}

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [investments, setInvestments] = useState<Investment[]>(() => {
    const saved = localStorage.getItem('asuncion_portfolio');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved portfolio', e);
      }
    }
    return INITIAL_INVESTMENTS;
  });

  const [exchangeRate, setExchangeRate] = useState<number>(() => {
    const saved = localStorage.getItem('asuncion_fx_rate');
    return saved ? parseFloat(saved) : 7850; // Standard PYG/USD rate in May 2026, user can edit
  });

  useEffect(() => {
    localStorage.setItem('asuncion_portfolio', JSON.stringify(investments));
  }, [investments]);

  useEffect(() => {
    localStorage.setItem('asuncion_fx_rate', exchangeRate.toString());
  }, [exchangeRate]);

  useEffect(() => {
    const fetchLiveRate = async () => {
      if (window.electronAPI?.getLiveExchangeRate) {
        try {
          const liveRate = await window.electronAPI.getLiveExchangeRate();
          if (liveRate && liveRate > 0) {
            setExchangeRate(liveRate);
          }
        } catch (e) {
          console.error('Failed to get live exchange rate:', e);
        }
      }
    };
    fetchLiveRate();
  }, []);

  const addInvestment = (inv: Omit<Investment, 'id'>) => {
    const newInv: Investment = {
      ...inv,
      id: `inv-${Date.now()}`
    };
    setInvestments(prev => [...prev, newInv]);
  };

  const editInvestment = (updatedInv: Investment) => {
    setInvestments(prev => prev.map(inv => inv.id === updatedInv.id ? updatedInv : inv));
  };

  const deleteInvestment = (id: string) => {
    setInvestments(prev => prev.filter(inv => inv.id !== id));
  };

  // 1. Calculate KPIs
  const totalInvestedPYG = investments
    .filter(i => i.currency === 'PYG')
    .reduce((sum, i) => sum + i.capital, 0);

  const totalInvestedUSD = investments
    .filter(i => i.currency === 'USD')
    .reduce((sum, i) => sum + i.capital, 0);

  // Average Rate weighted by capital in PYG equivalents
  const totalCapitalEquivalent = investments.reduce((sum, i) => {
    const capEq = i.currency === 'USD' ? i.capital * exchangeRate : i.capital;
    return sum + capEq;
  }, 0);

  const averageRate = totalCapitalEquivalent > 0
    ? investments.reduce((sum, i) => {
        const capEq = i.currency === 'USD' ? i.capital * exchangeRate : i.capital;
        return sum + (i.interestRate * (capEq / totalCapitalEquivalent));
      }, 0)
    : 0;

  // 2. Generate Cash Flow Estimation for the next 24 months (starting May 2026)
  const cashFlow: CashFlowPeriod[] = [];
  
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed, e.g. June is 5.

  
  // Calculate periods from May 2026 to April 2028 (24 months)
  const startProjDate = new Date(currentYear, currentMonth, 1);
  const endProjDate = new Date(currentYear, currentMonth + 24, 0);

  investments.forEach(inv => {
    const issuance = new Date(inv.issuanceDate || '2024-01-01');
    const maturity = inv.maturityDate ? new Date(inv.maturityDate) : null;

    // --- CASE A: BONOS ---
    if (inv.type === 'bono') {
      if (!maturity) return;
      
      // Calculate exact payment dates starting from maturity going backwards every 3 months (trimestral)
      let tempDate = new Date(maturity);
      const paymentDates: Date[] = [];
      
      // Edge case for COMFAR: next payment is 04/jun/26
      if (inv.isinOrSerie === 'PYCMF01F2457') {
        // Next is June 4, 2026. Let's populate forwards and backwards
        let d = new Date('2026-06-04');
        while (d <= maturity) {
          paymentDates.push(new Date(d));
          d.setMonth(d.getMonth() + 3);
        }
      } else {
        while (tempDate >= issuance) {
          paymentDates.push(new Date(tempDate));
          tempDate.setMonth(tempDate.getMonth() - 3);
        }
      }

      paymentDates.forEach(payDate => {
        // Check if the payment date is within our 24-month projection window
        if (payDate >= startProjDate && payDate <= endProjDate) {
          const dateString = payDate.toISOString().split('T')[0];
          const isMaturity = payDate.getTime() === maturity.getTime();
          
          // Coupon amount: Capital * (Rate / 100) / 4 (for trimestral)
          const interestAmount = inv.capital * (inv.interestRate / 100) / 4;
          
          // Coupon payment
          cashFlow.push({
            date: dateString,
            monthName: payDate.toLocaleString('es-PY', { month: 'short', year: 'numeric' }),
            investmentId: inv.id,
            issuer: inv.issuer,
            type: 'bono',
            currency: inv.currency,
            amount: Math.round(interestAmount * 100) / 100,
            isPrincipal: false
          });

          // Principal Amortization at Maturity
          if (isMaturity) {
            cashFlow.push({
              date: dateString,
              monthName: payDate.toLocaleString('es-PY', { month: 'short', year: 'numeric' }),
              investmentId: inv.id,
              issuer: inv.issuer,
              type: 'bono',
              currency: inv.currency,
              amount: inv.capital,
              isPrincipal: true
            });
          }
        }
      });
    }

    // --- CASE B: PLAZO FIJO ---
    if (inv.type === 'plazo_fijo') {
      if (!maturity) return;

      // Pays monthly on the first business day of each month
      // according to the Paraguayan calendar (skips weekends and holidays)
      const issueDate = new Date(issuance);
      let payDate = getFirstBusinessDayOfMonth(issueDate.getFullYear(), issueDate.getMonth() + 1);

      while (payDate <= maturity) {
        if (payDate >= startProjDate && payDate <= endProjDate) {
          const dateString = payDate.toISOString().split('T')[0];
          
          // Interest return
          const monthlyReturn = inv.fixedMonthlyReturn || (inv.capital * (inv.interestRate / 100) / 12);
          
          cashFlow.push({
            date: dateString,
            monthName: payDate.toLocaleString('es-PY', { month: 'short', year: 'numeric' }),
            investmentId: inv.id,
            issuer: inv.issuer,
            type: 'plazo_fijo',
            currency: inv.currency,
            amount: Math.round(monthlyReturn * 100) / 100,
            isPrincipal: false
          });

          // Check if this is the maturity month (compare year and month only)
          const payYearMonth = `${payDate.getFullYear()}-${payDate.getMonth()}`;
          const maturityYearMonth = `${maturity.getFullYear()}-${maturity.getMonth()}`;
          if (payYearMonth === maturityYearMonth) {
            cashFlow.push({
              date: dateString,
              monthName: payDate.toLocaleString('es-PY', { month: 'short', year: 'numeric' }),
              investmentId: inv.id,
              issuer: inv.issuer,
              type: 'plazo_fijo',
              currency: inv.currency,
              amount: inv.capital,
              isPrincipal: true
            });
          }
        }
        // Advance to the first business day of the next month
        payDate = getFirstBusinessDayOfMonth(payDate.getFullYear(), payDate.getMonth() + 1);
      }
    }

    // --- CASE C: FONDO MUTUO ---
    if (inv.type === 'fondo_mutuo') {
      // For mutual funds, we generate monthly estimated yield payments on the last day of each month
      for (let m = 0; m < 24; m++) {
        const payDate = new Date(currentYear, currentMonth + m + 1, 0); // Last day of month
        const dateString = payDate.toISOString().split('T')[0];
        
        // Est. Monthly Yield: Capital * (Rate / 12) / 100
        const estYield = inv.capital * (inv.interestRate / 100) / 12;

        cashFlow.push({
          date: dateString,
          monthName: payDate.toLocaleString('es-PY', { month: 'short', year: 'numeric' }),
          investmentId: inv.id,
          issuer: inv.issuer,
          type: 'fondo_mutuo',
          currency: inv.currency,
          amount: Math.round(estYield * 100) / 100,
          isPrincipal: false
        });
      }
    }
  });

  // Sort cash flows chronologically
  cashFlow.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate monthly passive income for the next month (June 2026, which is our first full projection month)
  const nextMonthName = new Date(currentYear, currentMonth + 1, 1).toLocaleString('es-PY', { month: 'short', year: 'numeric' });
  const monthlyPassiveIncome = cashFlow
    .filter(cf => cf.monthName === nextMonthName && !cf.isPrincipal)
    .reduce((sum, cf) => {
      const amountPYG = cf.currency === 'USD' ? cf.amount * exchangeRate : cf.amount;
      return sum + amountPYG;
    }, 0);

  return (
    <PortfolioContext.Provider value={{
      investments,
      exchangeRate,
      setExchangeRate,
      addInvestment,
      editInvestment,
      deleteInvestment,
      cashFlow,
      totalInvestedPYG,
      totalInvestedUSD,
      averageRate,
      monthlyPassiveIncome
    }}>
      {children}
    </PortfolioContext.Provider>
  );
};
