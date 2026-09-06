// Screen 6 — FIRE Types comparison
import { useMemo } from 'react';
import { useStore } from '../utils/store';
import { computeFireSummary, FIRE_TYPES, fireTypeCorpus, countryOf, fmt, fmtFull, totalFinancialAssets, monthlyExpensesBase } from '../utils/engine';
import { Card, CardTitle, ProgressBar, EmptyState, SectionHeader, InfoBox } from '../components/ui';
import { BarChart } from '../components/charts';
import { Flame } from 'lucide-react';

export default function FireTypes() {
  const { data } = useStore();
  const d = data!;
  const c = countryOf(d);
  const s = useMemo(() => computeFireSummary(d), [d]);

  if (s.fireNumber == null) {
    return (
      <div className="p-4 pb-28 space-y-4">
        <SectionHeader title="FIRE Types" />
        <EmptyState icon={<Flame size={26} />} title="FIRE number needed"
          body="The 7 FIRE variants are multiples of your FIRE number. Set your date of birth, retirement age and retirement monthly expense (Inputs + Goals) to compute it." />
      </div>
    );
  }

  const invested = totalFinancialAssets(d.financialAssets, d);
  const years = s.yearsToRetire ?? 10;

  const cards = FIRE_TYPES.map(t => {
    const corpus = fireTypeCorpus(t, s.fireNumber!, years, d.assumptions.equityReturn);
    return {
      ...t,
      corpus,
      monthlyExpense: t.key === 'coast'
        ? s.monthlyExpenseToday
        : (s.monthlyExpenseAtRetire ?? s.monthlyExpenseToday) * (t.factor ?? 1),
      progress: Math.min(100, (invested / corpus) * 100),
    };
  });

  return (
    <div className="p-4 pb-28 space-y-4 animate-fade-in">
      <SectionHeader title="FIRE Types" subtitle={`Your full FIRE number is ${fmt(s.fireNumber, c.currencySymbol)} — every variant scales from it.`} />

      <div className="grid grid-cols-1 gap-3">
        {cards.map(t => (
          <Card key={t.key}>
            <div className="flex justify-between items-start mb-1">
              <div>
                <h3 className="font-bold text-sm">{t.name}</h3>
                <p className="text-[11px] text-faint">{t.description}</p>
              </div>
              <span className="text-xs font-bold text-accent tabular">{t.factor != null ? `${t.factor * 100}%` : 'PV'}</span>
            </div>
            <div className="flex justify-between text-xs text-dim mt-2 mb-1.5">
              <span>Corpus: <b className="tabular" style={{ color: 'var(--text)' }}>{fmt(t.corpus, c.currencySymbol)}</b></span>
              <span>Supports: <b className="tabular" style={{ color: 'var(--text)' }}>{fmtFull(Math.round(t.monthlyExpense), c.currencySymbol)}/mo</b></span>
            </div>
            <ProgressBar value={t.progress} />
            <p className="hint mt-1">{t.progress.toFixed(1)}% funded by current financial assets ({fmt(invested, c.currencySymbol)})</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardTitle>Corpus Needed — Comparison</CardTitle>
        <div style={{ height: 260 }}>
          <BarChart horizontal
            labels={cards.map(t => t.name)}
            series={[
              { label: 'Corpus needed', data: cards.map(t => Math.round(t.corpus)), color: '#38bdf8' },
              { label: 'Current financial assets', data: cards.map(() => Math.round(invested)), color: '#34d399' },
            ]} />
        </div>
      </Card>

      <InfoBox>
        Coast FIRE is the amount you would need invested <b>today</b> for growth alone (at {Math.round(d.assumptions.equityReturn * 100)}%)
        to reach your full FIRE number by age {s.retireAge} — no further contributions.
        Current expense baseline: {fmtFull(Math.round(monthlyExpensesBase(d.cashFlow.expenses, d)), c.currencySymbol)}/month.
      </InfoBox>
    </div>
  );
}
