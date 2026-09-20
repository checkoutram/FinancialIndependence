import { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './utils/store';
import { Welcome, PinScreen } from './components/Pin';
import Overview from './screens/Overview';
import Inputs from './screens/Inputs';
import Assets from './screens/Assets';
import Goals from './screens/Goals';
import Projections from './screens/Projections';
import FireTypes from './screens/FireTypes';
import { LayoutDashboard, ClipboardList, Scale, Target, LineChart, Flame } from 'lucide-react';
import { useT } from './utils/i18n';

type Screen = 'overview' | 'inputs' | 'assets' | 'goals' | 'projections' | 'firetypes';

const NAV: Array<{ key: Screen; labelKey: string; icon: typeof Flame }> = [
  { key: 'overview', labelKey: 'nav.home', icon: LayoutDashboard },
  { key: 'inputs', labelKey: 'nav.inputs', icon: ClipboardList },
  { key: 'assets', labelKey: 'nav.assets', icon: Scale },
  { key: 'goals', labelKey: 'nav.goals', icon: Target },
  { key: 'projections', labelKey: 'nav.project', icon: LineChart },
  { key: 'firetypes', labelKey: 'nav.fire', icon: Flame },
];

function Shell() {
  const { isSetup, locked, loading, data } = useStore();
  const t = useT();
  const [screen, setScreen] = useState<Screen>('overview');
  const [phase, setPhase] = useState<'welcome' | 'pin-setup' | 'app'>('welcome');

  useEffect(() => {
    if (!loading && !isSetup && phase === 'app') setPhase('welcome');
  }, [loading, isSetup, phase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Flame size={32} className="text-amber animate-pulse" />
      </div>
    );
  }

  if (!isSetup) {
    if (phase === 'welcome') return <Welcome onStart={() => setPhase('pin-setup')} />;
    return <PinScreen mode="setup" onDone={() => setPhase('app')} />;
  }

  if (locked || !data) {
    return <PinScreen mode="unlock" onDone={() => {}} />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-lg mx-auto">
          {screen === 'overview' && <Overview go={(s) => setScreen(s as Screen)} />}
          {screen === 'inputs' && <Inputs />}
          {screen === 'assets' && <Assets />}
          {screen === 'goals' && <Goals />}
          {screen === 'projections' && <Projections />}
          {screen === 'firetypes' && <FireTypes />}
        </div>
      </div>

      <nav className="no-print sticky bottom-0 z-50 border-t" style={{ background: 'var(--nav-bg)', borderColor: 'var(--card-border)', backdropFilter: 'blur(16px)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-lg mx-auto flex justify-around">
          {NAV.map(n => (
            <button key={n.key} onClick={() => setScreen(n.key)}
              className="flex flex-col items-center gap-0.5 py-2 px-1.5 transition-colors"
              style={{ color: screen === n.key ? 'var(--accent)' : 'var(--text-faint)' }}>
              <n.icon size={19} />
              <span className="text-[9px] font-semibold">{t(n.labelKey)}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
