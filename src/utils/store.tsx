// ============================================
// Store — app state, PIN-encrypted offline persistence.
// Data is encrypted with AES-256-GCM (key derived from the PIN via
// PBKDF2) and stored locally. Nothing leaves the device.
// ============================================

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { FireData } from '../types';
import { emptyFireData } from '../types';
import {
  encryptData, decryptData, getEncryptedData, storeEncryptedData,
  hashPIN, verifyPIN, generateRecoveryKey,
  encryptPinWithAnswers, decryptPinWithAnswers,
} from './encryption';
import { checkPremium, trialDaysLeft } from './billing';

type Theme = 'dark' | 'light';
export type Entitlement = 'trial' | 'premium' | 'expired';

interface StoreCtx {
  data: FireData | null;
  locked: boolean;
  isSetup: boolean;
  loading: boolean;
  theme: Theme;
  toggleTheme: () => void;
  setup: (pin: string, questions?: string[], answers?: string[]) => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
  /** Verify recovery answers; returns the recovered PIN or null. */
  recoverPin: (answers: string[]) => Promise<string | null>;
  /** After recovery: decrypt with recovered PIN, re-encrypt under new PIN. */
  resetPin: (recoveredPin: string, newPin: string) => Promise<boolean>;
  /** True if recovery questions were configured at setup. */
  hasRecovery: () => boolean;
  /** Recovery questions to display on the Forgot PIN screen. */
  getRecoveryQuestions: () => string[];
  lock: () => void;
  update: (fn: (d: FireData) => FireData) => void;
  entitlement: Entitlement;
  trialLeft: number;
  readOnly: boolean;
  refreshEntitlement: () => Promise<void>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  deleteAll: () => void;
  exportEncrypted: () => string | null;
}

const Ctx = createContext<StoreCtx | null>(null);

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore outside provider');
  return ctx;
}

const THEME_KEY = 'fire_theme';

/** Recursively fill missing keys from defaults; stored values (incl. arrays) win when present. */
function deepMerge(defaults: Record<string, unknown>, stored: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...defaults };
  for (const [k, v] of Object.entries(stored || {})) {
    if (v === undefined || v === null) continue;
    const dv = defaults?.[k];
    const bothObj = dv !== null && typeof dv === 'object' && typeof v === 'object';
    if (bothObj && !Array.isArray(dv) && !Array.isArray(v)) {
      out[k] = deepMerge(dv as Record<string, unknown>, v as Record<string, unknown>);
    } else if (dv !== null && dv !== undefined) {
      // Default exists — only accept the stored value when its shape matches
      // (array vs object vs primitive). Very old saves used different shapes
      // (e.g. goals as an array); accepting them blindly crashed the app.
      const shapeOk = Array.isArray(dv) === Array.isArray(v) && typeof dv === typeof v;
      if (shapeOk) out[k] = v;
    } else {
      out[k] = v; // no default constraint — new/unknown key, keep stored value
    }
  }
  return out;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FireData | null>(null);
  const [locked, setLocked] = useState(true);
  const [isSetup, setIsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) as Theme) || 'dark');
  const pinRef = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement>('trial');
  const [trialLeft, setTrialLeft] = useState(trialDaysLeft());
  const entitlementRef = useRef<Entitlement>('trial');

  const refreshEntitlement = useCallback(async () => {
    const left = trialDaysLeft();
    setTrialLeft(left);
    let next: Entitlement;
    // A paid subscription always wins, even mid-trial.
    if (await checkPremium()) {
      next = 'premium';
    } else {
      next = left > 0 ? 'trial' : 'expired';
    }
    entitlementRef.current = next;
    setEntitlement(next);
  }, []);

  useEffect(() => {
    if (!locked && data) void refreshEntitlement();
  }, [locked, data !== null, refreshEntitlement]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const store = getEncryptedData();
    setIsSetup(!!store);
    setLocked(!!store);
    setLoading(false);
  }, []);

  const persist = useCallback(async (d: FireData, recovery?: { questions: string[]; answers: string[] }) => {
    const pin = pinRef.current;
    if (!pin) return;
    const encrypted = await encryptData(JSON.stringify(d), pin);
    const { hash } = await hashPIN(pin);
    const existing = getEncryptedData();
    // Recovery: keep existing fields unless new ones are supplied.
    // On PIN change, answersEnc is re-wrapped below by the caller.
    let recoveryQuestions = existing?.recoveryQuestions;
    let recoveryData = existing?.recoveryData;
    let answersEnc = existing ? (existing as Record<string, unknown>).answersEnc as string | undefined : undefined;
    if (recovery) {
      recoveryQuestions = recovery.questions;
      recoveryData = await encryptPinWithAnswers(pin, recovery.answers);
      answersEnc = JSON.stringify(await encryptData(JSON.stringify(recovery.answers), pin));
    }
    storeEncryptedData({
      pinHash: hash,
      recoveryKey: existing?.recoveryKey || generateRecoveryKey(),
      encryptedData: JSON.stringify(encrypted),
      biometricEnabled: false,
      autoLock: 'never',
      recoveryQuestions,
      recoveryData,
      ...(answersEnc ? { answersEnc } : {}),
    } as Parameters<typeof storeEncryptedData>[0]);
  }, []);

  const setup = useCallback(async (pin: string, questions?: string[], answers?: string[]) => {
    pinRef.current = pin;
    const d = emptyFireData();
    await persist(d, questions && answers ? { questions, answers } : undefined);
    setData(d);
    setIsSetup(true);
    setLocked(false);
  }, [persist]);

  const hasRecovery = useCallback((): boolean => {
    const store = getEncryptedData();
    return !!(store?.recoveryQuestions?.length && store?.recoveryData);
  }, []);

  const getRecoveryQuestions = useCallback((): string[] => {
    return getEncryptedData()?.recoveryQuestions || [];
  }, []);

  const recoverPin = useCallback(async (answers: string[]): Promise<string | null> => {
    const store = getEncryptedData();
    if (!store?.recoveryData) return null;
    return decryptPinWithAnswers(store.recoveryData, answers);
  }, []);

  const resetPin = useCallback(async (recoveredPin: string, newPin: string): Promise<boolean> => {
    const store = getEncryptedData();
    if (!store) return false;
    try {
      const decrypted = await decryptData(JSON.parse(store.encryptedData), recoveredPin);
      const parsed = JSON.parse(decrypted) as FireData;
      // Decrypt stored answers so we can re-wrap recovery under the new PIN
      let recovery: { questions: string[]; answers: string[] } | undefined;
      const answersEnc = (store as Record<string, unknown>).answersEnc as string | undefined;
      if (store.recoveryQuestions?.length && answersEnc) {
        try {
          const answers = JSON.parse(await decryptData(JSON.parse(answersEnc), recoveredPin)) as string[];
          recovery = { questions: store.recoveryQuestions, answers };
        } catch { /* answers blob unreadable — drop recovery */ }
      }
      pinRef.current = newPin;
      const merged = deepMerge(emptyFireData() as unknown as Record<string, unknown>, parsed as unknown as Record<string, unknown>) as unknown as FireData;
      await persist(merged, recovery);
      setData(merged);
      setLocked(false);
      return true;
    } catch {
      return false;
    }
  }, [persist]);

  const unlock = useCallback(async (pin: string): Promise<boolean> => {
    const store = getEncryptedData();
    if (!store) return false;
    const ok = await verifyPIN(pin, store.pinHash);
    if (!ok) return false;
    try {
      const decrypted = await decryptData(JSON.parse(store.encryptedData), pin);
      const parsed = JSON.parse(decrypted) as FireData;
      // Deep-merge onto the current empty shape so fields added in newer app
      // versions get defaults — a shallow merge left nested objects (e.g.
      // goals.others) undefined for older saves and crashed the dashboard.
      const merged = deepMerge(emptyFireData() as unknown as Record<string, unknown>, parsed as unknown as Record<string, unknown>) as unknown as FireData;
      pinRef.current = pin;
      setData(merged);
      setLocked(false);
      return true;
    } catch {
      return false;
    }
  }, []);

  const lock = useCallback(() => {
    pinRef.current = null;
    setData(null);
    setLocked(true);
  }, []);

  const update = useCallback((fn: (d: FireData) => FireData) => {
    // Read-only mode (trial expired, no subscription): ignore all edits so
    // the user's data stays visible but unchanged.
    if (entitlementRef.current === 'expired') return;
    setData(prev => {
      if (!prev) return prev;
      const next = fn(prev);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persist(next), 400);
      return next;
    });
  }, [persist]);

  const changePin = useCallback(async (oldPin: string, newPin: string): Promise<boolean> => {
    const store = getEncryptedData();
    if (!store || !data) return false;
    const ok = await verifyPIN(oldPin, store.pinHash);
    if (!ok) return false;
    // Re-wrap recovery answers under the new PIN so Forgot PIN keeps working
    let recovery: { questions: string[]; answers: string[] } | undefined;
    const answersEnc = (store as Record<string, unknown>).answersEnc as string | undefined;
    if (store.recoveryQuestions?.length && answersEnc) {
      try {
        const answers = JSON.parse(await decryptData(JSON.parse(answersEnc), oldPin)) as string[];
        recovery = { questions: store.recoveryQuestions, answers };
      } catch { /* drop recovery if unreadable */ }
    }
    pinRef.current = newPin;
    await persist(data, recovery);
    return true;
  }, [data, persist]);

  const deleteAll = useCallback(() => {
    localStorage.removeItem('finplan_secure_store');
    pinRef.current = null;
    setData(null);
    setIsSetup(false);
    setLocked(false);
  }, []);

  const exportEncrypted = useCallback(() => {
    const store = getEncryptedData();
    return store ? JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), ...store }, null, 2) : null;
  }, []);

  return (
    <Ctx.Provider value={{
      data, locked, isSetup, loading, theme,
      toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark'),
      setup, unlock, lock, update, changePin, deleteAll, exportEncrypted,
      recoverPin, resetPin, hasRecovery, getRecoveryQuestions,
      entitlement, trialLeft, readOnly: entitlement === 'expired', refreshEntitlement,
    }}>
      {children}
    </Ctx.Provider>
  );
}
