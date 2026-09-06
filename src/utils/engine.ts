// ============================================
// FIRE Engine — replicates the Excel template's formulas exactly.
// Conventions (same as the workbook):
//   closing(year) = months * monthlyInvest + opening + returns
//   returns(year) = opening * blendedReturn            (full years)
//   returns(year 1 if partial) = opening * blendedReturn * months/12
//   nextOpening = closing - withdrawals(year)
//   monthlyInvest grows by sipIncrease each year
//   Contributions stop after the plan's contribution end year
// ============================================

import type {
  FireData, FinancialAsset, RealAsset, LiabilityItem, ExpenseItem,
  ChildGoal, Currency, CountryProfile,
} from '../types';
import { COUNTRIES } from '../types';

// ---------- Formatting ----------
export function fmt(value: number, symbol = '₹', currency: Currency = 'INR'): string {
  const neg = value < 0;
  const abs = Math.abs(value);
  let out: string;
  if (currency === 'INR') {
    if (abs >= 1e7) out = (abs / 1e7).toFixed(2) + ' Cr';
    else if (abs >= 1e5) out = (abs / 1e5).toFixed(2) + ' L';
    else out = formatIndianNumber(Math.round(abs));
  } else {
    if (abs >= 1e6) out = (abs / 1e6).toFixed(2) + 'M';
    else if (abs >= 1e3) out = (abs / 1e3).toFixed(1) + 'K';
    else out = Math.round(abs).toString();
  }
  return (neg ? '-' : '') + symbol + out;
}

export function fmtFull(value: number, symbol = '₹', currency: Currency = 'INR'): string {
  const n = Math.round(value);
  const s = currency === 'INR' ? formatIndianNumber(Math.abs(n)) : Math.abs(n).toLocaleString('en-US');
  return (n < 0 ? '-' : '') + symbol + s;
}

export function formatIndianNumber(value: number): string {
  const str = Math.round(value).toString();
  if (str.length <= 3) return str;
  const lastThree = str.substring(str.length - 3);
  const other = str.substring(0, str.length - 3);
  return other.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
}

export function pct(x: number, digits = 1): string {
  return (x * 100).toFixed(digits) + '%';
}

// ---------- Helpers ----------
export function countryOf(d: FireData): CountryProfile {
  return COUNTRIES.find(c => c.code === d.country) || COUNTRIES[0];
}

export function toBase(amount: number, currency: Currency, d: FireData): number {
  const c = countryOf(d);
  return currency === c.baseCurrency ? amount : amount * d.assumptions.fxRate;
}

export function ageFromDob(dob: string, atYear = new Date().getFullYear()): number | null {
  if (!dob) return null;
  const y = new Date(dob).getFullYear();
  if (isNaN(y)) return null;
  return atYear - y;
}

// ---------- Totals ----------
export function totalFinancialAssets(assets: FinancialAsset[], d: FireData): number {
  return assets.reduce((s, a) => s + toBase(a.value || 0, a.currency, d), 0);
}

export function totalRealAssets(assets: RealAsset[], d: FireData): number {
  return assets.reduce((s, a) => s + toBase(a.value || 0, a.currency, d), 0);
}

export function totalLiabilities(liabs: LiabilityItem[], d: FireData): number {
  return liabs.reduce((s, l) => s + toBase(l.outstanding || 0, l.currency, d), 0);
}

/** Monthly expenses converted to base currency (yearly items / 12) */
export function monthlyExpensesBase(expenses: ExpenseItem[], d: FireData): number {
  return expenses.reduce((s, e) => {
    const monthly = e.frequency === 'yearly' ? (e.amount || 0) / 12 : (e.amount || 0);
    return s + toBase(monthly, e.currency, d);
  }, 0);
}

/** Monthly income (take-homes + rental), converted to base currency */
export function monthlyIncomeBase(d: FireData): number {
  let sum = 0;
  const es = d.employmentSelf;
  if (es.takeHomeMonthly) sum += toBase(es.takeHomeMonthly, es.salaryCurrency, d);
  const ep = d.employmentSpouse;
  if (ep.enabled && ep.takeHomeMonthly) sum += toBase(ep.takeHomeMonthly, ep.salaryCurrency, d);
  if (d.cashFlow.rentalIncomeMonthly) sum += d.cashFlow.rentalIncomeMonthly;
  // rents from real assets
  sum += d.realAssets.reduce((s, a) => s + toBase(a.monthlyRent || 0, a.currency, d), 0);
  return sum;
}

// ---------- Glide paths (matching the workbook columns exactly) ----------
/** INR goals: 80% until 3 yrs before target, then 70/60/50, then 40×2, 30 until 3 before horizon end, then 20/10/0/0 */
export function glideINR(yearIdx: number, targetIdx: number, endIdx: number): number {
  if (yearIdx <= targetIdx - 3) return 0.8;
  if (yearIdx === targetIdx - 2) return 0.7;
  if (yearIdx === targetIdx - 1) return 0.6;
  if (yearIdx === targetIdx) return 0.5;
  if (yearIdx <= targetIdx + 2) return 0.4;
  if (yearIdx <= endIdx - 4) return 0.3;
  if (yearIdx === endIdx - 3) return 0.2;
  if (yearIdx === endIdx - 2) return 0.1;
  return 0;
}

/** USD goals: 80% until 5 yrs before target, 70/60/50/40, 30 at target, 30 until 2 before end, then 20/10/0 */
export function glideUSD(yearIdx: number, targetIdx: number, endIdx: number): number {
  if (yearIdx <= targetIdx - 5) return 0.8;
  if (yearIdx === targetIdx - 4) return 0.7;
  if (yearIdx === targetIdx - 3) return 0.6;
  if (yearIdx === targetIdx - 2) return 0.5;
  if (yearIdx === targetIdx - 1) return 0.4;
  if (yearIdx <= endIdx - 3) return 0.3;
  if (yearIdx === endIdx - 2) return 0.2;
  if (yearIdx === endIdx - 1) return 0.1;
  return 0;
}

/** Retirement: 80% through retirement year, 70% for 11 years after, then 50% */
export function glideRetirement(year: number, retireYear: number): number {
  if (year <= retireYear) return 0.8;
  if (year <= retireYear + 11) return 0.7;
  return 0.5;
}

// ---------- Generic projection ----------
export interface ProjectionRow {
  year: number;
  yearIdx: number;
  months: number;
  monthlyInvest: number;
  opening: number;
  returns: number;
  withdrawal: number;
  closing: number;
  equityPct: number;
  blendedReturn: number;
  age?: number | null;
}

export interface ProjectionInput {
  startYear: number;
  startAmount: number;
  monthlySip: number;
  sipIncrease: number;         // decimal
  firstYearMonths: number;     // months remaining in the first year
  equityReturn: number;
  debtReturn: number;
  glide: (yearIdx: number) => number;
  withdrawals: Map<number, number>; // yearIdx -> amount (in that year's currency)
  horizonIdx: number;          // last yearIdx to project
  contribEndIdx: number;       // last yearIdx that gets contributions
  birthYear?: number | null;   // for age column
}

export function projectPlan(inp: ProjectionInput): ProjectionRow[] {
  const rows: ProjectionRow[] = [];
  let opening = inp.startAmount;
  let sip = inp.monthlySip;
  for (let idx = 1; idx <= inp.horizonIdx; idx++) {
    const months = idx === 1 ? inp.firstYearMonths : 12;
    const equityPct = inp.glide(idx);
    const blended = equityPct * inp.equityReturn + (1 - equityPct) * inp.debtReturn;
    const invest = idx <= inp.contribEndIdx ? sip : 0;
    const returns = idx === 1 && months < 12
      ? opening * blended * months / 12
      : opening * blended;
    const closing = months * invest + opening + returns;
    const withdrawal = inp.withdrawals.get(idx) || 0;
    rows.push({
      year: inp.startYear + idx - 1,
      yearIdx: idx,
      months,
      monthlyInvest: Math.round(invest),
      opening: Math.round(opening),
      returns: Math.round(returns),
      withdrawal: Math.round(withdrawal),
      closing: Math.round(closing),
      equityPct,
      blendedReturn: blended,
      age: inp.birthYear ? inp.startYear + idx - 1 - inp.birthYear : null,
    });
    opening = closing - withdrawal;
    sip = sip * (1 + inp.sipIncrease);
  }
  return rows;
}

// ---------- Children goal withdrawals ----------
interface ChildEvent { yearIdx: number; amount: number; label: string }

/**
 * Education (UG): cost/4 per year for 4 years, starting one year before the target,
 * grown at education inflation with nper = yearIdx.
 * PG: cost/2 per year for 2 years, starting one year before target.
 * Marriage: full cost at target year, grown at general inflation.
 */
export function childWithdrawalEvents(
  child: ChildGoal,
  eduInflation: number,
  otherInflation: number,
  alt = false,
): ChildEvent[] {
  const events: ChildEvent[] = [];
  const push = (cost: number | null, years: number | null, parts: number, infl: number, label: string, early: boolean) => {
    if (!cost || !years) return;
    const startIdx = early ? years - 1 : years;
    for (let k = 0; k < parts; k++) {
      const idx = startIdx + k;
      events.push({ yearIdx: idx, amount: (cost / parts) * Math.pow(1 + infl, idx), label });
    }
  };
  if (alt) {
    push(child.ugCostAlt, child.ugYearsAlt, 4, eduInflation, 'UG (foreign)', true);
  } else {
    push(child.ugCostBase, child.ugYears, 4, eduInflation, 'UG', true);
    push(child.pgCost, child.pgYears, 2, eduInflation, 'PG', true);
    push(child.marriageCost, child.marriageYears, 1, otherInflation, 'Marriage', false);
  }
  return events;
}

export function mergeEvents(list: ChildEvent[][]): Map<number, number> {
  const m = new Map<number, number>();
  for (const events of list) for (const e of events) {
    m.set(e.yearIdx, (m.get(e.yearIdx) || 0) + e.amount);
  }
  return m;
}

// ---------- Plan builders from app data ----------
export function buildChildrenPlan(d: FireData, alt: boolean): { rows: ProjectionRow[]; targetIdx: number } | null {
  const g = d.goals;
  const a = d.assumptions;
  const startYear = new Date().getFullYear();
  const sip = alt ? g.childrenSipAlt : g.childrenSipBase;
  if (!sip) return null;

  const events = mergeEvents(g.children.map(c =>
    childWithdrawalEvents(c, alt ? a.altEducationInflation : a.educationInflation, a.inflation, alt)));
  const horizonIdx = Math.max(1, ...[...events.keys()], 1);
  const targetIdx = Math.min(...g.children.map(c => (alt ? c.ugYearsAlt : c.ugYears) || 99), 99);

  const retireAge = g.retirement.retireAgeSelf;
  const birthYear = d.family.self.dob ? new Date(d.family.self.dob).getFullYear() : null;
  const retireYear = retireAge && birthYear ? birthYear + retireAge : startYear + 15;
  const contribEndIdx = Math.max(1, retireYear - startYear + 1);

  const startAmount = alt
    ? d.financialAssets.filter(x => x.mappedTo === 'children' && x.currency !== countryOf(d).baseCurrency)
        .reduce((s, x) => s + (x.value || 0), 0)
    : d.financialAssets.filter(x => x.mappedTo === 'children' && x.currency === countryOf(d).baseCurrency)
        .reduce((s, x) => s + (x.value || 0), 0);

  const rows = projectPlan({
    startYear,
    startAmount,
    monthlySip: sip,
    sipIncrease: alt ? a.altSipYearlyIncrease : a.sipYearlyIncrease,
    firstYearMonths: g.childrenFirstYearMonths || (alt ? 10 : 10),
    equityReturn: alt ? a.altEquityReturn : a.equityReturn,
    debtReturn: alt ? a.altDebtReturn : a.debtReturn,
    glide: idx => (alt ? glideUSD : glideINR)(idx, targetIdx, horizonIdx),
    withdrawals: events,
    horizonIdx,
    contribEndIdx,
    birthYear,
  });
  return { rows, targetIdx };
}

export function buildRetirementPlan(d: FireData): ProjectionRow[] | null {
  const g = d.goals.retirement;
  const a = d.assumptions;
  if (!g.monthlyInvestment && !d.financialAssets.some(x => x.mappedTo === 'retirement')) return null;
  const birthYear = d.family.self.dob ? new Date(d.family.self.dob).getFullYear() : null;
  const currentAge = birthYear ? new Date().getFullYear() - birthYear : null;
  if (!g.retireAgeSelf || !currentAge || !birthYear) return null;

  const startYear = new Date().getFullYear();
  const yearsToRetire = Math.max(1, g.retireAgeSelf - currentAge - 1 + 1); // retireYear = startYear + yearsToRetire - 1
  const retireYear = startYear + yearsToRetire - 1;
  const lifeExp = g.lifeExpectancy || 85;
  const endYear = birthYear + lifeExp;
  const horizonIdx = Math.max(yearsToRetire, endYear - startYear + 1);

  const startAmount = d.financialAssets
    .filter(x => x.mappedTo === 'retirement')
    .reduce((s, x) => s + toBase(x.value || 0, x.currency, d), 0);

  const withdrawals = new Map<number, number>();
  if (g.monthlyExpenseToday) {
    for (let idx = yearsToRetire; idx <= horizonIdx; idx++) {
      // Workbook: FV(inflation, yearIdx - 1, , -monthlyExpense * 12)
      withdrawals.set(idx, g.monthlyExpenseToday * 12 * Math.pow(1 + a.inflation, idx - 1));
    }
  }

  return projectPlan({
    startYear,
    startAmount,
    monthlySip: g.monthlyInvestment || 0,
    sipIncrease: a.sipYearlyIncrease,
    firstYearMonths: 12,
    equityReturn: a.equityReturn,
    debtReturn: a.debtReturn,
    glide: idx => glideRetirement(startYear + idx - 1, retireYear),
    withdrawals,
    horizonIdx,
    contribEndIdx: yearsToRetire,
    birthYear,
  });
}

export function buildOtherGoalPlan(d: FireData, goalId: string): { rows: ProjectionRow[]; targetIdx: number } | null {
  const goal = d.goals.others.find(g => g.id === goalId);
  if (!goal || !goal.years || !goal.monthlyInvestment) return null;
  const a = d.assumptions;
  const startYear = new Date().getFullYear();
  const targetIdx = goal.years;
  const withdrawals = new Map<number, number>();
  if (goal.cost) withdrawals.set(targetIdx, goal.cost * Math.pow(1 + a.inflation, targetIdx));
  const rows = projectPlan({
    startYear,
    startAmount: 0,
    monthlySip: goal.monthlyInvestment,
    sipIncrease: a.sipYearlyIncrease,
    firstYearMonths: goal.firstYearMonths || 12,
    equityReturn: a.equityReturn,
    debtReturn: a.debtReturn,
    glide: idx => glideINR(idx, targetIdx, targetIdx),
    withdrawals,
    horizonIdx: targetIdx,
    contribEndIdx: targetIdx,
  });
  return { rows, targetIdx };
}

// ---------- FIRE number & gap ----------
export interface FireSummary {
  currentAge: number | null;
  retireAge: number | null;
  yearsToRetire: number | null;
  monthlyExpenseToday: number;
  monthlyExpenseAtRetire: number | null;
  fireNumber: number | null;
  currentSavings: number;      // monthly income - expenses
  savingsRate: number | null;
  requiredMonthly: number;     // sum of planned SIPs (children base + retirement + other goals), base currency
  monthlyGap: number | null;
  annualGap: number | null;
  status: 'ontrack' | 'behind' | 'deficit' | 'unknown';
  projectedRetirementCorpus: number | null;
}

export function computeFireSummary(d: FireData): FireSummary {
  const a = d.assumptions;
  const c = countryOf(d);
  const currentAge = ageFromDob(d.family.self.dob);
  const retireAge = d.goals.retirement.retireAgeSelf;
  const yearsToRetire = currentAge != null && retireAge != null ? Math.max(0, retireAge - currentAge) : null;

  const monthlyExpenseToday = d.goals.retirement.monthlyExpenseToday ?? monthlyExpensesBase(d.cashFlow.expenses, d);
  const monthlyExpenseAtRetire = yearsToRetire != null
    ? monthlyExpenseToday * Math.pow(1 + a.inflation, yearsToRetire)
    : null;
  const fireNumber = monthlyExpenseAtRetire != null
    ? (monthlyExpenseAtRetire * 12) / a.withdrawalRate
    : null;

  const income = monthlyIncomeBase(d);
  const expenses = monthlyExpensesBase(d.cashFlow.expenses, d);
  const currentSavings = income - expenses;
  const savingsRate = income > 0 ? currentSavings / income : null;

  let requiredMonthly = 0;
  if (d.goals.childrenSipBase) requiredMonthly += d.goals.childrenSipBase;
  if (d.goals.childrenSipAlt) requiredMonthly += toBase(d.goals.childrenSipAlt, c.altCurrency, d);
  if (d.goals.retirement.monthlyInvestment) requiredMonthly += d.goals.retirement.monthlyInvestment;
  for (const og of d.goals.others) requiredMonthly += og.monthlyInvestment || 0;

  const monthlyGap = requiredMonthly > 0 ? currentSavings - requiredMonthly : null;
  const annualGap = monthlyGap != null ? monthlyGap * 12 : null;

  let status: FireSummary['status'] = 'unknown';
  if (monthlyGap != null) {
    if (monthlyGap >= 0) status = 'ontrack';
    else if (Math.abs(monthlyGap) <= 0.25 * requiredMonthly) status = 'behind';
    else status = 'deficit';
  }

  const retRows = buildRetirementPlan(d);
  const projectedRetirementCorpus = retRows && yearsToRetire != null && retRows.length >= yearsToRetire
    ? retRows[yearsToRetire - 1].closing
    : null;

  return {
    currentAge, retireAge, yearsToRetire,
    monthlyExpenseToday, monthlyExpenseAtRetire, fireNumber,
    currentSavings, savingsRate, requiredMonthly, monthlyGap, annualGap,
    status, projectedRetirementCorpus,
  };
}

// ---------- Asset allocation by age ----------
export function recommendedAllocation(age: number): { equity: number; debt: number; gold: number; cash: number } {
  if (age < 35) return { equity: 75, debt: 15, gold: 5, cash: 5 };
  if (age <= 45) return { equity: 65, debt: 20, gold: 10, cash: 5 };
  if (age <= 55) return { equity: 50, debt: 30, gold: 12, cash: 8 };
  return { equity: 35, debt: 40, gold: 15, cash: 10 };
}

// ---------- FIRE types ----------
export interface FireType {
  key: string;
  name: string;
  factor: number | null;   // multiple of FIRE number; null for Coast
  description: string;
}

export const FIRE_TYPES: FireType[] = [
  { key: 'lean', name: 'Lean FIRE', factor: 0.7, description: 'Frugal retirement at 70% of planned expenses' },
  { key: 'coast', name: 'Coast FIRE', factor: null, description: 'Amount needed today so growth alone reaches FIRE' },
  { key: 'barista', name: 'Barista FIRE', factor: 0.5, description: '50% covered by corpus, rest by part-time work' },
  { key: 'slow', name: 'Slow FIRE', factor: 0.85, description: 'A gentler path at 85% of full FIRE' },
  { key: 'full', name: 'Full FIRE', factor: 1.0, description: '100% of expenses covered by the corpus' },
  { key: 'chubby', name: 'Chubby FIRE', factor: 1.2, description: '20% buffer above full FIRE' },
  { key: 'fat', name: 'Fat FIRE', factor: 1.5, description: 'Luxury retirement at 150% of planned expenses' },
];

export function fireTypeCorpus(t: FireType, fireNumber: number, yearsToRetire: number, equityReturn: number): number {
  if (t.factor != null) return fireNumber * t.factor;
  // Coast FIRE: present value of fire number
  return fireNumber / Math.pow(1 + equityReturn, Math.max(1, yearsToRetire));
}
