import { useState } from 'react';
import { Flame, ShieldCheck, Trash2, Delete } from 'lucide-react';
import { useStore } from '../utils/store';

/** Welcome screen for first-time users — explains the app, no data yet. */
export function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: 'linear-gradient(160deg, var(--bg) 0%, var(--bg-soft) 100%)' }}>
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 animate-fade-in"
        style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
        <Flame size={40} color="#fff" />
      </div>
      <h1 className="text-3xl font-extrabold mb-2 animate-fade-in">FIRE Tracker</h1>
      <p className="text-dim max-w-xs mb-2 animate-fade-in">Financial Independence, Retire Early — plan your corpus, track goals and project your future.</p>
      <div className="card p-4 max-w-xs w-full text-left text-xs text-dim space-y-2 my-6 animate-fade-in">
        <div className="flex gap-2"><ShieldCheck size={15} className="text-green shrink-0 mt-0.5" /> Your data is encrypted with a PIN (AES-256) and never leaves this device.</div>
        <div className="flex gap-2"><Flame size={15} className="text-amber shrink-0 mt-0.5" /> Works fully offline — no account, no cloud, no tracking.</div>
      </div>
      <button className="btn-primary max-w-xs" onClick={onStart}>Set up my plan</button>
      <p className="hint mt-4 max-w-xs">You will enter your own numbers step by step. Every field has examples and explanations — nothing is pre-filled.</p>
    </div>
  );
}

/** PIN pad used for both setup and unlock. */
export function PinScreen({ mode, onDone }: { mode: 'setup' | 'unlock'; onDone: () => void }) {
  const { setup, unlock } = useStore();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);
  const [error, setError] = useState('');

  const submit = async (p: string) => {
    if (mode === 'setup') {
      if (confirm === null) {
        setConfirm(p);
        setPin('');
        setError('');
        return;
      }
      if (confirm !== p) {
        setError('PINs do not match — try again');
        setConfirm(null);
        setPin('');
        return;
      }
      await setup(p);
      onDone();
    } else {
      const ok = await unlock(p);
      if (ok) onDone();
      else {
        setError('Incorrect PIN');
        setPin('');
      }
    }
  };

  const press = (d: string) => {
    if (pin.length >= 6) return;
    setPin(pin + d);
    setError('');
  };

  const title = mode === 'setup'
    ? (confirm === null ? 'Create a PIN' : 'Confirm your PIN')
    : 'Enter your PIN';
  const subtitle = mode === 'setup'
    ? (confirm === null ? '4–6 digits. This PIN encrypts all your data — there is no recovery without it.' : 'Enter the same PIN again')
    : 'Your data is encrypted on this device';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
        <Flame size={26} color="#fff" />
      </div>
      <h2 className="text-xl font-bold mb-1">{title}</h2>
      <p className="text-xs text-dim mb-6 text-center max-w-[240px]">{subtitle}</p>

      <div className="flex gap-3 mb-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} style={i >= 4 && pin.length <= 4 ? { opacity: 0.25 } : {}} />
        ))}
      </div>
      {error && <p className="text-red text-xs mb-2">{error}</p>}

      <div className="grid grid-cols-3 gap-3 w-64 mt-4">
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map(k => (
          <button key={k}
            disabled={!k}
            onClick={() => k === '⌫' ? setPin(pin.slice(0, -1)) : press(k)}
            className="h-14 rounded-2xl text-xl font-semibold flex items-center justify-center transition-colors"
            style={{ background: k ? 'var(--card)' : 'transparent', border: k ? '1px solid var(--card-border)' : 'none', color: 'var(--text)' }}>
            {k === '⌫' ? <Delete size={20} /> : k}
          </button>
        ))}
      </div>

      <button
        className="btn-primary w-64 mt-5"
        disabled={pin.length < 4}
        onClick={() => submit(pin)}>
        {mode === 'setup' ? (confirm === null ? 'Continue' : 'Confirm PIN') : 'Unlock'}
      </button>
      {mode === 'unlock' && <ResetLink />}
    </div>
  );
}

function ResetLink() {
  const { deleteAll } = useStore();
  const [ask, setAsk] = useState(false);
  if (!ask) {
    return (
      <button className="text-faint text-xs mt-5 underline" onClick={() => setAsk(true)}>Forgot PIN?</button>
    );
  }
  return (
    <div className="card p-4 mt-5 max-w-xs text-center">
      <p className="text-xs text-dim mb-3">Without the PIN, encrypted data cannot be recovered. You can erase everything and start over.</p>
      <button className="btn-primary" style={{ background: 'var(--red)' }} onClick={deleteAll}>
        <Trash2 size={15} /> Erase all data & start over
      </button>
    </div>
  );
}
