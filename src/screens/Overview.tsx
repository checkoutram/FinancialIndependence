// Screen 1 — Overview / Hero Dashboard
import { useMemo, useState } from 'react';
import { useStore } from '../utils/store';
import {
  computeFireSummary, fmt, fmtFull, pct, countryOf, monthlyExpensesBase, monthlyIncomeBase,
  totalFinancialAssets, totalRealAssets, totalLiabilities, recommendedAllocation,
  FIRE_TYPES, fireTypeCorpus, buildRetirementPlan,
} from '../utils/engine';
import { Card, CardTitle, Stat, ProgressBar, InfoBox } from '../components/ui';
import { DoughnutChart, BarChart } from '../components/charts';
import { Flame, TrendingUp, TrendingDown, Minus, PieChart as PieIcon, Wallet, CloudUpload, X } from 'lucide-react';
import { PremiumStatus } from '../components/Premium';
import { backupDue, lastBackupAt, exportBackup, BACKUP_REMINDER_DAYS } from '../utils/backup';

/** Weekly backup reminder banner + back-up-now action. */
function BackupReminder() {
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
        setDoneMsg('Backup saved — keep the file somewhere safe (Drive, Gmail, WhatsApp).');
        force(x => x + 1);
      }
    } catch {
      setDoneMsg('Backup failed — please try again.');
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
            <div className="font-semibold">Back up your data</div>
            <div className="text-dim">
              {last ? `Last backup: ${new Date(last).toLocaleDateString()}` : 'No backup yet'} — if you lose this phone, only a backup can restore your plan. We remind you every {BACKUP_REMINDER_DAYS} days.
            </div>
          </>
        )}
      </div>
      {!doneMsg && (
        <button className="btn-primary text-xs px-3 py-2" disabled={busy} onClick={run}>
          {busy ? '…' : 'Back up'}
        </button>
      )}
      <button onClick={() => setDismissed(true)} className="text-faint shrink-0 p-1"><X size={14} /></button>
    </div>
  );
}

export default function Overview({ go }: { go: (s: string) => void }) {
  const { data } = useStore();
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
              Do you know <span style={{ color: 'var(--amber)' }}>how much you should save every month</span> to retire comfortably?
            </p>
            <p className="text-lg font-bold leading-snug animate-fade-in">
              Do you know <span className="text-green">when you can financially retire</span> — the exact year?
            </p>
            <p className="text-xs text-dim animate-fade-in">Most people don't. In the next 5 minutes, you will.</p>
          </div>
          <button className="btn-primary" onClick={() => go('inputs')}>Find out — build my plan</button>
          <p className="hint">Free for 30 days · Every field explained with examples · Nothing pre-filled</p>
        </div>

        {/* What you'll discover */}
        <Card>
          <CardTitle>What you'll discover</CardTitle>
          <div className="space-y-3 mt-3 text-xs">
            <div className="flex gap-3 items-start">
              <span className="text-base">🎯</span>
              <div><b>Your FIRE number</b><span className="text-dim"> — the exact corpus you need so work becomes optional</span></div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-base">📅</span>
              <div><b>Your retirement year</b><span className="text-dim"> — and how every extra ₹1,000/month moves it earlier</span></div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-base">💰</span>
              <div><b>Your monthly saving target</b><span className="text-dim"> — the SIP amount that actually gets you there</span></div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-base">👨‍👩‍👧‍👦</span>
              <div><b>Your family's goals, funded</b><span className="text-dim"> — kids' education, marriage, dream trips, all mapped</span></div>
            </div>
          </div>
        </Card>

        <InfoBox>
          The app computes your FIRE number, savings gap, goal projections and milestones from the data you enter.
          Nothing is pre-filled — your numbers stay encrypted on this device.
        </InfoBox>
      </div>
    );
  }

  const statusMeta = {
    ontrack: { label: 'On Track', cls: 'badge-green', icon: <TrendingUp size={15} /> },
    behind: { label: 'Behind', cls: 'badge-amber', icon: <Minus size={15} /> },
    deficit: { label: 'Deficit', cls: 'badge-red', icon: <TrendingDown size={15} /> },
    unknown: { label: 'Needs Data', cls: 'badge-amber', icon: <Minus size={15} /> },
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
              <p className="text-xs text-dim uppercase tracking-wide mb-1">You should save every month</p>
              <p className="text-3xl font-extrabold tabular" style={{ color: 'var(--green)' }}>{fmtFull(Math.ceil(monthlyTarget / 100) * 100, sym)}</p>
              <p className="text-xs text-dim mt-1">to fund all your goals and FIRE on time</p>
            </div>
          )}
          {s.fireNumber != null && (
            <div className="text-center pt-3" style={{ borderTop: '1px solid var(--card-border)' }}>
              <p className="text-xs text-dim uppercase tracking-wide mb-1">Your FIRE retirement amount</p>
              <p className="text-3xl font-extrabold tabular" style={{ color: 'var(--amber)' }}>{fmt(s.fireNumber, sym)}</p>
              <p className="text-xs text-dim mt-1">
                needed in <b>{s.yearsToRetire} years</b>
                {retireYear ? ` — you can retire in ${retireYear} at age ${s.retireAge}` : ''}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Hero status */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <span className={`badge ${statusMeta.cls} flex items-center gap-1`}>{statusMeta.icon} {statusMeta.label}</span>
          {s.savingsRate != null && <span className="text-xs text-dim">Savings rate <b className="tabular">{pct(s.savingsRate, 0)}</b></span>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Stat label="FIRE Number" value={s.fireNumber != null ? fmt(s.fireNumber, sym) : '—'} sub={s.fireNumber != null ? `at ${pct(d.assumptions.withdrawalRate, 0)} withdrawal` : 'set retirement inputs'} />
          <Stat label="Corpus at Retire Age" value={corpusAtRetire != null ? fmt(corpusAtRetire, sym) : '—'} sub="projected" />
          <Stat label="Current Age" value={s.currentAge != null ? `${s.currentAge}` : '—'} sub={s.retireAge != null ? `FIRE at ${s.retireAge}` : 'set your DOB'} />
          <Stat label="Years Left" value={s.yearsToRetire != null ? `${s.yearsToRetire}` : '—'} sub={s.yearsToRetire != null ? `until age ${s.retireAge}` : ''} />
        </div>
        {s.corpusGap != null && s.corpusGap > 0 && s.fireNumber != null && s.projectedRetirementCorpus != null && s.retireAge != null && (
          <div className="text-sm rounded-xl p-3 space-y-1.5" style={{ background: 'color-mix(in srgb, var(--amber) 14%, transparent)' }}>
            <p>
              Projected corpus <b>{fmt(s.projectedRetirementCorpus, sym)}</b> at {s.retireAge} falls short of your{' '}
              <b>{fmt(s.fireNumber, sym)}</b> FIRE number by <b className="text-amber">{fmt(s.corpusGap, sym)}</b>.
            </p>
            <p className="text-dim text-xs">
              To close the gap: invest <b className="text-amber">{s.extraMonthlyNeeded != null ? `~${fmtFull(Math.ceil(s.extraMonthlyNeeded / 100) * 100, sym)}` : 'more'}/month</b> extra,
              retire 2–3 years later, or plan a lower retirement expense.
            </p>
          </div>
        )}
        {s.monthlyGap != null && s.monthlyGap < 0 && s.retireAge != null && (
          <div className="text-sm rounded-xl p-3" style={{ background: 'color-mix(in srgb, var(--red) 12%, transparent)' }}>
            You need <b className="text-red">{fmtFull(Math.abs(s.monthlyGap), sym)}</b> more per month to reach FIRE by age {s.retireAge}.
          </div>
        )}
        {s.monthlyGap != null && s.monthlyGap >= 0 && (
          <div className="text-sm rounded-xl p-3" style={{ background: 'color-mix(in srgb, var(--green) 12%, transparent)' }}>
            You have a surplus of <b className="text-green">{fmtFull(s.monthlyGap, sym)}</b>/month above your planned investments. 
          </div>
        )}
      </Card>

      {/* Gap analysis */}
      <Card>
        <CardTitle>Gap Analysis</CardTitle>
        {s.requiredMonthly > 0 || hasIncome ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <Stat label="Current monthly savings" value={fmtFull(Math.round(s.currentSavings), sym)} />
              <Stat label="Required monthly savings" value={fmtFull(Math.round(s.requiredMonthly), sym)} sub="planned SIPs for all goals" />
              <Stat label={s.monthlyGap != null && s.monthlyGap < 0 ? 'Monthly shortfall' : 'Monthly surplus'} value={s.monthlyGap != null ? fmtFull(Math.abs(Math.round(s.monthlyGap)), sym) : '—'} tone={s.monthlyGap != null && s.monthlyGap < 0 ? 'red' : 'green'} />
              <Stat label={s.annualGap != null && s.annualGap < 0 ? 'Annual shortfall' : 'Annual surplus'} value={s.annualGap != null ? fmtFull(Math.abs(Math.round(s.annualGap)), sym) : '—'} tone={s.annualGap != null && s.annualGap < 0 ? 'red' : 'green'} />
            </div>
            <p className="text-xs text-dim leading-relaxed">
              {s.monthlyGap == null && 'Enter income, expenses and goal SIPs to see your gap.'}
              {s.monthlyGap != null && s.monthlyGap >= 0 && 'Your current savings cover all planned goal investments. Consider deploying the surplus.'}
              {s.monthlyGap != null && s.monthlyGap < 0 && Math.abs(s.monthlyGap) <= 0.25 * s.requiredMonthly && 'A small gap — a modest SIP increase, a yearly step-up, or trimming discretionary spending can close it.'}
              {s.monthlyGap != null && s.monthlyGap < 0 && Math.abs(s.monthlyGap) > 0.25 * s.requiredMonthly && 'A significant gap — revisit goal targets, extend timelines, increase income, or prioritise which goals matter most.'}
            </p>
          </>
        ) : (
          <p className="text-sm text-dim">Enter income & expenses in <button className="text-accent underline" onClick={() => go('inputs')}>Inputs</button> and goal SIPs in <button className="text-accent underline" onClick={() => go('goals')}>Goals</button>.</p>
        )}
      </Card>

      {/* Asset allocation */}
      {alloc && (
        <Card>
          <CardTitle>Recommended Allocation <span className="text-xs text-faint font-normal">age {s.currentAge}</span></CardTitle>
          <div className="flex gap-4 items-center">
            <div className="w-32 shrink-0">
              <DoughnutChart labels={['Equity', 'Debt', 'Gold', 'Cash']} values={[alloc.equity, alloc.debt, alloc.gold, alloc.cash]} />
            </div>
            <div className="flex-1 space-y-1.5 text-xs">
              {(['equity', 'debt', 'gold', 'cash'] as const).map(k => (
                <div key={k} className="flex justify-between">
                  <span className="text-dim capitalize">{k}</span>
                  <span className="font-bold tabular">{alloc[k]}%{s.requiredMonthly > 0 && ` · ${fmt(Math.round(s.requiredMonthly * alloc[k] / 100), sym)}/mo`}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="hint mt-3">
            {s.yearsToRetire != null && s.yearsToRetire > 15
              ? 'With a long runway, equity can compound through market cycles. Rebalance yearly.'
              : 'As FIRE approaches, glide toward debt to protect the corpus you have built.'}
          </p>
        </Card>
      )}

      {/* Goal progress */}
      <GoalProgress go={go} />

      {/* Milestones */}
      {milestones.length > 0 && (
        <Card>
          <CardTitle>FIRE Milestones</CardTitle>
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
          <CardTitle right={<PieIcon size={15} className="text-faint" />}>Net Worth</CardTitle>
          <div className="flex gap-4 items-center">
            <div className="w-32 shrink-0">
              <DoughnutChart
                labels={['Financial', 'Real estate']}
                values={[finAssets, realAssets]}
                colors={['#38bdf8', '#a78bfa']}
              />
            </div>
            <div className="flex-1 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-dim">Financial assets</span><b className="tabular">{fmt(finAssets, sym)}</b></div>
              <div className="flex justify-between"><span className="text-dim">Real assets</span><b className="tabular">{fmt(realAssets, sym)}</b></div>
              <div className="flex justify-between"><span className="text-dim">Liabilities</span><b className="tabular text-red">-{fmt(liabs, sym)}</b></div>
              <div className="flex justify-between border-t pt-2" style={{ borderColor: 'var(--card-border)' }}><span>Net worth</span><b className="tabular text-accent">{fmt(netWorth, sym)}</b></div>
            </div>
          </div>
        </Card>
      )}

      {/* Cash flow */}
      {income > 0 && (
        <Card>
          <CardTitle right={<Wallet size={15} className="text-faint" />}>Monthly Cash Flow</CardTitle>
          <div style={{ height: 150 }}>
            <BarChart
              labels={['Income', 'Expenses', 'Savings']}
              series={[{
                label: 'Monthly',
                data: [income, expenses, income - expenses],
                color: ['#34d399', '#f87171', income - expenses >= 0 ? '#38bdf8' : '#fbbf24'],
              }]}
            />
          </div>
        </Card>
      )}

      <p className="text-[10px] text-faint text-center px-6">
        Projections are estimates based on your assumptions, not investment advice. Review yearly.
      </p>
    </div>
  );
}

function Header() {
  const { data, lock, theme, toggleTheme } = useStore();
  const [backingUp, setBackingUp] = useState(false);
  const backup = async () => {
    if (backingUp) return;
    setBackingUp(true);
    try { await exportBackup(); } catch { /* user cancelled or failed silently */ }
    setBackingUp(false);
  };
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-extrabold flex items-center gap-2"><img src="./icon.png" alt="FIRE Tracker" className="w-7 h-7 rounded-lg" /> FIRE Tracker</h1>
        <p className="text-xs text-faint">{data?.family.self.name ? `Hello, ${data.family.self.name.split(' ')[0]}` : 'Your financial independence dashboard'}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={backup} disabled={backingUp} title="Back up data" className="text-xs text-dim px-2.5 py-1.5 rounded-lg no-print flex items-center gap-1" style={{ background: 'var(--input-bg)' }}>
          <CloudUpload size={13} /> {backingUp ? '…' : 'Backup'}
        </button>
        <button onClick={toggleTheme} className="text-xs text-dim px-3 py-1.5 rounded-lg no-print" style={{ background: 'var(--input-bg)' }}>
          {theme === 'dark' ? '☀ Light' : '☾ Dark'}
        </button>
        <button onClick={lock} className="text-xs text-dim px-3 py-1.5 rounded-lg no-print" style={{ background: 'var(--input-bg)' }}>Lock</button>
      </div>
    </div>
  );
}

function GoalProgress({ go }: { go: (s: string) => void }) {
  const { data } = useStore();
  const d = data!;
  const items: Array<{ name: string; pct: number | null; detail: string }> = [];

  // Retirement progress
  const s = computeFireSummary(d);
  if (s.fireNumber != null) {
    const fin = totalFinancialAssets(d.financialAssets, d);
    items.push({ name: 'Retirement / FIRE', pct: (fin / s.fireNumber) * 100, detail: `${fmt(fin, countryOf(d).currencySymbol)} of ${fmt(s.fireNumber, countryOf(d).currencySymbol)}` });
  }
  for (const og of d.goals.others) {
    if (og.cost && og.years) {
      items.push({ name: og.name || 'Goal', pct: 0, detail: `${fmt(og.cost, countryOf(d).currencySymbol)} in ${og.years} yrs` });
    }
  }
  const childCount = d.goals.children.filter(cg => cg.ugCostBase || cg.pgCost || cg.marriageCost).length;
  if (childCount > 0) {
    const total = d.goals.children.reduce((sum, cg) => sum + (cg.ugCostBase || 0) + (cg.pgCost || 0) + (cg.marriageCost || 0), 0);
    items.push({ name: `Children goals (${childCount})`, pct: null, detail: `${fmt(total, countryOf(d).currencySymbol)} today, inflated at ${pct(d.assumptions.educationInflation, 0)}` });
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardTitle>Goal Progress</CardTitle>
        <p className="text-sm text-dim">No goals yet. Add retirement, children and other goals on the <button className="text-accent underline" onClick={() => go('goals')}>Goals</button> tab.</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>Goal Progress</CardTitle>
      <div className="space-y-3">
        {items.map(it => (
          <div key={it.name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-dim">{it.name}</span>
              <span className="tabular text-faint">{it.detail}</span>
            </div>
            {it.pct != null
              ? <ProgressBar value={it.pct} />
              : <p className="hint">See year-by-year coverage on the Projections tab.</p>}
          </div>
        ))}
      </div>
    </Card>
  );
}
