import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../utils/store';
import { t } from '../utils/i18n';
import { Shield, Lock, ArrowRight, BookOpen, Eye, EyeOff, Delete } from 'lucide-react';

export default function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const { setupApp } = useApp();
  const [step, setStep] = useState(0);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [useDemo, setUseDemo] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step >= 1) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [step]);

  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  }, []);

  const handleDigit = (digit: string, target: 'pin' | 'confirm') => {
    triggerHaptic();
    if (error) setError('');
    if (target === 'pin') {
      if (pin.length < 6) setPin(p => p + digit);
    } else {
      if (confirmPin.length < 6) setConfirmPin(p => p + digit);
    }
    setPressedKey(digit);
    setTimeout(() => setPressedKey(null), 150);
  };

  const handleBackspace = (target: 'pin' | 'confirm') => {
    triggerHaptic();
    if (target === 'pin') {
      setPin(p => p.slice(0, -1));
    } else {
      setConfirmPin(p => p.slice(0, -1));
    }
    setPressedKey('backspace');
    setTimeout(() => setPressedKey(null), 150);
  };

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

  useEffect(() => {
    if (step === 1 && pin.length === 6) {
      const timer = setTimeout(() => setStep(2), 300);
      return () => clearTimeout(timer);
    }
    if (step === 2 && confirmPin.length === 6) {
      const timer = setTimeout(handleCreatePIN, 300);
      return () => clearTimeout(timer);
    }
  }, [pin, confirmPin, step]);

  const renderKeypad = (target: 'pin' | 'confirm') => (
    <div className="grid grid-cols-3 gap-3">
      {['1','2','3','4','5','6','7','8','9'].map(d => (
        <button
          key={d}
          onClick={() => handleDigit(d, target)}
          className={`aspect-square rounded-xl text-xl font-semibold text-navy-900 transition-all duration-100 active:scale-90 ${
            pressedKey === d ? 'bg-gray-300 scale-90' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {d}
        </button>
      ))}
      <button
        onClick={() => setShowPin(!showPin)}
        className="aspect-square bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-500 flex items-center justify-center"
      >
        {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
      <button
        onClick={() => handleDigit('0', target)}
        className={`aspect-square rounded-xl text-xl font-semibold text-navy-900 transition-all duration-100 active:scale-90 ${
          pressedKey === '0' ? 'bg-gray-300 scale-90' : 'bg-gray-100 hover:bg-gray-200'
        }`}
      >
        0
      </button>
      <button
        onClick={() => handleBackspace(target)}
        className={`aspect-square rounded-xl text-navy-900 flex items-center justify-center transition-all duration-100 ${
          pressedKey === 'backspace' ? 'bg-gray-300 scale-90' : 'bg-gray-100 hover:bg-gray-200'
        }`}
      >
        <Delete size={18} />
      </button>
    </div>
  );

  const renderPINStep = (title: string, currentValue: string, target: 'pin' | 'confirm') => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-navy-900 text-center">{title}</h2>
      <p className="text-gray-500 text-center text-sm">
        {currentValue.length} / 6 digits entered
      </p>
      <div className="flex justify-center gap-3">
        {[0,1,2,3,4,5].map(i => (
          <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
            i < currentValue.length ? 'bg-navy-900 border-navy-900 scale-110' : 'border-gray-300'
          }`} />
        ))}
      </div>
      <input
        ref={inputRef}
        type={showPin ? 'text' : 'password'}
        value={currentValue}
        onChange={() => {}}
        onKeyDown={(e) => {
          if (e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            handleDigit(e.key, target);
          } else if (e.key === 'Backspace') {
            e.preventDefault();
            handleBackspace(target);
          } else if (e.key === 'Enter') {
            e.preventDefault();
            handleCreatePIN();
          }
        }}
        className="sr-only"
        maxLength={6}
        inputMode="numeric"
        pattern="[0-9]*"
        autoFocus
      />
      {renderKeypad(target)}
      {error && <p className="text-red-500 text-sm text-center font-medium animate-pulse">{error}</p>}
      <button
        onClick={handleCreatePIN}
        disabled={currentValue.length !== 6}
        className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-200 ${
          currentValue.length === 6
            ? 'bg-navy-900 text-white hover:bg-navy-800 active:scale-[0.98] shadow-lg'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {t('next')}
        <ArrowRight size={20} />
      </button>
    </div>
  );

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
      <button onClick={() => setStep(1)} className="w-full bg-navy-900 text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-navy-800 transition-colors active:scale-[0.98]">
        {t('getStarted')} <ArrowRight size={20} />
      </button>
    </div>,

    renderPINStep(t('createPIN'), pin, 'pin'),

    renderPINStep(t('confirmPIN'), confirmPin, 'confirm'),
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center p-6" onClick={() => inputRef.current?.focus()}>
      <div className="max-w-sm mx-auto w-full">
        {steps[step]}
        {step === 0 && (
          <div className="mt-6 space-y-3">
            <button onClick={() => { setUseDemo(true); setStep(1); }} className="w-full border-2 border-navy-900 text-navy-900 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-navy-50 transition-colors">
              <BookOpen size={18} /> {t('useDemo')}
            </button>
            <p className="text-xs text-gray-400 text-center">{t('demoDescription')}</p>
          </div>
        )}
        {step === 2 && (
          <button
            onClick={() => { setStep(1); setConfirmPin(''); setError(''); }}
            className="w-full text-center text-gray-500 text-sm mt-4 hover:text-navy-900 transition-colors"
          >
            {t('back')} to re-enter PIN
          </button>
        )}
      </div>
    </div>
  );
}
