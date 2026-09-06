// Screen 4 — Goals: children education/marriage, retirement, other goals
import { useStore } from '../utils/store';
import type { ChildGoal, OtherGoal } from '../types';
import { Card, CardTitle, Field, Num, InfoBox, SectionHeader, RowActions } from '../components/ui';
import { countryOf, ageFromDob, fmt, pct } from '../utils/engine';
import { GraduationCap, Armchair, Home, Plus, HeartHandshake } from 'lucide-react';

let uid = 0;
const nid = () => `id-${Date.now()}-${uid++}`;

export default function Goals() {
  const { data, update } = useStore();
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
      <SectionHeader title="Goals" subtitle="What are you saving for? Costs are in today's money — the planner inflates them to the goal year." />

      {/* Children */}
      <Card>
        <CardTitle right={<GraduationCap size={15} className="text-faint" />}>Children Goals</CardTitle>
        <InfoBox>
          Enter today's cost and years until each goal. UG is withdrawn over 4 years and PG over 2 years,
          starting one year before the target (as in standard education planning). Marriage is withdrawn in full at the target year.
          Example: UG cost 2400000 {c.currencySymbol} in 12 years; foreign UG 100000 {c.altCurrencySymbol} in 12 years.
          A child aged 5 starting college at 17 → 12 years.
        </InfoBox>
        {d.family.children.length === 0 && (
          <p className="text-sm text-dim mt-3">Add children on the Inputs tab first — their goals will appear here.</p>
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
                  {child.name || 'Child'} {age != null ? `· age ${age}` : ''}
                  {age != null && <span className="normal-case font-normal text-faint"> — hint: UG at 17 → {Math.max(0, 17 - age)} yrs, PG at 21 → {Math.max(0, 21 - age)} yrs, marriage at 25 → {Math.max(0, 25 - age)} yrs</span>}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Field label={`UG cost (${c.currencySymbol}, today)`}><Num value={cg.ugCostBase} onChange={v => setChildGoal(child.id, { ugCostBase: v })} placeholder="e.g. 2400000" /></Field>
                  <Field label="UG in years"><Num value={cg.ugYears} onChange={v => setChildGoal(child.id, { ugYears: v })} placeholder="e.g. 12" /></Field>
                  <Field label={`Foreign UG (${c.altCurrencySymbol}, today)`}><Num value={cg.ugCostAlt} onChange={v => setChildGoal(child.id, { ugCostAlt: v })} placeholder="e.g. 100000" /></Field>
                  <Field label="Foreign UG in years"><Num value={cg.ugYearsAlt} onChange={v => setChildGoal(child.id, { ugYearsAlt: v })} placeholder="e.g. 12" /></Field>
                  <Field label={`PG cost (${c.currencySymbol}, today)`}><Num value={cg.pgCost} onChange={v => setChildGoal(child.id, { pgCost: v })} placeholder="e.g. 2600000" /></Field>
                  <Field label="PG in years"><Num value={cg.pgYears} onChange={v => setChildGoal(child.id, { pgYears: v })} placeholder="e.g. 16" /></Field>
                  <Field label={`Marriage cost (${c.currencySymbol})`}><Num value={cg.marriageCost} onChange={v => setChildGoal(child.id, { marriageCost: v })} placeholder="e.g. 2500000" /></Field>
                  <Field label="Marriage in years"><Num value={cg.marriageYears} onChange={v => setChildGoal(child.id, { marriageYears: v })} placeholder="e.g. 22" /></Field>
                </div>
              </div>
            );
          })}
        </div>

        {d.family.children.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <Field label={`Children SIP (${c.currencySymbol}/mo)`} hint="e.g. 90000. SIPs on Children-mapped assets are added automatically.">
              <Num value={d.goals.childrenSipBase} onChange={v => update(prev => ({ ...prev, goals: { ...prev.goals, childrenSipBase: v } }))} placeholder="90000" />
            </Field>
            <Field label={`Children SIP (${c.altCurrencySymbol}/mo)`} hint="e.g. 1850">
              <Num value={d.goals.childrenSipAlt} onChange={v => update(prev => ({ ...prev, goals: { ...prev.goals, childrenSipAlt: v } }))} placeholder="1850" />
            </Field>
            <Field label="Months left this year" hint="SIPs starting mid-year. e.g. 10">
              <Num value={d.goals.childrenFirstYearMonths} onChange={v => update(prev => ({ ...prev, goals: { ...prev.goals, childrenFirstYearMonths: v } }))} placeholder="12" />
            </Field>
          </div>
        )}
      </Card>

      {/* Retirement */}
      <Card>
        <CardTitle right={<Armchair size={15} className="text-faint" />}>Retirement</CardTitle>
        <InfoBox>
          Monthly expense is in <b>today's money</b> — inflation is applied to the retirement year.
          The FIRE number = inflated yearly expense ÷ withdrawal rate. Example: retire at 50, expenses 140000 {c.currencySymbol}/month today,
          investing 47500 {c.currencySymbol}/month, life expectancy 85.
        </InfoBox>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="Your retirement age" hint="The classic FIRE target. e.g. 50">
            <Num value={d.goals.retirement.retireAgeSelf} onChange={v => update(prev => ({ ...prev, goals: { ...prev.goals, retirement: { ...prev.goals.retirement, retireAgeSelf: v } } }))} placeholder="e.g. 50" />
          </Field>
          <Field label="Spouse retirement age" hint="Informational.">
            <Num value={d.goals.retirement.retireAgeSpouse} onChange={v => update(prev => ({ ...prev, goals: { ...prev.goals, retirement: { ...prev.goals.retirement, retireAgeSpouse: v } } }))} placeholder="e.g. 48" />
          </Field>
          <Field label="Life expectancy" hint="Corpus must last until this age. e.g. 85">
            <Num value={d.goals.retirement.lifeExpectancy} onChange={v => update(prev => ({ ...prev, goals: { ...prev.goals, retirement: { ...prev.goals.retirement, lifeExpectancy: v } } }))} placeholder="85" />
          </Field>
          <Field label={`Monthly expense in retirement (${c.currencySymbol}, today)`} hint="e.g. 140000">
            <Num value={d.goals.retirement.monthlyExpenseToday} onChange={v => update(prev => ({ ...prev, goals: { ...prev.goals, retirement: { ...prev.goals.retirement, monthlyExpenseToday: v } } }))} placeholder="e.g. 140000" />
          </Field>
          <Field label={`Monthly investment toward retirement (${c.currencySymbol})`} hint={`Steps up ${pct(d.assumptions.sipYearlyIncrease, 0)}/yr. e.g. 47500. SIPs on Retirement-mapped assets (EPF/NPS etc.) are added automatically — enter only additional investment here.`}>
            <Num value={d.goals.retirement.monthlyInvestment} onChange={v => update(prev => ({ ...prev, goals: { ...prev.goals, retirement: { ...prev.goals.retirement, monthlyInvestment: v } } }))} placeholder="e.g. 47500" />
          </Field>
        </div>
      </Card>

      {/* Other goals */}
      <Card>
        <CardTitle right={<Home size={15} className="text-faint" />}>Other Goals</CardTitle>
        <InfoBox>
          Big one-off purchases: home, car, world trip. Example: “India home”, cost 25000000 {c.currencySymbol} in 10 years,
          investing 205000 {c.currencySymbol}/month.
        </InfoBox>
        <div className="space-y-2 mt-3">
          {d.goals.others.map(g => (
            <OtherGoalRow key={g.id} goal={g}
              onChange={ng => update(prev => ({ ...prev, goals: { ...prev.goals, others: prev.goals.others.map(x => x.id === g.id ? ng : x) } }))}
              onDelete={() => update(prev => ({ ...prev, goals: { ...prev.goals, others: prev.goals.others.filter(x => x.id !== g.id) } }))} />
          ))}
          <button className="btn-ghost w-full" onClick={() => update(prev => ({
            ...prev,
            goals: { ...prev.goals, others: [...prev.goals.others, { id: nid(), name: '', cost: null, years: null, monthlyInvestment: null, firstYearMonths: 12 }] },
          }))}><Plus size={14} /> Add goal</button>
        </div>
      </Card>

      <HeartHandshake className="mx-auto text-faint" size={18} />
      <p className="hint text-center">Goal projections with charts are on the Projections tab.</p>
    </div>
  );
}

function OtherGoalRow({ goal, onChange, onDelete }: { goal: OtherGoal; onChange: (g: OtherGoal) => void; onDelete: () => void }) {
  const { data } = useStore();
  const c = countryOf(data!);
  const future = goal.cost && goal.years ? goal.cost * Math.pow(1 + data!.assumptions.inflation, goal.years) : null;
  return (
    <div className="card p-3 space-y-2">
      <div className="flex gap-2 items-center">
        <input className="input !py-2 flex-1" placeholder='e.g. "India permanent home"' value={goal.name} onChange={e => onChange({ ...goal, name: e.target.value })} />
        <RowActions onDelete={onDelete} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Num value={goal.cost} onChange={v => onChange({ ...goal, cost: v })} placeholder={`Cost (${c.currencySymbol})`} />
        <Num value={goal.years} onChange={v => onChange({ ...goal, years: v })} placeholder="Years" />
        <Num value={goal.monthlyInvestment} onChange={v => onChange({ ...goal, monthlyInvestment: v })} placeholder="SIP/mo" />
      </div>
      {future != null && <p className="hint">Cost in {goal.years} yrs at {pct(data!.assumptions.inflation, 0)} inflation: <b>{fmt(future, c.currencySymbol)}</b></p>}
    </div>
  );
}
