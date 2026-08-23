import { useMemo } from 'react';
import { useApp } from '../utils/store';
import { t } from '../utils/i18n';
import { formatIndianCurrency } from '../utils/calculations';
import { calculateNetWorth, calculateCashFlow, calculateFIRE, calculateFinancialHealth, calculateGoal } from '../utils/calculations';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Target, Shield, Lock, Umbrella } from 'lucide-react';

export default function Dashboard({ onNavigate, onLock }: { onNavigate: (s: string) => void; onLock: () => void }) {
  const { data, demoMode } = useApp();
  if (!data) return null;

  const netWorth = useMemo(() => calculateNetWorth(data.assets, data.liabilities), [data]);
  const cashFlow = useMemo(() => calculateCashFlow(data.incomes, data.expenses, data.liabilities), [data]);
  const fireInputs = {
    currentAge: data.profile.age,
    retirementAge: data.profile.retirementAge,
    monthlyExpenses: cashFlow.monthlyExpenses,
    inflation: 0.06,
    currentInvestments: netWorth.financialAssets,
    monthlyInvestments: cashFlow.monthlySurplus,
    preRetirementReturn: 0.12,
    postRetirementReturn: 0.08,
    retirementIncome: 0,
    rentalIncome: data.incomes.filter(i => i.type === 'rental').reduce((s, i) => s + i.amount, 0),
    pension: 0,
    withdrawalRate: 0.04,
  };
  const fire = useMemo(() => calculateFIRE(fireInputs), [fireInputs]);
  const health = useMemo(() => calculateFinancialHealth(data.assets, data.liabilities, data.incomes, data.expenses, data.insurances, data.goals, data.portfolio, data.profile), [data]);

  const cards = [
    { title: t('netWorth'), value: formatIndianCurrency(netWorth.netWorth), sub: `${t('financialAssetsShort')}: ${formatIndianCurrency(netWorth.financialAssets)}`, icon: Wallet, color: 'bg-blue-50 text-blue-700' },
    { title: t('monthlyIncome'), value: formatIndianCurrency(cashFlow.monthlyIncome), sub: `${t('monthlyExpenses')}: ${formatIndianCurrency(cashFlow.monthlyExpenses)}`, icon: TrendingUp, color: 'bg-green-50 text-green-700' },
    { title: t('monthlySurplus'), value: formatIndianCurrency(cashFlow.monthlySurplus), sub: `${t('savingsRate')}: ${cashFlow.savingsRate}%`, icon: PiggyBank, color: cashFlow.monthlySurplus >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700' },
    { title: t('fireNumber'), value: formatIndianCurrency(fire.fireNumber), sub: `${t('fireProgress')}: ${fire.fireProgress}%`, icon: Target, color: 'bg-amber-50 text-amber-700' },
    { title: t('projectedFireAge'), value: `${fire.estimatedFireAge}`, sub: `${fire.yearsToFire} ${t('years')}`, icon: TrendingUp, color: 'bg-purple-50 text-purple-700' },
    { title: t('financialHealth'), value: `${health.score}`, sub: `${t('scoreOutOf')}`, icon: Shield, color: health.score >= 70 ? 'bg-green-50 text-green-700' : health.score >= 50 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700' },
  ];

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy-900">{t('yourPlan')}</h1>
          <p className="text-sm text-gray-500">{t('understandWhere')}</p>
        </div>
        <div className="flex items-center gap-2">
          {demoMode && <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg">{t('demoData')}</span>}
          <button onClick={onLock} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"><Lock size={18} className="text-gray-600" /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map(card => (
          <div key={card.title} className={`${card.color} rounded-2xl p-4 card-hover`}>
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide opacity-80">{card.title}</span>
            </div>
            <div className="text-lg font-bold mb-1">{card.value}</div>
            <div className="text-xs opacity-70">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-bold text-navy-900 mb-4">{t('whereAmI')}</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">{t('total')}</span>
            <span className="font-semibold text-navy-900">{formatIndianCurrency(netWorth.totalAssets)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">{t('liabilities')}</span>
            <span className="font-semibold text-red-600">{formatIndianCurrency(netWorth.totalLiabilities)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600 font-medium">{t('netWorth')}</span>
            <span className="font-bold text-navy-900 text-lg">{formatIndianCurrency(netWorth.netWorth)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-bold text-navy-900 mb-4">{t('amIOnTrack')}</h3>
        <div className="space-y-4">
          {data.goals.slice(0, 3).map(goal => {
            const calc = calculateGoal(goal);
            return (
              <div key={goal.id} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${calc.status === 'green' ? 'bg-green-500' : calc.status === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-navy-900">{goal.name}</span>
                    <span className="text-sm text-gray-500">{calc.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-navy-900 rounded-full transition-all" style={{ width: `${calc.progress}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
          <button onClick={() => onNavigate('goals')} className="w-full text-center text-sm text-navy-900 font-medium py-2 hover:bg-gray-50 rounded-lg transition-colors">
            {t('goals')} &rarr;
          </button>
        </div>
      </div>

      <div className="bg-navy-900 rounded-2xl p-5 text-white">
        <h3 className="font-bold mb-2">{t('whatToChange')}</h3>
        <p className="text-white/70 text-sm mb-4">{t('possibleLevers')}</p>
        <div className="space-y-2">
          {cashFlow.monthlySurplus < 0 && (
            <div className="flex items-center gap-2 text-red-300 text-sm">
              <TrendingDown size={16} /> {t('reduceExpenses')}
            </div>
          )}
          {health.emergencyFund < 10 && (
            <div className="flex items-center gap-2 text-amber-300 text-sm">
              <Umbrella size={16} /> {t('buildEmergency')}
            </div>
          )}
          {fire.fireProgress < 50 && (
            <div className="flex items-center gap-2 text-blue-300 text-sm">
              <PiggyBank size={16} /> {t('increaseInvestment')}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center px-4">{t('disclaimer')}</p>
    </div>
  );
}
