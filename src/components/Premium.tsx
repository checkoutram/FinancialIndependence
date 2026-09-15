// ============================================
// Premium — trial badge, read-only banner and the subscribe paywall.
// ============================================

import { useEffect, useState } from 'react';
import { Crown, X, RefreshCw, ExternalLink } from 'lucide-react';
import { useStore } from '../utils/store';
import {
  loadProduct, purchasePremium, restorePremium, openManageSubscriptions,
  isNative, TRIAL_DAYS, type ProductInfo,
} from '../utils/billing';

export function PremiumModal({ onClose }: { onClose: () => void }) {
  const { refreshEntitlement, entitlement } = useStore();
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void loadProduct().then(setProduct);
  }, []);

  useEffect(() => {
    if (entitlement === 'premium') onClose();
  }, [entitlement, onClose]);

  const subscribe = async () => {
    setBusy(true); setMsg(null);
    const res = await purchasePremium();
    setBusy(false);
    if (res === 'ok') {
      await refreshEntitlement();
    } else if (res === 'error') {
      setMsg('Purchase could not be completed. Check your connection and Play Store account, then try again.');
    }
  };

  const restore = async () => {
    setBusy(true); setMsg(null);
    const ok = await restorePremium();
    setBusy(false);
    if (ok) await refreshEntitlement();
    else setMsg('No active subscription found for this Play Store account.');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-8" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown size={22} className="text-amber" />
            <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>FIRE Tracker Premium</h2>
          </div>
          <button onClick={onClose} aria-label="Close"><X size={20} style={{ color: 'var(--text-faint)' }} /></button>
        </div>

        <ul className="text-sm space-y-2 mb-5" style={{ color: 'var(--text-muted)' }}>
          <li>• Keep editing your full financial plan after the {TRIAL_DAYS}-day free trial</li>
          <li>• All projections, goals, FIRE variants and assets stay unlocked</li>
          <li>• Your data stays 100% on your device, encrypted — always</li>
          <li>• Cancel anytime in Google Play</li>
        </ul>

        <button
          onClick={subscribe}
          disabled={busy}
          className="w-full py-3.5 rounded-2xl font-bold text-base mb-3 disabled:opacity-50"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {busy ? 'Please wait…' : `Subscribe${product?.priceString ? ` — ${product.priceString}/month` : ''}`}
        </button>

        <div className="flex gap-3">
          <button onClick={restore} disabled={busy}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
            style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--card-border)' }}>
            <RefreshCw size={14} /> Restore purchase
          </button>
          <button onClick={() => void openManageSubscriptions()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
            style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--card-border)' }}>
            <ExternalLink size={14} /> Manage
          </button>
        </div>

        {msg && <p className="text-xs mt-3 text-center" style={{ color: 'var(--red, #f87171)' }}>{msg}</p>}
        {!isNative() && (
          <p className="text-xs mt-3 text-center" style={{ color: 'var(--text-faint)' }}>
            Subscriptions are available in the Android app.
          </p>
        )}
      </div>
    </div>
  );
}

/** Slim status row shown at the top of the Home tab. */
export function PremiumStatus() {
  const { entitlement, trialLeft } = useStore();
  const [open, setOpen] = useState(false);

  if (entitlement === 'premium') return null;

  if (entitlement === 'trial') {
    return (
      <>
        <button onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl mb-4 text-xs font-semibold"
          style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--amber, #fbbf24)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <span className="flex items-center gap-1.5"><Crown size={14} /> Free trial — {trialLeft} day{trialLeft === 1 ? '' : 's'} left</span>
          <span style={{ textDecoration: 'underline' }}>Go Premium</span>
        </button>
        {open && <PremiumModal onClose={() => setOpen(false)} />}
      </>
    );
  }

  // expired → read-only banner
  return (
    <>
      <div className="w-full px-4 py-3 rounded-2xl mb-4"
        style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)' }}>
        <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--red, #f87171)' }}>Trial ended — read-only mode</p>
        <p className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
          Your data is safe and fully visible, but editing is locked. Subscribe to continue planning.
        </p>
        <button onClick={() => setOpen(true)}
          className="w-full py-2 rounded-xl text-xs font-bold"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          Unlock Premium
        </button>
      </div>
      {open && <PremiumModal onClose={() => setOpen(false)} />}
    </>
  );
}
