import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CURRENCIES, FX_INR_PER, emptyFireData } from '../src/types';
import { rateToBase, toBase } from '../src/utils/engine';

describe('currency support', () => {
  it('exposes at least 10 currencies, each with a symbol and a positive FX rate', () => {
    expect(CURRENCIES.length).toBeGreaterThanOrEqual(10);
    for (const c of CURRENCIES) {
      expect(c.symbol.length).toBeGreaterThan(0);
      expect(FX_INR_PER[c.code]).toBeGreaterThan(0);
    }
  });

  it('FX_INR_PER covers exactly the supported currency list', () => {
    expect(Object.keys(FX_INR_PER).sort()).toEqual(CURRENCIES.map(c => c.code).sort());
  });

  it('base currency converts at rate 1 (identity)', () => {
    const d = emptyFireData('IN');
    expect(toBase(500000, 'INR', d)).toBe(500000);
  });

  it('alt currency uses the user-editable assumptions.fxRate', () => {
    const d = emptyFireData('IN'); // base INR, alt USD
    d.assumptions.fxRate = 90;
    expect(toBase(1000, 'USD', d)).toBe(90000);
    d.assumptions.fxRate = 95; // user override must win
    expect(toBase(1000, 'USD', d)).toBe(95000);
  });

  it('non-alt foreign currencies convert via the static FX table (AUD, GBP, EUR)', () => {
    const d = emptyFireData('IN');
    expect(toBase(1000, 'AUD', d)).toBeCloseTo(58000);
    expect(toBase(1000, 'GBP', d)).toBeCloseTo(115000);
    expect(toBase(1000, 'EUR', d)).toBeCloseTo(98000);
  });

  it('converts into a USD base correctly for US profiles', () => {
    const d = emptyFireData('US'); // base USD, alt INR
    d.assumptions.fxRate = 1 / 90;
    expect(toBase(90000, 'INR', d)).toBeCloseTo(1000);      // alt currency via fxRate
    expect(toBase(1000, 'GBP', d)).toBeCloseTo(115000 / 90); // GBP → INR → USD
    expect(toBase(1000, 'USD', d)).toBe(1000);
  });

  it('rateToBase never returns 0 or NaN for any supported currency', () => {
    for (const code of ['IN', 'US', 'GB'] as const) {
      const d = emptyFireData(code);
      for (const c of CURRENCIES) {
        const r = rateToBase(c.code, d);
        expect(Number.isFinite(r)).toBe(true);
        expect(r).toBeGreaterThan(0);
      }
    }
  });

  it('currency picker component exposes every supported currency', () => {
    const src = readFileSync(join(__dirname, '../src/components/ui.tsx'), 'utf8');
    // The picker must iterate the shared CURRENCIES list — no hardcoded INR/USD pair
    expect(src).toContain('CURRENCIES.map');
    expect(src).not.toContain("(['INR', 'USD']");
  });
});
