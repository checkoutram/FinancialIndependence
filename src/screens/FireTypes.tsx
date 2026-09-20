// Screen 6 — FIRE Types comparison
import { useMemo } from 'react';
import { useStore } from '../utils/store';
import { computeFireSummary, FIRE_TYPES, fireTypeCorpus, countryOf, fmt, fmtFull, totalFinancialAssets, monthlyExpensesBase } from '../utils/engine';
import { Card, CardTitle, ProgressBar, EmptyState, SectionHeader, InfoBox } from '../components/ui';
import { BarChart } from '../components/charts';
import { Flame } from 'lucide-react';
import { useT } from '../utils/i18n';

export default function FireTypes() {
  const { data } = useStore();
  const t = useT();
  const d = data!;
  const c = countryOf(d);
  const s = useMemo(() => computeFireSummary(d), [d]);

  if (s.fireNumber == null) {
    return (
      <div className="p-4 pt-5 pb-8 space-y-4">
        <SectionHeader title={t('ft.title')} />
        <EmptyState icon={<Flame size={26} />} title={t('ft.emptyTitle')}
          body={t('ft.emptyBody')} />
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
    <div className="p-4 pt-5 pb-8 space-y-4 animate-fade-in">
      <SectionHeader title={t('ft.title')} subtitle={t('ft.sub', { n: fmt(s.fireNumber, c.currencySymbol) })} />

      <div className="grid grid-cols-1 gap-3">
        {cards.map(t2 => (
          <Card key={t2.key}>
            <div className="flex justify-between items-start mb-1">
              <div>
                <h3 className="font-bold text-sm">{t2.name}</h3>
                <p className="text-[11px] text-faint">{t(`ftd.${t2.key}`)}</p>
              </div>
              <span className="text-xs font-bold text-accent tabular">{t2.factor != null ? `${t2.factor * 100}%` : 'PV'}</span>
            </div>
            <div className="flex justify-between text-xs text-dim mt-2 mb-1.5">
              <span>{t('ft.corpus')} <b className="tabular" style={{ color: 'var(--text)' }}>{fmt(t2.corpus, c.currencySymbol)}</b></span>
              <span>{t('ft.supports')} <b className="tabular" style={{ color: 'var(--text)' }}>{fmtFull(Math.round(t2.monthlyExpense), c.currencySymbol)}/mo</b></span>
            </div>
            <ProgressBar value={t2.progress} />
            <p className="hint mt-1">{t('ft.funded', { p: t2.progress.toFixed(1), n: fmt(invested, c.currencySymbol) })}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardTitle>{t('ft.chartTitle')}</CardTitle>
        <div style={{ height: 260 }}>
          <BarChart horizontal
            labels={cards.map(t2 => t2.name)}
            series={[
              { label: t('ch.corpusNeeded'), data: cards.map(t2 => Math.round(t2.corpus)), color: '#38bdf8' },
              { label: t('ch.curFinAssets'), data: cards.map(() => Math.round(invested)), color: '#34d399' },
            ]} />
        </div>
      </Card>

      <InfoBox>
        {t('ft.info', { pct: Math.round(d.assumptions.equityReturn * 100), age: s.retireAge ?? 0, exp: fmtFull(Math.round(monthlyExpensesBase(d.cashFlow.expenses, d)), c.currencySymbol) })}
      </InfoBox>
    </div>
  );
}
