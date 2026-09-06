// ============================================
// Test data — a realistic Indian household dataset
// (fictional names). Loaded ONLY on demand via the
// "Auto-populate test data" button, so every screen
// can be exercised quickly.
// ============================================

import type { FireData } from '../types';
import { emptyFireData } from '../types';

export function buildTestData(): FireData {
  const d = emptyFireData('IN');

  // Family — self 40, spouse 34, one child aged 9
  d.family.self = { name: 'Karthik Rajan', dob: '1986-11-23', citizenship: 'Indian' };
  d.family.spouse = { name: 'Meera Krishnan', dob: '1992-07-02', citizenship: 'Indian', enabled: true };
  d.family.children = [
    { id: 'test-c1', name: 'Anika', dob: '2017-01-23', citizenship: 'Indian' },
  ];
  d.family.yearsToReturnHome = 13;

  // Employment
  d.employmentSelf = {
    company: 'TechNova Solutions', designation: 'Engineering Manager',
    takeHomeMonthly: 235000, salaryCurrency: 'INR', basicMonthly: 117000,
    retirementContributionPct: 14, healthAccountMonthly: null, providentFundBalance: 2416400,
  };
  d.employmentSpouse = {
    company: 'FinEdge Services', designation: 'QA Lead',
    takeHomeMonthly: 70000, salaryCurrency: 'INR', basicMonthly: 35000,
    retirementContributionPct: 7, healthAccountMonthly: null, providentFundBalance: 50000,
    enabled: true,
  };

  // Cash flow
  d.cashFlow = {
    expenses: [
      { id: 't-e1', name: 'Household', amount: 150000, currency: 'INR', frequency: 'monthly' },
    ],
    rentalIncomeMonthly: null,
    emergencyFundTarget: null,
  };

  // Assumptions (Indian defaults: FX 90, equity 10%, debt 6%, inflation 6%, withdrawal 4%)
  d.assumptions = {
    fxRate: 90,
    equityReturn: 0.10, debtReturn: 0.06, inflation: 0.06,
    educationInflation: 0.09, withdrawalRate: 0.04, sipYearlyIncrease: 0.05,
    altEquityReturn: 0.08, altDebtReturn: 0.03,
    altEducationInflation: 0.07, altSipYearlyIncrease: 0.02,
  };

  // Real assets (₹3.65 Cr total)
  d.realAssets = [
    { id: 't-r1', name: 'Chennai home', value: 15000000, currency: 'INR', monthlyRent: null },
    { id: 't-r2', name: 'Chennai land', value: 8000000, currency: 'INR', monthlyRent: null },
    { id: 't-r3', name: 'Madurai plot', value: 8000000, currency: 'INR', monthlyRent: null },
    { id: 't-r4', name: 'Madurai land', value: 3000000, currency: 'INR', monthlyRent: null },
    { id: 't-r5', name: 'Coimbatore home', value: 2500000, currency: 'INR', monthlyRent: null },
  ];

  // Financial assets — ₹1.40 Cr total; retirement-mapped ones carry the SIPs
  d.financialAssets = [
    { id: 't-f1', name: 'NPS', value: 864000, currency: 'INR', expectedReturn: 0.08, monthlyContribution: 19036, mappedTo: 'retirement' },
    { id: 't-f2', name: 'Index Funds', value: 3250000, currency: 'INR', expectedReturn: 0.12, monthlyContribution: 100000, mappedTo: 'retirement' },
    { id: 't-f3', name: 'EPF', value: 2416400, currency: 'INR', expectedReturn: 0.0825, monthlyContribution: 32632, mappedTo: 'retirement' },
    { id: 't-f4', name: 'FD', value: 1300000, currency: 'INR', expectedReturn: 0.07, monthlyContribution: null, mappedTo: 'retirement' },
    { id: 't-f5', name: 'Gold', value: 6200000, currency: 'INR', expectedReturn: 0.04, monthlyContribution: null, mappedTo: 'none' },
  ];

  // Liabilities
  d.liabilities = [
    { id: 't-l1', name: 'Home loan', outstanding: 1850000, currency: 'INR', interestRate: 0.075, emi: null, emiCurrency: 'INR' },
  ];

  // Goals — child UG ₹10L in 8 yrs, marriage ₹20L in 16 yrs; retire at 53 on ₹1.5L/mo (today).
  // Retirement monthly investment is 0 here on purpose: the SIPs live on the
  // Retirement-mapped assets above (Option A — asset SIPs fund the projection).
  d.goals = {
    children: [
      { childId: 'test-c1', ugCostBase: 1000000, ugYears: 8, ugCostAlt: null, ugYearsAlt: null, pgCost: null, pgYears: null, marriageCost: 2000000, marriageYears: 16 },
    ],
    childrenSipBase: null,
    childrenSipAlt: null,
    childrenFirstYearMonths: 10,
    retirement: {
      retireAgeSelf: 53, retireAgeSpouse: 55, lifeExpectancy: 85,
      monthlyExpenseToday: 150000, monthlyInvestment: null,
    },
    others: [],
  };

  d.onboardingComplete = true;
  return d;
}
