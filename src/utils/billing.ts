// ============================================
// Billing — Google Play subscription (via @capgo/native-purchases).
// Entitlement model:
//   • First 30 days after first app launch: full access (app-managed trial).
//   • After that: an active Play subscription is required for editing.
//   • Expired without subscription → read-only mode (data stays visible).
// Only the license check talks to Google; all financial data stays on-device.
// ============================================

import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';

export const PRODUCT_ID = 'fire_premium_monthly';
export const PLAN_ID = 'monthly'; // Base plan ID — must match Play Console
export const TRIAL_DAYS = 30;

const TRIAL_KEY = 'fire_trial_start';
const PREMIUM_CACHE_KEY = 'fire_premium_cache';

export interface ProductInfo {
  title: string;
  priceString: string;
}

export const isNative = () => Capacitor.isNativePlatform();

/** Never let a Play Billing call hang the UI — fail after `ms` so the app stays responsive. */
function withTimeout<T>(p: Promise<T>, ms = 12000): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('billing-timeout')), ms)),
  ]);
}

/** Trial clock starts at first launch of the installed app. */
export function getTrialStart(): number {
  const raw = localStorage.getItem(TRIAL_KEY);
  if (raw) return Number(raw);
  const now = Date.now();
  localStorage.setItem(TRIAL_KEY, String(now));
  return now;
}

export function trialDaysLeft(): number {
  const elapsed = Date.now() - getTrialStart();
  return Math.max(0, TRIAL_DAYS - Math.floor(elapsed / 86_400_000));
}

interface PremiumCache { premium: boolean; checkedAt: number }

function readCache(): PremiumCache | null {
  try {
    const raw = localStorage.getItem(PREMIUM_CACHE_KEY);
    return raw ? JSON.parse(raw) as PremiumCache : null;
  } catch { return null; }
}

function writeCache(premium: boolean) {
  const c: PremiumCache = { premium, checkedAt: Date.now() };
  localStorage.setItem(PREMIUM_CACHE_KEY, JSON.stringify(c));
}

/** Check with Google Play whether a subscription is active. */
async function queryPlayPremium(): Promise<boolean> {
  const { purchases } = await withTimeout(NativePurchases.getPurchases({ productType: PURCHASE_TYPE.SUBS }));
  return (purchases || []).some(p => {
    const state = (p as { purchaseState?: string; isAcknowledged?: boolean }).purchaseState;
    // Any returned active subscription purchase counts (Play only returns owned ones).
    return !state || state === 'PURCHASED' || state === '1';
  });
}

/**
 * Resolve premium status. Offline-friendly: if the Play query fails and a
 * cached "premium" result is fresh (< 30 days), keep trusting it so paying
 * users aren't locked out without connectivity.
 */
export async function checkPremium(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const premium = await queryPlayPremium();
    writeCache(premium);
    return premium;
  } catch {
    const cache = readCache();
    if (cache && cache.premium && Date.now() - cache.checkedAt < 30 * 86_400_000) return true;
    return false;
  }
}

export async function loadProduct(): Promise<ProductInfo | null> {
  if (!isNative()) return null;
  try {
    const { products } = await withTimeout(NativePurchases.getProducts({
      productIdentifiers: [PRODUCT_ID],
      productType: PURCHASE_TYPE.SUBS,
    }));
    const p = products?.[0];
    if (!p) return null;
    const anyP = p as unknown as { title?: string; priceString?: string; description?: string };
    return { title: anyP.title || 'FIRE Tracker Premium', priceString: anyP.priceString || '' };
  } catch {
    return null;
  }
}

export async function purchasePremium(): Promise<'ok' | 'cancelled' | 'error'> {
  try {
    await withTimeout(NativePurchases.purchaseProduct({
      productIdentifier: PRODUCT_ID,
      planIdentifier: PLAN_ID,
      productType: PURCHASE_TYPE.SUBS,
    }));
    writeCache(true);
    return 'ok';
  } catch (e) {
    const msg = String((e as Error)?.message || e).toLowerCase();
    if (msg.includes('cancel')) return 'cancelled';
    return 'error';
  }
}

export async function restorePremium(): Promise<boolean> {
  try {
    await withTimeout(NativePurchases.restorePurchases());
    const premium = await queryPlayPremium();
    writeCache(premium);
    return premium;
  } catch {
    return false;
  }
}

export async function openManageSubscriptions(): Promise<void> {
  try {
    await withTimeout(NativePurchases.manageSubscriptions(), 8000);
  } catch { /* ignore */ }
}
