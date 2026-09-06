// ============================================
// Validation — runs the engine against the reference dataset
// taken from the Excel template ("source of truth") and compares
// with the workbook's computed values. 1% tolerance.
// The reference dataset is fixed and used ONLY for these tests;
// it is never loaded into the user's profile.
// ============================================

import { projectPlan, glideINR, glideRetirement, childWithdrawalEvents, mergeEvents } from './engine';
import type { ChildGoal } from '../types';

export interface ValidationResult {
  name: string;
  expected: number;
  actual: number;
  tolerance: number;
  pass: boolean;
  source: string;
}

const START_YEAR = 2026;
const FX = 90;

// ---- Reference inputs (from the Excel template) ----
const refChildren: ChildGoal[] = [
  { childId: 'c1', ugCostBase: 2400000, ugYears: 12, ugCostAlt: 100000, ugYearsAlt: 12, pgCost: 2600000, pgYears: 16, marriageCost: 2500000, marriageYears: 22 },
  { childId: 'c2', ugCostBase: 2400000, ugYears: 16, ugCostAlt: 100000, ugYearsAlt: 16, pgCost: 2600000, pgYears: 20, marriageCost: 2500000, marriageYears: 26 },
];

function runChildrenINR() {
  const events = mergeEvents(refChildren.map(c => childWithdrawalEvents(c, 0.09, 0.06, false)));
  const horizonIdx = Math.max(...events.keys());
  return projectPlan({
    startYear: START_YEAR,
    startAmount: 3000000,       // Bank Deposit mapped to children
    monthlySip: 90000,
    sipIncrease: 0.05,
    firstYearMonths: 10,
    equityReturn: 0.10,
    debtReturn: 0.06,
    glide: idx => glideINR(idx, 12, horizonIdx),
    withdrawals: events,
    horizonIdx,
    contribEndIdx: 15,          // SIPs stop at retirement year 2040
  });
}

function runRetirementINR() {
  const yearsToRetire = 15;     // age 35 -> 50, retireYear = 2040
  const retireYear = START_YEAR + yearsToRetire - 1;
  const horizonIdx = 2076 - START_YEAR + 1; // through age 85
  const withdrawals = new Map<number, number>();
  for (let idx = yearsToRetire; idx <= horizonIdx; idx++) {
    withdrawals.set(idx, 140000 * 12 * Math.pow(1.06, idx - 1));
  }
  return projectPlan({
    startYear: START_YEAR,
    startAmount: 19185000,      // USD investments 128000*90 + EPF/NPS/Gratuity 22L + Gold coins 45L + HDFC 9.65L
    monthlySip: 47500,
    sipIncrease: 0.05,
    firstYearMonths: 12,
    equityReturn: 0.10,
    debtReturn: 0.06,
    glide: idx => glideRetirement(START_YEAR + idx - 1, retireYear),
    withdrawals,
    horizonIdx,
    contribEndIdx: yearsToRetire,
  });
}

function runHomeINR() {
  const targetIdx = 10;
  const withdrawals = new Map<number, number>();
  withdrawals.set(targetIdx, 25000000 * Math.pow(1.06, targetIdx));
  return projectPlan({
    startYear: START_YEAR,
    startAmount: 0,
    monthlySip: 205000,
    sipIncrease: 0.05,
    firstYearMonths: 12,
    equityReturn: 0.10,
    debtReturn: 0.06,
    glide: idx => glideINR(idx, targetIdx, targetIdx),
    withdrawals,
    horizonIdx: targetIdx,
    contribEndIdx: targetIdx,
  });
}

function runTotalAssets(): number {
  const inr = 4560000 + 379000 + 1025000 + 800000 + 965000 + 3000000; // ₹1,07,29,000
  const usd = 56284 + 14382 + 50577 + 7000;                            // $1,28,243
  return inr + usd * FX;
}

export function runValidation(): ValidationResult[] {
  const child = runChildrenINR();
  const ret = runRetirementINR();
  const home = runHomeINR();
  const T = 0.01;

  const mk = (name: string, expected: number, actual: number, source: string): ValidationResult => ({
    name, expected, actual: Math.round(actual), tolerance: T,
    pass: Math.abs(actual - expected) / expected <= T,
    source,
  });

  return [
    mk('Total Financial Assets (converted to INR)', 22270870, runTotalAssets(), "Assets sheet: INR total ₹1,07,29,000 + USD $1,28,243 × ₹90"),
    mk('Children INR — Year 1 Closing', 4130000, child[0].closing, "Children INR sheet, cell F16 (₹30L start, ₹90K/mo × 10 months, 9.2% blended)"),
    mk('Children INR — Year 2 Closing', 5643960, child[1].closing, 'Children INR sheet, cell F17 (SIP stepped up 5% to ₹94,500)'),
    mk('Retirement INR — Year 1 Closing', 21520020, ret[0].closing, 'Retirement INR sheet, cell F15 (₹1,91,85,000 start, ₹47,500/mo)'),
    mk('Retirement INR — Year 2 Closing', 24098362, ret[1].closing, 'Retirement INR sheet, cell F16'),
    mk('Home INR — Year 1 Closing', 2460000, home[0].closing, 'Home INR sheet, cell F15 (₹2,05,000/mo × 12, ₹0 start)'),
    mk('Home INR — Year 2 Closing', 5269320, home[1].closing, 'Home INR sheet, cell F16 (₹2,15,250/mo after 5% step-up)'),
  ];
}
