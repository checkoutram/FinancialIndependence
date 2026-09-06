// Screen 5 — Projections: dynamic plan selector + chart + year-by-year table
import { useMemo, useState } from 'react';
import { useStore } from '../utils/store';
import {
  buildRetirementPlan, buildChildrenPlan, buildOtherGoalPlan,
  countryOf, fmtFull, pct, type ProjectionRow,
} from '../utils/engine';
import { Card, CardTitle, EmptyState, InfoBox, SectionHeader, Field } from '../components/ui';
import { LineChart } from '../components/charts';
import { LineChart as LineIcon } from 'lucide-react';

interface PlanOption { key: string; label: string }

export default function Projections() {
  const { data } = useStore();
  const d = data!;
  const c = countryOf(d);

  const [sel, setSel] = useState<string>('retirement');

  const retirement = useMemo(() => buildRetirementPlan(d), [d]);

  // Per-child plans, built only when that child has relevant goals or a SIP exists
  const childPlans = useMemo(() => d.family.children.map(child => {
    const cg = d.goals.children.find(x => x.childId === child.id);
    const name = child.name || 'Child';
    const hasBase = !!(cg && (cg.ugCostBase || cg.pgCost || cg.marriageCost)) || !!(d.goals.childrenSipBase);
    const hasAlt = !!(cg && cg.ugCostAlt) || !!(d.goals.childrenSipAlt);
    return {
      child, name,
      base: hasBase ? buildChildrenPlan(d, false, child.id) : null,
      alt: hasAlt ? buildChildrenPlan(d, true, child.id) : null,
    };
  }), [d]);

  const otherGoals = d.goals.others.filter(g => g.years && g.monthlyInvestment);

  // Build the dropdown options dynamically from whatever data exists
  const options: PlanOption[] = [{ key: 'retirement', label: 'Retirement corpus' }];
  for (const cp of childPlans) {
    if (cp.base) options.push({ key: `child-inr:${cp.child.id}`, label: `${cp.name} — Education & Marriage (${c.currencySymbol})` });
    if (cp.alt) options.push({ key: `child-usd:${cp.child.id}`, label: `${cp.name} — Foreign UG (${c.altCurrencySymbol})` });
  }
  for (const g of otherGoals) options.push({ key: `other:${g.id}`, label: g.name || 'Goal' });
  options.push({ key: 'all', label: 'Consolidated (all goals)' });

  // Fall back to retirement if the selected plan no longer exists
  const tab = options.some(o => o.key === sel) ? sel : 'retirement';

  const multiChildNote = d.family.children.length > 1
    ? ` With ${d.family.children.length} children, the children SIP and children-mapped assets are split between them in proportion to their goal costs.`
    : '';

  let content = null;
  if (tab === 'retirement') {
    content = retirement
      ? <PlanView rows={retirement} symbol={c.currencySymbol} currency={c.baseCurrency} title="Retirement Corpus"
          note="Accumulation until your retirement year (contributions + growth), then decumulation as inflation-adjusted expenses are withdrawn. Corpus lasting past life expectancy means the plan holds." />
      : <NoData text="Set your date of birth (Inputs), retirement age, monthly expense and monthly investment (Goals) to see the retirement projection." />;
  } else if (tab.startsWith('child-inr:') || tab.startsWith('child-usd:')) {
    const [kind, childId] = tab.split(':') as [string, string];
    const alt = kind === 'child-usd';
    const cp = childPlans.find(x => x.child.id === childId);
    const plan = cp ? (alt ? cp.alt : cp.base) : null;
    const sym = alt ? c.altCurrencySymbol : c.currencySymbol;
    const cur = alt ? c.altCurrency : c.baseCurrency;
    const noSip = !(alt ? d.goals.childrenSipAlt : d.goals.childrenSipBase);
    content = plan
      ? <PlanView rows={plan.rows} symbol={sym} currency={cur} title={`${cp!.name} — ${alt ? 'Foreign UG' : 'Education & Marriage'} (${cur})`}
          note={(alt
            ? 'Foreign education corpus in USD-style assumptions: lower returns, lower inflation, 2% yearly SIP step-up.'
            : 'Corpus built from children-mapped assets plus the monthly SIP. Withdrawals: UG spread over 4 years, PG over 2, marriage at the target year — all inflated to the withdrawal year.')
            + multiChildNote
            + (noSip ? ` No children SIP (${sym}) is set on the Goals tab — the corpus below is only mapped assets, so it will likely run out. Add a SIP to fund this goal.` : '')} />
      : <NoData text="Set this child's goal costs/years on the Goals tab." />;
  } else if (tab === 'all') {
    content = <Consolidated retirement={retirement}
      childrenInr={childPlans.map(cp => ({ name: cp.name, rows: cp.base?.rows || null }))}
      others={otherGoals.map(g => ({ name: g.name || 'Goal', rows: buildOtherGoalPlan(d, g.id)?.rows || [] }))} />;
  } else if (tab.startsWith('other:')) {
    const g = d.goals.others.find(x => x.id === tab.slice(6));
    const plan = g ? buildOtherGoalPlan(d, g.id) : null;
    content = plan
      ? <PlanView rows={plan.rows} symbol={c.currencySymbol} currency={c.baseCurrency} title={g!.name || 'Goal'}
          note="Corpus grows until the goal year, when the inflated goal cost is withdrawn." />
      : <NoData text="This goal needs a cost, years and monthly investment on the Goals tab." />;
  }

  return (
    <div className="p-4 pt-5 pb-8 space-y-4 animate-fade-in">
      <SectionHeader title="Projections" subtitle="Year-by-year compounding with a glide path that de-risks as the goal nears." />
      <Field label="Plan to view" hint="The list grows as you add children goals and other goals.">
        <select className="input no-print" value={tab} onChange={e => setSel(e.target.value)}>
          {options.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </Field>
      {content}
    </div>
  );
}

function NoData({ text }: { text: string }) {
  return <EmptyState icon={<LineIcon size={26} />} title="Not enough data yet" body={text} />;
}

function PlanView({ rows, symbol, currency, title, note }: {
  rows: ProjectionRow[]; symbol: string; currency: 'INR' | 'USD'; title: string; note: string;
}) {
  const labels = rows.map(r => r.age != null ? `${r.year} (${r.age})` : r.year);
  const exhausted = rows.find(r => r.closing < 0);
  return (
    <>
      <Card>
        <CardTitle>{title}</CardTitle>
        {exhausted && (
          <div className="mb-3 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: 'color-mix(in srgb, var(--red) 12%, transparent)', color: 'var(--red)', border: '1px solid color-mix(in srgb, var(--red) 30%, transparent)' }}>
            ⚠ Corpus runs out in {exhausted.year}{exhausted.age != null ? ` (age ${exhausted.age})` : ''} under these assumptions. Increase SIPs, lower expenses, or extend the working years.
          </div>
        )}
        <div style={{ height: 220 }}>
          <LineChart labels={labels} series={[
            { label: 'Corpus (closing)', data: rows.map(r => r.closing), color: '#38bdf8', fill: true },
            { label: 'Withdrawals', data: rows.map(r => r.withdrawal || null), color: '#f87171', dashed: true },
          ]} />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div><div className="text-[10px] text-faint uppercase">Peak corpus</div><div className="font-bold text-sm tabular">{fmtFull(Math.max(...rows.map(r => r.closing)), symbol, currency)}</div></div>
          <div><div className="text-[10px] text-faint uppercase">Final corpus</div><div className={`font-bold text-sm tabular ${rows[rows.length - 1].closing < 0 ? 'text-red' : 'text-green'}`}>{fmtFull(rows[rows.length - 1].closing, symbol, currency)}</div></div>
          <div><div className="text-[10px] text-faint uppercase">Total withdrawn</div><div className="font-bold text-sm tabular">{fmtFull(rows.reduce((s, r) => s + r.withdrawal, 0), symbol, currency)}</div></div>
        </div>
      </Card>
      <InfoBox>{note}</InfoBox>
      <Card>
        <CardTitle>Year-by-year</CardTitle>
        <div className="table-wrap max-h-96 overflow-y-auto">
          <table className="data-table tabular">
            <thead>
              <tr>
                <th>Year{rows[0]?.age != null ? ' (age)' : ''}</th><th>Invest/mo</th><th>Opening</th><th>Return {''}</th><th>Withdrawal</th><th>Closing</th><th>Eq%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.year}>
                  <td>{r.year}{r.age != null ? ` (${r.age})` : ''}</td>
                  <td>{r.monthlyInvest > 0 ? fmtFull(r.monthlyInvest, symbol, currency) : '—'}</td>
                  <td>{fmtFull(r.opening, symbol, currency)}</td>
                  <td className="text-green">{fmtFull(r.returns, symbol, currency)}</td>
                  <td className="text-red">{r.withdrawal > 0 ? fmtFull(r.withdrawal, symbol, currency) : '—'}</td>
                  <td className="font-semibold" style={{ color: r.closing < 0 ? 'var(--red)' : 'var(--text)' }}>{fmtFull(r.closing, symbol, currency)}</td>
                  <td>{pct(r.equityPct, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Consolidated({ retirement, childrenInr, others }: {
  retirement: ProjectionRow[] | null;
  childrenInr: Array<{ name: string; rows: ProjectionRow[] | null }>;
  others: Array<{ name: string; rows: ProjectionRow[] }>;
}) {
  const { data } = useStore();
  const c = countryOf(data!);
  const startYear = new Date().getFullYear();
  const kidRows = childrenInr.filter(k => k.rows);
  const maxLen = Math.max(retirement?.length || 0, ...kidRows.map(k => k.rows!.length), ...others.map(o => o.rows.length), 0);
  if (maxLen === 0) return <NoData text="Configure goals and SIPs to see the consolidated view." />;

  const labels: number[] = [];
  const totals: number[] = [];
  for (let i = 0; i < maxLen; i++) {
    labels.push(startYear + i);
    let sum = 0;
    if (retirement && i < retirement.length) sum += retirement[i].closing;
    for (const k of kidRows) if (i < k.rows!.length) sum += k.rows![i].closing;
    for (const o of others) if (i < o.rows.length) sum += o.rows[i].closing;
    totals.push(sum);
  }

  const kidColors = ['#fbbf24', '#f472b6', '#a78bfa', '#34d399'];
  return (
    <>
      <Card>
        <CardTitle>All Goal Corpuses ({c.baseCurrency})</CardTitle>
        <div style={{ height: 220 }}>
          <LineChart labels={labels} series={[
            { label: 'Total corpus', data: totals, color: '#38bdf8', fill: true },
            ...(retirement ? [{ label: 'Retirement', data: retirement.map(r => r.closing), color: '#34d399' }] : []),
            ...kidRows.map((k, i) => ({ label: k.name, data: k.rows!.map(r => r.closing), color: kidColors[i % kidColors.length] })),
          ]} />
        </div>
      </Card>
      <InfoBox>Foreign-currency children corpus is shown on its own plan to avoid mixing currencies. Total here is in {c.baseCurrency}.</InfoBox>
    </>
  );
}
