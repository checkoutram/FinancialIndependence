import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../utils/store';
import { t } from '../utils/i18n';
import { Fingerprint, Lock, Eye, EyeOff, Delete, ArrowRight } from 'lucide-react';
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
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { unlockApp } = useApp();

  useEffect(() => {
    isBiometricAvailable().then(setBiometricAvailable);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  }, []);

  const handleDigit = (digit: string) => {
    triggerHaptic();
    if (error) setError('');
    if (mode === 'confirm') {
      if (confirmPin.length < 6) setConfirmPin(p => p + digit);
    } else {
      if (pin.length < 6) setPin(p => p + digit);
    }
    setPressedKey(digit);
    setTimeout(() => setPressedKey(null), 150);
  };

  const handleBackspace = () => {
    triggerHaptic();
    if (mode === 'confirm') {
      setConfirmPin(p => p.slice(0, -1));
    } else {
      setPin(p => p.slice(0, -1));
    }
    setPressedKey('backspace');
    setTimeout(() => setPressedKey(null), 150);
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
      const timer = setTimeout(handleSubmit, 400);
      return () => clearTimeout(timer);
    }
  }, [pin, confirmPin]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      handleDigit(e.key);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const currentPin = mode === 'confirm' ? confirmPin : pin;
  const title = mode === 'unlock' ? t('enterPIN') : mode === 'create' ? t('createPIN') : t('confirmPIN');
  const isComplete = currentPin.length === 6;

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center p-6" onClick={() => inputRef.current?.focus()}>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
            <Lock className="text-white" size={32} />
          </div>
        </div>

        <h1 className="text-white text-2xl font-bold text-center mb-2">{title}</h1>
        <p className="text-white/60 text-center text-sm mb-2">
          {mode === 'unlock' ? t('enterToContinue') : t('pinTooShort')}
        </p>
        <p className="text-white/40 text-center text-xs mb-6">
          {currentPin.length} / 6 digits
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 mb-6 text-center animate-pulse">
            <p className="text-red-300 text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                i < currentPin.length
                  ? 'bg-white border-white scale-110'
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
          onKeyDown={handleKeyDown}
          className="sr-only"
          maxLength={6}
          inputMode="numeric"
          pattern="[0-9]*"
          autoFocus
        />

        <div className="grid grid-cols-3 gap-4 mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className={`aspect-square rounded-xl text-white text-2xl font-semibold transition-all duration-100 active:scale-90 ${
                pressedKey === digit
                  ? 'bg-white/30 scale-90'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
              aria-label={`Digit ${digit}`}
            >
              {digit}
            </button>
          ))}
          <button
            onClick={() => setShowPin(!showPin)}
            className="aspect-square bg-white/5 hover:bg-white/10 rounded-xl text-white/60 flex items-center justify-center transition-colors"
            aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
          >
            {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          <button
            onClick={() => handleDigit('0')}
            className={`aspect-square rounded-xl text-white text-2xl font-semibold transition-all duration-100 active:scale-90 ${
              pressedKey === '0'
                ? 'bg-white/30 scale-90'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            aria-label="Digit 0"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className={`aspect-square rounded-xl text-white/60 flex items-center justify-center transition-all duration-100 ${
              pressedKey === 'backspace'
                ? 'bg-white/20 scale-90'
                : 'bg-white/5 hover:bg-white/10'
            }`}
            aria-label="Backspace"
          >
            <Delete size={20} />
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isComplete}
          className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-200 ${
            isComplete
              ? 'bg-white text-navy-900 hover:bg-white/90 active:scale-[0.98] shadow-lg'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
        >
          {isComplete ? (
            <>
              {mode === 'unlock' ? t('unlock') : t('next')}
              <ArrowRight size={20} />
            </>
          ) : (
            <>
              {t('enterPIN')}
              <span className="text-sm opacity-60">({6 - currentPin.length} more)</span>
            </>
          )}
        </button>

        {mode === 'unlock' && biometricAvailable && (
          <button
            onClick={handleBiometric}
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl transition-colors mt-4"
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
