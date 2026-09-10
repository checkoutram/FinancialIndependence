// Screen 2 — Profile & Inputs (collapsible sections with guidance)
import { useStore } from '../utils/store';
import { COUNTRIES, type Employment, type ExpenseItem, type Person } from '../types';
import { Accordion, Field, Num, pct, Text, DateInput, Select, InfoBox, SectionHeader, RowActions, CurrencyToggle } from '../components/ui';
import { countryOf, fmtFull } from '../utils/engine';
import { Users, Briefcase, Wallet, SlidersHorizontal, Globe, Plus } from 'lucide-react';

let uid = 0;
const nid = () => `id-${Date.now()}-${uid++}`;

export default function Inputs() {
  const { data, update } = useStore();
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
      <SectionHeader title="Inputs" subtitle="Everything the planner needs. Each field explains what to enter — your data stays encrypted on this device." />

      {/* Country */}
      <Accordion title="Country & Currency" subtitle="Sets currency, typical returns and account names" icon={<Globe size={18} />} defaultOpen={!d.onboardingComplete}>
        <Field label="Where do you live / plan to retire?" hint="This sets the base currency (₹ or $), default equity/debt returns, inflation and retirement account labels. All can be overridden in Assumptions below.">
          <Select value={d.country} onChange={setCountry}
            options={COUNTRIES.map(x => ({ value: x.code, label: `${x.flag} ${x.label} (${x.currencySymbol})` }))} />
        </Field>
      </Accordion>

      {/* Family */}
      <Accordion title="Family" subtitle="Ages drive retirement year and goal timelines" icon={<Users size={18} />}>
        <PersonForm label="You" person={d.family.self} onChange={p => update(prev => ({ ...prev, family: { ...prev.family, self: p } }))} />
        <div className="flex items-center gap-2 pt-2">
          <input type="checkbox" id="sp" checked={d.family.spouse.enabled}
            onChange={e => update(prev => ({ ...prev, family: { ...prev.family, spouse: { ...prev.family.spouse, enabled: e.target.checked } } }))} />
          <label htmlFor="sp" className="text-sm text-dim">Include spouse</label>
        </div>
        {d.family.spouse.enabled && (
          <PersonForm label="Spouse" person={d.family.spouse} onChange={p => update(prev => ({ ...prev, family: { ...prev.family, spouse: { ...p, enabled: true } } }))} />
        )}

        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="label mb-0">Children</span>
            <button className="btn-ghost !py-1 !px-2 text-xs" onClick={() => {
              const id = nid();
              update(prev => ({
                ...prev,
                family: { ...prev.family, children: [...prev.family.children, { id, name: '', dob: '', citizenship: '' }] },
                goals: { ...prev.goals, children: [...prev.goals.children, { childId: id, ugCostBase: null, ugYears: null, ugCostAlt: null, ugYearsAlt: null, pgCost: null, pgYears: null, marriageCost: null, marriageYears: null }] },
              }));
            }}><Plus size={13} /> Add child</button>
          </div>
          {d.family.children.length === 0 && <p className="hint">No children added. If you have children, add them here — their education & marriage goals are configured on the Goals tab. Example: name “Aarav”, DOB 22 Dec 2020.</p>}
          {d.family.children.map((child, i) => (
            <div key={child.id} className="card p-3 mb-2 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-dim">Child {i + 1}</span>
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

        <Field label="Years until you plan to return / settle (optional)" hint="For NRIs: e.g. enter 10 if you plan to move back to India in 10 years. Used for context only.">
          <Num value={d.family.yearsToReturnHome} onChange={v => update(prev => ({ ...prev, family: { ...prev.family, yearsToReturnHome: v } }))} placeholder="e.g. 10" suffix="yrs" />
        </Field>
      </Accordion>

      {/* Employment */}
      <Accordion title="Employment & Income" subtitle="Take-home pay for you (and spouse)" icon={<Briefcase size={18} />}>
        <InfoBox>
          Enter your <b>monthly take-home</b> (what hits your bank account) and its currency.
          Example: salary credited in the US → choose USD and enter 6838. Retirement contributions
          ({c.retirementAccountName}) are tracked as assets on the Assets tab.
        </InfoBox>
        <EmploymentForm title="Your employment" emp={d.employmentSelf} countryRet={c.retirementAccountName} countryHsa={c.healthAccountName}
          onChange={e => update(prev => ({ ...prev, employmentSelf: e }))} />
        {d.family.spouse.enabled && (
          <>
            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="spe" checked={d.employmentSpouse.enabled}
                onChange={e => update(prev => ({ ...prev, employmentSpouse: { ...prev.employmentSpouse, enabled: e.target.checked } }))} />
              <label htmlFor="spe" className="text-sm text-dim">Spouse is employed</label>
            </div>
            {d.employmentSpouse.enabled && (
              <EmploymentForm title="Spouse employment" emp={d.employmentSpouse} countryRet={c.retirementAccountName} countryHsa={c.healthAccountName}
                onChange={e => update(prev => ({ ...prev, employmentSpouse: { ...e, enabled: true } }))} />
            )}
          </>
        )}
        <Field label={`Rental / other passive income (${c.currencySymbol}/month)`} hint="Example: 14000 if you receive ₹14,000 rent on a property. You can also attach rent to individual properties on the Assets tab.">
          <Num value={d.cashFlow.rentalIncomeMonthly} prefix={c.currencySymbol}
            onChange={v => update(prev => ({ ...prev, cashFlow: { ...prev.cashFlow, rentalIncomeMonthly: v } }))} placeholder="e.g. 14000" />
        </Field>
      </Accordion>

      {/* Cash flow / expenses */}
      <Accordion title="Monthly Cash Flow" subtitle="Expenses in either currency — converted at your FX rate" icon={<Wallet size={18} />}>
        <InfoBox>
          Add each expense as a line item with its own currency and frequency. Yearly items (insurance premiums,
          vacations) are divided by 12 automatically. Example: “Household”, 2900, USD, monthly. “Health insurance”, 4728, USD, yearly.
        </InfoBox>
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
        }))}><Plus size={14} /> Add expense</button>

        <Field label={`Emergency fund target (${c.currencySymbol})`} hint="Rule of thumb: 6–12 months of essential expenses. Example: 30000.">
          <Num value={d.cashFlow.emergencyFundTarget} prefix={c.currencySymbol}
            onChange={v => update(prev => ({ ...prev, cashFlow: { ...prev.cashFlow, emergencyFundTarget: v } }))} placeholder="e.g. 30000" />
        </Field>
      </Accordion>

      {/* Assumptions */}
      <Accordion title="Assumptions" subtitle="Returns, inflation, FX — the knobs that drive every projection" icon={<SlidersHorizontal size={18} />}>
        <InfoBox>
          Defaults come from your selected country. Long-run Indian equity ≈ 10–12%, debt ≈ 6–7%, inflation ≈ 6%.
          US equity ≈ 8–10%, debt ≈ 3–4%. The 4% withdrawal rule is the classic FIRE benchmark.
        </InfoBox>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`FX rate (1 ${c.altCurrency} = ? ${c.baseCurrency})`} hint="Example: 90 means $1 = ₹90.">
            <Num value={d.assumptions.fxRate} onChange={v => update(prev => ({ ...prev, assumptions: { ...prev.assumptions, fxRate: v || 1 } }))} placeholder="e.g. 90" />
          </Field>
          <Field label="Withdrawal rate" hint="Classic rule: 4%. Conservative: 3.5%.">
            <Num value={pct(d.assumptions.withdrawalRate)} suffix="%" onChange={v => update(prev => ({ ...prev, assumptions: { ...prev.assumptions, withdrawalRate: (v || 4) / 100 } }))} placeholder="4" />
          </Field>
          <Field label={`Equity return (${c.baseCurrency})`} hint="Long-run equity index return. Example: 10">
            <Num value={pct(d.assumptions.equityReturn)} suffix="%" onChange={v => update(prev => ({ ...prev, assumptions: { ...prev.assumptions, equityReturn: (v || 0) / 100 } }))} placeholder="10" />
          </Field>
          <Field label={`Debt return (${c.baseCurrency})`} hint="FDs, bonds, debt funds. Example: 6">
            <Num value={pct(d.assumptions.debtReturn)} suffix="%" onChange={v => update(prev => ({ ...prev, assumptions: { ...prev.assumptions, debtReturn: (v || 0) / 100 } }))} placeholder="6" />
          </Field>
          <Field label="General inflation" hint="Cost of living growth. Example: 6">
            <Num value={pct(d.assumptions.inflation)} suffix="%" onChange={v => update(prev => ({ ...prev, assumptions: { ...prev.assumptions, inflation: (v || 0) / 100 } }))} placeholder="6" />
          </Field>
          <Field label="Education inflation" hint="Education costs grow faster. Example: 9">
            <Num value={pct(d.assumptions.educationInflation)} suffix="%" onChange={v => update(prev => ({ ...prev, assumptions: { ...prev.assumptions, educationInflation: (v || 0) / 100 } }))} placeholder="9" />
          </Field>
          <Field label="SIP yearly step-up" hint="Increase investments as salary grows. Example: 5">
            <Num value={pct(d.assumptions.sipYearlyIncrease)} suffix="%" onChange={v => update(prev => ({ ...prev, assumptions: { ...prev.assumptions, sipYearlyIncrease: (v || 0) / 100 } }))} placeholder="5" />
          </Field>
          <Field label={`Equity return (${c.altCurrency})`} hint="For foreign-currency investments. Example: 8">
            <Num value={pct(d.assumptions.altEquityReturn)} suffix="%" onChange={v => update(prev => ({ ...prev, assumptions: { ...prev.assumptions, altEquityReturn: (v || 0) / 100 } }))} placeholder="8" />
          </Field>
          <Field label={`Debt return (${c.altCurrency})`} hint="Example: 3">
            <Num value={pct(d.assumptions.altDebtReturn)} suffix="%" onChange={v => update(prev => ({ ...prev, assumptions: { ...prev.assumptions, altDebtReturn: (v || 0) / 100 } }))} placeholder="3" />
          </Field>
          <Field label={`Education inflation (${c.altCurrency})`} hint="Example: 7">
            <Num value={pct(d.assumptions.altEducationInflation)} suffix="%" onChange={v => update(prev => ({ ...prev, assumptions: { ...prev.assumptions, altEducationInflation: (v || 0) / 100 } }))} placeholder="7" />
          </Field>
        </div>
      </Accordion>

      <button className="btn-primary" onClick={() => update(prev => ({ ...prev, onboardingComplete: true }))}>
        Save & continue
      </button>
      {d.onboardingComplete && <p className="text-center text-xs text-green">Saved — everything recalculates automatically.</p>}
      <p className="hint text-center">FX rate in use: 1 {c.altCurrency} = {c.currencySymbol}{fmtFull(d.assumptions.fxRate, '', c.baseCurrency)}</p>

    </div>
  );
}

function PersonForm({ label, person, onChange }: { label: string; person: Person; onChange: (p: Person) => void }) {
  return (
    <div className="space-y-3">
      {label && <p className="text-xs font-bold text-dim uppercase tracking-wider">{label}</p>}
      <Field label="Name" hint={label === 'You' ? 'Example: Arjun Mehta' : undefined}>
        <Text value={person.name} onChange={v => onChange({ ...person, name: v })} placeholder="Full name" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date of birth" hint="Used to compute current age and years to FIRE.">
          <DateInput value={person.dob} onChange={v => onChange({ ...person, dob: v })} />
        </Field>
        <Field label="Citizenship" hint="Example: Indian, US citizen.">
          <Text value={person.citizenship} onChange={v => onChange({ ...person, citizenship: v })} placeholder="e.g. Indian" />
        </Field>
      </div>
    </div>
  );
}

function EmploymentForm({ title, emp, onChange, countryRet, countryHsa }: {
  title: string; emp: Employment; onChange: (e: Employment) => void; countryRet: string; countryHsa: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-dim uppercase tracking-wider">{title}</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company" ><Text value={emp.company} onChange={v => onChange({ ...emp, company: v })} placeholder="e.g. Acme Technologies" /></Field>
        <Field label="Designation"><Text value={emp.designation} onChange={v => onChange({ ...emp, designation: v })} placeholder="e.g. Associate Director" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3 items-end">
        <Field label="Monthly take-home" hint="Net pay credited to your bank. Example: 6838 (USD).">
          <Num value={emp.takeHomeMonthly} onChange={v => onChange({ ...emp, takeHomeMonthly: v })} placeholder="e.g. 6838" />
        </Field>
        <Field label="Currency"><CurrencyToggle value={emp.salaryCurrency} onChange={v => onChange({ ...emp, salaryCurrency: v })} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Monthly basic pay" hint="Used for gratuity/PF estimates. Example: 11910.">
          <Num value={emp.basicMonthly} onChange={v => onChange({ ...emp, basicMonthly: v })} placeholder="optional" />
        </Field>
        <Field label={`${countryRet} contribution`} hint="Percentage of basic you contribute. Example: 15 for 15%.">
          <Num value={emp.retirementContributionPct} suffix="%" onChange={v => onChange({ ...emp, retirementContributionPct: v })} placeholder="e.g. 15" />
        </Field>
        <Field label={`${countryHsa} (monthly)`} hint="Example: 700 for an HSA contribution.">
          <Num value={emp.healthAccountMonthly} onChange={v => onChange({ ...emp, healthAccountMonthly: v })} placeholder="optional" />
        </Field>
        <Field label="PF / retirement balance (₹)" hint="Current accumulated balance, e.g. EPF 1025336. Also add it as a financial asset mapped to Retirement.">
          <Num value={emp.providentFundBalance} onChange={v => onChange({ ...emp, providentFundBalance: v })} placeholder="optional" />
        </Field>
      </div>
    </div>
  );
}

function ExpenseRow({ item, onChange, onDelete }: { item: ExpenseItem; onChange: (e: ExpenseItem) => void; onDelete: () => void }) {
  return (
    <div className="card p-3 space-y-2">
      <div className="flex gap-2 items-center">
        <input className="input !py-2 flex-1" placeholder='e.g. "Household" or "Health insurance"' value={item.name}
          onChange={e => onChange({ ...item, name: e.target.value })} />
        <RowActions onDelete={onDelete} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Num value={item.amount} onChange={v => onChange({ ...item, amount: v })} placeholder="Amount" />
        <CurrencyToggle value={item.currency} onChange={v => onChange({ ...item, currency: v })} />
        <Select value={item.frequency} onChange={v => onChange({ ...item, frequency: v as 'monthly' | 'yearly' })}
          options={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }]} />
      </div>
    </div>
  );
}
