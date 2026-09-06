// Screen 7 — Validation: engine vs Excel source of truth
import { useMemo } from 'react';
import { runValidation } from '../utils/validation';
import { Card, CardTitle, SectionHeader, InfoBox } from '../components/ui';
import { formatIndianNumber } from '../utils/engine';
import { CheckCircle2, XCircle, FlaskConical } from 'lucide-react';

export default function Validate() {
  const results = useMemo(() => runValidation(), []);
  const passed = results.filter(r => r.pass).length;

  return (
    <div className="p-4 pt-5 pb-8 space-y-4 animate-fade-in">
      <SectionHeader title="Calculation Validation" subtitle="The projection engine is tested against the Excel planning template (source of truth)." />

      <Card className="flex items-center gap-3">
        <FlaskConical size={22} className={passed === results.length ? 'text-green' : 'text-amber'} />
        <div className="flex-1">
          <div className="font-bold">{passed} / {results.length} tests passing</div>
          <div className="text-xs text-dim">1% tolerance · FX rate ₹90/$ · reference year 2026</div>
        </div>
        <span className={`badge ${passed === results.length ? 'badge-green' : 'badge-red'}`}>
          {passed === results.length ? 'ALL PASS' : 'CHECK'}
        </span>
      </Card>

      <InfoBox>
        These tests run the app's engine on the <b>fixed reference dataset</b> from the Excel template
        (₹30L deposit + ₹90K/mo for children, ₹1.92 Cr + ₹47.5K/mo for retirement, ₹2.05L/mo for the home goal)
        and compare against the workbook's own computed cells. This fixture is separate from your personal data.
      </InfoBox>

      <div className="space-y-2">
        {results.map(r => (
          <Card key={r.name} className="!p-3">
            <div className="flex items-center gap-2.5">
              {r.pass ? <CheckCircle2 size={18} className="text-green shrink-0" /> : <XCircle size={18} className="text-red shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{r.name}</div>
                <div className="text-[11px] text-faint truncate">{r.source}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-faint">Expected <span className="tabular">₹{formatIndianNumber(r.expected)}</span></div>
                <div className={`text-sm font-bold tabular ${r.pass ? 'text-green' : 'text-red'}`}>₹{formatIndianNumber(r.actual)}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardTitle>Reference values (from the workbook)</CardTitle>
        <div className="text-xs text-dim space-y-1.5">
          <p>• Children INR glide: 80% equity → steps down 70/60/50 near the goal, then 40/30 → 20/10/0 at the horizon.</p>
          <p>• Retirement glide: 80% until retirement year, 70% for 11 years after, 50% thereafter — to age 85.</p>
          <p>• Education withdrawals inflated at 9% (₹) / 7% ($); marriage at 6%; SIPs step up 5% (₹) / 2% ($) yearly.</p>
          <p>• First-year SIPs counted for 10 months (children) / 12 months (retirement, home).</p>
        </div>
      </Card>
    </div>
  );
}
