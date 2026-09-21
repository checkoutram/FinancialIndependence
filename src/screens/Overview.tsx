// Screen 1 — Overview / Hero Dashboard
import { useMemo, useRef, useState } from 'react';
import { useStore } from '../utils/store';
import {
  computeFireSummary, fmt, fmtFull, pct, countryOf, monthlyExpensesBase, monthlyIncomeBase,
  totalFinancialAssets, totalRealAssets, totalLiabilities, recommendedAllocation,
  FIRE_TYPES, fireTypeCorpus, buildRetirementPlan,
} from '../utils/engine';
import { Card, CardTitle, Stat, ProgressBar, InfoBox } from '../components/ui';
import { DoughnutChart, BarChart } from '../components/charts';
import { Flame, TrendingUp, TrendingDown, Minus, PieChart as PieIcon, Wallet, CloudUpload, X, Sun, Moon, Lock as LockIcon, FileUp } from 'lucide-react';
import { PremiumStatus } from '../components/Premium';
import { backupDue, lastBackupAt, exportBackup, restoreBackup, BACKUP_REMINDER_DAYS } from '../utils/backup';
import { useT, LangToggle } from '../utils/i18n';

/** Weekly backup reminder banner + back-up-now action. */
function BackupReminder() {
  const t = useT();
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [doneMsg, setDoneMsg] = useState('');
  const [, force] = useState(0);
  if (dismissed) return null;
  const due = backupDue();
  const last = lastBackupAt();
  if (!due && !doneMsg) return null;

  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await exportBackup();
      if (r !== 'cancelled') {
        setDoneMsg(t('bk.done'));
        force(x => x + 1);
      }
    } catch {
      setDoneMsg(t('bk.fail'));
    }
    setBusy(false);
  };

  return (
    <div className="card p-3 flex items-center gap-3" style={{ borderColor: due && !doneMsg ? 'var(--amber)' : 'var(--card-border)' }}>
      <CloudUpload size={20} className="text-amber shrink-0" />
      <div className="flex-1 text-xs">
        {doneMsg ? (
          <span className="text-dim">{doneMsg}</span>
        ) : (
          <>
            <div className="font-semibold">{t('bk.title')}</div>
            <div className="text-dim">
              {last ? t('bk.last', { date: new Date(last).toLocaleDateString() }) : t('bk.none')}{t('bk.tail', { days: BACKUP_REMINDER_DAYS })}
            </div>
          </>
        )}
      </div>
      {!doneMsg && (
        <button className="btn-primary text-xs px-3 py-2" disabled={busy} onClick={run}>
          {busy ? '…' : t('bk.btn')}
        </button>
      )}
      <button onClick={() => setDismissed(true)} className="text-faint shrink-0 p-1"><X size={14} /></button>
    </div>
  );
}

export default function Overview({ go }: { go: (s: string) => void }) {
  const { data } = useStore();
  const t = useT();
  const d = data!;
  const c = countryOf(d);
  const sym = c.currencySymbol;

  const s = useMemo(() => computeFireSummary(d), [d]);
  const hasIncome = monthlyIncomeBase(d) > 0;
  const hasProfile = !!d.family.self.dob && !!d.goals.retirement.retireAgeSelf;

  if (!hasProfile && !hasIncome) {
    return (
      <div className="p-4 pt-5 pb-8 space-y-4">
        <Header />

        {/* Curiosity hook hero */}
        <div className="card p-5 text-center space-y-4" style={{ background: 'linear-gradient(160deg, var(--card) 0%, var(--bg-soft) 100%)' }}>
          <img src="./icon.png" alt="FIRE Tracker" className="w-16 h-16 rounded-2xl mx-auto animate-fade-in" />
          <div className="space-y-3">
            <p className="text-lg font-bold leading-snug animate-fade-in">
              {t('hero.q1pre')}<span style={{ color: 'var(--amber)' }}>{t('hero.q1hl')}</span>{t('hero.q1post')}
            </p>
            <p className="text-lg font-bold leading-snug animate-fade-in">
              {t('hero.q2pre')}<span className="text-green">{t('hero.q2hl')}</span>{t('hero.q2post')}
            </p>
            <p className="text-xs text-dim animate-fade-in">{t('hero.sub')}</p>
          </div>
          <button className="btn-primary" onClick={() => go('inputs')}>{t('hero.cta')}</button>
          <p className="hint">{t('hero.hint')}</p>
        </div>

        {/* What you'll discover */}
        <Card>
          <CardTitle>{t('hero.discover')}</CardTitle>
          <div className="space-y-3 mt-3 text-xs">
            <div className="flex gap-3 items-start">
              <span className="text-base">🎯</span>
              <div><b>{t('hero.d1b')}</b><span className="text-dim">{t('hero.d1r')}</span></div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-base">📅</span>
              <div><b>{t('hero.d2b')}</b><span className="text-dim">{t('hero.d2r')}</span></div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-base">💰</span>
              <div><b>{t('hero.d3b')}</b><span className="text-dim">{t('hero.d3r')}</span></div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-base">👨‍👩‍👧‍👦</span>
              <div><b>{t('hero.d4b')}</b><span className="text-dim">{t('hero.d4r')}</span></div>
            </div>
          </div>
        </Card>

        <InfoBox>{t('hero.info')}</InfoBox>
      </div>
    );
  }

  const statusMeta = {
    ontrack: { label: t('st.ontrack'), cls: 'badge-green', icon: <TrendingUp size={15} /> },
    behind: { label: t('st.behind'), cls: 'badge-amber', icon: <Minus size={15} /> },
    deficit: { label: t('st.deficit'), cls: 'badge-red', icon: <TrendingDown size={15} /> },
    unknown: { label: t('st.unknown'), cls: 'badge-amber', icon: <Minus size={15} /> },
  }[s.status];

  const finAssets = totalFinancialAssets(d.financialAssets, d);
  const realAssets = totalRealAssets(d.realAssets, d);
  const liabs = totalLiabilities(d.liabilities, d);
  const netWorth = finAssets + realAssets - liabs;

  const income = monthlyIncomeBase(d);
  const expenses = monthlyExpensesBase(d.cashFlow.expenses, d);

  const alloc = s.currentAge != null ? recommendedAllocation(s.currentAge) : null;

  const milestones = s.fireNumber && s.yearsToRetire != null
    ? FIRE_TYPES.map(t => ({
        name: t.name,
        corpus: fireTypeCorpus(t, s.fireNumber!, s.yearsToRetire!, d.assumptions.equityReturn),
        progress: Math.min(100, (finAssets / fireTypeCorpus(t, s.fireNumber!, s.yearsToRetire!, d.assumptions.equityReturn)) * 100),
      }))
    : [];

  const retRows = buildRetirementPlan(d);
  const corpusAtRetire = retRows && s.yearsToRetire != null && retRows.length >= s.yearsToRetire
    ? retRows[s.yearsToRetire - 1].closing : null;

  // USP hero: monthly saving target + FIRE number, front and centre
  const monthlyTarget = s.requiredMonthly > 0
    ? s.requiredMonthly + (s.extraMonthlyNeeded != null && s.extraMonthlyNeeded > 0 ? s.extraMonthlyNeeded : 0)
    : (s.extraMonthlyNeeded != null && s.extraMonthlyNeeded > 0 ? s.extraMonthlyNeeded : 0);
  const retireYear = s.retireAge != null && s.currentAge != null
    ? new Date().getFullYear() + (s.yearsToRetire ?? 0)
    : null;

  return (
    <div className="p-4 pt-5 pb-8 space-y-4 animate-fade-in">
      <Header />
      <PremiumStatus />
      <BackupReminder />

      {/* USP hero — the two numbers everyone wants to know */}
      {(monthlyTarget > 0 || s.fireNumber != null) && (
        <div className="card p-5 space-y-4" style={{ background: 'linear-gradient(150deg, color-mix(in srgb, var(--green) 16%, var(--card)) 0%, var(--card) 60%)', borderColor: 'color-mix(in srgb, var(--green) 35%, transparent)' }}>
          {monthlyTarget > 0 && (
            <div className="text-center">
              <p className="text-xs text-dim uppercase tracking-wide mb-1">{t('usp.saveLabel')}</p>
              <p className="text-3xl font-extrabold tabular" style={{ color: 'var(--green)' }}>{fmtFull(Math.ceil(monthlyTarget / 100) * 100, sym)}</p>
              <p className="text-xs text-dim mt-1">{t('usp.saveSub')}</p>
            </div>
          )}
          {s.fireNumber != null && (
            <div className="text-center pt-3" style={{ borderTop: '1px solid var(--card-border)' }}>
              <p className="text-xs text-dim uppercase tracking-wide mb-1">{t('usp.fireLabel')}</p>
              <p className="text-3xl font-extrabold tabular" style={{ color: 'var(--amber)' }}>{fmt(s.fireNumber, sym)}</p>
              <p className="text-xs text-dim mt-1">
                {t('usp.neededIn', { n: s.yearsToRetire ?? 0 })}
                {retireYear ? t('usp.retireIn', { year: retireYear, age: s.retireAge ?? 0 }) : ''}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Hero status */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <span className={`badge ${statusMeta.cls} flex items-center gap-1`}>{statusMeta.icon} {statusMeta.label}</span>
          {s.savingsRate != null && <span className="text-xs text-dim">{t('ov.savingsRate')} <b className="tabular">{pct(s.savingsRate, 0)}</b></span>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Stat label={t('stt.fireNumber')} value={s.fireNumber != null ? fmt(s.fireNumber, sym) : '—'} sub={s.fireNumber != null ? t('stt.atWithdrawal', { x: pct(d.assumptions.withdrawalRate, 0) ?? '' }) : t('stt.setRetInputs')} />
          <Stat label={t('stt.corpusAt')} value={corpusAtRetire != null ? fmt(corpusAtRetire, sym) : '—'} sub={t('stt.projected')} />
          <Stat label={t('stt.curAge')} value={s.currentAge != null ? `${s.currentAge}` : '—'} sub={s.retireAge != null ? t('stt.fireAt', { age: s.retireAge }) : t('stt.setDob')} />
          <Stat label={t('stt.yearsLeft')} value={s.yearsToRetire != null ? `${s.yearsToRetire}` : '—'} sub={s.yearsToRetire != null ? t('stt.untilAge', { age: s.retireAge ?? 0 }) : ''} />
        </div>
        {s.corpusGap != null && s.corpusGap > 0 && s.fireNumber != null && s.projectedRetirementCorpus != null && s.retireAge != null && (
          <div className="text-sm rounded-xl p-3 space-y-1.5" style={{ background: 'color-mix(in srgb, var(--amber) 14%, transparent)' }}>
            <p>
              {t('gap.text', { proj: fmt(s.projectedRetirementCorpus, sym), age: s.retireAge, fire: fmt(s.fireNumber, sym), gap: fmt(s.corpusGap, sym) })}
            </p>
            <p className="text-dim text-xs">
              {t('gap.advice', { amt: s.extraMonthlyNeeded != null ? `~${fmtFull(Math.ceil(s.extraMonthlyNeeded / 100) * 100, sym)}` : '—' })}
            </p>
          </div>
        )}
        {s.monthlyGap != null && s.monthlyGap < 0 && s.retireAge != null && (
          <div className="text-sm rounded-xl p-3" style={{ background: 'color-mix(in srgb, var(--red) 12%, transparent)' }}>
            {t('gap.need', { amt: fmtFull(Math.abs(s.monthlyGap), sym), age: s.retireAge })}
          </div>
        )}
        {s.monthlyGap != null && s.monthlyGap >= 0 && (
          <div className="text-sm rounded-xl p-3" style={{ background: 'color-mix(in srgb, var(--green) 12%, transparent)' }}>
            {t('gap.surplus', { amt: fmtFull(s.monthlyGap, sym) })}
          </div>
        )}
      </Card>

      {/* Gap analysis */}
      <Card>
        <CardTitle>{t('ga.title')}</CardTitle>
        {s.requiredMonthly > 0 || hasIncome ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <Stat label={t('ga.curSave')} value={fmtFull(Math.round(s.currentSavings), sym)} />
              <Stat label={t('ga.reqSave')} value={fmtFull(Math.round(s.requiredMonthly), sym)} sub={t('ga.reqSaveSub')} />
              <Stat label={s.monthlyGap != null && s.monthlyGap < 0 ? t('ga.mShortfall') : t('ga.mSurplus')} value={s.monthlyGap != null ? fmtFull(Math.abs(Math.round(s.monthlyGap)), sym) : '—'} tone={s.monthlyGap != null && s.monthlyGap < 0 ? 'red' : 'green'} />
              <Stat label={s.annualGap != null && s.annualGap < 0 ? t('ga.aShortfall') : t('ga.aSurplus')} value={s.annualGap != null ? fmtFull(Math.abs(Math.round(s.annualGap)), sym) : '—'} tone={s.annualGap != null && s.annualGap < 0 ? 'red' : 'green'} />
            </div>
            <p className="text-xs text-dim leading-relaxed">
              {s.monthlyGap == null && t('ga.enter')}
              {s.monthlyGap != null && s.monthlyGap >= 0 && t('ga.ok')}
              {s.monthlyGap != null && s.monthlyGap < 0 && Math.abs(s.monthlyGap) <= 0.25 * s.requiredMonthly && t('ga.small')}
              {s.monthlyGap != null && s.monthlyGap < 0 && Math.abs(s.monthlyGap) > 0.25 * s.requiredMonthly && t('ga.big')}
            </p>
          </>
        ) : (
          <p className="text-sm text-dim">{t('ga.emptyPre')}<button className="text-accent underline" onClick={() => go('inputs')}>{t('ga.inputs')}</button>{t('ga.and')}<button className="text-accent underline" onClick={() => go('goals')}>{t('ga.goals')}</button>{t('ga.emptyPost')}</p>
        )}
      </Card>

      {/* Asset allocation */}
      {alloc && (
        <Card>
          <CardTitle>{t('alloc.title')} <span className="text-xs text-faint font-normal">{t('alloc.age', { n: s.currentAge ?? 0 })}</span></CardTitle>
          <div className="flex gap-4 items-center">
            <div className="w-32 shrink-0">
              <DoughnutChart labels={[t('alloc.equity'), t('alloc.debt'), t('alloc.gold'), t('alloc.cash')]} values={[alloc.equity, alloc.debt, alloc.gold, alloc.cash]} />
            </div>
            <div className="flex-1 space-y-1.5 text-xs">
              {(['equity', 'debt', 'gold', 'cash'] as const).map(k => (
                <div key={k} className="flex justify-between">
                  <span className="text-dim capitalize">{t(`alloc.${k}`)}</span>
                  <span className="font-bold tabular">{alloc[k]}%{s.requiredMonthly > 0 && ` · ${fmt(Math.round(s.requiredMonthly * alloc[k] / 100), sym)}/mo`}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="hint mt-3">
            {s.yearsToRetire != null && s.yearsToRetire > 15
              ? t('alloc.long')
              : t('alloc.short')}
          </p>
        </Card>
      )}

      {/* Goal progress */}
      <GoalProgress go={go} />

      {/* Milestones */}
      {milestones.length > 0 && (
        <Card>
          <CardTitle>{t('ms.title')}</CardTitle>
          <div className="space-y-3">
            {milestones.map(m => (
              <div key={m.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-dim">{m.name}</span>
                  <span className="tabular"><b>{fmt(m.corpus, sym)}</b> · {m.progress.toFixed(0)}%</span>
                </div>
                <ProgressBar value={m.progress} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Net worth */}
      {(finAssets > 0 || realAssets > 0 || liabs > 0) && (
        <Card>
          <CardTitle right={<PieIcon size={15} className="text-faint" />}>{t('nw.title')}</CardTitle>
          <div className="flex gap-4 items-center">
            <div className="w-32 shrink-0">
              <DoughnutChart
                labels={[t('chart.fin'), t('chart.real')]}
                values={[finAssets, realAssets]}
                colors={['#38bdf8', '#a78bfa']}
              />
            </div>
            <div className="flex-1 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-dim">{t('nw.fin')}</span><b className="tabular">{fmt(finAssets, sym)}</b></div>
              <div className="flex justify-between"><span className="text-dim">{t('nw.real')}</span><b className="tabular">{fmt(realAssets, sym)}</b></div>
              <div className="flex justify-between"><span className="text-dim">{t('nw.liab')}</span><b className="tabular text-red">-{fmt(liabs, sym)}</b></div>
              <div className="flex justify-between border-t pt-2" style={{ borderColor: 'var(--card-border)' }}><span>{t('nw.net')}</span><b className="tabular text-accent">{fmt(netWorth, sym)}</b></div>
            </div>
          </div>
        </Card>
      )}

      {/* Cash flow */}
      {income > 0 && (
        <Card>
          <CardTitle right={<Wallet size={15} className="text-faint" />}>{t('cf.title')}</CardTitle>
          <div style={{ height: 150 }}>
            <BarChart
              labels={[t('cf.income'), t('cf.expenses'), t('cf.savings')]}
              series={[{
                label: t('cf.monthly'),
                data: [income, expenses, income - expenses],
                color: ['#34d399', '#f87171', income - expenses >= 0 ? '#38bdf8' : '#fbbf24'],
              }]}
            />
          </div>
        </Card>
      )}

      <p className="text-[10px] text-faint text-center px-6">
        {t('ov.disclaimer')}
      </p>
    </div>
  );
}

function Header() {
  const { data, lock, theme, toggleTheme } = useStore();
  const t = useT();
  const [backingUp, setBackingUp] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const backup = async () => {
    if (backingUp) return;
    setBackingUp(true);
    try { await exportBackup(); } catch { /* user cancelled or failed silently */ }
    setBackingUp(false);
  };
  const importBackup = async (f: File | undefined) => {
    if (!f) return;
    if (!window.confirm(t('hdr.confirmRestore'))) return;
    const err = restoreBackup(await f.text());
    if (err) window.alert(t('hdr.importFail'));
    else window.location.reload();
  };
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0 shrink">
        <h1 className="text-lg font-extrabold flex items-center gap-2 whitespace-nowrap"><img src="./icon.png" alt="FIRE Tracker" className="w-7 h-7 rounded-lg shrink-0" /> FIRE Tracker</h1>
        <p className="text-xs text-faint truncate">{data?.family.self.name ? t('hdr.hello', { name: data.family.self.name.split(' ')[0] }) : t('hdr.tagline')}</p>
      </div>
      <div className="flex gap-1.5 items-center shrink-0">
        <LangToggle />
        <button onClick={backup} disabled={backingUp} title={t('bk.title')} aria-label={t('bk.title')} className="text-dim p-2 rounded-lg no-print flex items-center" style={{ background: 'var(--input-bg)' }}>
          <CloudUpload size={15} className={backingUp ? 'animate-pulse' : ''} />
        </button>
        <button onClick={() => fileRef.current?.click()} title={t('hdr.import')} aria-label={t('hdr.import')} className="text-dim p-2 rounded-lg no-print flex items-center" style={{ background: 'var(--input-bg)' }}>
          <FileUp size={15} />
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden"
          onChange={e => { void importBackup(e.target.files?.[0]); e.target.value = ''; }} />
        <button onClick={toggleTheme} title={theme === 'dark' ? t('hdr.light') : t('hdr.dark')} aria-label={theme === 'dark' ? t('hdr.light') : t('hdr.dark')} className="text-dim p-2 rounded-lg no-print" style={{ background: 'var(--input-bg)' }}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button onClick={lock} title={t('hdr.logout')} aria-label={t('hdr.logout')} className="text-dim p-2 rounded-lg no-print" style={{ background: 'var(--input-bg)' }}>
          <LockIcon size={15} />
        </button>
      </div>
    </div>
  );
}

function GoalProgress({ go }: { go: (s: string) => void }) {
  const { data } = useStore();
  const t = useT();
  const d = data!;
  const items: Array<{ name: string; pct: number | null; detail: string }> = [];

  // Retirement progress
  const s = computeFireSummary(d);
  if (s.fireNumber != null) {
    const fin = totalFinancialAssets(d.financialAssets, d);
    items.push({ name: t('gp.ret'), pct: (fin / s.fireNumber) * 100, detail: t('gp.of', { a: fmt(fin, countryOf(d).currencySymbol), b: fmt(s.fireNumber, countryOf(d).currencySymbol) }) });
  }
  for (const og of d.goals.others) {
    if (og.cost && og.years) {
      items.push({ name: og.name || t('pr.goal'), pct: 0, detail: t('gp.in', { cost: fmt(og.cost, countryOf(d).currencySymbol), yrs: og.years }) });
    }
  }
  const childCount = d.goals.children.filter(cg => cg.ugCostBase || cg.pgCost || cg.marriageCost).length;
  if (childCount > 0) {
    const total = d.goals.children.reduce((sum, cg) => sum + (cg.ugCostBase || 0) + (cg.pgCost || 0) + (cg.marriageCost || 0), 0);
    items.push({ name: t('gp.childGoals', { n: childCount }), pct: null, detail: t('gp.childDetail', { total: fmt(total, countryOf(d).currencySymbol), pct: pct(d.assumptions.educationInflation, 0) ?? '' }) });
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardTitle>{t('gp.title')}</CardTitle>
        <p className="text-sm text-dim">{t('gp.nonePre')}<button className="text-accent underline" onClick={() => go('goals')}>{t('gp.noneLink')}</button>{t('gp.nonePost')}</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>{t('gp.title')}</CardTitle>
      <div className="space-y-3">
        {items.map(it => (
          <div key={it.name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-dim">{it.name}</span>
              <span className="tabular text-faint">{it.detail}</span>
            </div>
            {it.pct != null
              ? <ProgressBar value={it.pct} />
              : <p className="hint">{t('gp.hint')}</p>}
          </div>
        ))}
      </div>
    </Card>
  );
}
