// Screen 4 — Goals: children education/marriage, retirement, other goals
import { useStore } from '../utils/store';
import type { ChildGoal, OtherGoal } from '../types';
import { Card, CardTitle, Field, Num, InfoBox, SectionHeader, RowActions } from '../components/ui';
import { countryOf, ageFromDob, fmt, pct } from '../utils/engine';
import { GraduationCap, Armchair, Home, Plus, HeartHandshake } from 'lucide-react';
import { useT } from '../utils/i18n';

let uid = 0;
const nid = () => `id-${Date.now()}-${uid++}`;

export default function Goals() {
  const { data, update } = useStore();
  const t = useT();
  const d = data!;
  const c = countryOf(d);

  const setChildGoal = (childId: string, patch: Partial<ChildGoal>) => {
    update(prev => ({
      ...prev,
      goals: {
        ...prev.goals,
        children: prev.goals.children.some(cg => cg.childId === childId)
          ? prev.goals.children.map(cg => cg.childId === childId ? { ...cg, ...patch } : cg)
          : [...prev.goals.children, { childId, ugCostBase: null, ugYears: null, ugCostAlt: null, ugYearsAlt: null, pgCost: null, pgYears: null, marriageCost: null, marriageYears: null, ...patch }],
      },
    }));
  };

  return (
    <div className="p-4 pt-5 pb-8 space-y-4 animate-fade-in">
      <SectionHeader title={t('go.title')} subtitle={t('go.sub')} />

      {/* Children */}
      <Card>
        <CardTitle right={<GraduationCap size={15} className="text-faint" />}>{t('go.childTitle')}</CardTitle>
        <InfoBox>{t('go.childInfo', { cur: c.currencySymbol, alt: c.altCurrencySymbol })}</InfoBox>
        {d.family.children.length === 0 && (
          <p className="text-sm text-dim mt-3">{t('go.addFirst')}</p>
        )}
        <div className="space-y-3 mt-3">
          {d.family.children.map(child => {
            const cg = d.goals.children.find(x => x.childId === child.id) || {
              childId: child.id, ugCostBase: null, ugYears: null, ugCostAlt: null, ugYearsAlt: null,
              pgCost: null, pgYears: null, marriageCost: null, marriageYears: null,
            };
            const age = ageFromDob(child.dob);
            return (
              <div key={child.id} className="card p-3 space-y-3">
                <p className="text-xs font-bold text-dim uppercase tracking-wider">
                  {child.name || t('go.child')} {age != null ? t('go.ageBit', { n: age }) : ''}
                  {age != null && <span className="normal-case font-normal text-faint">{t('go.hintAges', { ug: Math.max(0, 17 - age), pg: Math.max(0, 21 - age), m: Math.max(0, 25 - age) })}</span>}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Field label={t('go.ugCost', { sym: c.currencySymbol })}><Num value={cg.ugCostBase} onChange={v => setChildGoal(child.id, { ugCostBase: v })} placeholder="e.g. 2400000" /></Field>
                  <Field label={t('go.ugYears')}><Num value={cg.ugYears} onChange={v => setChildGoal(child.id, { ugYears: v })} placeholder="e.g. 12" /></Field>
                  <Field label={t('go.fugCost', { sym: c.altCurrencySymbol })}><Num value={cg.ugCostAlt} onChange={v => setChildGoal(child.id, { ugCostAlt: v })} placeholder="e.g. 100000" /></Field>
                  <Field label={t('go.fugYears')}><Num value={cg.ugYearsAlt} onChange={v => setChildGoal(child.id, { ugYearsAlt: v })} placeholder="e.g. 12" /></Field>
                  <Field label={t('go.pgCost', { sym: c.currencySymbol })}><Num value={cg.pgCost} onChange={v => setChildGoal(child.id, { pgCost: v })} placeholder="e.g. 2600000" /></Field>
                  <Field label={t('go.pgYears')}><Num value={cg.pgYears} onChange={v => setChildGoal(child.id, { pgYears: v })} placeholder="e.g. 16" /></Field>
                  <Field label={t('go.mCost', { sym: c.currencySymbol })}><Num value={cg.marriageCost} onChange={v => setChildGoal(child.id, { marriageCost: v })} placeholder="e.g. 2500000" /></Field>
                  <Field label={t('go.mYears')}><Num value={cg.marriageYears} onChange={v => setChildGoal(child.id, { marriageYears: v })} placeholder="e.g. 22" /></Field>
                </div>
              </div>
            );
          })}
        </div>

        {d.family.children.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <Field label={t('go.sipBase', { sym: c.currencySymbol })} hint={t('go.sipBaseHint')}>
              <Num value={d.goals.childrenSipBase} onChange={v => update(prev => ({ ...prev, goals: { ...prev.goals, childrenSipBase: v } }))} placeholder="90000" />
            </Field>
            <Field label={t('go.sipAlt', { sym: c.altCurrencySymbol })} hint={t('go.sipAltHint')}>
              <Num value={d.goals.childrenSipAlt} onChange={v => update(prev => ({ ...prev, goals: { ...prev.goals, childrenSipAlt: v } }))} placeholder="1850" />
            </Field>
            <Field label={t('go.monthsLeft')} hint={t('go.monthsLeftHint')}>
              <Num value={d.goals.childrenFirstYearMonths} onChange={v => update(prev => ({ ...prev, goals: { ...prev.goals, childrenFirstYearMonths: v } }))} placeholder="12" />
            </Field>
          </div>
        )}
      </Card>

      {/* Retirement */}
      <Card>
        <CardTitle right={<Armchair size={15} className="text-faint" />}>{t('go.retTitle')}</CardTitle>
        <InfoBox>{t('go.retInfo', { cur: c.currencySymbol })}</InfoBox>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label={t('go.retAge')} hint={t('go.retAgeHint')}>
            <Num value={d.goals.retirement.retireAgeSelf} onChange={v => update(prev => ({ ...prev, goals: { ...prev.goals, retirement: { ...prev.goals.retirement, retireAgeSelf: v } } }))} placeholder="e.g. 50" />
          </Field>
          <Field label={t('go.spouseAge')} hint={t('go.spouseAgeHint')}>
            <Num value={d.goals.retirement.retireAgeSpouse} onChange={v => update(prev => ({ ...prev, goals: { ...prev.goals, retirement: { ...prev.goals.retirement, retireAgeSpouse: v } } }))} placeholder="e.g. 48" />
          </Field>
          <Field label={t('go.life')} hint={t('go.lifeHint')}>
            <Num value={d.goals.retirement.lifeExpectancy} onChange={v => update(prev => ({ ...prev, goals: { ...prev.goals, retirement: { ...prev.goals.retirement, lifeExpectancy: v } } }))} placeholder="85" />
          </Field>
          <Field label={t('go.retExp', { sym: c.currencySymbol })} hint="e.g. 140000">
            <Num value={d.goals.retirement.monthlyExpenseToday} onChange={v => update(prev => ({ ...prev, goals: { ...prev.goals, retirement: { ...prev.goals.retirement, monthlyExpenseToday: v } } }))} placeholder="e.g. 140000" />
          </Field>
          <Field label={t('go.retInv', { sym: c.currencySymbol })} hint={t('go.retInvHint', { step: pct(d.assumptions.sipYearlyIncrease, 0) ?? 0 })}>
            <Num value={d.goals.retirement.monthlyInvestment} onChange={v => update(prev => ({ ...prev, goals: { ...prev.goals, retirement: { ...prev.goals.retirement, monthlyInvestment: v } } }))} placeholder="e.g. 47500" />
          </Field>
        </div>
      </Card>

      {/* Other goals */}
      <Card>
        <CardTitle right={<Home size={15} className="text-faint" />}>{t('go.otherTitle')}</CardTitle>
        <InfoBox>{t('go.otherInfo', { cur: c.currencySymbol })}</InfoBox>
        <div className="space-y-2 mt-3">
          {d.goals.others.map(g => (
            <OtherGoalRow key={g.id} goal={g}
              onChange={ng => update(prev => ({ ...prev, goals: { ...prev.goals, others: prev.goals.others.map(x => x.id === g.id ? ng : x) } }))}
              onDelete={() => update(prev => ({ ...prev, goals: { ...prev.goals, others: prev.goals.others.filter(x => x.id !== g.id) } }))} />
          ))}
          <button className="btn-ghost w-full" onClick={() => update(prev => ({
            ...prev,
            goals: { ...prev.goals, others: [...prev.goals.others, { id: nid(), name: '', cost: null, years: null, monthlyInvestment: null, firstYearMonths: 12 }] },
          }))}><Plus size={14} /> {t('go.addGoal')}</button>
        </div>
      </Card>

      <HeartHandshake className="mx-auto text-faint" size={18} />
      <p className="hint text-center">{t('go.footer')}</p>
    </div>
  );
}

function OtherGoalRow({ goal, onChange, onDelete }: { goal: OtherGoal; onChange: (g: OtherGoal) => void; onDelete: () => void }) {
  const { data } = useStore();
  const t = useT();
  const c = countryOf(data!);
  const future = goal.cost && goal.years ? goal.cost * Math.pow(1 + data!.assumptions.inflation, goal.years) : null;
  return (
    <div className="card p-3 space-y-2">
      <div className="flex gap-2 items-center">
        <input className="input !py-2 flex-1" placeholder={t('og.namePh')} value={goal.name} onChange={e => onChange({ ...goal, name: e.target.value })} />
        <RowActions onDelete={onDelete} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Num value={goal.cost} onChange={v => onChange({ ...goal, cost: v })} placeholder={t('og.cost', { sym: c.currencySymbol })} />
        <Num value={goal.years} onChange={v => onChange({ ...goal, years: v })} placeholder={t('og.years')} />
        <Num value={goal.monthlyInvestment} onChange={v => onChange({ ...goal, monthlyInvestment: v })} placeholder={t('og.sip')} />
      </div>
      {future != null && <p className="hint">{t('og.future', { yrs: goal.years ?? 0, pct: pct(data!.assumptions.inflation, 0) ?? 0, amt: fmt(future, c.currencySymbol) })}</p>}
    </div>
  );
}
