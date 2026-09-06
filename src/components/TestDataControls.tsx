// Dev/testing helper — load or clear the full reference dataset.
// NOTE: remove this testing card for the production build.
import { useState } from 'react';
import { FlaskConical, Eraser } from 'lucide-react';
import { useStore } from '../utils/store';
import { buildTestData } from '../utils/testData';
import { emptyFireData } from '../types';

export function TestDataControls() {
  const { update } = useStore();
  const [confirm, setConfirm] = useState<'load' | 'clear' | null>(null);
  const [done, setDone] = useState('');

  const load = () => {
    update(() => buildTestData());
    setConfirm(null);
    setDone('Test data loaded — check every tab.');
    setTimeout(() => setDone(''), 3000);
  };

  const clear = () => {
    update(prev => emptyFireData(prev.country));
    setConfirm(null);
    setDone('All data cleared.');
    setTimeout(() => setDone(''), 3000);
  };

  return (
    <div className="card p-3 space-y-2 no-print" style={{ borderStyle: 'dashed' }}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-faint flex items-center gap-1.5">
        <FlaskConical size={12} /> Testing
      </p>
      {confirm === null && (
        <div className="flex gap-2">
          <button className="btn-ghost flex-1 !text-xs" onClick={() => setConfirm('load')}>
            Auto-populate test data
          </button>
          <button className="btn-ghost !text-xs" onClick={() => setConfirm('clear')}>
            <Eraser size={13} /> Clear data
          </button>
        </div>
      )}
      {confirm === 'load' && (
        <div className="text-xs space-y-2">
          <p className="text-dim">Replace current entries with the sample household dataset (fictional family)?</p>
          <div className="flex gap-2">
            <button className="btn-primary !py-2 !text-xs flex-1" onClick={load}>Yes, load it</button>
            <button className="btn-ghost !text-xs" onClick={() => setConfirm(null)}>Cancel</button>
          </div>
        </div>
      )}
      {confirm === 'clear' && (
        <div className="text-xs space-y-2">
          <p className="text-dim">Erase everything you entered? This cannot be undone.</p>
          <div className="flex gap-2">
            <button className="btn-primary !py-2 !text-xs flex-1" style={{ background: 'var(--red)' }} onClick={clear}>Yes, erase</button>
            <button className="btn-ghost !text-xs" onClick={() => setConfirm(null)}>Cancel</button>
          </div>
        </div>
      )}
      {done && <p className="text-xs text-green">{done}</p>}
    </div>
  );
}
