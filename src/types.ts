export interface UserProfile {
  name: string;
  age: number;
  spouseAge?: number;
  children: Child[];
  retirementAge: number;
  spouseRetirementAge?: number;
  language: Language;
  currency: string;
}

export interface Child {
  id: string;
  name: string;
  age: number;
}

export interface IncomeSource {
  id: string;
  type: IncomeType;
  amount: number;
  frequency: 'monthly' | 'annual';
  description?: string;
}

export type IncomeType = 
  | 'salary' | 'spouse_salary' | 'business' | 'rental' 
  | 'pension' | 'bonus' | 'other';

export interface ExpenseCategory {
  id: string;
  name: string;
  amount: number;
  type: ExpenseType;
  isCustom?: boolean;
}

export type ExpenseType = 
  | 'housing' | 'groceries' | 'food' | 'utilities' | 'transport' 
  | 'education' | 'medical' | 'insurance' | 'travel' | 'emi' 
  | 'lifestyle' | 'other';

export interface Asset {
  id: string;
  type: AssetType;
  subtype: string;
  name: string;
  value: number;
  description?: string;
}

export type AssetType = 'real_estate' | 'financial' | 'gold' | 'other';

export interface Liability {
  id: string;
  type: LiabilityType;
  name: string;
  outstandingBalance: number;
  emi: number;
  interestRate: number;
  remainingTenure: number;
  description?: string;
}

export type LiabilityType = 
  | 'home_loan' | 'land_loan' | 'car_loan' | 'personal_loan' 
  | 'credit_card' | 'other';

export interface Insurance {
  id: string;
  type: InsuranceType;
  name: string;
  coverage: number;
  premium?: number;
  description?: string;
}

export type InsuranceType = 
  | 'health' | 'term' | 'personal_accident' | 'other';

export interface FinancialGoal {
  id: string;
  name: string;
  type: GoalType;
  targetYear: number;
  currentCost: number;
  currentAllocation: number;
  expectedReturn: number;
  inflation: number;
  description?: string;
  childId?: string;
}

export type GoalType = 
  | 'child_education' | 'foreign_education' | 'marriage' 
  | 'retirement' | 'house' | 'car' | 'travel' 
  | 'emergency_fund' | 'financial_independence' | 'custom';

export interface PortfolioAllocation {
  equity: number;
  debt: number;
  gold: number;
  cash: number;
  realEstate: number;
  other: number;
}

export interface TargetAllocation {
  equity: number;
  debt: number;
  gold: number;
  cash: number;
  realEstate: number;
  other: number;
}

export interface RiskProfile {
  capacity: number;
  tolerance: number;
  required: number;
  horizon: number;
  liquidity: number;
  dependents: number;
  reactionToLoss: number;
  overall: RiskLevel;
}

export type RiskLevel = 'conservative' | 'moderate' | 'balanced' | 'growth' | 'aggressive';

export interface SecuritySettings {
  pinHash: string;
  biometricEnabled: boolean;
  autoLock: AutoLockTime;
  recoveryKey: string;
}

export type AutoLockTime = 'immediate' | '1min' | '5min' | '15min' | 'never';

export interface AppSettings {
  language: Language;
  theme: 'light' | 'dark';
  demoMode: boolean;
}

export type Language = 'en' | 'ta' | 'ml' | 'te' | 'kn' | 'hi' | 'mr';

export interface FinancialData {
  profile: UserProfile;
  incomes: IncomeSource[];
  expenses: ExpenseCategory[];
  assets: Asset[];
  liabilities: Liability[];
  insurances: Insurance[];
  goals: FinancialGoal[];
  portfolio: PortfolioAllocation;
  targetAllocation: TargetAllocation;
  riskProfile: RiskProfile;
  settings: AppSettings;
  security: SecuritySettings;
  onboardingComplete: boolean;
  lastReviewDate?: string;
}

export interface FIREInputs {
  currentAge: number;
  retirementAge: number;
  monthlyExpenses: number;
  inflation: number;
  currentInvestments: number;
  monthlyInvestments: number;
  preRetirementReturn: number;
  postRetirementReturn: number;
  retirementIncome: number;
  rentalIncome: number;
  pension: number;
  withdrawalRate: number;
}

export interface FIREResult {
  annualRetirementExpenses: number;
  fireNumber: number;
  projectedCorpus: number;
  corpusGap: number;
  fireProgress: number;
  estimatedFireAge: number;
  yearsToFire: number;
}

export interface GoalCalculation {
  futureCost: number;
  requiredCorpus: number;
  projectedCorpus: number;
  fundingGap: number;
  requiredMonthlySIP: number;
  progress: number;
  status: 'green' | 'yellow' | 'red';
}

export interface NetWorth {
  totalAssets: number;
  financialAssets: number;
  realEstateAssets: number;
  totalLiabilities: number;
  netWorth: number;
  financialNetWorth: number;
}

export interface CashFlow {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyEMIs: number;
  monthlySurplus: number;
  annualSavings: number;
  savingsRate: number;
}

export interface FinancialHealth {
  score: number;
  emergencyFund: number;
  insurance: number;
  debt: number;
  cashFlow: number;
  goalFunding: number;
  retirement: number;
  diversification: number;
}

export interface InsuranceGap {
  lifeInsuranceAvailable: number;
  lifeInsuranceRequired: number;
  lifeGap: number;
  healthCoverage: number;
  healthGap: number;
}

export interface EmergencyFundAnalysis {
  currentFund: number;
  recommendedFund: number;
  shortfall: number;
  monthsOfExpenses: number;
}

export interface DemoData {
  profile: UserProfile;
  incomes: IncomeSource[];
  expenses: ExpenseCategory[];
  assets: Asset[];
  liabilities: Liability[];
  insurances: Insurance[];
  goals: FinancialGoal[];
}
