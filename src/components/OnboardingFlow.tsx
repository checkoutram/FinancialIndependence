import { useState } from 'react';
import { useApp } from '../utils/store';
import { t } from '../utils/i18n';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';

export default function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const { data, updateData } = useApp();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(data?.profile || { name: '', age: 30, children: [], retirementAge: 60, language: 'en' as const, currency: 'INR' });

  const steps = [
    { title: t('personalTitle'), fields: [
      { label: t('name'), key: 'name', type: 'text' },
      { label: t('age'), key: 'age', type: 'number' },
      { label: t('spouseAge'), key: 'spouseAge', type: 'number' },
      { label: t('retirementAge'), key: 'retirementAge', type: 'number' },
    ]},
    { title: t('incomeTitle'), fields: [] },
    { title: t('expensesTitle'), fields: [] },
    { title: t('assetsTitle'), fields: [] },
    { title: t('liabilitiesTitle'), fields: [] },
    { title: t('insuranceTitle'), fields: [] },
    { title: t('goalsTitle'), fields: [] },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
    else {
      updateData({ profile, onboardingComplete: true });
      onComplete();
    }
  };

  const current = steps[step];

  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-navy-900 rounded-full transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
          <span className="text-sm text-gray-500 font-medium">{t('stepOf', { current: step + 1, total: steps.length })}</span>
        </div>

        <h2 className="text-2xl font-bold text-navy-900 mb-6">{current.title}</h2>

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
              <input type="text" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:border-transparent" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('age')}</label>
              <input type="number" value={profile.age} onChange={e => setProfile(p => ({ ...p, age: parseInt(e.target.value) || 0 }))} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('spouseAge')}</label>
              <input type="number" value={profile.spouseAge || ''} onChange={e => setProfile(p => ({ ...p, spouseAge: parseInt(e.target.value) || undefined }))} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('retirementAge')}</label>
              <input type="number" value={profile.retirementAge} onChange={e => setProfile(p => ({ ...p, retirementAge: parseInt(e.target.value) || 60 }))} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:border-transparent" />
            </div>
          </div>
        )}

        {step > 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">You can add {current.title.toLowerCase()} later from the dashboard.</p>
            <button onClick={handleNext} className="text-navy-900 font-medium underline">Skip for now</button>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="flex-1 bg-gray-200 text-navy-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
              <ArrowLeft size={18} /> {t('back')}
            </button>
          )}
          <button onClick={handleNext} className="flex-1 bg-navy-900 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
            {step === steps.length - 1 ? <>{t('finish')} <Check size={18} /></> : <>{t('next')} <ArrowRight size={18} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
