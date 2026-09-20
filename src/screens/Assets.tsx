// Screen 3 — Assets & Liabilities
import { useStore } from '../utils/store';
import type { FinancialAsset, RealAsset, LiabilityItem } from '../types';
import { Card, CardTitle, Field, Num, pct, InfoBox, SectionHeader, RowActions, CurrencyToggle, Select, EmptyState } from '../components/ui';
import { DoughnutChart } from '../components/charts';
import { countryOf, totalFinancialAssets, totalRealAssets, totalLiabilities, fmt, toBase } from '../utils/engine';
import { Landmark, Home, CreditCard, Plus, Scale } from 'lucide-react';
import { useT } from '../utils/i18n';

let uid = 0;
const nid = () => `id-${Date.now()}-${uid++}`;

export default function Assets() {
  const { data, update } = useStore();
  const t = useT();
  const d = data!;
  const c = countryOf(d);
  const sym = c.currencySymbol;

  const fin = totalFinancialAssets(d.financialAssets, d);
  const real = totalRealAssets(d.realAssets, d);
  const liab = totalLiabilities(d.liabilities, d);
  const empty = d.realAssets.length === 0 && d.financialAssets.length === 0 && d.liabilities.length === 0;

  return (
    <div className="p-4 pt-5 pb-8 space-y-4 animate-fade-in">
      <SectionHeader title={t('as.title')} subtitle={t('as.sub')} />

      {empty && (
        <EmptyState icon={<Scale size={26} />} title={t('as.emptyTitle')}
          body={t('as.emptyBody')} />
      )}

      {!empty && (
        <Card>
          <CardTitle>{t('as.bs')}</CardTitle>
          <div className="flex gap-4 items-center">
            <div className="w-32 shrink-0">
              <DoughnutChart labels={[t('chart.fin'), t('chart.real')]} values={[fin, real]} colors={['#38bdf8', '#a78bfa']} />
            </div>
            <div className="flex-1 space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-dim">{t('nw.fin')}</span><b className="tabular">{fmt(fin, sym)}</b></div>
              <div className="flex justify-between"><span className="text-dim">{t('nw.real')}</span><b className="tabular">{fmt(real, sym)}</b></div>
              <div className="flex justify-between"><span className="text-dim">{t('nw.liab')}</span><b className="tabular text-red">-{fmt(liab, sym)}</b></div>
              <div className="flex justify-between border-t pt-1.5" style={{ borderColor: 'var(--card-border)' }}>
                <span>{t('nw.net')}</span><b className="tabular text-accent">{fmt(fin + real - liab, sym)}</b>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Real assets */}
      <Card>
        <CardTitle right={<Home size={15} className="text-faint" />}>{t('as.realTitle')}</CardTitle>
        <InfoBox>{t('as.realInfo')}</InfoBox>
        <div className="space-y-2 mt-3">
          {d.realAssets.map(a => (
            <RealAssetRow key={a.id} asset={a}
              onChange={na => update(prev => ({ ...prev, realAssets: prev.realAssets.map(x => x.id === a.id ? na : x) }))}
              onDelete={() => update(prev => ({ ...prev, realAssets: prev.realAssets.filter(x => x.id !== a.id) }))} />
          ))}
          <button className="btn-ghost w-full" onClick={() => update(prev => ({
            ...prev, realAssets: [...prev.realAssets, { id: nid(), name: '', value: null, currency: c.baseCurrency, monthlyRent: null }],
          }))}><Plus size={14} /> {t('as.addReal')}</button>
        </div>
      </Card>

      {/* Financial assets */}
      <Card>
        <CardTitle right={<Landmark size={15} className="text-faint" />}>{t('as.finTitle')}</CardTitle>
        <InfoBox>{t('as.finInfo', { ret: c.retirementAccountName, hsa: c.healthAccountName })}</InfoBox>
        <div className="space-y-2 mt-3">
          {d.financialAssets.map(a => (
            <FinAssetRow key={a.id} asset={a}
              onChange={na => update(prev => ({ ...prev, financialAssets: prev.financialAssets.map(x => x.id === a.id ? na : x) }))}
              onDelete={() => update(prev => ({ ...prev, financialAssets: prev.financialAssets.filter(x => x.id !== a.id) }))} />
          ))}
          <button className="btn-ghost w-full" onClick={() => update(prev => ({
            ...prev, financialAssets: [...prev.financialAssets, { id: nid(), name: '', value: null, currency: c.baseCurrency, expectedReturn: null, monthlyContribution: null, mappedTo: 'none' }],
          }))}><Plus size={14} /> {t('as.addFin')}</button>
        </div>
      </Card>

      {/* Liabilities */}
      <Card>
        <CardTitle right={<CreditCard size={15} className="text-faint" />}>{t('as.liabTitle')}</CardTitle>
        <InfoBox>{t('as.liabInfo')}</InfoBox>
        <div className="space-y-2 mt-3">
          {d.liabilities.map(l => (
            <LiabilityRow key={l.id} item={l}
              onChange={nl => update(prev => ({ ...prev, liabilities: prev.liabilities.map(x => x.id === l.id ? nl : x) }))}
              onDelete={() => update(prev => ({ ...prev, liabilities: prev.liabilities.filter(x => x.id !== l.id) }))} />
          ))}
          <button className="btn-ghost w-full" onClick={() => update(prev => ({
            ...prev, liabilities: [...prev.liabilities, { id: nid(), name: '', outstanding: null, currency: c.baseCurrency, interestRate: null, emi: null, emiCurrency: c.baseCurrency }],
          }))}><Plus size={14} /> {t('as.addLiab')}</button>
        </div>
      </Card>
    </div>
  );
}

function RealAssetRow({ asset, onChange, onDelete }: { asset: RealAsset; onChange: (a: RealAsset) => void; onDelete: () => void }) {
  const t = useT();
  return (
    <div className="card p-3 space-y-2">
      <div className="flex gap-2 items-center">
        <input className="input !py-2 flex-1" placeholder={t('ra.namePh')} value={asset.name} onChange={e => onChange({ ...asset, name: e.target.value })} />
        <RowActions onDelete={onDelete} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Num value={asset.value} onChange={v => onChange({ ...asset, value: v })} placeholder={t('ra.value')} />
        <CurrencyToggle value={asset.currency} onChange={v => onChange({ ...asset, currency: v })} />
      </div>
      <Num value={asset.monthlyRent} onChange={v => onChange({ ...asset, monthlyRent: v })} placeholder={t('ra.rent')} />
    </div>
  );
}

function FinAssetRow({ asset, onChange, onDelete }: { asset: FinancialAsset; onChange: (a: FinancialAsset) => void; onDelete: () => void }) {
  const { data } = useStore();
  const t = useT();
  const c = countryOf(data!);
  return (
    <div className="card p-3 space-y-2">
      <div className="flex gap-2 items-center">
        <input className="input !py-2 flex-1" placeholder={t('fa.namePh')} value={asset.name} onChange={e => onChange({ ...asset, name: e.target.value })} />
        <RowActions onDelete={onDelete} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Num value={asset.value} onChange={v => onChange({ ...asset, value: v })} placeholder={t('fa.value')} />
        <CurrencyToggle value={asset.currency} onChange={v => onChange({ ...asset, currency: v })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Num value={pct(asset.expectedReturn)} suffix="%"
          onChange={v => onChange({ ...asset, expectedReturn: v != null ? v / 100 : null })} placeholder={t('fa.retPh')} />
        <Num value={asset.monthlyContribution} onChange={v => onChange({ ...asset, monthlyContribution: v })} placeholder={t('fa.sipPh')} />
      </div>
      <p className="hint">{t('fa.hint')}</p>
      <Field label={t('fa.mapped')} hint={t('fa.mappedHint', { worth: asset.value ? fmt(toBase(asset.value, asset.currency, data!), c.currencySymbol) : '—' })}>
        <Select value={asset.mappedTo} onChange={v => onChange({ ...asset, mappedTo: v as FinancialAsset['mappedTo'] })}
          options={[{ value: 'none', label: t('fa.none') }, { value: 'retirement', label: t('fa.retirement') }, { value: 'children', label: t('fa.children') }]} />
      </Field>
    </div>
  );
}

function LiabilityRow({ item, onChange, onDelete }: { item: LiabilityItem; onChange: (l: LiabilityItem) => void; onDelete: () => void }) {
  const t = useT();
  return (
    <div className="card p-3 space-y-2">
      <div className="flex gap-2 items-center">
        <input className="input !py-2 flex-1" placeholder={t('li.namePh')} value={item.name} onChange={e => onChange({ ...item, name: e.target.value })} />
        <RowActions onDelete={onDelete} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Num value={item.outstanding} onChange={v => onChange({ ...item, outstanding: v })} placeholder={t('li.outstanding')} />
        <CurrencyToggle value={item.currency} onChange={v => onChange({ ...item, currency: v })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Num value={pct(item.interestRate)} suffix="%"
          onChange={v => onChange({ ...item, interestRate: v != null ? v / 100 : null })} placeholder={t('li.int')} />
        <Num value={item.emi} onChange={v => onChange({ ...item, emi: v })} placeholder={t('li.emi')} />
      </div>
    </div>
  );
}
