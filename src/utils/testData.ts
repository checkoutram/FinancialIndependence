// ============================================
// Test data — a realistic US-resident NRI household
// dataset (fictional names). Loaded ONLY on demand via
// the "Auto-populate test data" button, so every screen
// can be exercised quickly.
// ============================================

import type { FireData } from '../types';
import { emptyFireData } from '../types';

export function buildTestData(): FireData {
  const d = emptyFireData('US');

  // Family — self 35, spouse 33, two sons aged 5 and 1; plans to return to India in 10 yrs
  d.family.self = { name: 'Arjun Prakash', dob: '1990-08-18', citizenship: 'Indian' };
  d.family.spouse = { name: 'Divya Ramesh', dob: '1992-10-19', citizenship: 'Indian', enabled: true };
  d.family.children = [
    { id: 'test-c1', name: 'Vihaan', dob: '2020-12-22', citizenship: 'Indian' },
    { id: 'test-c2', name: 'Aarav', dob: '2024-12-10', citizenship: 'American' },
  ];
  d.family.yearsToReturnHome = 10;

  // Employment (USD take-home; 401(k) % and HSA from the sheet)
  d.employmentSelf = {
    company: 'Northwind Tech', designation: 'Associate Director',
    takeHomeMonthly: 6838, salaryCurrency: 'USD', basicMonthly: 11910,
    retirementContributionPct: 15, healthAccountMonthly: 700, providentFundBalance: null,
  };
  d.employmentSpouse = {
    company: 'CloudPeak Systems', designation: 'Automation Developer',
    takeHomeMonthly: 6400, salaryCurrency: 'USD', basicMonthly: 11200,
    retirementContributionPct: 16, healthAccountMonthly: null, providentFundBalance: null,
    enabled: true,
  };

  // Cash flow (USD/month from the sheet: household 2900 + lifestyle 1600)
  d.cashFlow = {
    expenses: [
      { id: 't-e1', name: 'Household', amount: 2900, currency: 'USD', frequency: 'monthly' },
      { id: 't-e2', name: 'Lifestyle', amount: 1600, currency: 'USD', frequency: 'monthly' },
    ],
    rentalIncomeMonthly: null,
    emergencyFundTarget: 30000,
  };

  // Assumptions (US family: base USD, alt INR at 1 USD = ₹90)
  d.assumptions = {
    fxRate: 1 / 90,
    equityReturn: 0.08, debtReturn: 0.03, inflation: 0.03,
    educationInflation: 0.07, withdrawalRate: 0.04, sipYearlyIncrease: 0.05,
    altEquityReturn: 0.10, altDebtReturn: 0.06,
    altEducationInflation: 0.09, altSipYearlyIncrease: 0.02,
  };

  // Real assets (India properties in ₹, US home/vehicle in $, gold jewelry in ₹)
  d.realAssets = [
    { id: 't-r1', name: 'India home 1', value: 3800000, currency: 'INR', monthlyRent: 14000 },
    { id: 't-r2', name: 'India home 2', value: 2100000, currency: 'INR', monthlyRent: null },
    { id: 't-r3', name: 'Farmland (1 acre)', value: 15000000, currency: 'INR', monthlyRent: null },
    { id: 't-r4', name: 'US home', value: 680000, currency: 'USD', monthlyRent: null },
    { id: 't-r5', name: 'Vehicle', value: 20000, currency: 'USD', monthlyRent: null },
    { id: 't-r6', name: 'Gold jewelry', value: 13680000, currency: 'INR', monthlyRent: null },
  ];

  // Financial assets — retirement-mapped ones (401k/HSA/NPS/EPF/Index) carry the SIPs
  d.financialAssets = [
    { id: 't-f1', name: '401(k) — Vanguard Large Cap Growth', value: 56284, currency: 'USD', expectedReturn: 0.10, monthlyContribution: 2264, mappedTo: 'retirement' },
    { id: 't-f2', name: '401(k) — Vanguard Large Cap (spouse)', value: 0, currency: 'USD', expectedReturn: 0.10, monthlyContribution: 1936, mappedTo: 'retirement' },
    { id: 't-f3', name: 'HSA — Vanguard 500 Admiral', value: 14382, currency: 'USD', expectedReturn: 0.10, monthlyContribution: 700, mappedTo: 'retirement' },
    { id: 't-f4', name: 'NPS', value: 379000, currency: 'INR', expectedReturn: 0.08, monthlyContribution: null, mappedTo: 'retirement' },
    { id: 't-f5', name: 'EPF (spouse)', value: 1025000, currency: 'INR', expectedReturn: 0.0825, monthlyContribution: null, mappedTo: 'retirement' },
    { id: 't-f6', name: 'HDFC NIFTY 100 Index (G)', value: 965000, currency: 'INR', expectedReturn: 0.10, monthlyContribution: null, mappedTo: 'retirement' },
    { id: 't-f7', name: 'Gratuity (frozen, pays out 2027)', value: 800000, currency: 'INR', expectedReturn: null, monthlyContribution: null, mappedTo: 'none' },
    { id: 't-f8', name: 'Bank deposit', value: 3000000, currency: 'INR', expectedReturn: 0.081, monthlyContribution: null, mappedTo: 'none' },
    { id: 't-f9', name: 'Mutual funds', value: 50577, currency: 'INR', expectedReturn: 0.10, monthlyContribution: 3000, mappedTo: 'none' },
    { id: 't-f10', name: 'YouTube channel', value: 7000, currency: 'INR', expectedReturn: 0.06, monthlyContribution: null, mappedTo: 'none' },
    { id: 't-f11', name: 'Gold coins', value: 4560000, currency: 'INR', expectedReturn: 0.04, monthlyContribution: null, mappedTo: 'none' },
  ];

  // Liabilities (US mortgages, USD)
  d.liabilities = [
    { id: 't-l1', name: 'Home loan 1', outstanding: 672000, currency: 'USD', interestRate: 0.061, emi: 4800, emiCurrency: 'USD' },
    { id: 't-l2', name: 'Home loan 2 (401k loan)', outstanding: 20439, currency: 'USD', interestRate: 0.102, emi: 200, emiCurrency: 'USD' },
  ];

  // Goals — per child: US UG $100k (base) + India UG ₹24L (alt), India PG ₹26L and
  // marriage ₹25L (base-only fields, converted at 90). Retire at 50/48 on
  // ₹70,000/mo (today's value ≈ $800). Other goals: India home ₹2.5 Cr and car ₹30L in 10 yrs.
  d.goals = {
    children: [
      { childId: 'test-c1', ugCostBase: 100000, ugYears: 12, ugCostAlt: 2400000, ugYearsAlt: 12, pgCost: 29000, pgYears: 16, marriageCost: 27800, marriageYears: 22 },
      { childId: 'test-c2', ugCostBase: 100000, ugYears: 16, ugCostAlt: 2400000, ugYearsAlt: 16, pgCost: 29000, pgYears: 20, marriageCost: 27800, marriageYears: 26 },
    ],
    childrenSipBase: null,
    childrenSipAlt: null,
    childrenFirstYearMonths: null,
    retirement: {
      retireAgeSelf: 50, retireAgeSpouse: 48, lifeExpectancy: 85,
      monthlyExpenseToday: 800, monthlyInvestment: null,
    },
    others: [
      { id: 't-g1', name: 'India permanent home', cost: 278000, years: 10, monthlyInvestment: null, firstYearMonths: null },
      { id: 't-g2', name: 'India car', cost: 33500, years: 10, monthlyInvestment: null, firstYearMonths: null },
    ],
  };

  d.onboardingComplete = true;
  return d;
}
