import { useState, useRef } from 'react';
import { Flame, ShieldCheck, ShieldQuestion, Trash2, Delete } from 'lucide-react';
import { useStore } from '../utils/store';
import { restoreBackup } from '../utils/backup';
import { useT, LangToggle } from '../utils/i18n';

/**
 * Security questions offered at PIN setup (user picks 2).
 * Stored values are the translation KEYS so they render in the current language.
 */
export const RECOVERY_QUESTION_KEYS = ['q.school', 'q.maiden', 'q.nickname', 'q.city', 'q.pet', 'q.teacher'] as const;

/** Welcome screen for first-time users — explains the app, no data yet. */
export function Welcome({ onStart }: { onStart: () => void }) {
  const t = useT();
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
      <div className="absolute top-4 right-4" style={{ top: 'max(1rem, env(safe-area-inset-top))' }}><LangToggle /></div>
      <img src="./icon.png" alt="FIRE Tracker" className="w-20 h-20 rounded-3xl mb-6 animate-fade-in" />
      <h1 className="text-3xl font-extrabold mb-2 animate-fade-in">FIRE Tracker</h1>
      <p className="text-dim max-w-xs mb-2 animate-fade-in">{t('welcome.tagline')}</p>
      <div className="card p-4 max-w-xs w-full text-left text-xs text-dim space-y-2 my-6 animate-fade-in">
        <div className="flex gap-2"><ShieldCheck size={15} className="text-green shrink-0 mt-0.5" /> {t('welcome.sec1')}</div>
        <div className="flex gap-2"><Flame size={15} className="text-amber shrink-0 mt-0.5" /> {t('welcome.sec2')}</div>
      </div>
      <button className="btn-primary max-w-xs" onClick={onStart}>{t('welcome.cta')}</button>
      <p className="hint mt-4 max-w-xs">{t('welcome.hint')}</p>
      <div className="mt-6 animate-fade-in">
        <button className="text-dim text-xs underline" onClick={() => fileRef.current?.click()}>
          {t('welcome.restore')}
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
  const t = useT();
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
        setError(t('pin.mismatch'));
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
        setError(t('pin.incorrect'));
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
    ? (confirm === null ? t('pin.create') : t('pin.confirm'))
    : t('pin.enter');
  const subtitle = mode === 'setup'
    ? (confirm === null ? t('pin.createSub') : t('pin.confirmSub'))
    : t('pin.enterSub');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--bg)', paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
      <img src="./icon.png" alt="FIRE Tracker" className="w-14 h-14 rounded-2xl mb-4" />
      <h2 className="text-xl font-bold mb-1">{title}</h2>
      <p className="text-xs text-dim mb-6 text-center max-w-[240px]">{subtitle}</p>

      <div className="flex items-center justify-center gap-3 mb-1" style={{ minHeight: 18 }}>
        {pin.length === 0
          ? <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{t('pin.digits')}</span>
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
        {mode === 'setup' ? (confirm === null ? t('pin.continue') : t('pin.confirmBtn')) : t('pin.unlock')}
      </button>
      {mode === 'unlock' && <ResetLink />}
    </div>
  );
}

/** Setup step: pick 2 security questions and answer them (enables Forgot PIN). */
function RecoverySetup({ onComplete, onSkip }: { onComplete: (q: string[], a: string[]) => void; onSkip: () => void }) {
  const t = useT();
  const [q1, setQ1] = useState<string>(RECOVERY_QUESTION_KEYS[0]);
  const [q2, setQ2] = useState<string>(RECOVERY_QUESTION_KEYS[1]);
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
      <h2 className="text-xl font-bold mb-1">{t('rec.title')}</h2>
      <p className="text-xs text-dim mb-5 text-center max-w-[280px]">{t('rec.sub')}</p>
      <div className="card p-4 w-full max-w-xs space-y-3">
        <div>
          <label className="text-xs text-dim block mb-1">{t('rec.q1')}</label>
          <select className="input" value={q1} onChange={e => setQ1(e.target.value)}>
            {RECOVERY_QUESTION_KEYS.map(k => <option key={k} value={k}>{t(k)}</option>)}
          </select>
          <input className="input mt-2" value={a1} onChange={e => setA1(e.target.value)} placeholder={t('rec.answer')} autoCapitalize="none" />
        </div>
        <div>
          <label className="text-xs text-dim block mb-1">{t('rec.q2')}</label>
          <select className="input" value={q2} onChange={e => setQ2(e.target.value)}>
            {RECOVERY_QUESTION_KEYS.map(k => <option key={k} value={k}>{t(k)}</option>)}
          </select>
          <input className="input mt-2" value={a2} onChange={e => setA2(e.target.value)} placeholder={t('rec.answer')} autoCapitalize="none" />
        </div>
      </div>
      <button className="btn-primary mt-5" style={{ width: '16rem', maxWidth: '100%' }} disabled={!valid || busy} onClick={done}>
        {busy ? t('rec.saving') : t('rec.save')}
      </button>
      <button className="text-faint text-xs mt-4 underline" onClick={onSkip}>{t('rec.skip')}</button>
    </div>
  );
}

/** Forgot PIN: verify answers → set a new PIN → data preserved. */
function RecoveryFlow({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const { getRecoveryQuestions, recoverPin, resetPin } = useStore();
  const t = useT();
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
      setError(t('recf.badAnswers'));
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
      setError(t('pin.mismatch'));
      setPin('');
      setStage('newpin');
      return;
    }
    if (!recovered) return;
    setBusy(true);
    const ok = await resetPin(recovered, pin);
    setBusy(false);
    if (ok) onDone();
    else setError(t('recf.error'));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--bg)', paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
      <ShieldQuestion size={44} className="text-green mb-3" />
      <h2 className="text-xl font-bold mb-1">{stage === 'answers' ? t('recf.recover') : stage === 'newpin' ? t('recf.newpin') : t('recf.confirmNew')}</h2>
      <p className="text-xs text-dim mb-5 text-center max-w-[280px]">
        {stage === 'answers' ? t('recf.subAnswers') : t('recf.subPin')}
      </p>

      {stage === 'answers' ? (
        <>
          <div className="card p-4 w-full max-w-xs space-y-3">
            {questions.map((q, i) => (
              <div key={q}>
                <label className="text-xs text-dim block mb-1">{t(q)}</label>
                <input className="input" value={answers[i]} autoCapitalize="none"
                  onChange={e => setAnswers(prev => prev.map((a, j) => j === i ? e.target.value : a))}
                  placeholder={t('rec.answer')} />
              </div>
            ))}
          </div>
          <div style={{ minHeight: 20, marginTop: 8 }}>{error && <p className="text-red text-xs animate-fade-in">{error}</p>}</div>
          <button className="btn-primary mt-2" style={{ width: '16rem', maxWidth: '100%' }}
            disabled={busy || answers.some(a => a.trim().length < 2)} onClick={verify}>
            {busy ? t('recf.verifying') : t('recf.verify')}
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center justify-center gap-3 mb-1" style={{ minHeight: 18 }}>
            {pin.length === 0
              ? <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{t('pin.digits')}</span>
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
            {busy ? t('recf.resetting') : stage === 'newpin' ? t('pin.continue') : t('recf.resetBtn')}
          </button>
        </>
      )}
      <button className="text-faint text-xs mt-4 underline" onClick={onBack}>{t('recf.back')}</button>
    </div>
  );
}

function ResetLink() {
  const { deleteAll, hasRecovery } = useStore();
  const t = useT();
  const [ask, setAsk] = useState(false);
  const [recover, setRecover] = useState(false);

  if (recover) {
    return <RecoveryFlow onDone={() => window.location.reload()} onBack={() => setRecover(false)} />;
  }
  if (!ask) {
    return (
      <button className="text-faint text-xs mt-5 underline" onClick={() => setAsk(true)}>{t('pin.forgot')}</button>
    );
  }
  const canRecover = hasRecovery();
  return (
    <div className="card p-4 mt-5 max-w-xs text-center">
      {canRecover && (
        <>
          <p className="text-xs text-dim mb-3">{t('reset.explainRecover')}</p>
          <button className="btn-primary mb-3" onClick={() => setRecover(true)}>
            <ShieldQuestion size={15} /> {t('reset.btn')}
          </button>
        </>
      )}
      <p className="text-xs text-dim mb-3">{canRecover ? t('reset.forgotAnswers') : t('reset.noPin')}</p>
      <button className="btn-primary" style={{ background: 'var(--red)' }} onClick={deleteAll}>
        <Trash2 size={15} /> {t('reset.erase')}
      </button>
    </div>
  );
}
