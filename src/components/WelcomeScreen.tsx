import { useState } from 'react';
import { useApp } from '../utils/store';
import { t } from '../utils/i18n';
import { Shield, Lock, ArrowRight, BookOpen } from 'lucide-react';

export default function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const { setupApp } = useApp();
  const [step, setStep] = useState(0);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [useDemo, setUseDemo] = useState(false);

  const handleCreatePIN = async () => {
    if (pin.length !== 6) { setError(t('pinTooShort')); return; }
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      if (pin !== confirmPin) { setError(t('pinMismatch')); setConfirmPin(''); return; }
      await setupApp(pin, useDemo);
      onStart();
    }
  };

  const steps = [
    <div key="0" className="text-center space-y-6">
      <div className="w-20 h-20 bg-navy-900 rounded-2xl flex items-center justify-center mx-auto">
        <Shield className="text-white" size={40} />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-navy-900 mb-2">{t('appName')}</h1>
        <p className="text-gray-500 text-lg">{t('welcome')}</p>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left space-y-2">
        <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
          <Lock size={16} /> {t('yourDataStays')}
        </div>
        <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
          <Shield size={16} /> {t('noCloud')}
        </div>
      </div>
      <button onClick={() => setStep(1)} className="w-full bg-navy-900 text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-navy-800 transition-colors">
        {t('getStarted')} <ArrowRight size={20} />
      </button>
    </div>,

    <div key="1" className="space-y-6">
      <h2 className="text-2xl font-bold text-navy-900 text-center">{t('createPIN')}</h2>
      <p className="text-gray-500 text-center text-sm">{t('securityTitle')}</p>
      <div className="flex justify-center gap-3">
        {[0,1,2,3,4,5].map(i => (
          <div key={i} className={`w-4 h-4 rounded-full border-2 ${i < pin.length ? 'bg-navy-900 border-navy-900' : 'border-gray-300'}`} />
        ))}
      </div>
      <input type="password" inputMode="numeric" maxLength={6} value={pin} onChange={e => { setError(''); setPin(e.target.value.replace(/\D/g, '')); }} className="sr-only" />
      <div className="grid grid-cols-3 gap-3">
        {['1','2','3','4','5','6','7','8','9'].map(d => (
          <button key={d} onClick={() => pin.length < 6 && setPin(p => p + d)} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-xl text-xl font-semibold text-navy-900">{d}</button>
        ))}
        <button className="aspect-square rounded-xl" />
        <button onClick={() => pin.length < 6 && setPin(p => p + '0')} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-xl text-xl font-semibold text-navy-900">0</button>
        <button onClick={() => setPin(p => p.slice(0,-1))} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-xl text-navy-900 flex items-center justify-center">⌫</button>
      </div>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <button onClick={handleCreatePIN} disabled={pin.length !== 6} className="w-full bg-navy-900 text-white py-4 rounded-xl font-semibold disabled:opacity-50">{t('next')}</button>
    </div>,

    <div key="2" className="space-y-6">
      <h2 className="text-2xl font-bold text-navy-900 text-center">{t('confirmPIN')}</h2>
      <div className="flex justify-center gap-3">
        {[0,1,2,3,4,5].map(i => (
          <div key={i} className={`w-4 h-4 rounded-full border-2 ${i < confirmPin.length ? 'bg-navy-900 border-navy-900' : 'border-gray-300'}`} />
        ))}
      </div>
      <input type="password" inputMode="numeric" maxLength={6} value={confirmPin} onChange={e => { setError(''); setConfirmPin(e.target.value.replace(/\D/g, '')); }} className="sr-only" />
      <div className="grid grid-cols-3 gap-3">
        {['1','2','3','4','5','6','7','8','9'].map(d => (
          <button key={d} onClick={() => confirmPin.length < 6 && setConfirmPin(p => p + d)} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-xl text-xl font-semibold text-navy-900">{d}</button>
        ))}
        <button className="aspect-square rounded-xl" />
        <button onClick={() => confirmPin.length < 6 && setConfirmPin(p => p + '0')} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-xl text-xl font-semibold text-navy-900">0</button>
        <button onClick={() => setConfirmPin(p => p.slice(0,-1))} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-xl text-navy-900 flex items-center justify-center">⌫</button>
      </div>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <div className="flex gap-3">
        <button onClick={() => setStep(1)} className="flex-1 bg-gray-200 text-navy-900 py-4 rounded-xl font-semibold">{t('back')}</button>
        <button onClick={handleCreatePIN} disabled={confirmPin.length !== 6} className="flex-1 bg-navy-900 text-white py-4 rounded-xl font-semibold disabled:opacity-50">{t('next')}</button>
      </div>
    </div>
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center p-6">
      <div className="max-w-sm mx-auto w-full">
        {steps[step]}
        {step === 0 && (
          <div className="mt-6 space-y-3">
            <button onClick={() => { setUseDemo(true); setStep(1); }} className="w-full border-2 border-navy-900 text-navy-900 py-3 rounded-xl font-medium flex items-center justify-center gap-2">
              <BookOpen size={18} /> {t('useDemo')}
            </button>
            <p className="text-xs text-gray-400 text-center">{t('demoDescription')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
