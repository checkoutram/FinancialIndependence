import { useState, useRef } from 'react';
import { Flame, ShieldCheck, ShieldQuestion, Trash2, Delete } from 'lucide-react';
import { useStore } from '../utils/store';
import { restoreBackup } from '../utils/backup';

/** Security questions offered at PIN setup (user picks 2). */
export const RECOVERY_QUESTIONS = [
  'What was your first school name?',
  'What is your mother\u2019s maiden name?',
  'What was your childhood nickname?',
  'What city were you born in?',
  'What was the name of your first pet?',
  'What is your favourite teacher\u2019s name?',
];

/** Welcome screen for first-time users — explains the app, no data yet. */
export function Welcome({ onStart }: { onStart: () => void }) {
  const [restoreMsg, setRestoreMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    const text = await f.text();
    const err = restoreBackup(text);
    if (err) setRestoreMsg(err);
    else window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: 'linear-gradient(160deg, var(--bg) 0%, var(--bg-soft) 100%)', paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
      <img src="./icon.png" alt="FIRE Tracker" className="w-20 h-20 rounded-3xl mb-6 animate-fade-in" />
      <h1 className="text-3xl font-extrabold mb-2 animate-fade-in">FIRE Tracker</h1>
      <p className="text-dim max-w-xs mb-2 animate-fade-in">Financial Independence, Retire Early — plan your corpus, track goals and project your future.</p>
      <div className="card p-4 max-w-xs w-full text-left text-xs text-dim space-y-2 my-6 animate-fade-in">
        <div className="flex gap-2"><ShieldCheck size={15} className="text-green shrink-0 mt-0.5" /> Your data is encrypted with a PIN (AES-256) and never leaves this device.</div>
        <div className="flex gap-2"><Flame size={15} className="text-amber shrink-0 mt-0.5" /> Works fully offline — no account, no cloud, no tracking.</div>
      </div>
      <button className="btn-primary max-w-xs" onClick={onStart}>Set up my plan</button>
      <p className="hint mt-4 max-w-xs">You will enter your own numbers step by step. Every field has examples and explanations — nothing is pre-filled.</p>
      <div className="mt-6 animate-fade-in">
        <button className="text-dim text-xs underline" onClick={() => fileRef.current?.click()}>
          Have a backup from your old phone? Restore it here
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden"
          onChange={e => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
        {restoreMsg && <p className="text-red text-xs mt-2 max-w-xs">{restoreMsg}</p>}
      </div>
    </div>
  );
}

/** PIN pad used for both setup and unlock. */
export function PinScreen({ mode, onDone }: { mode: 'setup' | 'unlock'; onDone: () => void }) {
  const { setup, unlock } = useStore();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [finalPin, setFinalPin] = useState<string | null>(null); // setup: PIN confirmed, next is questions

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
      setFinalPin(p);
      return;
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

  // Setup: after PIN confirmed, collect recovery questions
  if (mode === 'setup' && finalPin) {
    return (
      <RecoverySetup
        onComplete={async (questions, answers) => {
          await setup(finalPin, questions, answers);
          onDone();
        }}
        onSkip={async () => {
          await setup(finalPin);
          onDone();
        }}
      />
    );
  }

  const title = mode === 'setup'
    ? (confirm === null ? 'Create a PIN' : 'Confirm your PIN')
    : 'Enter your PIN';
  const subtitle = mode === 'setup'
    ? (confirm === null ? '4–6 digits. This PIN encrypts all your data.' : 'Enter the same PIN again')
    : 'Your data is encrypted on this device';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--bg)', paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
      <img src="./icon.png" alt="FIRE Tracker" className="w-14 h-14 rounded-2xl mb-4" />
      <h2 className="text-xl font-bold mb-1">{title}</h2>
      <p className="text-xs text-dim mb-6 text-center max-w-[240px]">{subtitle}</p>

      <div className="flex items-center justify-center gap-3 mb-1" style={{ minHeight: 18 }}>
        {pin.length === 0
          ? <span className="text-xs" style={{ color: 'var(--text-faint)' }}>4–6 digits</span>
          : Array.from({ length: pin.length }).map((_, i) => <div key={i} className="pin-dot filled" />)}
      </div>
      <div style={{ minHeight: 20 }}>{error && <p className="text-red text-xs animate-fade-in">{error}</p>}</div>

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
        className="btn-primary mt-5"
        style={{ width: '16rem', maxWidth: '100%' }}
        disabled={pin.length < 4}
        onClick={() => submit(pin)}>
        {mode === 'setup' ? (confirm === null ? 'Continue' : 'Confirm PIN') : 'Unlock'}
      </button>
      {mode === 'unlock' && <ResetLink />}
    </div>
  );
}

/** Setup step: pick 2 security questions and answer them (enables Forgot PIN). */
function RecoverySetup({ onComplete, onSkip }: { onComplete: (q: string[], a: string[]) => void; onSkip: () => void }) {
  const [q1, setQ1] = useState(RECOVERY_QUESTIONS[0]);
  const [q2, setQ2] = useState(RECOVERY_QUESTIONS[1]);
  const [a1, setA1] = useState('');
  const [a2, setA2] = useState('');
  const [busy, setBusy] = useState(false);
  const valid = q1 !== q2 && a1.trim().length >= 2 && a2.trim().length >= 2;

  const done = async () => {
    if (!valid || busy) return;
    setBusy(true);
    await onComplete([q1, q2], [a1.trim(), a2.trim()]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--bg)', paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
      <ShieldQuestion size={44} className="text-green mb-3" />
      <h2 className="text-xl font-bold mb-1">Recovery questions</h2>
      <p className="text-xs text-dim mb-5 text-center max-w-[280px]">If you ever forget your PIN, these answers let you reset it and keep your data. Answers are encrypted on this device.</p>
      <div className="card p-4 w-full max-w-xs space-y-3">
        <div>
          <label className="text-xs text-dim block mb-1">Question 1</label>
          <select className="input" value={q1} onChange={e => setQ1(e.target.value)}>
            {RECOVERY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
          <input className="input mt-2" value={a1} onChange={e => setA1(e.target.value)} placeholder="Your answer" autoCapitalize="none" />
        </div>
        <div>
          <label className="text-xs text-dim block mb-1">Question 2</label>
          <select className="input" value={q2} onChange={e => setQ2(e.target.value)}>
            {RECOVERY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
          <input className="input mt-2" value={a2} onChange={e => setA2(e.target.value)} placeholder="Your answer" autoCapitalize="none" />
        </div>
      </div>
      <button className="btn-primary mt-5" style={{ width: '16rem', maxWidth: '100%' }} disabled={!valid || busy} onClick={done}>
        {busy ? 'Saving…' : 'Save & finish'}
      </button>
      <button className="text-faint text-xs mt-4 underline" onClick={onSkip}>Skip — I understand data cannot be recovered without the PIN</button>
    </div>
  );
}

/** Forgot PIN: verify answers → set a new PIN → data preserved. */
function RecoveryFlow({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const { getRecoveryQuestions, recoverPin, resetPin } = useStore();
  const questions = getRecoveryQuestions();
  const [answers, setAnswers] = useState<string[]>(questions.map(() => ''));
  const [stage, setStage] = useState<'answers' | 'newpin' | 'confirm'>('answers');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pin, setPin] = useState('');
  const recoveredRef = useState<string | null>(null);
  const recovered = recoveredRef[0];
  const setRecovered = recoveredRef[1];

  const verify = async () => {
    if (busy || answers.some(a => a.trim().length < 2)) return;
    setBusy(true);
    setError('');
    const p = await recoverPin(answers.map(a => a.trim()));
    setBusy(false);
    if (p) {
      setRecovered(p);
      setStage('newpin');
    } else {
      setError('Answers do not match — try again');
    }
  };

  const submitPin = async () => {
    if (stage === 'newpin') {
      setNewPin(pin);
      setPin('');
      setStage('confirm');
      setError('');
      return;
    }
    if (pin !== newPin) {
      setError('PINs do not match — try again');
      setPin('');
      setStage('newpin');
      return;
    }
    if (!recovered) return;
    setBusy(true);
    const ok = await resetPin(recovered, pin);
    setBusy(false);
    if (ok) onDone();
    else setError('Something went wrong — try again');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--bg)', paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
      <ShieldQuestion size={44} className="text-green mb-3" />
      <h2 className="text-xl font-bold mb-1">{stage === 'answers' ? 'Recover your PIN' : stage === 'newpin' ? 'Set a new PIN' : 'Confirm new PIN'}</h2>
      <p className="text-xs text-dim mb-5 text-center max-w-[280px]">
        {stage === 'answers' ? 'Answer your recovery questions to reset the PIN. Your data stays intact.' : 'Choose a new 4–6 digit PIN. Your data will be re-encrypted with it.'}
      </p>

      {stage === 'answers' ? (
        <>
          <div className="card p-4 w-full max-w-xs space-y-3">
            {questions.map((q, i) => (
              <div key={q}>
                <label className="text-xs text-dim block mb-1">{q}</label>
                <input className="input" value={answers[i]} autoCapitalize="none"
                  onChange={e => setAnswers(prev => prev.map((a, j) => j === i ? e.target.value : a))}
                  placeholder="Your answer" />
              </div>
            ))}
          </div>
          <div style={{ minHeight: 20, marginTop: 8 }}>{error && <p className="text-red text-xs animate-fade-in">{error}</p>}</div>
          <button className="btn-primary mt-2" style={{ width: '16rem', maxWidth: '100%' }}
            disabled={busy || answers.some(a => a.trim().length < 2)} onClick={verify}>
            {busy ? 'Verifying…' : 'Verify answers'}
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center justify-center gap-3 mb-1" style={{ minHeight: 18 }}>
            {pin.length === 0
              ? <span className="text-xs" style={{ color: 'var(--text-faint)' }}>4–6 digits</span>
              : Array.from({ length: pin.length }).map((_, i) => <div key={i} className="pin-dot filled" />)}
          </div>
          <div style={{ minHeight: 20 }}>{error && <p className="text-red text-xs animate-fade-in">{error}</p>}</div>
          <div className="grid grid-cols-3 gap-3 w-64 mt-4">
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map(k => (
              <button key={k} disabled={!k}
                onClick={() => k === '⌫' ? setPin(pin.slice(0, -1)) : (pin.length < 6 && setPin(pin + k))}
                className="h-14 rounded-2xl text-xl font-semibold flex items-center justify-center transition-colors"
                style={{ background: k ? 'var(--card)' : 'transparent', border: k ? '1px solid var(--card-border)' : 'none', color: 'var(--text)' }}>
                {k === '⌫' ? <Delete size={20} /> : k}
              </button>
            ))}
          </div>
          <button className="btn-primary mt-5" style={{ width: '16rem', maxWidth: '100%' }}
            disabled={pin.length < 4 || busy} onClick={submitPin}>
            {busy ? 'Resetting…' : stage === 'newpin' ? 'Continue' : 'Reset PIN & unlock'}
          </button>
        </>
      )}
      <button className="text-faint text-xs mt-4 underline" onClick={onBack}>Back</button>
    </div>
  );
}

function ResetLink() {
  const { deleteAll, hasRecovery } = useStore();
  const [ask, setAsk] = useState(false);
  const [recover, setRecover] = useState(false);

  if (recover) {
    return <RecoveryFlow onDone={() => window.location.reload()} onBack={() => setRecover(false)} />;
  }
  if (!ask) {
    return (
      <button className="text-faint text-xs mt-5 underline" onClick={() => setAsk(true)}>Forgot PIN?</button>
    );
  }
  const canRecover = hasRecovery();
  return (
    <div className="card p-4 mt-5 max-w-xs text-center">
      {canRecover && (
        <>
          <p className="text-xs text-dim mb-3">Answer your recovery questions to reset the PIN and keep all your data.</p>
          <button className="btn-primary mb-3" onClick={() => setRecover(true)}>
            <ShieldQuestion size={15} /> Reset PIN with recovery questions
          </button>
        </>
      )}
      <p className="text-xs text-dim mb-3">{canRecover ? 'Or, if you also forgot the answers:' : 'Without the PIN, encrypted data cannot be recovered. You can erase everything and start over.'}</p>
      <button className="btn-primary" style={{ background: 'var(--red)' }} onClick={deleteAll}>
        <Trash2 size={15} /> Erase all data & start over
      </button>
    </div>
  );
}
