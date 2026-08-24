import { useState } from 'react';
import { useApp } from '../utils/store';
import { t } from '../utils/i18n';
import { Shield, Lock, ArrowRight, BookOpen } from 'lucide-react';
import type { Language } from '../types';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'Tamil' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'te', label: 'Telugu' },
  { code: 'kn', label: 'Kannada' },
  { code: 'hi', label: 'Hindi' },
  { code: 'mr', label: 'Marathi' },
];

export default function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const { setupApp, updateData } = useApp();
  const [step, setStep] = useState<'language' | 'pin'>('language');
  const [selectedLang, setSelectedLang] = useState<Language>('en');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [useDemo, setUseDemo] = useState(false);

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLang(lang);
  };

  const handleProceed = () => {
    // Save language preference immediately
    updateData({ profile: { language: selectedLang } as any });
    setStep('pin');
  };

  const handleDigit = (digit: string, target: 'pin' | 'confirm') => {
    if (error) setError('');
    if (target === 'pin') {
      if (pin.length < 6) setPin(p => p + digit);
    } else {
      if (confirmPin.length < 6) setConfirmPin(p => p + digit);
    }
  };

  const handleBackspace = (target: 'pin' | 'confirm') => {
    if (target === 'pin') setPin(p => p.slice(0, -1));
    else setConfirmPin(p => p.slice(0, -1));
  };

  const handleCreatePIN = async () => {
    if (pin.length !== 6) { setError(t('pinTooShort')); return; }
    if (step === 'pin' && confirmPin.length === 0) {
      // First time entering PIN, move to confirm
      if (pin.length === 6) {
        setStep('confirm');
        return;
      }
    }
    if (confirmPin.length === 6) {
      if (pin !== confirmPin) {
        setError(t('pinMismatch'));
        setConfirmPin('');
        return;
      }
      await setupApp(pin, useDemo);
      // Set language after setup
      updateData({ profile: { language: selectedLang } as any });
      onStart();
    }
  };

  // Auto-advance
  if (step === 'pin' && pin.length === 6 && confirmPin.length === 0) {
    setTimeout(() => setStep('confirm'), 300);
  }
  if (step === 'confirm' && confirmPin.length === 6) {
    setTimeout(handleCreatePIN, 300);
  }

  const currentPin = step === 'confirm' ? confirmPin : pin;
  const isComplete = currentPin.length === 6;

  if (step === 'language') {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-center p-6">
        <div className="max-w-sm mx-auto w-full text-center space-y-6">
          <div className="w-20 h-20 bg-navy-900 rounded-2xl flex items-center justify-center mx-auto">
            <Shield className="text-white" size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-navy-900 mb-2">{t('appName')}</h1>
            <p className="text-gray-500 text-lg">{t('welcome')}</p>
          </div>

          <div className="text-left">
            <label className="block text-sm font-medium text-navy-900 mb-2">Select Language / மொழி தேர்வு</label>
            <select 
              value={selectedLang} 
              onChange={e => handleLanguageSelect(e.target.value as Language)}
              className="w-full p-3 border border-gray-200 rounded-xl bg-white text-navy-900 focus:ring-2 focus:ring-navy-900 focus:border-transparent"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left space-y-2">
            <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
              <Lock size={16} /> {t('yourDataStays')}
            </div>
            <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
              <Shield size={16} /> {t('noCloud')}
            </div>
          </div>

          <button onClick={handleProceed} className="w-full bg-navy-900 text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-navy-800 transition-colors active:scale-[0.98]">
            {t('getStarted')} <ArrowRight size={20} />
          </button>

          <button onClick={() => { setUseDemo(true); handleProceed(); }} className="w-full border-2 border-navy-900 text-navy-900 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-navy-50 transition-colors">
            <BookOpen size={18} /> {t('useDemo')}
          </button>
          <p className="text-xs text-gray-400 text-center">{t('demoDescription')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center p-6">
      <div className="max-w-sm mx-auto w-full">
        {step === 'pin' && (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-navy-900">{t('createPIN')}</h2>
            <p className="text-gray-500 text-sm">{currentPin.length} / 6 digits</p>
            <div className="flex justify-center gap-3">
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${i < pin.length ? 'bg-navy-900 border-navy-900' : 'border-gray-300'}`} />
              ))}
            </div>
            {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
            <div className="grid grid-cols-3 gap-3">
              {['1','2','3','4','5','6','7','8','9'].map(d => (
                <button key={d} onClick={() => handleDigit(d, 'pin')} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-xl text-xl font-semibold text-navy-900 active:scale-90 transition-all">{d}</button>
              ))}
              <div />
              <button onClick={() => handleDigit('0', 'pin')} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-xl text-xl font-semibold text-navy-900 active:scale-90 transition-all">0</button>
              <button onClick={() => handleBackspace('pin')} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-xl text-navy-900 active:scale-90 transition-all">⌫</button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-navy-900">{t('confirmPIN')}</h2>
            <p className="text-gray-500 text-sm">{currentPin.length} / 6 digits</p>
            <div className="flex justify-center gap-3">
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${i < confirmPin.length ? 'bg-navy-900 border-navy-900' : 'border-gray-300'}`} />
              ))}
            </div>
            {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
            <div className="grid grid-cols-3 gap-3">
              {['1','2','3','4','5','6','7','8','9'].map(d => (
                <button key={d} onClick={() => handleDigit(d, 'confirm')} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-xl text-xl font-semibold text-navy-900 active:scale-90 transition-all">{d}</button>
              ))}
              <button onClick={() => setStep('pin')} className="aspect-square bg-gray-50 text-gray-500 rounded-xl text-sm font-medium">Back</button>
              <button onClick={() => handleDigit('0', 'confirm')} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-xl text-xl font-semibold text-navy-900 active:scale-90 transition-all">0</button>
              <button onClick={() => handleBackspace('confirm')} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-xl text-navy-900 active:scale-90 transition-all">⌫</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
