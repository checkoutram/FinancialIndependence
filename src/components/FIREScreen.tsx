import { useState, useMemo } from 'react';
import { useApp } from '../utils/store';
import { t } from '../utils/i18n';
import { formatIndianCurrency } from '../utils/calculations';
import { calculateFIRE } from '../utils/calculations';
import { ArrowLeft, Flame, Info, ChevronDown, ChevronUp } from 'lucide-react';

export default function FIREScreen({ onBack }: { onBack: () => void }) {
  const { data } = useApp();
  const [showCalc, setShowCalc] = useState(false);
  const [inputs, setInputs] = useState({
    currentAge: data?.profile.age || 30,
    retirementAge: data?.profile.retirementAge || 60,
    monthlyExpenses: 150000,
    inflation: 6,
    currentInvestments: 5000000,
    monthlyInvestments: 50000,
    preRetirementReturn: 12,
    postRetirementReturn: 8,
    retirementIncome: 0,
    rentalIncome: 25000,
    pension: 0,
    withdrawalRate: 4,
  });

  const fire = useMemo(() => calculateFIRE({
    currentAge: inputs.currentAge,
    retirementAge: inputs.retirementAge,
    monthlyExpenses: inputs.monthlyExpenses,
    inflation: inputs.inflation / 100,
    currentInvestments: inputs.currentInvestments,
    monthlyInvestments: inputs.monthlyInvestments,
    preRetirementReturn: inputs.preRetirementReturn / 100,
    postRetirementReturn: inputs.postRetirementReturn / 100,
    retirementIncome: inputs.retirementIncome,
    rentalIncome: inputs.rentalIncome,
    pension: inputs.pension,
    withdrawalRate: inputs.withdrawalRate / 100,
  }), [inputs]);

  const presets = [
    { label: '+Rs 10,000/month', change: { monthlyInvestments: inputs.monthlyInvestments + 10000 } },
    { label: '+Rs 25,000/month', change: { monthlyInvestments: inputs.monthlyInvestments + 25000 } },
    { label: '+Rs 50,000/month', change: { monthlyInvestments: inputs.monthlyInvestments + 50000 } },
    { label: 'Retire 2 years later', change: { retirementAge: inputs.retirementAge + 2 } },
    { label: 'Reduce expenses Rs 10K', change: { monthlyExpenses: Math.max(0, inputs.monthlyExpenses - 10000) } },
  ];

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold text-navy-900">{t('fireCalculator')}</h1>
      </div>

      <div className="bg-navy-900 rounded-2xl p-6 text-white text-center">
        <Flame className="mx-auto mb-3 text-amber-400" size={32} />
        <p className="text-white/60 text-sm mb-1">{t('fireNumber')}</p>
        <p className="text-3xl font-bold mb-3">{formatIndianCurrency(fire.fireNumber)}</p>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-white/50 text-xs">{t('projectedCorpus')}</p>
            <p className="font-semibold">{formatIndianCurrency(fire.projectedCorpus)}</p>
          </div>
          <div>
            <p className="text-white/50 text-xs">{t('corpusGap')}</p>
            <p className={`font-semibold ${fire.corpusGap > 0 ? 'text-red-300' : 'text-green-300'}`}>{formatIndianCurrency(fire.corpusGap)}</p>
          </div>
          <div>
            <p className="text-white/50 text-xs">{t('projectedFireAge')}</p>
            <p className="font-semibold">{fire.estimatedFireAge}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-navy-900">{t('whatIf')}</h3>
          <button onClick={() => setShowCalc(!showCalc)} className="text-gray-500">
            {showCalc ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {presets.map(p => (
            <button key={p.label} onClick={() => setInputs(i => ({ ...i, ...p.change }))} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-navy-900 transition-colors">
              {p.label}
            </button>
          ))}
        </div>

        {showCalc && (
          <div className="space-y-4 border-t border-gray-100 pt-4">
            {[
              { label: t('currentAge'), key: 'currentAge', min: 18, max: 100 },
              { label: t('retirementAge'), key: 'retirementAge', min: 30, max: 100 },
              { label: t('monthlyExpenses'), key: 'monthlyExpenses', min: 0, max: 10000000 },
              { label: t('currentInvestments'), key: 'currentInvestments', min: 0, max: 100000000 },
              { label: t('monthlyInvestments'), key: 'monthlyInvestments', min: 0, max: 1000000 },
              { label: t('inflation'), key: 'inflation', min: 0, max: 20, suffix: '%' },
              { label: t('preRetirementReturn'), key: 'preRetirementReturn', min: 0, max: 30, suffix: '%' },
              { label: t('withdrawalRate'), key: 'withdrawalRate', min: 1, max: 10, suffix: '%' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <input
                  type="range"
                  min={field.min}
                  max={field.max}
                  value={inputs[field.key as keyof typeof inputs]}
                  onChange={e => setInputs(i => ({ ...i, [field.key]: parseInt(e.target.value) }))}
                  className="w-full mb-1"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{field.min}{field.suffix || ''}</span>
                  <span className="font-semibold text-navy-900">{inputs[field.key as keyof typeof inputs]}{field.suffix || ''}</span>
                  <span>{field.max}{field.suffix || ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
        <Info className="text-amber-600 shrink-0" size={20} />
        <p className="text-sm text-amber-800">{t('withdrawalExplanation')}</p>
      </div>

      <button onClick={() => setShowCalc(!showCalc)} className="w-full text-center text-sm text-navy-900 font-medium py-3 bg-white rounded-xl border border-gray-200">
        {showCalc ? t('hideDetails') : t('howCalculated')}
      </button>

      {showCalc && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <p className="text-sm font-medium text-navy-900">{t('formula')}:</p>
          <p className="text-sm text-gray-600 font-mono bg-gray-50 p-3 rounded-lg">{t('fireFormula')}</p>
          <p className="text-sm text-gray-600">{t('methodology')}: {t('fourPercentRule')}</p>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">{t('annualRetirementExpenses')}:</span> <span className="font-semibold">{formatIndianCurrency(fire.annualRetirementExpenses)}</span></p>
            <p><span className="text-gray-500">{t('withdrawalRate')}:</span> <span className="font-semibold">{inputs.withdrawalRate}%</span></p>
            <p><span className="text-gray-500">{t('result')}:</span> <span className="font-semibold">{formatIndianCurrency(fire.fireNumber)}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}
