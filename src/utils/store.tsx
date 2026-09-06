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
} from './encryption';

type Theme = 'dark' | 'light';

interface StoreCtx {
  data: FireData | null;
  locked: boolean;
  isSetup: boolean;
  loading: boolean;
  theme: Theme;
  toggleTheme: () => void;
  setup: (pin: string) => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
  update: (fn: (d: FireData) => FireData) => void;
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

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FireData | null>(null);
  const [locked, setLocked] = useState(true);
  const [isSetup, setIsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) as Theme) || 'dark');
  const pinRef = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const persist = useCallback(async (d: FireData) => {
    const pin = pinRef.current;
    if (!pin) return;
    const encrypted = await encryptData(JSON.stringify(d), pin);
    const { hash } = await hashPIN(pin);
    const existing = getEncryptedData();
    storeEncryptedData({
      pinHash: hash,
      recoveryKey: existing?.recoveryKey || generateRecoveryKey(),
      encryptedData: JSON.stringify(encrypted),
      biometricEnabled: false,
      autoLock: 'never',
    });
  }, []);

  const setup = useCallback(async (pin: string) => {
    pinRef.current = pin;
    const d = emptyFireData();
    await persist(d);
    setData(d);
    setIsSetup(true);
    setLocked(false);
  }, [persist]);

  const unlock = useCallback(async (pin: string): Promise<boolean> => {
    const store = getEncryptedData();
    if (!store) return false;
    const ok = await verifyPIN(pin, store.pinHash);
    if (!ok) return false;
    try {
      const decrypted = await decryptData(JSON.parse(store.encryptedData), pin);
      const parsed = JSON.parse(decrypted) as FireData;
      // Merge onto the current empty shape so new fields get defaults
      const merged = { ...emptyFireData(), ...parsed };
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
    pinRef.current = newPin;
    await persist(data);
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
    }}>
      {children}
    </Ctx.Provider>
  );
}
