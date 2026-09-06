// ============================================
// FIRE Tracker — Data Model
// All user data is entered by the user. Nothing is pre-filled.
// ============================================

export type Currency = 'INR' | 'USD';

export type CountryCode = 'IN' | 'US' | 'CA' | 'AU' | 'GB' | 'AE';

export interface CountryProfile {
  code: CountryCode;
  label: string;
  flag: string;
  /** Base (display) currency */
  baseCurrency: Currency;
  /** Secondary currency commonly tracked */
  altCurrency: Currency;
  currencySymbol: string;   // base
  altCurrencySymbol: string;
  defaultFxRate: number;    // 1 unit of alt currency = fxRate base currency
  defaultEquityReturn: number;
  defaultDebtReturn: number;
  defaultInflation: number;
  defaultWithdrawalRate: number;
  retirementAccountName: string;  // e.g. 401K, EPF, Super
  healthAccountName: string;      // e.g. HSA
}

export const COUNTRIES: CountryProfile[] = [
  { code: 'IN', flag: '🇮🇳', label: 'India', baseCurrency: 'INR', altCurrency: 'USD', currencySymbol: '₹', altCurrencySymbol: '$', defaultFxRate: 90, defaultEquityReturn: 0.10, defaultDebtReturn: 0.06, defaultInflation: 0.06, defaultWithdrawalRate: 0.04, retirementAccountName: 'EPF / NPS', healthAccountName: 'Health Insurance' },
  { code: 'US', flag: '🇺🇸', label: 'USA', baseCurrency: 'USD', altCurrency: 'INR', currencySymbol: '$', altCurrencySymbol: '₹', defaultFxRate: 1 / 90, defaultEquityReturn: 0.08, defaultDebtReturn: 0.03, defaultInflation: 0.03, defaultWithdrawalRate: 0.04, retirementAccountName: '401(k)', healthAccountName: 'HSA' },
  { code: 'CA', flag: '🇨🇦', label: 'Canada', baseCurrency: 'USD', altCurrency: 'INR', currencySymbol: 'C$', altCurrencySymbol: '₹', defaultFxRate: 1 / 60, defaultEquityReturn: 0.07, defaultDebtReturn: 0.03, defaultInflation: 0.03, defaultWithdrawalRate: 0.04, retirementAccountName: 'RRSP / TFSA', healthAccountName: 'Health Plan' },
  { code: 'AU', flag: '🇦🇺', label: 'Australia', baseCurrency: 'USD', altCurrency: 'INR', currencySymbol: 'A$', altCurrencySymbol: '₹', defaultFxRate: 1 / 55, defaultEquityReturn: 0.07, defaultDebtReturn: 0.03, defaultInflation: 0.03, defaultWithdrawalRate: 0.04, retirementAccountName: 'Superannuation', healthAccountName: 'Medicare / Private' },
  { code: 'GB', flag: '🇬🇧', label: 'UK', baseCurrency: 'USD', altCurrency: 'INR', currencySymbol: '£', altCurrencySymbol: '₹', defaultFxRate: 1 / 115, defaultEquityReturn: 0.07, defaultDebtReturn: 0.03, defaultInflation: 0.03, defaultWithdrawalRate: 0.04, retirementAccountName: 'SIPP / ISA', healthAccountName: 'NHS / Private' },
  { code: 'AE', flag: '🇦🇪', label: 'UAE', baseCurrency: 'USD', altCurrency: 'INR', currencySymbol: 'د.إ', altCurrencySymbol: '₹', defaultFxRate: 1 / 24, defaultEquityReturn: 0.08, defaultDebtReturn: 0.03, defaultInflation: 0.03, defaultWithdrawalRate: 0.04, retirementAccountName: 'End of Service / GPSSA', healthAccountName: 'Health Insurance' },
];

// ---------- Family ----------
export interface Person {
  name: string;
  dob: string;         // ISO date
  citizenship: string;
}

export interface Family {
  self: Person;
  spouse: Person & { enabled: boolean };
  children: Array<Person & { id: string }>;
  yearsToReturnHome: number | null; // e.g. NRIs planning to move back
}

// ---------- Employment ----------
export interface Employment {
  company: string;
  designation: string;
  takeHomeMonthly: number | null;   // in salaryCurrency
  salaryCurrency: Currency;
  basicMonthly: number | null;
  retirementContributionPct: number | null;  // e.g. 401K % / EPF %
  healthAccountMonthly: number | null;       // e.g. HSA
  providentFundBalance: number | null;       // e.g. EPF accumulation (base currency)
}

// ---------- Cash flow ----------
export interface ExpenseItem {
  id: string;
  name: string;
  amount: number | null;
  currency: Currency;
  frequency: 'monthly' | 'yearly';
}

export interface CashFlowData {
  expenses: ExpenseItem[];
  rentalIncomeMonthly: number | null;  // base currency
  emergencyFundTarget: number | null;  // base currency
}

// ---------- Assumptions ----------
export interface Assumptions {
  fxRate: number;             // 1 alt currency = fxRate base currency
  equityReturn: number;       // decimal, base-country equity
  debtReturn: number;
  inflation: number;
  educationInflation: number;
  withdrawalRate: number;
  sipYearlyIncrease: number;  // decimal
  altEquityReturn: number;    // alt-currency investments
  altDebtReturn: number;
  altEducationInflation: number;
  altSipYearlyIncrease: number;
}

// ---------- Assets & Liabilities ----------
export type GoalMapping = 'retirement' | 'children' | 'none';

export interface RealAsset {
  id: string;
  name: string;
  value: number | null;
  currency: Currency;
  monthlyRent: number | null;
}

export interface FinancialAsset {
  id: string;
  name: string;
  value: number | null;
  currency: Currency;
  expectedReturn: number | null; // decimal
  monthlyContribution: number | null;
  mappedTo: GoalMapping;
}

export interface LiabilityItem {
  id: string;
  name: string;
  outstanding: number | null;
  currency: Currency;
  interestRate: number | null;   // decimal
  emi: number | null;
  emiCurrency: Currency;
}

// ---------- Goals ----------
export interface ChildGoal {
  childId: string;
  ugCostBase: number | null;   ugYears: number | null;   // base currency (India education)
  ugCostAlt: number | null;    ugYearsAlt: number | null; // alt currency (foreign education)
  pgCost: number | null;       pgYears: number | null;
  marriageCost: number | null; marriageYears: number | null;
}

export interface RetirementGoal {
  retireAgeSelf: number | null;
  retireAgeSpouse: number | null;
  lifeExpectancy: number | null;
  monthlyExpenseToday: number | null;   // base currency
  monthlyInvestment: number | null;     // base currency, stepped up yearly
}

export interface OtherGoal {
  id: string;
  name: string;
  cost: number | null;   // base currency, today's cost
  years: number | null;
  monthlyInvestment: number | null;
  firstYearMonths: number | null; // months invested in the current year
}

export interface GoalsData {
  children: ChildGoal[];
  childrenSipBase: number | null;   // monthly SIP for children goals in base currency
  childrenSipAlt: number | null;    // monthly SIP for children goals in alt currency
  childrenFirstYearMonths: number | null;
  retirement: RetirementGoal;
  others: OtherGoal[];
}

// ---------- Root ----------
export interface FireData {
  version: 2;
  country: CountryCode;
  family: Family;
  employmentSelf: Employment;
  employmentSpouse: Employment & { enabled: boolean };
  cashFlow: CashFlowData;
  assumptions: Assumptions;
  realAssets: RealAsset[];
  financialAssets: FinancialAsset[];
  liabilities: LiabilityItem[];
  goals: GoalsData;
  onboardingComplete: boolean;
}

export function emptyPerson(): Person {
  return { name: '', dob: '', citizenship: '' };
}

export function emptyEmployment(): Employment {
  return {
    company: '', designation: '', takeHomeMonthly: null, salaryCurrency: 'USD',
    basicMonthly: null, retirementContributionPct: null, healthAccountMonthly: null,
    providentFundBalance: null,
  };
}

export function defaultAssumptions(c: CountryProfile): Assumptions {
  return {
    fxRate: c.defaultFxRate,
    equityReturn: c.defaultEquityReturn,
    debtReturn: c.defaultDebtReturn,
    inflation: c.defaultInflation,
    educationInflation: 0.09,
    withdrawalRate: c.defaultWithdrawalRate,
    sipYearlyIncrease: 0.05,
    altEquityReturn: 0.08,
    altDebtReturn: 0.03,
    altEducationInflation: 0.07,
    altSipYearlyIncrease: 0.02,
  };
}

export function emptyFireData(country: CountryCode = 'IN'): FireData {
  const c = COUNTRIES.find(x => x.code === country) || COUNTRIES[0];
  return {
    version: 2,
    country,
    family: {
      self: emptyPerson(),
      spouse: { ...emptyPerson(), enabled: false },
      children: [],
      yearsToReturnHome: null,
    },
    employmentSelf: { ...emptyEmployment(), salaryCurrency: c.altCurrency },
    employmentSpouse: { ...emptyEmployment(), salaryCurrency: c.altCurrency, enabled: false },
    cashFlow: { expenses: [], rentalIncomeMonthly: null, emergencyFundTarget: null },
    assumptions: defaultAssumptions(c),
    realAssets: [],
    financialAssets: [],
    liabilities: [],
    goals: {
      children: [],
      childrenSipBase: null,
      childrenSipAlt: null,
      childrenFirstYearMonths: null,
      retirement: {
        retireAgeSelf: null, retireAgeSpouse: null, lifeExpectancy: 85,
        monthlyExpenseToday: null, monthlyInvestment: null,
      },
      others: [],
    },
    onboardingComplete: false,
  };
}
