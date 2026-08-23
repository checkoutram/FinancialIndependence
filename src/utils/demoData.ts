import type { FinancialData, DemoData } from '../types';

export const demoData: DemoData = {
  profile: {
    name: 'Rahul Sharma',
    age: 39,
    spouseAge: 39,
    children: [
      { id: 'c1', name: 'Child 1', age: 11 },
      { id: 'c2', name: 'Child 2', age: 2 },
    ],
    retirementAge: 60,
    spouseRetirementAge: 60,
    language: 'en',
    currency: 'INR',
  },
  incomes: [
    { id: 'i1', type: 'salary', amount: 350000, frequency: 'monthly', description: 'Primary salary' },
    { id: 'i2', type: 'rental', amount: 25000, frequency: 'monthly', description: 'Rental income' },
    { id: 'i3', type: 'bonus', amount: 500000, frequency: 'annual', description: 'Annual bonus' },
  ],
  expenses: [
    { id: 'e1', name: 'Housing', amount: 45000, type: 'housing' },
    { id: 'e2', name: 'Groceries', amount: 25000, type: 'groceries' },
    { id: 'e3', name: 'Utilities', amount: 8000, type: 'utilities' },
    { id: 'e4', name: 'Transport', amount: 15000, type: 'transport' },
    { id: 'e5', name: 'Education', amount: 20000, type: 'education' },
    { id: 'e6', name: 'Medical', amount: 5000, type: 'medical' },
    { id: 'e7', name: 'Insurance', amount: 12000, type: 'insurance' },
    { id: 'e8', name: 'Travel', amount: 10000, type: 'travel' },
    { id: 'e9', name: 'Lifestyle', amount: 30000, type: 'lifestyle' },
    { id: 'e10', name: 'Other', amount: 5000, type: 'other' },
  ],
  assets: [
    { id: 'a1', type: 'real_estate', subtype: 'primary_home', name: 'Primary Home', value: 5500000 },
    { id: 'a2', type: 'real_estate', subtype: 'land', name: 'Land', value: 12000000 },
    { id: 'a3', type: 'financial', subtype: 'savings', name: 'Savings Account', value: 500000 },
    { id: 'a4', type: 'financial', subtype: 'fd', name: 'Fixed Deposits', value: 3000000 },
    { id: 'a5', type: 'financial', subtype: 'mutual_funds', name: 'Mutual Funds', value: 2500000 },
    { id: 'a6', type: 'financial', subtype: 'stocks', name: 'Stocks', value: 1500000 },
    { id: 'a7', type: 'financial', subtype: 'epf', name: 'EPF', value: 2000000 },
    { id: 'a8', type: 'financial', subtype: 'ppf', name: 'PPF', value: 1500000 },
    { id: 'a9', type: 'gold', subtype: 'gold', name: 'Gold (60 sovereigns)', value: 1800000 },
  ],
  liabilities: [
    { id: 'l1', type: 'home_loan', name: 'Home Loan', outstandingBalance: 2500000, emi: 35000, interestRate: 0.085, remainingTenure: 10 },
    { id: 'l2', type: 'land_loan', name: 'Land Loan', outstandingBalance: 5000000, emi: 100000, interestRate: 0.09, remainingTenure: 7 },
    { id: 'l3', type: 'car_loan', name: 'Car Loan', outstandingBalance: 800000, emi: 18000, interestRate: 0.09, remainingTenure: 4 },
  ],
  insurances: [
    { id: 'ins1', type: 'health', name: 'Family Health Insurance', coverage: 1000000, premium: 25000 },
    { id: 'ins2', type: 'term', name: 'Term Insurance', coverage: 5000000, premium: 15000 },
    { id: 'ins3', type: 'personal_accident', name: 'Personal Accident', coverage: 2000000, premium: 3000 },
  ],
  goals: [
    { id: 'g1', name: 'Child 1 Foreign Education', type: 'foreign_education', targetYear: 2032, currentCost: 10000000, currentAllocation: 2000000, expectedReturn: 0.12, inflation: 0.08, childId: 'c1' },
    { id: 'g2', name: 'Child 2 Education', type: 'child_education', targetYear: 2040, currentCost: 5000000, currentAllocation: 500000, expectedReturn: 0.12, inflation: 0.08, childId: 'c2' },
    { id: 'g3', name: 'Child 2 Future Support', type: 'custom', targetYear: 2045, currentCost: 15000000, currentAllocation: 1000000, expectedReturn: 0.12, inflation: 0.07 },
    { id: 'g4', name: 'Retirement', type: 'retirement', targetYear: 2046, currentCost: 50000000, currentAllocation: 8000000, expectedReturn: 0.10, inflation: 0.06 },
    { id: 'g5', name: 'Emergency Fund', type: 'emergency_fund', targetYear: 2026, currentCost: 1500000, currentAllocation: 500000, expectedReturn: 0.06, inflation: 0.05 },
  ],
};

export function createDemoFinancialData(): FinancialData {
  return {
    ...demoData,
    portfolio: { equity: 4000000, debt: 5000000, gold: 1800000, cash: 500000, realEstate: 17500000, other: 0 },
    targetAllocation: { equity: 40, debt: 40, gold: 10, cash: 5, realEstate: 5, other: 0 },
    riskProfile: { capacity: 6, tolerance: 6, required: 5, horizon: 7, liquidity: 4, dependents: 5, reactionToLoss: 5, overall: 'balanced' as const },
    settings: { language: 'en', theme: 'light', demoMode: true },
    security: { pinHash: '', biometricEnabled: false, autoLock: '5min', recoveryKey: '' },
    onboardingComplete: true,
  };
}
