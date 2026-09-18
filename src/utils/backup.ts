// ============================================
// Backup & restore — encrypted export the user can
// keep in Google Drive / Gmail / WhatsApp etc.
// The file contains only AES-256-GCM encrypted data;
// it is useless without the user's PIN.
// ============================================

import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { getEncryptedData, storeEncryptedData, type SecureStore } from './encryption';

const LAST_BACKUP_KEY = 'fire_last_backup';
export const BACKUP_REMINDER_DAYS = 7;

export function lastBackupAt(): number {
  const v = localStorage.getItem(LAST_BACKUP_KEY);
  return v ? parseInt(v, 10) || 0 : 0;
}

export function backupDue(): boolean {
  const last = lastBackupAt();
  return Date.now() - last > BACKUP_REMINDER_DAYS * 86400000;
}

function markBackedUp() {
  localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()));
}

export function backupFileName(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `fire-tracker-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`;
}

/** Build the encrypted backup payload (full secure store, PIN-encrypted). */
export function buildBackup(): string {
  const store = getEncryptedData();
  if (!store) throw new Error('No data to back up');
  return JSON.stringify({
    app: 'FIRE Tracker',
    kind: 'fire-tracker-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    store,
  }, null, 2);
}

/** Export the backup: native share sheet (Drive/Gmail/WhatsApp…) or browser download. */
export async function exportBackup(): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const payload = buildBackup();
  const name = backupFileName();

  if (Capacitor.isNativePlatform()) {
    try {
      const res = await Filesystem.writeFile({
        path: name,
        data: payload,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });
      await Share.share({
        title: 'FIRE Tracker backup',
        text: 'Encrypted FIRE Tracker backup. Keep it safe — you need your PIN to restore it.',
        url: res.uri,
        dialogTitle: 'Save your backup to Drive, Gmail, WhatsApp…',
      });
      markBackedUp();
      return 'shared';
    } catch (e) {
      // User closed the share sheet
      if (e instanceof Error && /cancel/i.test(e.message)) return 'cancelled';
      throw e;
    }
  }

  // Web fallback: plain download
  const blob = new Blob([payload], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
  markBackedUp();
  return 'downloaded';
}

/** Validate and install a backup file. Returns null on success, error message otherwise. */
export function restoreBackup(jsonText: string): string | null {
  try {
    const parsed = JSON.parse(jsonText);
    const store: SecureStore = parsed.kind === 'fire-tracker-backup' ? parsed.store : parsed;
    if (!store || typeof store.pinHash !== 'string' || typeof store.encryptedData !== 'string') {
      return 'This does not look like a FIRE Tracker backup file.';
    }
    // Sanity check the encrypted payload parses
    const enc = JSON.parse(store.encryptedData);
    if (!enc.ciphertext || !enc.iv || !enc.salt || !enc.tag) {
      return 'Backup file is corrupted (encrypted payload invalid).';
    }
    storeEncryptedData({
      pinHash: store.pinHash,
      recoveryKey: store.recoveryKey || '',
      encryptedData: store.encryptedData,
      biometricEnabled: !!store.biometricEnabled,
      autoLock: store.autoLock || 'never',
      recoveryQuestions: store.recoveryQuestions,
      recoveryData: store.recoveryData,
      ...(store.answersEnc ? { answersEnc: store.answersEnc } : {}),
    });
    return null;
  } catch {
    return 'Could not read this file. Make sure it is an unmodified FIRE Tracker backup.';
  }
}
