// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { buildBackup, restoreBackup, backupDue, lastBackupAt, backupFileName } from '../src/utils/backup';
import { storeEncryptedData, getEncryptedData, encryptData, decryptData } from '../src/utils/encryption';

async function seedStore(pin = '4321') {
  const enc = await encryptData(JSON.stringify({ hello: 'world', value: 42 }), pin);
  storeEncryptedData({
    pinHash: 'abc:def',
    recoveryKey: 'AAAAAA-BBBBBB-CCCCCC-DDDDDD',
    encryptedData: JSON.stringify(enc),
    biometricEnabled: false,
    autoLock: 'never',
    recoveryQuestions: ['Q1', 'Q2'],
    recoveryData: '{"x":1}',
  });
}

describe('Backup build', () => {
  beforeEach(() => localStorage.clear());

  it('exports the full encrypted store', async () => {
    await seedStore();
    const parsed = JSON.parse(buildBackup());
    expect(parsed.kind).toBe('fire-tracker-backup');
    expect(parsed.version).toBe(1);
    expect(parsed.store.pinHash).toBe('abc:def');
    expect(parsed.store.recoveryQuestions).toEqual(['Q1', 'Q2']);
    expect(parsed.exportedAt).toBeTruthy();
  });

  it('throws when there is no data', () => {
    expect(() => buildBackup()).toThrow();
  });

  it('backup filename is dated and .json', () => {
    expect(backupFileName()).toMatch(/^fire-tracker-backup-\d{8}\.json$/);
  });
});

describe('Backup restore', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips: export → wipe → restore → decrypt with PIN', async () => {
    await seedStore('7788');
    const backup = buildBackup();
    localStorage.clear();
    expect(getEncryptedData()).toBeNull();

    expect(restoreBackup(backup)).toBeNull();
    const store = getEncryptedData()!;
    expect(store.pinHash).toBe('abc:def');
    expect(store.recoveryQuestions).toEqual(['Q1', 'Q2']);
    expect(store.recoveryData).toBe('{"x":1}');

    const plain = await decryptData(JSON.parse(store.encryptedData), '7788');
    expect(JSON.parse(plain)).toEqual({ hello: 'world', value: 42 });
  });

  it('restores a bare SecureStore (legacy export shape)', async () => {
    await seedStore();
    const store = getEncryptedData()!;
    localStorage.clear();
    expect(restoreBackup(JSON.stringify(store))).toBeNull();
    expect(getEncryptedData()!.pinHash).toBe('abc:def');
  });

  it('rejects garbage input', () => {
    expect(restoreBackup('not json at all')).toMatch(/Could not read/);
    expect(restoreBackup('{"foo": 1}')).toMatch(/does not look like/);
  });

  it('rejects a corrupted encrypted payload', async () => {
    await seedStore();
    const parsed = JSON.parse(buildBackup());
    parsed.store.encryptedData = '{"ciphertext":"zz"}';
    expect(restoreBackup(JSON.stringify(parsed))).toMatch(/corrupted/);
  });
});

describe('Weekly backup reminder', () => {
  beforeEach(() => localStorage.clear());

  it('is due when never backed up', () => {
    expect(lastBackupAt()).toBe(0);
    expect(backupDue()).toBe(true);
  });

  it('is not due right after a backup', () => {
    localStorage.setItem('fire_last_backup', String(Date.now()));
    expect(backupDue()).toBe(false);
  });

  it('becomes due again after 7 days', () => {
    localStorage.setItem('fire_last_backup', String(Date.now() - 8 * 86400000));
    expect(backupDue()).toBe(true);
    localStorage.setItem('fire_last_backup', String(Date.now() - 6 * 86400000));
    expect(backupDue()).toBe(false);
  });
});
