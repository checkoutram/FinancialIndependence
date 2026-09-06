// Screen 3 — Assets & Liabilities
import { useStore } from '../utils/store';
import type { FinancialAsset, RealAsset, LiabilityItem } from '../types';
import { Card, CardTitle, Field, Num, Text, InfoBox, SectionHeader, RowActions, CurrencyToggle, Select, EmptyState } from '../components/ui';
import { DoughnutChart } from '../components/charts';
import { countryOf, totalFinancialAssets, totalRealAssets, totalLiabilities, fmt, toBase } from '../utils/engine';
import { Landmark, Home, CreditCard, Plus, Scale } from 'lucide-react';

let uid = 0;
const nid = () => `id-${Date.now()}-${uid++}`;

export default function Assets() {
  const { data, update } = useStore();
  const d = data!;
  const c = countryOf(d);
  const sym = c.currencySymbol;

  const fin = totalFinancialAssets(d.financialAssets, d);
  const real = totalRealAssets(d.realAssets, d);
  const liab = totalLiabilities(d.liabilities, d);
  const empty = d.realAssets.length === 0 && d.financialAssets.length === 0 && d.liabilities.length === 0;

  return (
    <div className="p-4 pt-5 pb-8 space-y-4 animate-fade-in">
      <SectionHeader title="Assets & Liabilities" subtitle="Everything you own and owe. Amounts in either currency are converted at your FX rate." />

      {empty && (
        <EmptyState icon={<Scale size={26} />} title="No assets yet"
          body="Add what you own (property, funds, deposits) and what you owe (loans). Financial assets can be mapped to goals so projections know what funds what." />
      )}

      {!empty && (
        <Card>
          <CardTitle>Balance Sheet</CardTitle>
          <div className="flex gap-4 items-center">
            <div className="w-32 shrink-0">
              <DoughnutChart labels={['Financial', 'Real estate']} values={[fin, real]} colors={['#38bdf8', '#a78bfa']} />
            </div>
            <div className="flex-1 space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-dim">Financial assets</span><b className="tabular">{fmt(fin, sym)}</b></div>
              <div className="flex justify-between"><span className="text-dim">Real assets</span><b className="tabular">{fmt(real, sym)}</b></div>
              <div className="flex justify-between"><span className="text-dim">Liabilities</span><b className="tabular text-red">-{fmt(liab, sym)}</b></div>
              <div className="flex justify-between border-t pt-1.5" style={{ borderColor: 'var(--card-border)' }}>
                <span>Net worth</span><b className="tabular text-accent">{fmt(fin + real - liab, sym)}</b>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Real assets */}
      <Card>
        <CardTitle right={<Home size={15} className="text-faint" />}>Real Assets</CardTitle>
        <InfoBox>
          Property, land, vehicles, jewellery at <b>current market value</b>. Add monthly rent if it earns any.
          Example: “Home 1”, value 3800000 ₹, rent 14000 ₹.
        </InfoBox>
        <div className="space-y-2 mt-3">
          {d.realAssets.map(a => (
            <RealAssetRow key={a.id} asset={a}
              onChange={na => update(prev => ({ ...prev, realAssets: prev.realAssets.map(x => x.id === a.id ? na : x) }))}
              onDelete={() => update(prev => ({ ...prev, realAssets: prev.realAssets.filter(x => x.id !== a.id) }))} />
          ))}
          <button className="btn-ghost w-full" onClick={() => update(prev => ({
            ...prev, realAssets: [...prev.realAssets, { id: nid(), name: '', value: null, currency: c.baseCurrency, monthlyRent: null }],
          }))}><Plus size={14} /> Add real asset</button>
        </div>
      </Card>

      {/* Financial assets */}
      <Card>
        <CardTitle right={<Landmark size={15} className="text-faint" />}>Financial Assets</CardTitle>
        <InfoBox>
          Mutual funds, stocks, FDs, {c.retirementAccountName}, {c.healthAccountName}, gold coins.
          <b> Map each to a goal</b> — “Retirement” funds the retirement projection, “Children” funds education goals,
          “None” is general wealth. Example: “NPS”, value 379000 ₹, return 9%, mapped to Retirement.
        </InfoBox>
        <div className="space-y-2 mt-3">
          {d.financialAssets.map(a => (
            <FinAssetRow key={a.id} asset={a}
              onChange={na => update(prev => ({ ...prev, financialAssets: prev.financialAssets.map(x => x.id === a.id ? na : x) }))}
              onDelete={() => update(prev => ({ ...prev, financialAssets: prev.financialAssets.filter(x => x.id !== a.id) }))} />
          ))}
          <button className="btn-ghost w-full" onClick={() => update(prev => ({
            ...prev, financialAssets: [...prev.financialAssets, { id: nid(), name: '', value: null, currency: c.baseCurrency, expectedReturn: null, monthlyContribution: null, mappedTo: 'none' }],
          }))}><Plus size={14} /> Add financial asset</button>
        </div>
      </Card>

      {/* Liabilities */}
      <Card>
        <CardTitle right={<CreditCard size={15} className="text-faint" />}>Liabilities</CardTitle>
        <InfoBox>
          Outstanding loan principal (not the original loan amount). Example: “Home Loan 1”, outstanding 672000 ₹,
          rate 6.1%, EMI 4800 ₹.
        </InfoBox>
        <div className="space-y-2 mt-3">
          {d.liabilities.map(l => (
            <LiabilityRow key={l.id} item={l}
              onChange={nl => update(prev => ({ ...prev, liabilities: prev.liabilities.map(x => x.id === l.id ? nl : x) }))}
              onDelete={() => update(prev => ({ ...prev, liabilities: prev.liabilities.filter(x => x.id !== l.id) }))} />
          ))}
          <button className="btn-ghost w-full" onClick={() => update(prev => ({
            ...prev, liabilities: [...prev.liabilities, { id: nid(), name: '', outstanding: null, currency: c.baseCurrency, interestRate: null, emi: null, emiCurrency: c.baseCurrency }],
          }))}><Plus size={14} /> Add liability</button>
        </div>
      </Card>
    </div>
  );
}

function RealAssetRow({ asset, onChange, onDelete }: { asset: RealAsset; onChange: (a: RealAsset) => void; onDelete: () => void }) {
  return (
    <div className="card p-3 space-y-2">
      <div className="flex gap-2 items-center">
        <input className="input !py-2 flex-1" placeholder='e.g. "Home 1" or "Farmland"' value={asset.name} onChange={e => onChange({ ...asset, name: e.target.value })} />
        <RowActions onDelete={onDelete} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Num value={asset.value} onChange={v => onChange({ ...asset, value: v })} placeholder="Market value" />
        <CurrencyToggle value={asset.currency} onChange={v => onChange({ ...asset, currency: v })} />
      </div>
      <Num value={asset.monthlyRent} onChange={v => onChange({ ...asset, monthlyRent: v })} placeholder="Monthly rent (optional)" />
    </div>
  );
}

function FinAssetRow({ asset, onChange, onDelete }: { asset: FinancialAsset; onChange: (a: FinancialAsset) => void; onDelete: () => void }) {
  const { data } = useStore();
  const c = countryOf(data!);
  return (
    <div className="card p-3 space-y-2">
      <div className="flex gap-2 items-center">
        <input className="input !py-2 flex-1" placeholder='e.g. "NPS" or "401(k) Index Fund"' value={asset.name} onChange={e => onChange({ ...asset, name: e.target.value })} />
        <RowActions onDelete={onDelete} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Num value={asset.value} onChange={v => onChange({ ...asset, value: v })} placeholder="Current value" />
        <CurrencyToggle value={asset.currency} onChange={v => onChange({ ...asset, currency: v })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Num value={asset.expectedReturn != null ? asset.expectedReturn * 100 : null} suffix="%"
          onChange={v => onChange({ ...asset, expectedReturn: v != null ? v / 100 : null })} placeholder="Return %/yr" />
        <Num value={asset.monthlyContribution} onChange={v => onChange({ ...asset, monthlyContribution: v })} placeholder="Monthly SIP" />
      </div>
      <Field label="Mapped to goal" hint={`“Retirement” → retirement projection · “Children” → education corpus · “None” → general net worth. Worth in base currency: ${asset.value ? fmt(toBase(asset.value, asset.currency, data!), c.currencySymbol) : '—'}`}>
        <Select value={asset.mappedTo} onChange={v => onChange({ ...asset, mappedTo: v as FinancialAsset['mappedTo'] })}
          options={[{ value: 'none', label: 'None — general wealth' }, { value: 'retirement', label: 'Retirement' }, { value: 'children', label: 'Children goals' }]} />
      </Field>
    </div>
  );
}

function LiabilityRow({ item, onChange, onDelete }: { item: LiabilityItem; onChange: (l: LiabilityItem) => void; onDelete: () => void }) {
  return (
    <div className="card p-3 space-y-2">
      <div className="flex gap-2 items-center">
        <input className="input !py-2 flex-1" placeholder='e.g. "Home Loan 1"' value={item.name} onChange={e => onChange({ ...item, name: e.target.value })} />
        <RowActions onDelete={onDelete} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Num value={item.outstanding} onChange={v => onChange({ ...item, outstanding: v })} placeholder="Outstanding" />
        <CurrencyToggle value={item.currency} onChange={v => onChange({ ...item, currency: v })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Num value={item.interestRate != null ? item.interestRate * 100 : null} suffix="%"
          onChange={v => onChange({ ...item, interestRate: v != null ? v / 100 : null })} placeholder="Interest %" />
        <Num value={item.emi} onChange={v => onChange({ ...item, emi: v })} placeholder="Monthly EMI" />
      </div>
    </div>
  );
}
