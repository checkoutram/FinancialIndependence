import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { FinancialData, Language, SecuritySettings, AppSettings } from '../types';
import { createDemoFinancialData } from './demoData';
import { encryptData, decryptData, getEncryptedData, storeEncryptedData, hashPIN, verifyPIN, generateRecoveryKey } from './encryption';
import { getLanguage, setLanguage as setLang } from './i18n';

interface AppState {
  data: FinancialData | null;
  isLocked: boolean;
  isSetup: boolean;
  isLoading: boolean;
  error: string | null;
  language: Language;
  demoMode: boolean;
}

interface AppContextType extends AppState {
  loadData: (pin: string) => Promise<boolean>;
  saveData: (pin: string, data: FinancialData) => Promise<void>;
  setupApp: (pin: string, useDemo?: boolean) => Promise<void>;
  lockApp: () => void;
  unlockApp: (pin: string) => Promise<boolean>;
  changePIN: (oldPin: string, newPin: string) => Promise<boolean>;
  resetPIN: (recoveryKey: string, newPin: string) => Promise<boolean>;
  deleteAllData: () => void;
  updateData: (updates: Partial<FinancialData>) => void;
  setLanguage: (lang: Language) => void;
  exportBackup: (pin: string) => Promise<string>;
  importBackup: (pin: string, backupJson: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    data: null,
    isLocked: true,
    isSetup: false,
    isLoading: true,
    error: null,
    language: getLanguage(),
    demoMode: false,
  });

  useEffect(() => {
    const store = getEncryptedData();
    if (store) {
      setState(s => ({ ...s, isSetup: true, isLoading: false }));
    } else {
      setState(s => ({ ...s, isSetup: false, isLocked: false, isLoading: false }));
    }
  }, []);

  const loadData = useCallback(async (pin: string): Promise<boolean> => {
    const store = getEncryptedData();
    if (!store) return false;

    const isValid = await verifyPIN(pin, store.pinHash);
    if (!isValid) return false;

    try {
      const encrypted = JSON.parse(store.encryptedData);
      const decrypted = await decryptData(encrypted, pin);
      const data = JSON.parse(decrypted) as FinancialData;
      setState(s => ({ ...s, data, isLocked: false, language: data.settings?.language || getLanguage() }));
      return true;
    } catch {
      return false;
    }
  }, []);

  const saveData = useCallback(async (pin: string, data: FinancialData) => {
    const json = JSON.stringify(data);
    const encrypted = await encryptData(json, pin);
    const { hash: pinHash } = await hashPIN(pin);
    const store = getEncryptedData();
    
    storeEncryptedData({
      pinHash,
      recoveryKey: store?.recoveryKey || generateRecoveryKey(),
      encryptedData: JSON.stringify(encrypted),
      biometricEnabled: store?.biometricEnabled || false,
      autoLock: store?.autoLock || '5min',
    });
    
    setState(s => ({ ...s, data, isSetup: true }));
  }, []);

  const setupApp = useCallback(async (pin: string, useDemo = false) => {
    const data = useDemo ? createDemoFinancialData() : {
      profile: { name: '', age: 30, children: [], retirementAge: 60, language: getLanguage(), currency: 'INR' },
      incomes: [],
      expenses: [],
      assets: [],
      liabilities: [],
      insurances: [],
      goals: [],
      portfolio: { equity: 0, debt: 0, gold: 0, cash: 0, realEstate: 0, other: 0 },
      targetAllocation: { equity: 50, debt: 30, gold: 10, cash: 5, realEstate: 5, other: 0 },
      riskProfile: { capacity: 5, tolerance: 5, required: 5, horizon: 5, liquidity: 5, dependents: 5, reactionToLoss: 5, overall: 'balanced' as const },
      settings: { language: getLanguage(), theme: 'light' as const, demoMode: useDemo },
      security: { pinHash: '', biometricEnabled: false, autoLock: '5min', recoveryKey: '' },
      onboardingComplete: false,
    };

    const recoveryKey = generateRecoveryKey();
    const json = JSON.stringify(data);
    const encrypted = await encryptData(json, pin);
    const { hash: pinHash } = await hashPIN(pin);
    
    storeEncryptedData({
      pinHash,
      recoveryKey,
      encryptedData: JSON.stringify(encrypted),
      biometricEnabled: false,
      autoLock: '5min',
    });

    setState(s => ({ ...s, data, isSetup: true, isLocked: false, demoMode: useDemo }));
  }, []);

  const lockApp = useCallback(() => {
    setState(s => ({ ...s, isLocked: true, data: null }));
  }, []);

  const unlockApp = useCallback(async (pin: string): Promise<boolean> => {
    return loadData(pin);
  }, [loadData]);

  const changePIN = useCallback(async (oldPin: string, newPin: string): Promise<boolean> => {
    const store = getEncryptedData();
    if (!store) return false;

    const isValid = await verifyPIN(oldPin, store.pinHash);
    if (!isValid) return false;

    try {
      const encrypted = JSON.parse(store.encryptedData);
      const decrypted = await decryptData(encrypted, oldPin);
      const data = JSON.parse(decrypted) as FinancialData;
      
      const newEncrypted = await encryptData(JSON.stringify(data), newPin);
      const { hash: newPinHash } = await hashPIN(newPin);
      
      storeEncryptedData({
        ...store,
        pinHash: newPinHash,
        encryptedData: JSON.stringify(newEncrypted),
      });
      
      return true;
    } catch {
      return false;
    }
  }, []);

  const resetPIN = useCallback(async (recoveryKey: string, newPin: string): Promise<boolean> => {
    const store = getEncryptedData();
    if (!store || store.recoveryKey !== recoveryKey) return false;

    try {
      // We can't decrypt without old PIN, so we need to store a new encrypted blob
      // For this demo, we'll create fresh data with the new PIN
      const data = createDemoFinancialData();
      const newEncrypted = await encryptData(JSON.stringify(data), newPin);
      const { hash: newPinHash } = await hashPIN(newPin);
      
      storeEncryptedData({
        ...store,
        pinHash: newPinHash,
        encryptedData: JSON.stringify(newEncrypted),
      });
      
      setState(s => ({ ...s, data, isLocked: false }));
      return true;
    } catch {
      return false;
    }
  }, []);

  const deleteAllData = useCallback(() => {
    localStorage.removeItem('finplan_secure_store');
    localStorage.removeItem('finplan_language');
    localStorage.removeItem('finplan_biometric_id');
    setState({
      data: null,
      isLocked: false,
      isSetup: false,
      isLoading: false,
      error: null,
      language: 'en',
      demoMode: false,
    });
  }, []);

  const updateData = useCallback((updates: Partial<FinancialData>) => {
    setState(s => {
      if (!s.data) return s;
      return { ...s, data: { ...s.data, ...updates } as FinancialData };
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLang(lang);
    setState(s => ({ ...s, language: lang }));
  }, []);

  const exportBackup = useCallback(async (pin: string): Promise<string> => {
    const store = getEncryptedData();
    if (!store) throw new Error('No data');
    
    const isValid = await verifyPIN(pin, store.pinHash);
    if (!isValid) throw new Error('Invalid PIN');

    const backup = {
      version: 1,
      timestamp: new Date().toISOString(),
      encryptedData: store.encryptedData,
    };
    
    return JSON.stringify(backup, null, 2);
  }, []);

  const importBackup = useCallback(async (pin: string, backupJson: string): Promise<boolean> => {
    try {
      const backup = JSON.parse(backupJson);
      if (!backup.encryptedData) return false;
      
      const encrypted = JSON.parse(backup.encryptedData);
      const decrypted = await decryptData(encrypted, pin);
      const data = JSON.parse(decrypted) as FinancialData;
      
      const newEncrypted = await encryptData(JSON.stringify(data), pin);
      const { hash: pinHash } = await hashPIN(pin);
      
      storeEncryptedData({
        pinHash,
        recoveryKey: generateRecoveryKey(),
        encryptedData: JSON.stringify(newEncrypted),
        biometricEnabled: false,
        autoLock: '5min',
      });
      
      setState(s => ({ ...s, data, isSetup: true, isLocked: false }));
      return true;
    } catch {
      return false;
    }
  }, []);

  return (
    <AppContext.Provider value={{
      ...state,
      loadData,
      saveData,
      setupApp,
      lockApp,
      unlockApp,
      changePIN,
      resetPIN,
      deleteAllData,
      updateData,
      setLanguage,
      exportBackup,
      importBackup,
    }}>
      {children}
    </AppContext.Provider>
  );
}
