import { useState } from 'react';
import { useApp } from '../utils/store';
import { t } from '../utils/i18n';
import { User, Briefcase, Home, CreditCard, Shield, Target, CheckCircle, ArrowRight, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import type { FinancialData, IncomeSource, ExpenseCategory, Asset, Liability, Insurance, FinancialGoal } from '../types';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const steps = [
  { title: 'personal', icon: User, description: 'personalDesc' },
  { title: 'income', icon: Briefcase, description: 'incomeDesc' },
  { title: 'assets', icon: Home, description: 'assetsDesc' },
  { title: 'liabilities', icon: CreditCard, description: 'liabilitiesDesc' },
  { title: 'insurance', icon: Shield, description: 'insuranceDesc' },
  { title: 'goals', icon: Target, description: 'goalsDesc' },
  { title: 'review', icon: CheckCircle, description: 'reviewDesc' },
];

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const { data, updateData } = useApp();

  // Step 1: Personal
  const [profile, setProfile] = useState({
    name: data?.profile?.name || '',
    age: data?.profile?.age || 30,
    spouseAge: data?.profile?.spouseAge || '',
    retirementAge: data?.profile?.retirementAge || 60,
  });

  // Step 2: Income & Expenses
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlyExpenses, setMonthlyExpenses] = useState('');

  // Step 3: Assets
  const [assets, setAssets] = useState({
    home: '',
    land: '',
    investments: '',
    gold: '',
  });

  // Step 4: Liabilities
  const [liabilities, setLiabilities] = useState({
    loanAmount: '',
    emi: '',
    interestRate: '8',
    tenure: '',
  });

  // Step 5: Insurance
  const [insurance, setInsurance] = useState({
    life: '',
    health: '',
  });

  // Step 6: Goals
  const [goals, setGoals] = useState<Array<{name: string; target: string; years: string}>>([
    { name: '', target: '', years: '' },
  ]);

  const addGoal = () => {
    if (goals.length < 6) setGoals([...goals, { name: '', target: '', years: '' }]);
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const updateGoal = (index: number, field: string, value: string) => {
    const updated = [...goals];
    updated[index] = { ...updated[index], [field]: value };
    setGoals(updated);
  };

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleComplete = () => {
    // Build proper FinancialData structure
    const newData: Partial<FinancialData> = {
      profile: {
        ...data?.profile,
        name: profile.name,
        age: Number(profile.age) || 30,
        spouseAge: profile.spouseAge ? Number(profile.spouseAge) : undefined,
        retirementAge: Number(profile.retirementAge) || 60,
        children: data?.profile?.children || [],
        language: data?.profile?.language || 'en',
        currency: data?.profile?.currency || 'INR',
      },
      incomes: monthlyIncome ? [{
        id: 'income-1',
        type: 'salary' as const,
        amount: Number(monthlyIncome) || 0,
        frequency: 'monthly' as const,
        description: 'Primary Income',
      }] : [],
      expenses: monthlyExpenses ? [{
        id: 'exp-1',
        name: 'Monthly Expenses',
        amount: Number(monthlyExpenses) || 0,
        type: 'other' as const,
      }] : [],
      assets: [
        ...(assets.home ? [{ id: 'asset-1', type: 'real_estate' as const, subtype: 'home', name: 'Home', value: Number(assets.home) || 0 }] : []),
        ...(assets.land ? [{ id: 'asset-2', type: 'real_estate' as const, subtype: 'land', name: 'Land', value: Number(assets.land) || 0 }] : []),
        ...(assets.investments ? [{ id: 'asset-3', type: 'financial' as const, subtype: 'investments', name: 'Financial Investments', value: Number(assets.investments) || 0 }] : []),
        ...(assets.gold ? [{ id: 'asset-4', type: 'gold' as const, subtype: 'gold', name: 'Gold', value: (Number(assets.gold) || 0) * 5000 }] : []),
      ],
      liabilities: liabilities.loanAmount ? [{
        id: 'liab-1',
        type: 'land_loan' as const,
        name: 'Land Loan',
        outstandingBalance: Number(liabilities.loanAmount) || 0,
        emi: Number(liabilities.emi) || 0,
        interestRate: Number(liabilities.interestRate) || 8,
        remainingTenure: Number(liabilities.tenure) || 0,
      }] : [],
      insurances: [
        ...(insurance.life ? [{ id: 'ins-1', type: 'term' as const, name: 'Life Insurance', coverage: Number(insurance.life) || 0 }] : []),
        ...(insurance.health ? [{ id: 'ins-2', type: 'health' as const, name: 'Health Insurance', coverage: Number(insurance.health) || 0 }] : []),
      ],
      goals: goals.filter(g => g.name && g.target && g.years).map((g, i) => ({
        id: `goal-${i}`,
        name: g.name,
        type: g.name.toLowerCase().includes('retirement') ? 'retirement' as const : 
              g.name.toLowerCase().includes('education') ? 'child_education' as const :
              g.name.toLowerCase().includes('foreign') ? 'foreign_education' as const : 'custom' as const,
        targetYear: new Date().getFullYear() + (Number(g.years) || 0),
        currentCost: Number(g.target) || 0,
        currentAllocation: 0,
        expectedReturn: 10,
        inflation: g.name.toLowerCase().includes('education') ? 10 : 6,
      })),
      onboardingComplete: true,
    };

    updateData(newData);
    onComplete();
  };

  const StepIcon = steps[step].icon;

  const renderStep = () => {
    switch (step) {
      case 0: // Personal
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">{t('name')}</label>
              <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-900 focus:border-transparent" placeholder="Enter your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">{t('age')}</label>
              <input type="number" value={profile.age} onChange={e => setProfile({...profile, age: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-900 focus:border-transparent" placeholder="30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Spouse Age (optional)</label>
              <input type="number" value={profile.spouseAge} onChange={e => setProfile({...profile, spouseAge: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-900 focus:border-transparent" placeholder="30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Retirement Age</label>
              <input type="number" value={profile.retirementAge} onChange={e => setProfile({...profile, retirementAge: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-900 focus:border-transparent" placeholder="60" />
            </div>
          </div>
        );

      case 1: // Income
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Monthly Income (₹)</label>
              <input type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-900 focus:border-transparent" placeholder="e.g. 350000" />
              {monthlyIncome && <p className="text-xs text-gray-500 mt-1">Annual: ₹{(Number(monthlyIncome) * 12).toLocaleString('en-IN')}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Monthly Expenses (₹)</label>
              <input type="number" value={monthlyExpenses} onChange={e => setMonthlyExpenses(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-900 focus:border-transparent" placeholder="e.g. 125000" />
              {monthlyExpenses && <p className="text-xs text-gray-500 mt-1">Annual: ₹{(Number(monthlyExpenses) * 12).toLocaleString('en-IN')}</p>}
            </div>
            {monthlyIncome && monthlyExpenses && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-sm font-medium text-green-800">Monthly Cash Flow: ₹{(Number(monthlyIncome) - Number(monthlyExpenses)).toLocaleString('en-IN')}</p>
              </div>
            )}
          </div>
        );

      case 2: // Assets
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Home Value (₹)</label>
              <input type="number" value={assets.home} onChange={e => setAssets({...assets, home: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-900 focus:border-transparent" placeholder="e.g. 5500000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Other Real Estate / Land (₹)</label>
              <input type="number" value={assets.land} onChange={e => setAssets({...assets, land: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-900 focus:border-transparent" placeholder="e.g. 12000000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Financial Investments (₹)</label>
              <input type="number" value={assets.investments} onChange={e => setAssets({...assets, investments: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-900 focus:border-transparent" placeholder="e.g. 1100000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Gold (sovereigns)</label>
              <input type="number" value={assets.gold} onChange={e => setAssets({...assets, gold: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-900 focus:border-transparent" placeholder="e.g. 60" />
              {assets.gold && <p className="text-xs text-gray-500 mt-1">Approx value: ₹{(Number(assets.gold) * 5000).toLocaleString('en-IN')} (@ ₹5,000/sovereign)</p>}
            </div>
          </div>
        );

      case 3: // Liabilities
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Outstanding Loan Amount (₹)</label>
              <input type="number" value={liabilities.loanAmount} onChange={e => setLiabilities({...liabilities, loanAmount: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-900 focus:border-transparent" placeholder="e.g. 5000000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Monthly EMI (₹)</label>
              <input type="number" value={liabilities.emi} onChange={e => setLiabilities({...liabilities, emi: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-900 focus:border-transparent" placeholder="e.g. 100000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Interest Rate (%)</label>
              <input type="number" value={liabilities.interestRate} onChange={e => setLiabilities({...liabilities, interestRate: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-900 focus:border-transparent" placeholder="8" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Remaining Tenure (years)</label>
              <input type="number" value={liabilities.tenure} onChange={e => setLiabilities({...liabilities, tenure: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-900 focus:border-transparent" placeholder="e.g. 10" />
            </div>
          </div>
        );

      case 4: // Insurance
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Life Insurance Coverage (₹)</label>
              <input type="number" value={insurance.life} onChange={e => setInsurance({...insurance, life: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-900 focus:border-transparent" placeholder="e.g. 10000000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Health Insurance Coverage (₹)</label>
              <input type="number" value={insurance.health} onChange={e => setInsurance({...insurance, health: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-900 focus:border-transparent" placeholder="e.g. 500000" />
            </div>
          </div>
        );

      case 5: // Goals
        return (
          <div className="space-y-4">
            {goals.map((goal, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-navy-900">Goal {index + 1}</h4>
                  {goals.length > 1 && (
                    <button onClick={() => removeGoal(index)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <input type="text" value={goal.name} onChange={e => updateGoal(index, 'name', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="Goal name (e.g. Child Education)" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={goal.target} onChange={e => updateGoal(index, 'target', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="Target (₹)" />
                  <input type="number" value={goal.years} onChange={e => updateGoal(index, 'years', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="Years" />
                </div>
              </div>
            ))}
            {goals.length < 6 && (
              <button onClick={addGoal} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 text-sm font-medium flex items-center justify-center gap-2 hover:border-navy-900 hover:text-navy-900 transition-colors">
                <Plus size={16} /> Add Another Goal
              </button>
            )}
          </div>
        );

      case 6: // Review
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-navy-900">Review Your Information</h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Name:</span><span className="font-medium">{profile.name || 'Not set'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Age:</span><span className="font-medium">{profile.age}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Monthly Income:</span><span className="font-medium">₹{monthlyIncome ? Number(monthlyIncome).toLocaleString('en-IN') : 'Not set'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Monthly Expenses:</span><span className="font-medium">₹{monthlyExpenses ? Number(monthlyExpenses).toLocaleString('en-IN') : 'Not set'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Assets:</span><span className="font-medium">₹{(Number(assets.home||0) + Number(assets.land||0) + Number(assets.investments||0) + (Number(assets.gold||0)*5000)).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Liabilities:</span><span className="font-medium">₹{Number(liabilities.loanAmount||0).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Goals:</span><span className="font-medium">{goals.filter(g => g.name).length} set</span></div>
            </div>
            <p className="text-xs text-gray-500">You can edit any of this later from the dashboard.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex-1 p-6 max-w-lg mx-auto w-full">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-navy-900">{t('step')} {step + 1} {t('of')} {steps.length}</span>
            <span className="text-sm text-gray-500">{Math.round(((step + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-navy-900 rounded-full transition-all duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-navy-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <StepIcon className="text-white" size={28} />
          </div>
          <h2 className="text-2xl font-bold text-navy-900 mb-2">{t(steps[step].title)}</h2>
          <p className="text-gray-500">{t(steps[step].description)}</p>
        </div>

        {renderStep()}

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={handleBack} className="flex-1 bg-gray-100 text-navy-900 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
              <ArrowLeft size={18} /> {t('back')}
            </button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={handleNext} className="flex-1 bg-navy-900 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-navy-800 transition-colors">
              {t('next')} <ArrowRight size={18} />
            </button>
          ) : (
            <button onClick={handleComplete} className="flex-1 bg-navy-900 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-navy-800 transition-colors">
              <CheckCircle size={18} /> {t('finish')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
