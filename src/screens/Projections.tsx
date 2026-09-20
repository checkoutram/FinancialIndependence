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
import { useT } from '../utils/i18n';

interface PlanOption { key: string; label: string }

export default function Projections() {
  const { data } = useStore();
  const t = useT();
  const d = data!;
  const c = countryOf(d);

  const [sel, setSel] = useState<string>('retirement');

  const retirement = useMemo(() => buildRetirementPlan(d), [d]);

  // Per-child plans, built only when that child has relevant goals or a SIP exists
  const childPlans = useMemo(() => d.family.children.map(child => {
    const cg = d.goals.children.find(x => x.childId === child.id);
    const name = child.name || t('pr.child');
    const hasBase = !!(cg && (cg.ugCostBase || cg.pgCost || cg.marriageCost)) || !!(d.goals.childrenSipBase);
    const hasAlt = !!(cg && cg.ugCostAlt) || !!(d.goals.childrenSipAlt);
    return {
      child, name,
      base: hasBase ? buildChildrenPlan(d, false, child.id) : null,
      alt: hasAlt ? buildChildrenPlan(d, true, child.id) : null,
    };
  }), [d, t]);

  const otherGoals = d.goals.others.filter(g => g.years && (g.monthlyInvestment || g.cost));

  // Build the dropdown options dynamically from whatever data exists
  const options: PlanOption[] = [{ key: 'retirement', label: t('pr.optRet') }];
  for (const cp of childPlans) {
    if (cp.base) options.push({ key: `child-inr:${cp.child.id}`, label: t('pr.optEdu', { name: cp.name, sym: c.currencySymbol }) });
    if (cp.alt) options.push({ key: `child-usd:${cp.child.id}`, label: t('pr.optFug', { name: cp.name, sym: c.altCurrencySymbol }) });
  }
  for (const g of otherGoals) options.push({ key: `other:${g.id}`, label: g.name || t('pr.goal') });
  options.push({ key: 'all', label: t('pr.optAll') });

  // Fall back to retirement if the selected plan no longer exists
  const tab = options.some(o => o.key === sel) ? sel : 'retirement';

  const multiChildNote = d.family.children.length > 1
    ? t('pr.multiChild', { n: d.family.children.length })
    : '';

  let content = null;
  if (tab === 'retirement') {
    content = retirement
      ? <PlanView rows={retirement} symbol={c.currencySymbol} currency={c.baseCurrency} title={t('pr.retTitle')}
          note={t('pr.retNote')} />
      : <NoData text={t('pr.retNoData')} />;
  } else if (tab.startsWith('child-inr:') || tab.startsWith('child-usd:')) {
    const [kind, childId] = tab.split(':') as [string, string];
    const alt = kind === 'child-usd';
    const cp = childPlans.find(x => x.child.id === childId);
    const plan = cp ? (alt ? cp.alt : cp.base) : null;
    const sym = alt ? c.altCurrencySymbol : c.currencySymbol;
    const cur = alt ? c.altCurrency : c.baseCurrency;
    const noSip = !(alt ? d.goals.childrenSipAlt : d.goals.childrenSipBase);
    content = plan
      ? <PlanView rows={plan.rows} symbol={sym} currency={cur}
          title={t(alt ? 'pr.titleFug' : 'pr.titleEdu', { name: cp!.name, cur })}
          note={(alt ? t('pr.noteFug') : t('pr.noteEdu'))
            + multiChildNote
            + (noSip ? t('pr.noSip', { sym }) : '')} />
      : <NoData text={t('pr.childNoData')} />;
  } else if (tab === 'all') {
    content = <Consolidated retirement={retirement}
      childrenInr={childPlans.map(cp => ({ name: cp.name, rows: cp.base?.rows || null }))}
      others={otherGoals.map(g => ({ name: g.name || t('pr.goal'), rows: buildOtherGoalPlan(d, g.id)?.rows || [] }))} />;
  } else if (tab.startsWith('other:')) {
    const g = d.goals.others.find(x => x.id === tab.slice(6));
    const plan = g ? buildOtherGoalPlan(d, g.id) : null;
    content = plan
      ? <PlanView rows={plan.rows} symbol={c.currencySymbol} currency={c.baseCurrency} title={g!.name || t('pr.goal')}
          note={t('pr.otherNote')} />
      : <NoData text={t('pr.otherNoData')} />;
  }

  return (
    <div className="p-4 pt-5 pb-8 space-y-4 animate-fade-in">
      <SectionHeader title={t('pr.title')} subtitle={t('pr.sub')} />
      <Field label={t('pr.planLabel')} hint={t('pr.planHint')}>
        <select className="input no-print" value={tab} onChange={e => setSel(e.target.value)}>
          {options.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </Field>
      {content}
    </div>
  );
}

function NoData({ text }: { text: string }) {
  const t = useT();
  return <EmptyState icon={<LineIcon size={26} />} title={t('pr.noDataTitle')} body={text} />;
}

function PlanView({ rows, symbol, currency, title, note }: {
  rows: ProjectionRow[]; symbol: string; currency: 'INR' | 'USD'; title: string; note: string;
}) {
  const t = useT();
  const labels = rows.map(r => r.age != null ? `${r.year} (${r.age})` : r.year);
  const exhausted = rows.find(r => r.closing < 0);
  return (
    <>
      <Card>
        <CardTitle>{title}</CardTitle>
        {exhausted && (
          <div className="mb-3 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: 'color-mix(in srgb, var(--red) 12%, transparent)', color: 'var(--red)', border: '1px solid color-mix(in srgb, var(--red) 30%, transparent)' }}>
            {t('pr.warn1', { year: exhausted.year })}{exhausted.age != null ? t('pr.warnAge', { age: exhausted.age }) : ''}{t('pr.warn2')}
          </div>
        )}
        <div style={{ height: 220 }}>
          <LineChart labels={labels} series={[
            { label: t('ch.corpus'), data: rows.map(r => r.closing), color: '#38bdf8', fill: true },
            { label: t('ch.withdrawals'), data: rows.map(r => r.withdrawal || null), color: '#f87171', dashed: true },
          ]} />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div><div className="text-[10px] text-faint uppercase">{t('pr.peak')}</div><div className="font-bold text-sm tabular">{fmtFull(Math.max(...rows.map(r => r.closing)), symbol, currency)}</div></div>
          <div><div className="text-[10px] text-faint uppercase">{t('pr.final')}</div><div className={`font-bold text-sm tabular ${rows[rows.length - 1].closing < 0 ? 'text-red' : 'text-green'}`}>{fmtFull(rows[rows.length - 1].closing, symbol, currency)}</div></div>
          <div><div className="text-[10px] text-faint uppercase">{t('pr.withdrawn')}</div><div className="font-bold text-sm tabular">{fmtFull(rows.reduce((s, r) => s + r.withdrawal, 0), symbol, currency)}</div></div>
        </div>
      </Card>
      <InfoBox>{note}</InfoBox>
      <Card>
        <CardTitle>{t('pr.yby')}</CardTitle>
        <div className="table-wrap max-h-96 overflow-y-auto">
          <table className="data-table tabular">
            <thead>
              <tr>
                <th>{t('th.year')}{rows[0]?.age != null ? t('th.yearAge') : ''}</th><th>{t('th.invest')}</th><th>{t('th.opening')}</th><th>{t('th.return')} {''}</th><th>{t('th.withdrawal')}</th><th>{t('th.closing')}</th><th>Eq%</th>
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
  const t = useT();
  const c = countryOf(data!);
  const startYear = new Date().getFullYear();
  const kidRows = childrenInr.filter(k => k.rows);
  const maxLen = Math.max(retirement?.length || 0, ...kidRows.map(k => k.rows!.length), ...others.map(o => o.rows.length), 0);
  if (maxLen === 0) return <NoData text={t('cons.noData')} />;

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
        <CardTitle>{t('cons.title', { cur: c.baseCurrency })}</CardTitle>
        <div style={{ height: 220 }}>
          <LineChart labels={labels} series={[
            { label: t('ch.total'), data: totals, color: '#38bdf8', fill: true },
            ...(retirement ? [{ label: t('ch.retirement'), data: retirement.map(r => r.closing), color: '#34d399' }] : []),
            ...kidRows.map((k, i) => ({ label: k.name, data: k.rows!.map(r => r.closing), color: kidColors[i % kidColors.length] })),
          ]} />
        </div>
      </Card>
      <InfoBox>{t('cons.info', { cur: c.baseCurrency })}</InfoBox>
    </>
  );
}
