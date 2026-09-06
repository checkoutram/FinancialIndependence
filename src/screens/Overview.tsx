// Screen 1 — Overview / Hero Dashboard
import { useMemo } from 'react';
import { useStore } from '../utils/store';
import {
  computeFireSummary, fmt, fmtFull, pct, countryOf, monthlyExpensesBase, monthlyIncomeBase,
  totalFinancialAssets, totalRealAssets, totalLiabilities, recommendedAllocation,
  FIRE_TYPES, fireTypeCorpus, buildRetirementPlan,
} from '../utils/engine';
import { Card, CardTitle, Stat, ProgressBar, EmptyState, InfoBox } from '../components/ui';
import { TestDataControls } from '../components/TestDataControls';
import { DoughnutChart, BarChart } from '../components/charts';
import { Flame, TrendingUp, TrendingDown, Minus, ClipboardList, PieChart as PieIcon, Wallet } from 'lucide-react';

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
        <EmptyState
          icon={<ClipboardList size={26} />}
          title="Let's build your FIRE plan"
          body="Start by entering your family details, income and expenses on the Inputs tab. It takes about 5 minutes, and every field explains what to enter with examples."
          action={<button className="btn-primary" onClick={() => go('inputs')}>Open Inputs</button>}
        />
        <TestDataControls />
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

  return (
    <div className="p-4 pt-5 pb-8 space-y-4 animate-fade-in">
      <Header />

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
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-extrabold flex items-center gap-2"><Flame size={20} className="text-amber" /> FIRE Tracker</h1>
        <p className="text-xs text-faint">{data?.family.self.name ? `Hello, ${data.family.self.name.split(' ')[0]}` : 'Your financial independence dashboard'}</p>
      </div>
      <div className="flex gap-2">
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
