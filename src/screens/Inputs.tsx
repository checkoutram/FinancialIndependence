// Screen 2 — Profile & Inputs (collapsible sections with guidance)
import { useStore } from '../utils/store';
import { COUNTRIES, type Employment, type ExpenseItem, type Person } from '../types';
import { Accordion, Field, Num, pct, Text, DateInput, Select, InfoBox, SectionHeader, RowActions, CurrencyToggle } from '../components/ui';
import { countryOf, fmtFull } from '../utils/engine';
import { Users, Briefcase, Wallet, SlidersHorizontal, Globe, Plus } from 'lucide-react';
import { useT } from '../utils/i18n';

let uid = 0;
const nid = () => `id-${Date.now()}-${uid++}`;

export default function Inputs() {
  const { data, update } = useStore();
  const t = useT();
  const d = data!;
  const c = countryOf(d);

  const setCountry = (code: string) => {
    const cp = COUNTRIES.find(x => x.code === code)!;
    update(prev => ({
      ...prev,
      country: cp.code,
      assumptions: {
        ...prev.assumptions,
        fxRate: cp.defaultFxRate,
        equityReturn: cp.defaultEquityReturn,
        debtReturn: cp.defaultDebtReturn,
        inflation: cp.defaultInflation,
        withdrawalRate: cp.defaultWithdrawalRate,
      },
    }));
  };

  return (
    <div className="p-4 pt-5 pb-8 space-y-3 animate-fade-in">
      <SectionHeader title={t('in.title')} subtitle={t('in.sub')} />

      {/* Country */}
      <Accordion title={t('in.country')} subtitle={t('in.countrySub')} icon={<Globe size={18} />} defaultOpen={!d.onboardingComplete}>
        <Field label={t('in.where')} hint={t('in.whereHint')}>
          <Select value={d.country} onChange={setCountry}
            options={COUNTRIES.map(x => ({ value: x.code, label: `${x.flag} ${x.label} (${x.currencySymbol})` }))} />
        </Field>
      </Accordion>

      {/* Family */}
      <Accordion title={t('in.family')} subtitle={t('in.familySub')} icon={<Users size={18} />}>
        <PersonForm label={t('in.you')} person={d.family.self} onChange={p => update(prev => ({ ...prev, family: { ...prev.family, self: p } }))} />
        <div className="flex items-center gap-2 pt-2">
          <input type="checkbox" id="sp" checked={d.family.spouse.enabled}
            onChange={e => update(prev => ({ ...prev, family: { ...prev.family, spouse: { ...prev.family.spouse, enabled: e.target.checked } } }))} />
          <label htmlFor="sp" className="text-sm text-dim">{t('in.includeSpouse')}</label>
        </div>
        {d.family.spouse.enabled && (
          <PersonForm label={t('in.spouse')} person={d.family.spouse} onChange={p => update(prev => ({ ...prev, family: { ...prev.family, spouse: { ...p, enabled: true } } }))} />
        )}

        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="label mb-0">{t('in.children')}</span>
            <button className="btn-ghost !py-1 !px-2 text-xs" onClick={() => {
              const id = nid();
              update(prev => ({
                ...prev,
                family: { ...prev.family, children: [...prev.family.children, { id, name: '', dob: '', citizenship: '' }] },
                goals: { ...prev.goals, children: [...prev.goals.children, { childId: id, ugCostBase: null, ugYears: null, ugCostAlt: null, ugYearsAlt: null, pgCost: null, pgYears: null, marriageCost: null, marriageYears: null }] },
              }));
            }}><Plus size={13} /> {t('in.addChild')}</button>
          </div>
          {d.family.children.length === 0 && <p className="hint">{t('in.noChildren')}</p>}
          {d.family.children.map((child, i) => (
            <div key={child.id} className="card p-3 mb-2 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-dim">{t('in.childN', { n: i + 1 })}</span>
                <RowActions onDelete={() => update(prev => ({
                  ...prev,
                  family: { ...prev.family, children: prev.family.children.filter(x => x.id !== child.id) },
                }))} />
              </div>
              <PersonForm label="" person={child} onChange={p => update(prev => ({
                ...prev,
                family: { ...prev.family, children: prev.family.children.map(x => x.id === child.id ? { ...x, ...p } : x) },
              }))} />
            </div>
          ))}
        </div>

        <Field label={t('in.returnHome')} hint={t('in.returnHomeHint')}>
          <Num value={d.family.yearsToReturnHome} onChange={v => update(prev => ({ ...prev, family: { ...prev.family, yearsToReturnHome: v } }))} placeholder="e.g. 10" suffix="yrs" />
        </Field>
      </Accordion>

      {/* Employment */}
      <Accordion title={t('in.emp')} subtitle={t('in.empSub')} icon={<Briefcase size={18} />}>
        <InfoBox>{t('in.empInfo', { ret: c.retirementAccountName })}</InfoBox>
        <EmploymentForm title={t('in.yourEmp')} emp={d.employmentSelf} countryRet={c.retirementAccountName} countryHsa={c.healthAccountName}
          onChange={e => update(prev => ({ ...prev, employmentSelf: e }))} />
        {d.family.spouse.enabled && (
          <>
            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="spe" checked={d.employmentSpouse.enabled}
                onChange={e => update(prev => ({ ...prev, employmentSpouse: { ...prev.employmentSpouse, enabled: e.target.checked } }))} />
              <label htmlFor="spe" className="text-sm text-dim">{t('in.spouseEmployed')}</label>
            </div>
            {d.employmentSpouse.enabled && (
              <EmploymentForm title={t('in.spouseEmp')} emp={d.employmentSpouse} countryRet={c.retirementAccountName} countryHsa={c.healthAccountName}
                onChange={e => update(prev => ({ ...prev, employmentSpouse: { ...e, enabled: true } }))} />
            )}
          </>
        )}
        <Field label={t('in.rental', { cur: c.currencySymbol })} hint={t('in.rentalHint')}>
          <Num value={d.cashFlow.rentalIncomeMonthly} prefix={c.currencySymbol}
            onChange={v => update(prev => ({ ...prev, cashFlow: { ...prev.cashFlow, rentalIncomeMonthly: v } }))} placeholder="e.g. 14000" />
        </Field>
      </Accordion>

      {/* Cash flow / expenses */}
      <Accordion title={t('in.cashflow')} subtitle={t('in.cashflowSub')} icon={<Wallet size={18} />}>
        <InfoBox>{t('in.cfInfo')}</InfoBox>
        {d.cashFlow.expenses.map((e) => (
          <ExpenseRow key={e.id} item={e} onChange={ne => update(prev => ({
            ...prev, cashFlow: { ...prev.cashFlow, expenses: prev.cashFlow.expenses.map(x => x.id === e.id ? ne : x) },
          }))} onDelete={() => update(prev => ({
            ...prev, cashFlow: { ...prev.cashFlow, expenses: prev.cashFlow.expenses.filter(x => x.id !== e.id) },
          }))} />
        ))}
        <button className="btn-ghost w-full" onClick={() => update(prev => ({
          ...prev,
          cashFlow: { ...prev.cashFlow, expenses: [...prev.cashFlow.expenses, { id: nid(), name: '', amount: null, currency: c.baseCurrency, frequency: 'monthly' }] },
        }))}><Plus size={14} /> {t('in.addExpense')}</button>

        <Field label={t('in.emergency', { cur: c.currencySymbol })} hint={t('in.emergencyHint')}>
          <Num value={d.cashFlow.emergencyFundTarget} prefix={c.currencySymbol}
            onChange={v => update(prev => ({ ...prev, cashFlow: { ...prev.cashFlow, emergencyFundTarget: v } }))} placeholder="e.g. 30000" />
        </Field>
      </Accordion>

      {/* Assumptions */}
      <Accordion title={t('in.assump')} subtitle={t('in.assumpSub')} icon={<SlidersHorizontal size={18} />}>
        <InfoBox>{t('in.assumpInfo')}</InfoBox>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('in.fx', { alt: c.altCurrency, base: c.baseCurrency })} hint={t('in.fxHint')}>
            <Num value={d.assumptions.fxRate} onChange={v => update(prev => ({ ...prev, assumptions: { ...prev.assumptions, fxRate: v || 1 } }))} placeholder="e.g. 90" />
          </Field>
          <Field label={t('in.withdrawal')} hint={t('in.withdrawalHint')}>
            <Num value={pct(d.assumptions.withdrawalRate)} suffix="%" onChange={v => update(prev => ({ ...prev, assumptions: { ...prev.assumptions, withdrawalRate: (v || 4) / 100 } }))} placeholder="4" />
          </Field>
          <Field label={t('in.eqRet', { cur: c.baseCurrency })} hint={t('in.eqRetHint')}>
            <Num value={pct(d.assumptions.equityReturn)} suffix="%" onChange={v => update(prev => ({ ...prev, assumptions: { ...prev.assumptions, equityReturn: (v || 0) / 100 } }))} placeholder="10" />
          </Field>
          <Field label={t('in.debtRet', { cur: c.baseCurrency })} hint={t('in.debtRetHint')}>
            <Num value={pct(d.assumptions.debtReturn)} suffix="%" onChange={v => update(prev => ({ ...prev, assumptions: { ...prev.assumptions, debtReturn: (v || 0) / 100 } }))} placeholder="6" />
          </Field>
          <Field label={t('in.infl')} hint={t('in.inflHint')}>
            <Num value={pct(d.assumptions.inflation)} suffix="%" onChange={v => update(prev => ({ ...prev, assumptions: { ...prev.assumptions, inflation: (v || 0) / 100 } }))} placeholder="6" />
          </Field>
          <Field label={t('in.eduInfl')} hint={t('in.eduInflHint')}>
            <Num value={pct(d.assumptions.educationInflation)} suffix="%" onChange={v => update(prev => ({ ...prev, assumptions: { ...prev.assumptions, educationInflation: (v || 0) / 100 } }))} placeholder="9" />
          </Field>
          <Field label={t('in.stepup')} hint={t('in.stepupHint')}>
            <Num value={pct(d.assumptions.sipYearlyIncrease)} suffix="%" onChange={v => update(prev => ({ ...prev, assumptions: { ...prev.assumptions, sipYearlyIncrease: (v || 0) / 100 } }))} placeholder="5" />
          </Field>
          <Field label={t('in.eqRetAlt', { cur: c.altCurrency })} hint={t('in.eqRetAltHint')}>
            <Num value={pct(d.assumptions.altEquityReturn)} suffix="%" onChange={v => update(prev => ({ ...prev, assumptions: { ...prev.assumptions, altEquityReturn: (v || 0) / 100 } }))} placeholder="8" />
          </Field>
          <Field label={t('in.debtRetAlt', { cur: c.altCurrency })} hint={t('in.debtRetAltHint')}>
            <Num value={pct(d.assumptions.altDebtReturn)} suffix="%" onChange={v => update(prev => ({ ...prev, assumptions: { ...prev.assumptions, altDebtReturn: (v || 0) / 100 } }))} placeholder="3" />
          </Field>
          <Field label={t('in.eduInflAlt', { cur: c.altCurrency })} hint={t('in.eduInflAltHint')}>
            <Num value={pct(d.assumptions.altEducationInflation)} suffix="%" onChange={v => update(prev => ({ ...prev, assumptions: { ...prev.assumptions, altEducationInflation: (v || 0) / 100 } }))} placeholder="7" />
          </Field>
        </div>
      </Accordion>

      <button className="btn-primary" onClick={() => update(prev => ({ ...prev, onboardingComplete: true }))}>
        {t('in.save')}
      </button>
      {d.onboardingComplete && <p className="text-center text-xs text-green">{t('in.saved')}</p>}
      <p className="hint text-center">{t('in.fxInUse', { alt: c.altCurrency, sym: c.currencySymbol, rate: fmtFull(d.assumptions.fxRate, '', c.baseCurrency) })}</p>

    </div>
  );
}

function PersonForm({ label, person, onChange }: { label: string; person: Person; onChange: (p: Person) => void }) {
  const t = useT();
  return (
    <div className="space-y-3">
      {label && <p className="text-xs font-bold text-dim uppercase tracking-wider">{label}</p>}
      <Field label={t('pf.name')} hint={label === t('in.you') ? t('pf.nameHint') : undefined}>
        <Text value={person.name} onChange={v => onChange({ ...person, name: v })} placeholder={t('pf.fullName')} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('pf.dob')} hint={t('pf.dobHint')}>
          <DateInput value={person.dob} onChange={v => onChange({ ...person, dob: v })} />
        </Field>
        <Field label={t('pf.citizenship')} hint={t('pf.citizenshipHint')}>
          <Text value={person.citizenship} onChange={v => onChange({ ...person, citizenship: v })} placeholder={t('pf.citizenshipPh')} />
        </Field>
      </div>
    </div>
  );
}

function EmploymentForm({ title, emp, onChange, countryRet, countryHsa }: {
  title: string; emp: Employment; onChange: (e: Employment) => void; countryRet: string; countryHsa: string;
}) {
  const t = useT();
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-dim uppercase tracking-wider">{title}</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('ef.company')} ><Text value={emp.company} onChange={v => onChange({ ...emp, company: v })} placeholder={t('ef.companyPh')} /></Field>
        <Field label={t('ef.designation')}><Text value={emp.designation} onChange={v => onChange({ ...emp, designation: v })} placeholder={t('ef.designationPh')} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3 items-end">
        <Field label={t('ef.takeHome')} hint={t('ef.takeHomeHint')}>
          <Num value={emp.takeHomeMonthly} onChange={v => onChange({ ...emp, takeHomeMonthly: v })} placeholder="e.g. 6838" />
        </Field>
        <Field label={t('ef.currency')}><CurrencyToggle value={emp.salaryCurrency} onChange={v => onChange({ ...emp, salaryCurrency: v })} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('ef.basic')} hint={t('ef.basicHint')}>
          <Num value={emp.basicMonthly} onChange={v => onChange({ ...emp, basicMonthly: v })} placeholder={t('ef.optional')} />
        </Field>
        <Field label={t('ef.retCont', { ret: countryRet })} hint={t('ef.retContHint')}>
          <Num value={emp.retirementContributionPct} suffix="%" onChange={v => onChange({ ...emp, retirementContributionPct: v })} placeholder="e.g. 15" />
        </Field>
        <Field label={t('ef.hsa', { hsa: countryHsa })} hint={t('ef.hsaHint')}>
          <Num value={emp.healthAccountMonthly} onChange={v => onChange({ ...emp, healthAccountMonthly: v })} placeholder={t('ef.optional')} />
        </Field>
        <Field label={t('ef.pfBal')} hint={t('ef.pfBalHint')}>
          <Num value={emp.providentFundBalance} onChange={v => onChange({ ...emp, providentFundBalance: v })} placeholder={t('ef.optional')} />
        </Field>
      </div>
    </div>
  );
}

function ExpenseRow({ item, onChange, onDelete }: { item: ExpenseItem; onChange: (e: ExpenseItem) => void; onDelete: () => void }) {
  const t = useT();
  return (
    <div className="card p-3 space-y-2">
      <div className="flex gap-2 items-center">
        <input className="input !py-2 flex-1" placeholder={t('exp.namePh')} value={item.name}
          onChange={e => onChange({ ...item, name: e.target.value })} />
        <RowActions onDelete={onDelete} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Num value={item.amount} onChange={v => onChange({ ...item, amount: v })} placeholder={t('exp.amount')} />
        <CurrencyToggle value={item.currency} onChange={v => onChange({ ...item, currency: v })} />
        <Select value={item.frequency} onChange={v => onChange({ ...item, frequency: v as 'monthly' | 'yearly' })}
          options={[{ value: 'monthly', label: t('exp.monthly') }, { value: 'yearly', label: t('exp.yearly') }]} />
      </div>
    </div>
  );
}
