// @vitest-environment jsdom
// i18n regression: every English key must have a Tamil translation and vice versa.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../src/utils/i18n.tsx'), 'utf8');

// Extract the keys listed in each language block by splitting on the language markers.
function block(lang: 'en' | 'ta'): string {
  const marker = `  ${lang}: {`;
  const start = src.indexOf(marker);
  expect(start).toBeGreaterThan(-1);
  const rest = src.slice(start + marker.length);
  const end = rest.indexOf('\n  },');
  return rest.slice(0, end);
}
function keys(lang: 'en' | 'ta'): string[] {
  return [...block(lang).matchAll(/'([^']+)':/g)].map(m => m[1]);
}

describe('i18n dictionary', () => {
  it('every English key has a Tamil translation', () => {
    const en = keys('en');
    const ta = new Set(keys('ta'));
    const missing = en.filter(k => !ta.has(k));
    expect(missing).toEqual([]);
  });
  it('every Tamil key exists in English', () => {
    const ta = keys('ta');
    const en = new Set(keys('en'));
    const extra = ta.filter(k => !en.has(k));
    expect(extra).toEqual([]);
  });
  it('has no duplicate keys within a language', () => {
    for (const lang of ['en', 'ta'] as const) {
      const ks = keys(lang);
      expect(new Set(ks).size).toBe(ks.length);
    }
  });
  it('placeholder variables match between languages', () => {
    const enBlock = block('en');
    const taBlock = block('ta');
    const enEntries = [...enBlock.matchAll(/'([^']+)':\s*'((?:[^'\\]|\\.)*)'/g)];
    for (const [, key, enVal] of enEntries) {
      const taMatch = taBlock.match(new RegExp(`'${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}':\\s*'((?:[^'\\\\]|\\\\.)*)'`));
      if (!taMatch) continue;
      const enVars = [...enVal.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
      const taVars = [...taMatch[1].matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
      expect(taVars, `key ${key}`).toEqual(enVars);
    }
  });
});
