import { useApp } from '../utils/store';
import { t } from '../utils/i18n';
import { formatIndianCurrency } from '../utils/calculations';
import { calculateGoal } from '../utils/calculations';
import { ArrowLeft, Plus } from 'lucide-react';

export default function GoalsScreen({ onBack }: { onBack: () => void }) {
  const { data } = useApp();
  if (!data) return null;

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold text-navy-900">{t('goals')}</h1>
      </div>

      <div className="space-y-3">
        {data.goals.map(goal => {
          const calc = calculateGoal(goal);
          return (
            <div key={goal.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-navy-900">{goal.name}</h3>
                  <p className="text-sm text-gray-500">{goal.targetYear} &bull; {t(goal.type)}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${calc.status === 'green' ? 'bg-green-100 text-green-700' : calc.status === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  {calc.status === 'green' ? t('onTrack') : calc.status === 'yellow' ? t('needsAttention') : t('fundingGap')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t('futureCost')}</p>
                  <p className="font-semibold text-navy-900">{formatIndianCurrency(calc.futureCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t('projectedCorpus')}</p>
                  <p className="font-semibold text-navy-900">{formatIndianCurrency(calc.projectedCorpus)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t('fundingGap')}</p>
                  <p className="font-semibold text-red-600">{formatIndianCurrency(calc.fundingGap)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t('requiredMonthlySIP')}</p>
                  <p className="font-semibold text-navy-900">{formatIndianCurrency(calc.requiredMonthlySIP)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-navy-900 rounded-full transition-all" style={{ width: `${calc.progress}%` }} />
                </div>
                <span className="text-sm font-bold text-navy-900">{calc.progress}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <button className="w-full bg-navy-900 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2">
        <Plus size={20} /> {t('addGoal')}
      </button>
    </div>
  );
}
