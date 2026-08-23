import { useState, useRef, useEffect } from 'react';
import { useApp } from '../utils/store';
import { t } from '../utils/i18n';
import { Fingerprint, Lock, Eye, EyeOff } from 'lucide-react';
import { isBiometricAvailable, authenticateBiometric } from '../utils/encryption';

interface PINScreenProps {
  onUnlock: () => void;
  mode: 'unlock' | 'create' | 'confirm';
  onPINCreated?: (pin: string) => void;
}

export default function PINScreen({ onUnlock, mode, onPINCreated }: PINScreenProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showPin, setShowPin] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { unlockApp } = useApp();

  useEffect(() => {
    isBiometricAvailable().then(setBiometricAvailable);
    inputRef.current?.focus();
  }, []);

  const handleDigit = (digit: string) => {
    if (error) setError('');
    if (mode === 'confirm') {
      if (confirmPin.length < 6) setConfirmPin(p => p + digit);
    } else {
      if (pin.length < 6) setPin(p => p + digit);
    }
  };

  const handleBackspace = () => {
    if (mode === 'confirm') {
      setConfirmPin(p => p.slice(0, -1));
    } else {
      setPin(p => p.slice(0, -1));
    }
  };

  const handleSubmit = async () => {
    const currentPin = mode === 'confirm' ? confirmPin : pin;
    if (currentPin.length !== 6) {
      setError(t('pinTooShort'));
      return;
    }

    if (mode === 'create') {
      onPINCreated?.(currentPin);
      return;
    }

    if (mode === 'confirm') {
      if (pin !== confirmPin) {
        setError(t('pinMismatch'));
        setConfirmPin('');
        return;
      }
      onPINCreated?.(pin);
      return;
    }

    const success = await unlockApp(currentPin);
    if (success) {
      onUnlock();
    } else {
      setAttempts(a => a + 1);
      setError(t('incorrectPIN'));
      setPin('');
      if (attempts >= 4) {
        setError(t('lockedOut'));
      }
    }
  };

  const handleBiometric = async () => {
    const success = await authenticateBiometric();
    if (success) {
      onUnlock();
    } else {
      setError(t('error'));
    }
  };

  useEffect(() => {
    const current = mode === 'confirm' ? confirmPin : pin;
    if (current.length === 6) {
      const timer = setTimeout(handleSubmit, 300);
      return () => clearTimeout(timer);
    }
  }, [pin, confirmPin]);

  const currentPin = mode === 'confirm' ? confirmPin : pin;
  const title = mode === 'unlock' ? t('enterPIN') : mode === 'create' ? t('createPIN') : t('confirmPIN');

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
            <Lock className="text-white" size={32} />
          </div>
        </div>
        
        <h1 className="text-white text-2xl font-bold text-center mb-2">{title}</h1>
        <p className="text-white/60 text-center text-sm mb-8">
          {mode === 'unlock' ? t('enterToContinue') : t('pinTooShort')}
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 mb-6 text-center">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                i < currentPin.length 
                  ? 'bg-white border-white' 
                  : 'border-white/40'
              }`}
            />
          ))}
        </div>

        <input
          ref={inputRef}
          type={showPin ? 'text' : 'password'}
          value={currentPin}
          onChange={() => {}}
          className="sr-only"
          maxLength={6}
          inputMode="numeric"
          pattern="[0-9]*"
        />

        <div className="grid grid-cols-3 gap-4 mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="aspect-square bg-white/10 hover:bg-white/20 rounded-xl text-white text-2xl font-semibold transition-colors active:scale-95"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={() => setShowPin(!showPin)}
            className="aspect-square bg-white/5 hover:bg-white/10 rounded-xl text-white/60 flex items-center justify-center transition-colors"
          >
            {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="aspect-square bg-white/10 hover:bg-white/20 rounded-xl text-white text-2xl font-semibold transition-colors active:scale-95"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="aspect-square bg-white/5 hover:bg-white/10 rounded-xl text-white/60 flex items-center justify-center transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
              <line x1="18" y1="9" x2="12" y2="15" />
              <line x1="12" y1="9" x2="18" y2="15" />
            </svg>
          </button>
        </div>

        {mode === 'unlock' && biometricAvailable && (
          <button
            onClick={handleBiometric}
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl transition-colors"
          >
            <Fingerprint size={20} />
            <span className="text-sm font-medium">{t('useBiometric')}</span>
          </button>
        )}

        {mode === 'unlock' && (
          <button
            onClick={() => {}}
            className="w-full text-center text-white/40 text-sm mt-4 hover:text-white/60 transition-colors"
          >
            {t('forgotPIN')}
          </button>
        )}
      </div>
    </div>
  );
}
