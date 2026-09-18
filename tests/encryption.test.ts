// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import {
  hashPIN, verifyPIN, encryptData, decryptData, generateRecoveryKey,
  encryptPinWithAnswers, decryptPinWithAnswers,
} from '../src/utils/encryption';

describe('PIN hashing', () => {
  it('hashes and verifies a PIN', async () => {
    const { hash } = await hashPIN('4321');
    expect(await verifyPIN('4321', hash)).toBe(true);
    expect(await verifyPIN('1234', hash)).toBe(false);
  });

  it('produces different hashes for same PIN (random salt)', async () => {
    const a = await hashPIN('5555');
    const b = await hashPIN('5555');
    expect(a.hash).not.toBe(b.hash);
    expect(await verifyPIN('5555', a.hash)).toBe(true);
    expect(await verifyPIN('5555', b.hash)).toBe(true);
  });

  it('rejects malformed stored hash', async () => {
    expect(await verifyPIN('1234', 'garbage')).toBe(false);
  });
});

describe('Data encryption (AES-256-GCM)', () => {
  it('round-trips data with the PIN', async () => {
    const payload = JSON.stringify({ netWorth: 1234567, name: 'Test User' });
    const enc = await encryptData(payload, '2468');
    const dec = await decryptData(enc, '2468');
    expect(dec).toBe(payload);
  });

  it('fails to decrypt with the wrong PIN', async () => {
    const enc = await encryptData('secret', '1111');
    await expect(decryptData(enc, '2222')).rejects.toThrow();
  });

  it('fails on corrupted payload', async () => {
    const enc = await encryptData('secret', '1111');
    const bad = { ...enc, ciphertext: enc.ciphertext.slice(0, -2) + (enc.ciphertext.endsWith('00') ? 'ff' : '00') };
    await expect(decryptData(bad, '1111')).rejects.toThrow();
  });
});

describe('Recovery key', () => {
  it('generates grouped human-readable keys', () => {
    const k = generateRecoveryKey();
    expect(k).toMatch(/^[A-Z2-9]{6}-[A-Z2-9]{6}-[A-Z2-9]{6}-[A-Z2-9]{6}$/);
    // no ambiguous chars
    expect(k).not.toMatch(/[01IO]/);
  });
});

describe('PIN recovery via security answers', () => {
  const questions = ['Q1', 'Q2'];

  it('recovers the PIN with correct answers', async () => {
    const rec = await encryptPinWithAnswers('9876', ['Chennai', 'Fluffy']);
    expect(await decryptPinWithAnswers(rec, ['Chennai', 'Fluffy'])).toBe('9876');
    expect(questions.length).toBe(2);
  });

  it('is case-insensitive and ignores extra whitespace', async () => {
    const rec = await encryptPinWithAnswers('9876', ['New York', 'Fluffy']);
    expect(await decryptPinWithAnswers(rec, ['  new york ', 'FLUFFY'])).toBe('9876');
    expect(await decryptPinWithAnswers(rec, ['new   york', 'fluffy  '])).toBe('9876');
  });

  it('rejects wrong answers', async () => {
    const rec = await encryptPinWithAnswers('9876', ['Chennai', 'Fluffy']);
    expect(await decryptPinWithAnswers(rec, ['Mumbai', 'Fluffy'])).toBeNull();
    expect(await decryptPinWithAnswers(rec, ['Chennai', 'Rex'])).toBeNull();
  });

  it('rejects missing answers', async () => {
    const rec = await encryptPinWithAnswers('9876', ['Chennai', 'Fluffy']);
    expect(await decryptPinWithAnswers(rec, ['Chennai'])).toBeNull();
  });

  it('returns null for corrupted recovery data', async () => {
    expect(await decryptPinWithAnswers('not-json', ['a', 'b'])).toBeNull();
  });
});
