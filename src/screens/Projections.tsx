// Screen 5 — Projections: tabbed charts + year-by-year tables
import { useMemo, useState } from 'react';
import { useStore } from '../utils/store';
import {
  buildRetirementPlan, buildChildrenPlan, buildOtherGoalPlan,
  countryOf, fmtFull, pct, type ProjectionRow,
} from '../utils/engine';
import { Card, CardTitle, EmptyState, InfoBox, SectionHeader } from '../components/ui';
import { LineChart } from '../components/charts';
import { LineChart as LineIcon } from 'lucide-react';

type Tab = 'retirement' | 'childrenInr' | 'childrenUsd' | string;

export default function Projections() {
  const { data } = useStore();
  const d = data!;
  const c = countryOf(d);

  const otherTabs = d.goals.others.filter(g => g.years && g.monthlyInvestment);
  const [tab, setTab] = useState<Tab>('retirement');

  const retirement = useMemo(() => buildRetirementPlan(d), [d]);
  const childrenInr = useMemo(() => buildChildrenPlan(d, false), [d]);
  const childrenUsd = useMemo(() => buildChildrenPlan(d, true), [d]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'retirement', label: 'Retirement' },
    { key: 'childrenInr', label: `Children (${c.currencySymbol})` },
    { key: 'childrenUsd', label: `Children (${c.altCurrencySymbol})` },
    ...otherTabs.map(g => ({ key: g.id, label: g.name || 'Goal' })),
    { key: 'all', label: 'Consolidated' },
  ];

  let content = null;
  if (tab === 'retirement') {
    content = retirement
      ? <PlanView rows={retirement} symbol={c.currencySymbol} currency={c.baseCurrency} title="Retirement Corpus"
          note="Accumulation until your retirement year (contributions + growth), then decumulation as inflation-adjusted expenses are withdrawn. Corpus lasting past life expectancy means the plan holds." />
      : <NoData text="Set your date of birth (Inputs), retirement age, monthly expense and monthly investment (Goals) to see the retirement projection." />;
  } else if (tab === 'childrenInr') {
    content = childrenInr
      ? <PlanView rows={childrenInr.rows} symbol={c.currencySymbol} currency={c.baseCurrency} title={`Children Goals (${c.baseCurrency})`}
          note="Corpus built from children-mapped assets plus the monthly SIP. Withdrawals: UG spread over 4 years, PG over 2, marriage at the target year — all inflated to the withdrawal year." />
      : <NoData text={`Set children goal costs/years and a children SIP (${c.currencySymbol}) on the Goals tab.`} />;
  } else if (tab === 'childrenUsd') {
    content = childrenUsd
      ? <PlanView rows={childrenUsd.rows} symbol={c.altCurrencySymbol} currency={c.altCurrency} title={`Children Goals (${c.altCurrency})`}
          note="Foreign education corpus in USD-style assumptions: lower returns, lower inflation, 2% yearly SIP step-up." />
      : <NoData text={`Set foreign UG costs and a children SIP (${c.altCurrency}) on the Goals tab.`} />;
  } else if (tab === 'all') {
    content = <Consolidated retirement={retirement} childrenInr={childrenInr?.rows || null} others={otherTabs.map(g => ({ name: g.name || 'Goal', rows: buildOtherGoalPlan(d, g.id)?.rows || [] }))} />;
  } else {
    const g = d.goals.others.find(x => x.id === tab);
    const plan = g ? buildOtherGoalPlan(d, g.id) : null;
    content = plan
      ? <PlanView rows={plan.rows} symbol={c.currencySymbol} currency={c.baseCurrency} title={g!.name || 'Goal'}
          note="Corpus grows until the goal year, when the inflated goal cost is withdrawn." />
      : <NoData text="This goal needs a cost, years and monthly investment on the Goals tab." />;
  }

  return (
    <div className="p-4 pt-5 pb-8 space-y-4 animate-fade-in">
      <SectionHeader title="Projections" subtitle="Year-by-year compounding with a glide path that de-risks as the goal nears." />
      <div className="flex gap-2 overflow-x-auto no-print" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors"
            style={{
              background: tab === t.key ? 'var(--accent)' : 'var(--card)',
              color: tab === t.key ? '#fff' : 'var(--text-dim)',
              border: '1px solid var(--card-border)',
            }}>
            {t.label}
          </button>
        ))}
      </div>
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
  childrenInr: ProjectionRow[] | null;
  others: Array<{ name: string; rows: ProjectionRow[] }>;
}) {
  const { data } = useStore();
  const c = countryOf(data!);
  const startYear = new Date().getFullYear();
  const maxLen = Math.max(retirement?.length || 0, childrenInr?.length || 0, ...others.map(o => o.rows.length), 0);
  if (maxLen === 0) return <NoData text="Configure goals and SIPs to see the consolidated view." />;

  const labels: number[] = [];
  const totals: number[] = [];
  for (let i = 0; i < maxLen; i++) {
    labels.push(startYear + i);
    let sum = 0;
    if (retirement && i < retirement.length) sum += retirement[i].closing;
    if (childrenInr && i < childrenInr.length) sum += childrenInr[i].closing;
    for (const o of others) if (i < o.rows.length) sum += o.rows[i].closing;
    totals.push(sum);
  }

  return (
    <>
      <Card>
        <CardTitle>All Goal Corpuses ({c.baseCurrency})</CardTitle>
        <div style={{ height: 220 }}>
          <LineChart labels={labels} series={[
            { label: 'Total corpus', data: totals, color: '#38bdf8', fill: true },
            ...(retirement ? [{ label: 'Retirement', data: retirement.map(r => r.closing), color: '#34d399' }] : []),
            ...(childrenInr ? [{ label: 'Children', data: childrenInr.map(r => r.closing), color: '#fbbf24' }] : []),
          ]} />
        </div>
      </Card>
      <InfoBox>Foreign-currency children corpus is shown on its own tab to avoid mixing currencies. Total here is in {c.baseCurrency}.</InfoBox>
    </>
  );
}
