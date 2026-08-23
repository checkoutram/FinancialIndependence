import { useRef } from 'react';
import { useApp } from '../utils/store';
import { t } from '../utils/i18n';
import { formatIndianCurrency } from '../utils/calculations';
import { calculateNetWorth, calculateCashFlow, calculateFIRE, calculateFinancialHealth } from '../utils/calculations';
import { ArrowLeft, Printer } from 'lucide-react';

export default function ReportScreen({ onBack }: { onBack: () => void }) {
  const { data, demoMode } = useApp();
  const reportRef = useRef<HTMLDivElement>(null);
  if (!data) return null;

  const netWorth = calculateNetWorth(data.assets, data.liabilities);
  const cashFlow = calculateCashFlow(data.incomes, data.expenses, data.liabilities);
  const fire = calculateFIRE({
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
  });
  const health = calculateFinancialHealth(data.assets, data.liabilities, data.incomes, data.expenses, data.insurances, data.goals, data.portfolio, data.profile);

  const handlePrint = () => window.print();

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center gap-3 no-print">
        <button onClick={onBack} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold text-navy-900">{t('report')}</h1>
        <div className="flex-1" />
        <button onClick={handlePrint} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><Printer size={18} /></button>
      </div>

      <div ref={reportRef} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 print:shadow-none print:border-none">
        <div className="text-center border-b border-gray-200 pb-6 mb-6">
          <h2 className="text-2xl font-bold text-navy-900 mb-1">{t('appName')}</h2>
          <p className="text-sm text-gray-500">{t('reportDisclaimer')}</p>
          {demoMode && <p className="text-xs text-amber-600 font-bold mt-2">{t('demoData')}</p>}
          <p className="text-xs text-gray-400 mt-2">{t('reportGenerated')} {new Date().toLocaleDateString('en-IN')}</p>
        </div>

        <div className="space-y-6">
          <Section title={t('personalTitle')}>
            <Row label={t('name')} value={data.profile.name || '—'} />
            <Row label={t('age')} value={`${data.profile.age}`} />
            <Row label={t('retirementAge')} value={`${data.profile.retirementAge}`} />
          </Section>

          <Section title={t('incomeTitle')}>
            {data.incomes.map(i => <Row key={i.id} label={t(i.type)} value={formatIndianCurrency(i.amount) + (i.frequency === 'annual' ? '/yr' : '/mo')} />)}
            <Row label={t('total')} value={formatIndianCurrency(cashFlow.monthlyIncome) + '/mo'} bold />
          </Section>

          <Section title={t('expensesTitle')}>
            {data.expenses.map(e => <Row key={e.id} label={e.name} value={formatIndianCurrency(e.amount) + '/mo'} />)}
            <Row label={t('total')} value={formatIndianCurrency(cashFlow.monthlyExpenses) + '/mo'} bold />
          </Section>

          <Section title={t('cashFlow')}>
            <Row label={t('monthlyIncome')} value={formatIndianCurrency(cashFlow.monthlyIncome)} />
            <Row label={t('monthlyExpenses')} value={formatIndianCurrency(cashFlow.monthlyExpenses)} />
            <Row label={t('monthlySurplus')} value={formatIndianCurrency(cashFlow.monthlySurplus)} bold />
            <Row label={t('savingsRate')} value={`${cashFlow.savingsRate}%`} bold />
          </Section>

          <Section title={t('netWorth')}>
            <Row label={t('totalAssets')} value={formatIndianCurrency(netWorth.totalAssets)} />
            <Row label={t('totalLiabilities')} value={formatIndianCurrency(netWorth.totalLiabilities)} />
            <Row label={t('netWorth')} value={formatIndianCurrency(netWorth.netWorth)} bold />
          </Section>

          <Section title={t('fireCalculator')}>
            <Row label={t('fireNumber')} value={formatIndianCurrency(fire.fireNumber)} bold />
            <Row label={t('projectedCorpus')} value={formatIndianCurrency(fire.projectedCorpus)} />
            <Row label={t('corpusGap')} value={formatIndianCurrency(fire.corpusGap)} />
            <Row label={t('projectedFireAge')} value={`${fire.estimatedFireAge}`} />
          </Section>

          <Section title={t('financialHealth')}>
            <Row label={t('score')} value={`${health.score}/100`} bold />
            <Row label={t('emergencyScore')} value={`${health.emergencyFund}/15`} />
            <Row label={t('insuranceScore')} value={`${health.insurance}/15`} />
            <Row label={t('debtScore')} value={`${health.debt}/15`} />
            <Row label={t('cashFlowScore')} value={`${health.cashFlow}/15`} />
            <Row label={t('goalFundingScore')} value={`${health.goalFunding}/15`} />
            <Row label={t('retirementScore')} value={`${health.retirement}/15`} />
            <Row label={t('diversificationScore')} value={`${health.diversification}/10`} />
          </Section>

          <Section title={t('assumptions')}>
            <Row label={t('inflationRate')} value="6%" />
            <Row label={t('preRetirementReturn')} value="12%" />
            <Row label={t('postRetirementReturn')} value="8%" />
            <Row label={t('withdrawalRate')} value="4%" />
          </Section>

          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 font-medium">{t('confidential')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('reportDisclaimer')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('sebiDisclaimer')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 pb-4 last:border-0">
      <h3 className="font-bold text-navy-900 mb-3 text-sm uppercase tracking-wide">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className={`text-navy-900 ${bold ? 'font-bold' : 'font-medium'}`}>{value}</span>
    </div>
  );
}
