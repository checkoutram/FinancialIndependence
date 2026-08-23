import { useState, useEffect, useCallback } from 'react';
import { AppProvider, useApp } from './utils/store';
import { t } from './utils/i18n';
import PINScreen from './components/PINScreen';
import WelcomeScreen from './components/WelcomeScreen';
import OnboardingFlow from './components/OnboardingFlow';
import Dashboard from './components/Dashboard';
import GoalsScreen from './components/GoalsScreen';
import FIREScreen from './components/FIREScreen';
import PlanningScreen from './components/PlanningScreen';
import MoreScreen from './components/MoreScreen';
import SettingsScreen from './components/SettingsScreen';
import PrivacyScreen from './components/PrivacyScreen';
import ReportScreen from './components/ReportScreen';
import { Home, Target, Flame, Calculator, MoreHorizontal } from 'lucide-react';

function AppContent() {
  const { isSetup, isLocked, isLoading, data, lockApp } = useApp();
  const [screen, setScreen] = useState<'welcome' | 'onboarding' | 'dashboard' | 'goals' | 'fire' | 'planning' | 'more' | 'settings' | 'privacy' | 'report'>('welcome');
  const [showLock, setShowLock] = useState(false);

  useEffect(() => {
    if (!isSetup && !isLoading) {
      setScreen('welcome');
    } else if (isSetup && !isLocked && data) {
      setScreen(data.onboardingComplete ? 'dashboard' : 'onboarding');
    }
  }, [isSetup, isLocked, isLoading, data]);

  useEffect(() => {
    if (isLocked && isSetup) {
      setShowLock(true);
    }
  }, [isLocked, isSetup]);

  const handleLock = useCallback(() => {
    lockApp();
    setShowLock(true);
  }, [lockApp]);

  const handleUnlock = useCallback(() => {
    setShowLock(false);
    if (data?.onboardingComplete) {
      setScreen('dashboard');
    } else {
      setScreen('onboarding');
    }
  }, [data]);

  const handleNav = useCallback((s: string) => {
    setScreen(s as any);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-navy-900 text-lg font-medium">{t('loading')}</div>
      </div>
    );
  }

  if (showLock) {
    return <PINScreen onUnlock={handleUnlock} mode="unlock" />;
  }

  if (!isSetup) {
    if (screen === 'welcome') return <WelcomeScreen onStart={() => setScreen('onboarding')} />;
    return <OnboardingFlow onComplete={() => setScreen('dashboard')} />;
  }

  if (!data) {
    return <PINScreen onUnlock={handleUnlock} mode="unlock" />;
  }

  if (!data.onboardingComplete) {
    return <OnboardingFlow onComplete={() => setScreen('dashboard')} />;
  }

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard': return <Dashboard onNavigate={handleNav} onLock={handleLock} />;
      case 'goals': return <GoalsScreen onBack={() => setScreen('dashboard')} />;
      case 'fire': return <FIREScreen onBack={() => setScreen('dashboard')} />;
      case 'planning': return <PlanningScreen onBack={() => setScreen('dashboard')} onNavigate={handleNav} />;
      case 'more': return <MoreScreen onBack={() => setScreen('dashboard')} onNavigate={handleNav} />;
      case 'settings': return <SettingsScreen onBack={() => setScreen('more')} />;
      case 'privacy': return <PrivacyScreen onBack={() => setScreen('more')} />;
      case 'report': return <ReportScreen onBack={() => setScreen('more')} />;
      default: return <Dashboard onNavigate={handleNav} onLock={handleLock} />;
    }
  };

  const isMainScreen = ['dashboard', 'goals', 'fire', 'planning', 'more'].includes(screen);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex-1 overflow-auto">
        {renderScreen()}
      </div>
      
      {isMainScreen && (
        <nav className="bg-white border-t border-gray-200 px-4 py-2 flex justify-around items-center sticky bottom-0 z-50">
          <button 
            onClick={() => setScreen('dashboard')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${screen === 'dashboard' ? 'text-navy-900' : 'text-gray-400'}`}
          >
            <Home size={20} />
            <span className="text-[10px] font-medium">{t('home')}</span>
          </button>
          <button 
            onClick={() => setScreen('goals')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${screen === 'goals' ? 'text-navy-900' : 'text-gray-400'}`}
          >
            <Target size={20} />
            <span className="text-[10px] font-medium">{t('goals')}</span>
          </button>
          <button 
            onClick={() => setScreen('fire')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${screen === 'fire' ? 'text-navy-900' : 'text-gray-400'}`}
          >
            <Flame size={20} />
            <span className="text-[10px] font-medium">{t('fire')}</span>
          </button>
          <button 
            onClick={() => setScreen('planning')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${screen === 'planning' ? 'text-navy-900' : 'text-gray-400'}`}
          >
            <Calculator size={20} />
            <span className="text-[10px] font-medium">{t('planning')}</span>
          </button>
          <button 
            onClick={() => setScreen('more')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${screen === 'more' ? 'text-navy-900' : 'text-gray-400'}`}
          >
            <MoreHorizontal size={20} />
            <span className="text-[10px] font-medium">{t('more')}</span>
          </button>
        </nav>
      )}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
