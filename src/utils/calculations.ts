import type { 
  FinancialGoal, IncomeSource, ExpenseCategory, Asset, Liability, 
  Insurance, PortfolioAllocation, TargetAllocation, RiskProfile,
  FIREInputs, FIREResult, GoalCalculation, NetWorth, CashFlow,
  FinancialHealth, InsuranceGap, EmergencyFundAnalysis, UserProfile,
  RiskLevel, FinancialData
} from '../types';

// ============================================
// INDIAN NUMBER FORMATTING
// ============================================

export function formatIndianCurrency(value: number): string {
  if (value === 0) return '₹0';
  if (value < 0) return '-₹' + formatIndianNumber(-value);
  
  const absValue = Math.abs(value);
  
  if (absValue >= 10000000) {
    return '₹' + (absValue / 10000000).toFixed(2) + ' Cr';
  } else if (absValue >= 100000) {
    return '₹' + (absValue / 100000).toFixed(2) + ' L';
  } else if (absValue >= 1000) {
    return '₹' + formatIndianNumber(absValue);
  }
  return '₹' + absValue.toLocaleString('en-IN');
}

export function formatIndianNumber(value: number): string {
  if (value === 0) return '0';
  const val = Math.round(value);
  const str = val.toString();
  
  if (str.length <= 3) return str;
  
  let lastThree = str.substring(str.length - 3);
  let otherNumbers = str.substring(0, str.length - 3);
  
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  
  const result = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return result;
}

export function formatIndianCompact(value: number): string {
  if (value === 0) return '₹0';
  if (value >= 10000000) {
    return '₹' + (value / 10000000).toFixed(2) + ' Cr';
  } else if (value >= 100000) {
    return '₹' + (value / 100000).toFixed(2) + ' L';
  } else if (value >= 1000) {
    return '₹' + (value / 1000).toFixed(1) + ' K';
  }
  return '₹' + value.toFixed(0);
}

// ============================================
// FUTURE VALUE & PRESENT VALUE
// ============================================

export function futureValue(pv: number, rate: number, years: number): number {
  if (years <= 0) return pv;
  if (rate === 0) return pv;
  return pv * Math.pow(1 + rate, years);
}

export function presentValue(fv: number, rate: number, years: number): number {
  if (years <= 0) return fv;
  if (rate === 0) return fv;
  return fv / Math.pow(1 + rate, years);
}

// ============================================
// SIP CALCULATIONS
// ============================================

export function sipFutureValue(
  monthlyInvestment: number, 
  annualReturn: number, 
  years: number
): number {
  if (years <= 0) return 0;
  if (monthlyInvestment <= 0) return 0;
  
  const monthlyRate = annualReturn / 12;
  const months = years * 12;
  
  if (monthlyRate === 0) return monthlyInvestment * months;
  
  return monthlyInvestment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
}

export function requiredSIP(
  targetAmount: number, 
  annualReturn: number, 
  years: number
): number {
  if (years <= 0 || targetAmount <= 0) return 0;
  
  const monthlyRate = annualReturn / 12;
  const months = years * 12;
  
  if (monthlyRate === 0) return targetAmount / months;
  
  return targetAmount / (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
}

export function lumpSumGrowth(
  principal: number, 
  annualReturn: number, 
  years: number
): number {
  if (years <= 0) return principal;
  return principal * Math.pow(1 + annualReturn, years);
}

// ============================================
// LOAN CALCULATIONS
// ============================================

export function calculateEMI(
  principal: number, 
  annualRate: number, 
  tenureYears: number
): number {
  if (principal <= 0) return 0;
  if (tenureYears <= 0) return principal;
  
  const monthlyRate = annualRate / 12;
  const months = tenureYears * 12;
  
  if (monthlyRate === 0) return principal / months;
  
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
    (Math.pow(1 + monthlyRate, months) - 1);
}

export function loanAmortization(
  principal: number, 
  annualRate: number, 
  tenureYears: number
): Array<{ month: number; emi: number; principal: number; interest: number; balance: number }> {
  const schedule: Array<{ month: number; emi: number; principal: number; interest: number; balance: number }> = [];
  
  if (principal <= 0 || tenureYears <= 0) return schedule;
  
  const emi = calculateEMI(principal, annualRate, tenureYears);
  const monthlyRate = annualRate / 12;
  let balance = principal;
  const months = tenureYears * 12;
  
  for (let i = 1; i <= months; i++) {
    if (balance <= 0) break;
    
    const interest = balance * monthlyRate;
    const principalPaid = Math.min(emi - interest, balance);
    balance -= principalPaid;
    
    schedule.push({
      month: i,
      emi: Math.round(emi),
      principal: Math.round(principalPaid),
      interest: Math.round(interest),
      balance: Math.round(Math.max(0, balance))
    });
  }
  
  return schedule;
}

// ============================================
// NET WORTH
// ============================================

export function calculateNetWorth(
  assets: Asset[], 
  liabilities: Liability[]
): NetWorth {
  const financialAssets = assets
    .filter(a => a.type === 'financial')
    .reduce((sum, a) => sum + a.value, 0);
  
  const realEstateAssets = assets
    .filter(a => a.type === 'real_estate')
    .reduce((sum, a) => sum + a.value, 0);
  
  const otherAssets = assets
    .filter(a => a.type === 'gold' || a.type === 'other')
    .reduce((sum, a) => sum + a.value, 0);
  
  const totalAssets = financialAssets + realEstateAssets + otherAssets;
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.outstandingBalance, 0);
  
  return {
    totalAssets,
    financialAssets,
    realEstateAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    financialNetWorth: financialAssets - totalLiabilities
  };
}

// ============================================
// CASH FLOW
// ============================================

export function calculateCashFlow(
  incomes: IncomeSource[], 
  expenses: ExpenseCategory[], 
  liabilities: Liability[]
): CashFlow {
  const monthlyIncome = incomes
    .filter(i => i.frequency === 'monthly')
    .reduce((sum, i) => sum + i.amount, 0) +
    incomes
    .filter(i => i.frequency === 'annual')
    .reduce((sum, i) => sum + i.amount / 12, 0);
  
  const monthlyExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyEMIs = liabilities.reduce((sum, l) => sum + l.emi, 0);
  
  // Monthly surplus = Income - Expenses (EMI shown separately, not deducted from surplus)
  const monthlySurplus = monthlyIncome - monthlyExpenses;
  const monthlyTotalOutflows = monthlyExpenses + monthlyEMIs;
  const annualSavings = monthlySurplus * 12;
  const savingsRate = monthlyIncome > 0 ? (monthlySurplus / monthlyIncome) * 100 : 0;
  
  return {
    monthlyIncome: Math.round(monthlyIncome),
    monthlyExpenses: Math.round(monthlyExpenses),
    monthlyEMIs: Math.round(monthlyEMIs),
    monthlySurplus: Math.round(monthlySurplus),
    annualSavings: Math.round(annualSavings),
    savingsRate: Math.round(savingsRate * 10) / 10
  };
}

// ============================================
// GOAL CALCULATIONS
// ============================================

export function calculateGoal(
  goal: FinancialGoal, 
  _currentYear: number = new Date().getFullYear()
): GoalCalculation {
  const years = Math.max(0, goal.targetYear - _currentYear);
  
  // Future cost of the goal
  const futureCost = futureValue(goal.currentCost, goal.inflation, years);
  
  // Projected corpus from current allocation
  const projectedCorpus = lumpSumGrowth(
    goal.currentAllocation, 
    goal.expectedReturn, 
    years
  );
  
  // Funding gap
  const fundingGap = Math.max(0, futureCost - projectedCorpus);
  
  // Required monthly SIP to close gap
  const requiredMonthlySIP = requiredSIP(fundingGap, goal.expectedReturn, years);
  
  // Progress percentage
  const progress = futureCost > 0 ? Math.min(100, (projectedCorpus / futureCost) * 100) : 0;
  
  // Status
  let status: 'green' | 'yellow' | 'red' = 'green';
  if (progress < 50) status = 'red';
  else if (progress < 80) status = 'yellow';
  
  return {
    futureCost: Math.round(futureCost),
    requiredCorpus: Math.round(futureCost),
    projectedCorpus: Math.round(projectedCorpus),
    fundingGap: Math.round(fundingGap),
    requiredMonthlySIP: Math.round(requiredMonthlySIP),
    progress: Math.round(progress * 10) / 10,
    status
  };
}

// ============================================
// FIRE CALCULATIONS
// ============================================

export function calculateFIRE(inputs: FIREInputs): FIREResult {
  const yearsToRetirement = Math.max(0, inputs.retirementAge - inputs.currentAge);
  
  // Inflation-adjusted annual retirement expenses
  const annualRetirementExpenses = futureValue(
    inputs.monthlyExpenses * 12, 
    inputs.inflation, 
    yearsToRetirement
  );
  
  // FIRE number based on withdrawal rate
  const fireNumber = annualRetirementExpenses / inputs.withdrawalRate;
  
  // Projected retirement corpus
  const projectedLumpSum = lumpSumGrowth(
    inputs.currentInvestments, 
    inputs.preRetirementReturn, 
    yearsToRetirement
  );
  
  const projectedSIP = sipFutureValue(
    inputs.monthlyInvestments, 
    inputs.preRetirementReturn, 
    yearsToRetirement
  );
  
  const projectedCorpus = projectedLumpSum + projectedSIP;
  
  // Corpus gap
  const corpusGap = Math.max(0, fireNumber - projectedCorpus);
  
  // FIRE progress
  const fireProgress = fireNumber > 0 ? Math.min(100, (projectedCorpus / fireNumber) * 100) : 0;
  
  // Estimated FIRE age (when corpus reaches fireNumber)
  let estimatedFireAge = inputs.retirementAge;
  let yearsToFire = yearsToRetirement;
  
  if (projectedCorpus >= fireNumber) {
    // Already at FIRE
    estimatedFireAge = inputs.currentAge;
    yearsToFire = 0;
  } else if (inputs.monthlyInvestments > 0) {
    // Find when corpus reaches fireNumber
    for (let y = 1; y <= 50; y++) {
      const testCorpus = lumpSumGrowth(inputs.currentInvestments, inputs.preRetirementReturn, y) +
        sipFutureValue(inputs.monthlyInvestments, inputs.preRetirementReturn, y);
      
      if (testCorpus >= fireNumber) {
        estimatedFireAge = inputs.currentAge + y;
        yearsToFire = y;
        break;
      }
    }
  }
  
  // Current FIRE number (simple 4% rule, no inflation)
  const currentFireNumber = inputs.monthlyExpenses * 12 / inputs.withdrawalRate;
  const currentFireProgress = currentFireNumber > 0 ? Math.min(100, (inputs.currentInvestments / currentFireNumber) * 100) : 0;
  
  return {
    annualRetirementExpenses: Math.round(annualRetirementExpenses),
    fireNumber: Math.round(fireNumber),
    currentFireNumber: Math.round(currentFireNumber),
    projectedCorpus: Math.round(projectedCorpus),
    corpusGap: Math.round(corpusGap),
    fireProgress: Math.round(fireProgress * 10) / 10,
    currentFireProgress: Math.round(currentFireProgress * 10) / 10,
    estimatedFireAge,
    yearsToFire
  };
}

// ============================================
// RETIREMENT CALCULATIONS
// ============================================

export function calculateRetirementCorpus(
  monthlyExpenses: number,
  inflation: number,
  yearsToRetirement: number,
  postRetirementReturn: number,
  withdrawalRate: number,
  _retirementIncome: number = 0,
  _rentalIncome: number = 0,
  _pension: number = 0
) {
  const annualExpenses = monthlyExpenses * 12;
  const inflationAdjustedExpenses = futureValue(annualExpenses, inflation, yearsToRetirement);
  const netAnnualExpenses = Math.max(0, inflationAdjustedExpenses - _retirementIncome - _rentalIncome - _pension);
  const requiredCorpus = netAnnualExpenses / withdrawalRate;
  
  return {
    currentAnnualExpenses: annualExpenses,
    inflationAdjustedExpenses: Math.round(inflationAdjustedExpenses),
    requiredCorpus: Math.round(requiredCorpus),
    netAnnualExpenses: Math.round(netAnnualExpenses)
  };
}

// ============================================
// EMERGENCY FUND
// ============================================

export function calculateEmergencyFund(
  expenses: ExpenseCategory[], 
  liabilities: Liability[], 
  incomes: IncomeSource[],
  profile: UserProfile
): EmergencyFundAnalysis {
  const essentialExpenses = expenses
    .filter(e => ['housing', 'groceries', 'utilities', 'medical', 'insurance', 'emi', 'education'].includes(e.type))
    .reduce((sum, e) => sum + e.amount, 0);
  
  const monthlyEMIs = liabilities.reduce((sum, l) => sum + l.emi, 0);
  const totalEssential = essentialExpenses + monthlyEMIs;
  
  // Determine recommended months based on dependents and earners
  const earningMembers = incomes.filter(i => i.type === 'salary' || i.type === 'spouse_salary' || i.type === 'business').length;
  const dependents = profile.children.length + (profile.spouseAge ? 1 : 0);
  
  let recommendedMonths = 6;
  if (earningMembers === 1 && dependents > 0) recommendedMonths = 12;
  else if (earningMembers === 1) recommendedMonths = 9;
  else if (dependents > 2) recommendedMonths = 9;
  
  const recommendedFund = totalEssential * recommendedMonths;
  
  // Current emergency fund (assets marked as cash/savings)
  // This is simplified - in real app would look for specific asset types
  const currentFund = 0; // Will be calculated from actual assets
  
  return {
    currentFund: Math.round(currentFund),
    recommendedFund: Math.round(recommendedFund),
    shortfall: Math.round(Math.max(0, recommendedFund - currentFund)),
    monthsOfExpenses: totalEssential > 0 ? Math.round((currentFund / totalEssential) * 10) / 10 : 0
  };
}

// ============================================
// INSURANCE GAP
// ============================================

export function calculateInsuranceGap(
  insurances: Insurance[], 
  incomes: IncomeSource[], 
  liabilities: Liability[],
  expenses: ExpenseCategory[]
): InsuranceGap {
  const lifeInsuranceAvailable = insurances
    .filter(i => i.type === 'term')
    .reduce((sum, i) => sum + i.coverage, 0);
  
  // Rule of thumb: 10-15x annual income + outstanding liabilities
  const annualIncome = incomes.reduce((sum, i) => {
    const monthly = i.frequency === 'monthly' ? i.amount : i.amount / 12;
    return sum + monthly * 12;
  }, 0);
  
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.outstandingBalance, 0);
  const lifeInsuranceRequired = annualIncome * 12 + totalLiabilities;
  
  const healthCoverage = insurances
    .filter(i => i.type === 'health')
    .reduce((sum, i) => sum + i.coverage, 0);
  
  // Recommended health coverage: 5-10 lakhs per person
  const familySize = 1 + (incomes.some(i => i.type === 'spouse_salary') ? 1 : 0); // Simplified
  const recommendedHealth = familySize * 500000;
  
  return {
    lifeInsuranceAvailable: Math.round(lifeInsuranceAvailable),
    lifeInsuranceRequired: Math.round(lifeInsuranceRequired),
    lifeGap: Math.round(Math.max(0, lifeInsuranceRequired - lifeInsuranceAvailable)),
    healthCoverage: Math.round(healthCoverage),
    healthGap: Math.round(Math.max(0, recommendedHealth - healthCoverage))
  };
}

// ============================================
// FINANCIAL HEALTH SCORE
// ============================================

export function calculateFinancialHealth(
  assets: Asset[],
  liabilities: Liability[],
  incomes: IncomeSource[],
  expenses: ExpenseCategory[],
  insurances: Insurance[],
  goals: FinancialGoal[],
  portfolio: PortfolioAllocation,
  profile: UserProfile
): FinancialHealth {
  const cashFlow = calculateCashFlow(incomes, expenses, liabilities);
  const netWorth = calculateNetWorth(assets, liabilities);
  const emergency = calculateEmergencyFund(expenses, liabilities, incomes, profile);
  const insuranceGap = calculateInsuranceGap(insurances, incomes, liabilities, expenses);
  
  // Emergency fund score (0-15)
  let emergencyScore = 0;
  if (emergency.recommendedFund > 0) {
    const ratio = emergency.currentFund / emergency.recommendedFund;
    emergencyScore = Math.min(15, ratio * 15);
  }
  
  // Insurance score (0-15)
  let insuranceScore = 0;
  if (insuranceGap.lifeInsuranceRequired > 0) {
    const lifeRatio = insuranceGap.lifeInsuranceAvailable / insuranceGap.lifeInsuranceRequired;
    insuranceScore = Math.min(15, lifeRatio * 15);
  }
  
  // Debt score (0-15) - lower debt-to-income is better
  let debtScore = 15;
  const totalEMIs = liabilities.reduce((sum, l) => sum + l.emi, 0);
  const debtToIncome = cashFlow.monthlyIncome > 0 ? totalEMIs / cashFlow.monthlyIncome : 0;
  if (debtToIncome > 0.5) debtScore = 5;
  else if (debtToIncome > 0.4) debtScore = 8;
  else if (debtToIncome > 0.3) debtScore = 11;
  else if (debtToIncome > 0.2) debtScore = 13;
  
  // Cash flow score (0-15)
  let cashFlowScore = 0;
  if (cashFlow.savingsRate >= 30) cashFlowScore = 15;
  else if (cashFlow.savingsRate >= 25) cashFlowScore = 13;
  else if (cashFlow.savingsRate >= 20) cashFlowScore = 11;
  else if (cashFlow.savingsRate >= 15) cashFlowScore = 9;
  else if (cashFlow.savingsRate >= 10) cashFlowScore = 7;
  else if (cashFlow.savingsRate >= 5) cashFlowScore = 5;
  else cashFlowScore = Math.max(0, cashFlow.savingsRate * 1);
  
  // Goal funding score (0-15)
  let goalScore = 0;
  if (goals.length > 0) {
    const goalProgress = goals.map(g => calculateGoal(g, new Date().getFullYear()));
    const avgProgress = goalProgress.reduce((sum, g) => sum + g.progress, 0) / goalProgress.length;
    goalScore = Math.min(15, (avgProgress / 100) * 15);
  }
  
  // Retirement score (0-15)
  let retirementScore = 0;
  const retirementGoal = goals.find(g => g.type === 'retirement');
  if (retirementGoal) {
    const retirementCalc = calculateGoal(retirementGoal, new Date().getFullYear());
    retirementScore = Math.min(15, (retirementCalc.progress / 100) * 15);
  }
  
  // Diversification score (0-10)
  let diversificationScore = 0;
  const totalPortfolio = portfolio.equity + portfolio.debt + portfolio.gold + portfolio.cash + portfolio.realEstate + portfolio.other;
  if (totalPortfolio > 0) {
    const hasEquity = portfolio.equity / totalPortfolio > 0.1;
    const hasDebt = portfolio.debt / totalPortfolio > 0.1;
    const hasGold = portfolio.gold / totalPortfolio > 0.05;
    const hasCash = portfolio.cash / totalPortfolio > 0.05;
    diversificationScore = (hasEquity ? 3 : 0) + (hasDebt ? 3 : 0) + (hasGold ? 2 : 0) + (hasCash ? 2 : 0);
  }
  
  const totalScore = Math.round(
    emergencyScore + insuranceScore + debtScore + cashFlowScore + 
    goalScore + retirementScore + diversificationScore
  );
  
  return {
    score: Math.min(100, totalScore),
    emergencyFund: Math.round(emergencyScore),
    insurance: Math.round(insuranceScore),
    debt: Math.round(debtScore),
    cashFlow: Math.round(cashFlowScore),
    goalFunding: Math.round(goalScore),
    retirement: Math.round(retirementScore),
    diversification: Math.round(diversificationScore)
  };
}

// ============================================
// PORTFOLIO ANALYSIS
// ============================================

export function analyzePortfolio(
  portfolio: PortfolioAllocation, 
  target: TargetAllocation
) {
  const total = portfolio.equity + portfolio.debt + portfolio.gold + portfolio.cash + portfolio.realEstate + portfolio.other;
  
  if (total === 0) {
    return {
      current: { equity: 0, debt: 0, gold: 0, cash: 0, realEstate: 0, other: 0 },
      deviation: { equity: 0, debt: 0, gold: 0, cash: 0, realEstate: 0, other: 0 },
      significantDeviation: false
    };
  }
  
  const current = {
    equity: (portfolio.equity / total) * 100,
    debt: (portfolio.debt / total) * 100,
    gold: (portfolio.gold / total) * 100,
    cash: (portfolio.cash / total) * 100,
    realEstate: (portfolio.realEstate / total) * 100,
    other: (portfolio.other / total) * 100
  };
  
  const deviation = {
    equity: Math.abs(current.equity - target.equity),
    debt: Math.abs(current.debt - target.debt),
    gold: Math.abs(current.gold - target.gold),
    cash: Math.abs(current.cash - target.cash),
    realEstate: Math.abs(current.realEstate - target.realEstate),
    other: Math.abs(current.other - target.other)
  };
  
  const significantDeviation = Object.values(deviation).some(d => d > 10);
  
  return { current, deviation, significantDeviation };
}

// ============================================
// RISK PROFILE
// ============================================

export function calculateRiskProfile(answers: Partial<RiskProfile>): RiskProfile {
  const capacity = answers.capacity || 5;
  const tolerance = answers.tolerance || 5;
  const required = answers.required || 5;
  const horizon = answers.horizon || 5;
  const liquidity = answers.liquidity || 5;
  const dependents = answers.dependents || 5;
  const reactionToLoss = answers.reactionToLoss || 5;
  
  const avg = (capacity + tolerance + required + horizon + liquidity + dependents + reactionToLoss) / 7;
  
  let overall: RiskLevel = 'balanced';
  if (avg <= 2.5) overall = 'conservative';
  else if (avg <= 4) overall = 'moderate';
  else if (avg <= 5.5) overall = 'balanced';
  else if (avg <= 7) overall = 'growth';
  else overall = 'aggressive';
  
  return {
    capacity,
    tolerance,
    required,
    horizon,
    liquidity,
    dependents,
    reactionToLoss,
    overall
  };
}

// ============================================
// CHILD EDUCATION
// ============================================

export function calculateChildEducation(
  childAge: number,
  currentCost: number,
  targetYear: number,
  educationInflation: number,
  currentInvestments: number,
  expectedReturn: number,
  currentYear: number = new Date().getFullYear()
) {
  const years = Math.max(0, targetYear - currentYear);
  const yearsUntilEducation = Math.max(0, targetYear - currentYear);
  
  const futureCost = futureValue(currentCost, educationInflation, yearsUntilEducation);
  const projectedCorpus = lumpSumGrowth(currentInvestments, expectedReturn, yearsUntilEducation);
  const fundingGap = Math.max(0, futureCost - projectedCorpus);
  const requiredMonthlySIP = requiredSIP(fundingGap, expectedReturn, yearsUntilEducation);
  
  return {
    futureCost: Math.round(futureCost),
    projectedCorpus: Math.round(projectedCorpus),
    fundingGap: Math.round(fundingGap),
    requiredMonthlySIP: Math.round(requiredMonthlySIP),
    yearsUntilEducation
  };
}

// ============================================
// WHAT-IF SIMULATOR
// ============================================

export function simulateFIRE(
  baseInputs: FIREInputs,
  changes: Partial<FIREInputs>
): FIREResult {
  const inputs = { ...baseInputs, ...changes };
  return calculateFIRE(inputs);
}

// ============================================
// VALIDATION
// ============================================

export function validateFinancialData(data: Partial<FinancialData>): string[] {
  const errors: string[] = [];
  
  if (data.profile) {
    if (data.profile.age < 0 || data.profile.age > 120) {
      errors.push('Age must be between 0 and 120');
    }
    if (data.profile.retirementAge && data.profile.retirementAge < data.profile.age) {
      errors.push('Retirement age cannot be less than current age');
    }
  }
  
  if (data.goals) {
    const currentYear = new Date().getFullYear();
    for (const goal of data.goals) {
      if (goal.targetYear < currentYear) {
        errors.push(`Goal "${goal.name}" target year cannot be in the past`);
      }
      if (goal.currentCost < 0) {
        errors.push(`Goal "${goal.name}" cost cannot be negative`);
      }
    }
  }
  
  if (data.liabilities) {
    for (const loan of data.liabilities) {
      if (loan.outstandingBalance < 0) {
        errors.push(`Loan "${loan.name}" balance cannot be negative`);
      }
      if (loan.emi < 0) {
        errors.push(`Loan "${loan.name}" EMI cannot be negative`);
      }
    }
  }
  
  return errors;
}
