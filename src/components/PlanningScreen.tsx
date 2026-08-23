import { useApp } from '../utils/store';
import { t } from '../utils/i18n';
import { formatIndianCurrency } from '../utils/calculations';
import { calculateNetWorth, calculateCashFlow, calculateEmergencyFund, calculateInsuranceGap } from '../utils/calculations';
import { ArrowLeft, Wallet, TrendingUp, Umbrella, Heart, PieChart } from 'lucide-react';

export default function PlanningScreen({ onBack }: { onBack: () => void; onNavigate?: (s: string) => void }) {
  const { data } = useApp();
  if (!data) return null;

  const netWorth = calculateNetWorth(data.assets, data.liabilities);
  const cashFlow = calculateCashFlow(data.incomes, data.expenses, data.liabilities);
  const emergency = calculateEmergencyFund(data.expenses, data.liabilities, data.incomes, data.profile);
  const insurance = calculateInsuranceGap(data.insurances, data.incomes, data.liabilities, data.expenses);

  const sections = [
    { id: 'cashflow', title: t('cashFlow'), icon: TrendingUp, color: 'bg-blue-50 text-blue-700', content: (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-600">{t('monthlyIncome')}</span><span className="font-semibold text-green-700">{formatIndianCurrency(cashFlow.monthlyIncome)}</span></div>
        <div className="flex justify-between"><span className="text-gray-600">{t('monthlyExpenses')}</span><span className="font-semibold text-red-600">{formatIndianCurrency(cashFlow.monthlyExpenses)}</span></div>
        <div className="flex justify-between"><span className="text-gray-600">{t('monthlySurplus')}</span><span className={`font-semibold ${cashFlow.monthlySurplus >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatIndianCurrency(cashFlow.monthlySurplus)}</span></div>
        <div className="flex justify-between border-t pt-2"><span className="text-gray-600 font-medium">{t('savingsRate')}</span><span className="font-bold text-navy-900">{cashFlow.savingsRate}%</span></div>
      </div>
    )},
    { id: 'networth', title: t('netWorth'), icon: Wallet, color: 'bg-emerald-50 text-emerald-700', content: (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-600">{t('assets')}</span><span className="font-semibold text-green-700">{formatIndianCurrency(netWorth.totalAssets)}</span></div>
        <div className="flex justify-between"><span className="text-gray-600">{t('liabilities')}</span><span className="font-semibold text-red-600">{formatIndianCurrency(netWorth.totalLiabilities)}</span></div>
        <div className="flex justify-between border-t pt-2"><span className="text-gray-600 font-medium">{t('netWorth')}</span><span className="font-bold text-navy-900">{formatIndianCurrency(netWorth.netWorth)}</span></div>
      </div>
    )},
    { id: 'emergency', title: t('emergencyFundCalc'), icon: Umbrella, color: 'bg-amber-50 text-amber-700', content: (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-600">{t('currentFund')}</span><span className="font-semibold">{formatIndianCurrency(emergency.currentFund)}</span></div>
        <div className="flex justify-between"><span className="text-gray-600">{t('recommendedFund')}</span><span className="font-semibold">{formatIndianCurrency(emergency.recommendedFund)}</span></div>
        <div className="flex justify-between border-t pt-2"><span className="text-gray-600 font-medium">{t('shortfall')}</span><span className={`font-bold ${emergency.shortfall > 0 ? 'text-red-600' : 'text-green-700'}`}>{formatIndianCurrency(emergency.shortfall)}</span></div>
      </div>
    )},
    { id: 'insurance', title: t('insuranceGap'), icon: Heart, color: 'bg-rose-50 text-rose-700', content: (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-600">{t('lifeInsurance')} {t('available')}</span><span className="font-semibold">{formatIndianCurrency(insurance.lifeInsuranceAvailable)}</span></div>
        <div className="flex justify-between"><span className="text-gray-600">{t('lifeInsurance')} {t('required')}</span><span className="font-semibold">{formatIndianCurrency(insurance.lifeInsuranceRequired)}</span></div>
        <div className="flex justify-between border-t pt-2"><span className="text-gray-600 font-medium">{t('gap')}</span><span className={`font-bold ${insurance.lifeGap > 0 ? 'text-red-600' : 'text-green-700'}`}>{formatIndianCurrency(insurance.lifeGap)}</span></div>
      </div>
    )},
    { id: 'portfolio', title: t('portfolio'), icon: PieChart, color: 'bg-purple-50 text-purple-700', content: (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-600">{t('equity')}</span><span className="font-semibold">{data.portfolio.equity > 0 ? formatIndianCurrency(data.portfolio.equity) : '—'}</span></div>
        <div className="flex justify-between"><span className="text-gray-600">{t('debt')}</span><span className="font-semibold">{data.portfolio.debt > 0 ? formatIndianCurrency(data.portfolio.debt) : '—'}</span></div>
        <div className="flex justify-between"><span className="text-gray-600">{t('gold')}</span><span className="font-semibold">{data.portfolio.gold > 0 ? formatIndianCurrency(data.portfolio.gold) : '—'}</span></div>
        <div className="flex justify-between"><span className="text-gray-600">{t('cash')}</span><span className="font-semibold">{data.portfolio.cash > 0 ? formatIndianCurrency(data.portfolio.cash) : '—'}</span></div>
      </div>
    )},
  ];

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold text-navy-900">{t('planning')}</h1>
      </div>

      {sections.map(s => (
        <div key={s.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className={`inline-flex items-center gap-2 ${s.color} px-3 py-1.5 rounded-lg mb-4`}>
            <s.icon size={16} />
            <span className="text-sm font-semibold">{s.title}</span>
          </div>
          {s.content}
        </div>
      ))}
    </div>
  );
}
