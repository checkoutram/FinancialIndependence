// ============================================
// Test data — the reference dataset from the Excel planning
// template. Loaded ONLY on demand via the "Load test data"
// button, so every screen can be exercised quickly.
// ============================================

import type { FireData } from '../types';
import { emptyFireData } from '../types';

export function buildTestData(): FireData {
  const d = emptyFireData('IN');

  // Family
  d.family.self = { name: 'Arjun Mehta', dob: '1990-08-18', citizenship: 'Indian (in USA)' };
  d.family.spouse = { name: 'Priya Sharma', dob: '1992-10-19', citizenship: 'Indian (in USA)', enabled: true };
  d.family.children = [
    { id: 'test-c1', name: 'Aarav', dob: '2020-12-22', citizenship: 'Indian' },
    { id: 'test-c2', name: 'Vivaan', dob: '2024-12-10', citizenship: 'US citizen' },
  ];
  d.family.yearsToReturnHome = 10;

  // Employment
  d.employmentSelf = {
    company: 'Acme Technologies', designation: 'Associate Director',
    takeHomeMonthly: 6838, salaryCurrency: 'USD', basicMonthly: 11910,
    retirementContributionPct: 15, healthAccountMonthly: 700, providentFundBalance: null,
  };
  d.employmentSpouse = {
    company: 'GlobalTech US Inc', designation: 'Automation Developer',
    takeHomeMonthly: 6400, salaryCurrency: 'USD', basicMonthly: 11200,
    retirementContributionPct: 16, healthAccountMonthly: null, providentFundBalance: 1025336,
    enabled: true,
  };

  // Cash flow
  d.cashFlow = {
    expenses: [
      { id: 't-e1', name: 'Household', amount: 2900, currency: 'USD', frequency: 'monthly' },
      { id: 't-e2', name: 'Lifestyle', amount: 1600, currency: 'USD', frequency: 'monthly' },
      { id: 't-e3', name: 'EMI (Home Loans)', amount: 4800, currency: 'USD', frequency: 'monthly' },
      { id: 't-e4', name: 'Life insurance premium', amount: 696, currency: 'USD', frequency: 'yearly' },
      { id: 't-e5', name: 'Health insurance premium', amount: 4728, currency: 'USD', frequency: 'yearly' },
      { id: 't-e6', name: 'Vehicle insurance premium', amount: 1560, currency: 'USD', frequency: 'yearly' },
    ],
    rentalIncomeMonthly: 14000,
    emergencyFundTarget: 30000,
  };

  // Assumptions (Excel: FX 90, equity 10%, debt 6%, inflation 6%, withdrawal 4%)
  d.assumptions = {
    fxRate: 90,
    equityReturn: 0.10, debtReturn: 0.06, inflation: 0.06,
    educationInflation: 0.09, withdrawalRate: 0.04, sipYearlyIncrease: 0.05,
    altEquityReturn: 0.08, altDebtReturn: 0.03,
    altEducationInflation: 0.07, altSipYearlyIncrease: 0.02,
  };

  // Real assets
  d.realAssets = [
    { id: 't-r1', name: 'Home 1 (India)', value: 3800000, currency: 'INR', monthlyRent: 14000 },
    { id: 't-r2', name: 'Home 2 (Parents)', value: 2100000, currency: 'INR', monthlyRent: null },
    { id: 't-r3', name: 'Farmland (coconut)', value: 15000000, currency: 'INR', monthlyRent: null },
    { id: 't-r4', name: 'Home (US)', value: 680000, currency: 'USD', monthlyRent: null },
    { id: 't-r5', name: 'Vehicle', value: 20000, currency: 'USD', monthlyRent: null },
    { id: 't-r6', name: 'Jewelry / Gold', value: 13680000, currency: 'INR', monthlyRent: null },
  ];

  // Financial assets (mapped to goals per the Excel's asset-mapping)
  d.financialAssets = [
    { id: 't-f1', name: 'Gold Coins', value: 4560000, currency: 'INR', expectedReturn: 0.06, monthlyContribution: null, mappedTo: 'retirement' },
    { id: 't-f2', name: 'NPS', value: 379000, currency: 'INR', expectedReturn: 0.09, monthlyContribution: null, mappedTo: 'retirement' },
    { id: 't-f3', name: 'EPF (Priya)', value: 1025336, currency: 'INR', expectedReturn: 0.08, monthlyContribution: null, mappedTo: 'retirement' },
    { id: 't-f4', name: 'Gratuity (CTS)', value: 800000, currency: 'INR', expectedReturn: 0, monthlyContribution: null, mappedTo: 'retirement' },
    { id: 't-f5', name: 'HDFC Nifty 100 Index', value: 965000, currency: 'INR', expectedReturn: 0.10, monthlyContribution: null, mappedTo: 'retirement' },
    { id: 't-f6', name: 'Bank Deposit (Dad)', value: 3000000, currency: 'INR', expectedReturn: 0.081, monthlyContribution: null, mappedTo: 'children' },
    { id: 't-f7', name: '401K — Vanguard LCG (Ram)', value: 56284, currency: 'USD', expectedReturn: 0.10, monthlyContribution: 2264, mappedTo: 'retirement' },
    { id: 't-f8', name: 'HSA — Vanguard 500 (Ram)', value: 14382, currency: 'USD', expectedReturn: 0.10, monthlyContribution: 700, mappedTo: 'retirement' },
    { id: 't-f9', name: 'MF Portfolio', value: 50577, currency: 'USD', expectedReturn: 0.10, monthlyContribution: 3000, mappedTo: 'retirement' },
    { id: 't-f10', name: 'YouTube / Other', value: 7000, currency: 'USD', expectedReturn: 0.06, monthlyContribution: null, mappedTo: 'none' },
  ];

  // Liabilities
  d.liabilities = [
    { id: 't-l1', name: 'Home Loan 1', outstanding: 672000, currency: 'INR', interestRate: 0.061, emi: 4800, emiCurrency: 'USD' },
    { id: 't-l2', name: 'Home Loan 2 (401K loan)', outstanding: 20439, currency: 'USD', interestRate: 0.102, emi: 200, emiCurrency: 'USD' },
  ];

  // Goals
  d.goals = {
    children: [
      { childId: 'test-c1', ugCostBase: 2400000, ugYears: 12, ugCostAlt: 100000, ugYearsAlt: 12, pgCost: 2600000, pgYears: 16, marriageCost: 2500000, marriageYears: 22 },
      { childId: 'test-c2', ugCostBase: 2400000, ugYears: 16, ugCostAlt: 100000, ugYearsAlt: 16, pgCost: 2600000, pgYears: 20, marriageCost: 2500000, marriageYears: 26 },
    ],
    childrenSipBase: 90000,
    childrenSipAlt: 1850,
    childrenFirstYearMonths: 10,
    retirement: {
      retireAgeSelf: 50, retireAgeSpouse: 48, lifeExpectancy: 85,
      monthlyExpenseToday: 140000, monthlyInvestment: 47500,
    },
    others: [
      { id: 't-g1', name: 'India permanent home', cost: 25000000, years: 10, monthlyInvestment: 205000, firstYearMonths: 12 },
    ],
  };

  d.onboardingComplete = true;
  return d;
}
