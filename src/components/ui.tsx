// Shared UI primitives — consistent financial-app look & feel.
import { useState, type ReactNode } from 'react';
import { ChevronDown, Info, Trash2 } from 'lucide-react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card p-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-bold text-sm tracking-wide">{children}</h3>
      {right}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

interface NumProps {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  step?: string;
  prefix?: string;
  suffix?: string;
  min?: number;
}

/** Numeric input that stays empty (no fake zeros) until the user types. */
export function Num({ value, onChange, placeholder, step = 'any', prefix, suffix, min }: NumProps) {
  return (
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-faint text-sm">{prefix}</span>}
      <input
        type="number"
        inputMode="decimal"
        className={`input tabular ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-10' : ''}`}
        value={value ?? ''}
        min={min}
        step={step}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-faint text-xs">{suffix}</span>}
    </div>
  );
}

export function Text({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input type="text" className="input" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />;
}

export function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input type="date" className="input" value={value} onChange={e => onChange(e.target.value)} />;
}

export function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <select className="input" value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Accordion({ title, subtitle, icon, defaultOpen = false, children }: {
  title: string; subtitle?: string; icon?: ReactNode; defaultOpen?: boolean; children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setOpen(!open)}>
        {icon && <span className="text-accent">{icon}</span>}
        <span className="flex-1">
          <span className="block font-bold text-sm">{title}</span>
          {subtitle && <span className="block text-xs text-faint mt-0.5">{subtitle}</span>}
        </span>
        <ChevronDown size={18} className={`text-faint transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 space-y-4 animate-fade-in">{children}</div>}
    </div>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const v = Math.max(0, Math.min(100, value));
  const c = color || (v >= 80 ? 'var(--green)' : v >= 40 ? 'var(--amber)' : 'var(--red)');
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${v}%`, background: c }} />
    </div>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'green' | 'amber' | 'red' }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-faint font-semibold">{label}</div>
      <div className={`text-lg font-bold tabular ${tone ? `text-${tone}` : ''}`}>{value}</div>
      {sub && <div className="text-xs text-dim">{sub}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <Card className="text-center py-10 px-6">
      <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--input-bg)', color: 'var(--accent)' }}>
        {icon}
      </div>
      <h3 className="font-bold mb-1">{title}</h3>
      <p className="text-sm text-dim mb-4 max-w-xs mx-auto">{body}</p>
      {action}
    </Card>
  );
}

export function InfoBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5 p-3 rounded-xl text-xs leading-relaxed" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--text-dim)' }}>
      <Info size={15} className="shrink-0 mt-0.5 text-accent" />
      <div>{children}</div>
    </div>
  );
}

export function RowActions({ onDelete }: { onDelete: () => void }) {
  return (
    <button onClick={onDelete} className="p-1.5 rounded-lg text-faint hover:text-red-400 transition-colors" aria-label="Delete row">
      <Trash2 size={15} />
    </button>
  );
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="pt-1">
      <h2 className="text-lg font-bold">{title}</h2>
      {subtitle && <p className="text-xs text-dim mt-0.5">{subtitle}</p>}
    </div>
  );
}

export function CurrencyToggle({ value, onChange }: { value: string; onChange: (v: 'INR' | 'USD') => void }) {
  return (
    <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--card-border)' }}>
      {(['INR', 'USD'] as const).map(c => (
        <button key={c} type="button" onClick={() => onChange(c)}
          className="px-3 py-1.5 text-xs font-bold transition-colors"
          style={{ background: value === c ? 'var(--accent)' : 'transparent', color: value === c ? '#fff' : 'var(--text-dim)' }}>
          {c === 'INR' ? '₹ INR' : '$ USD'}
        </button>
      ))}
    </div>
  );
}
