// ============================================
// ENCRYPTION LAYER - AES-256-GCM
// ============================================
// All sensitive data is encrypted using Web Crypto API
// Keys are derived from PIN using PBKDF2

const SALT_LENGTH = 32;
const IV_LENGTH = 12;
const KEY_ITERATIONS = 100000;
const KEY_LENGTH = 256;

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
  tag: string;
}

export interface SecureStore {
  pinHash: string;
  recoveryKey: string;
  encryptedData: string;
  biometricEnabled: boolean;
  autoLock: string;
  /** Security questions shown on the "Forgot PIN" screen (plain text). */
  recoveryQuestions?: string[];
  /** The PIN, encrypted with a key derived from the recovery answers. */
  recoveryData?: string;
  /** The recovery answers, encrypted with the PIN (used to re-wrap recovery on PIN change). */
  answersEnc?: string;
}

// Normalize an answer so small differences (case, spacing) don't matter
function normalizeAnswer(a: string): string {
  return a.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Derive a passphrase from all answers combined
function answersPassphrase(answers: string[]): string {
  return answers.map(normalizeAnswer).join('|');
}

// Encrypt the PIN with recovery answers (for "Forgot PIN" flow)
export async function encryptPinWithAnswers(pin: string, answers: string[]): Promise<string> {
  const enc = await encryptData(pin, answersPassphrase(answers));
  return JSON.stringify(enc);
}

// Recover the PIN from recovery answers — throws/returns null if wrong
export async function decryptPinWithAnswers(recoveryData: string, answers: string[]): Promise<string | null> {
  try {
    const enc: EncryptedData = JSON.parse(recoveryData);
    const pin = await decryptData(enc, answersPassphrase(answers));
    return /^\d{4,6}$/.test(pin) ? pin : null;
  } catch {
    return null;
  }
}

// Generate a random string for recovery key
export function generateRecoveryKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const randomValues = new Uint8Array(24);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < 24; i++) {
    result += chars[randomValues[i] % chars.length];
    if ((i + 1) % 6 === 0 && i < 23) result += '-';
  }
  
  return result;
}

// Hash PIN using PBKDF2
export async function hashPIN(pin: string, salt?: Uint8Array): Promise<{ hash: string; salt: string }> {
  const saltBytes = salt || crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const encoder = new TextEncoder();
  const pinData = encoder.encode(pin);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pinData,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes as BufferSource,
      iterations: KEY_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    KEY_LENGTH
  );
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { hash: hashHex + ':' + saltHex, salt: saltHex };
}

// Verify PIN against stored hash
export async function verifyPIN(pin: string, storedHash: string): Promise<boolean> {
  const [hash, salt] = storedHash.split(':');
  if (!hash || !salt) return false;
  
  const saltBytes = new Uint8Array(salt.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  const result = await hashPIN(pin, saltBytes);
  
  return result.hash === storedHash;
}

// Derive encryption key from PIN
async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const pinData = encoder.encode(pin);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pinData,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: KEY_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt data with AES-256-GCM
export async function encryptData(data: string, pin: string): Promise<EncryptedData> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(pin, salt);
  
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );
  
  const encryptedArray = new Uint8Array(encrypted);
  const tagLength = 16;
  const ciphertext = encryptedArray.slice(0, -tagLength);
  const tag = encryptedArray.slice(-tagLength);
  
  return {
    ciphertext: Array.from(ciphertext).map(b => b.toString(16).padStart(2, '0')).join(''),
    iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
    salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''),
    tag: Array.from(tag).map(b => b.toString(16).padStart(2, '0')).join('')
  };
}

// Decrypt data with AES-256-GCM
export async function decryptData(encrypted: EncryptedData, pin: string): Promise<string> {
  const saltMatch = encrypted.salt.match(/.{2}/g);
  const ivMatch = encrypted.iv.match(/.{2}/g);
  const ciphertextMatch = encrypted.ciphertext.match(/.{2}/g);
  const tagMatch = encrypted.tag.match(/.{2}/g);
  if (!saltMatch || !ivMatch || !ciphertextMatch || !tagMatch) throw new Error('Invalid encrypted data');
  
  const salt = new Uint8Array(saltMatch.map(byte => parseInt(byte, 16)));
  const iv = new Uint8Array(ivMatch.map(byte => parseInt(byte, 16)));
  const ciphertext = new Uint8Array(ciphertextMatch.map(byte => parseInt(byte, 16)));
  const tag = new Uint8Array(tagMatch.map(byte => parseInt(byte, 16)));
  
  const key = await deriveKey(pin, salt);
  
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext);
  combined.set(tag, ciphertext.length);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    combined
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// Store encrypted data locally
export function storeEncryptedData(data: SecureStore): void {
  const store = JSON.stringify(data);
  localStorage.setItem('finplan_secure_store', store);
}

// Retrieve encrypted data
export function getEncryptedData(): SecureStore | null {
  const store = localStorage.getItem('finplan_secure_store');
  if (!store) return null;
  try {
    return JSON.parse(store);
  } catch {
    return null;
  }
}

// Check if app is set up
export function isAppSetup(): boolean {
  return !!getEncryptedData();
}

// Export encrypted backup
export async function exportBackup(pin: string): Promise<string> {
  const store = getEncryptedData();
  if (!store) throw new Error('No data to backup');
  
  const backup = {
    version: 1,
    timestamp: new Date().toISOString(),
    encryptedData: store.encryptedData,
    salt: store.encryptedData.slice(0, 64) // Extract salt from encrypted data
  };
  
  return JSON.stringify(backup, null, 2);
}

// Import encrypted backup
export async function importBackup(backupJson: string, pin: string): Promise<boolean> {
  try {
    const backup = JSON.parse(backupJson);
    if (!backup.encryptedData) return false;
    
    // Verify we can decrypt it
    const encrypted: EncryptedData = JSON.parse(backup.encryptedData);
    await decryptData(encrypted, pin);
    
    // Store it
    const store: SecureStore = {
      pinHash: '', // Will be set by caller
      recoveryKey: '',
      encryptedData: backup.encryptedData,
      biometricEnabled: false,
      autoLock: '5min'
    };
    
    storeEncryptedData(store);
    return true;
  } catch {
    return false;
  }
}

// Biometric authentication (WebAuthn)
export async function isBiometricAvailable(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function registerBiometric(): Promise<boolean> {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));
    
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Financial Planner', id: window.location.hostname },
        user: {
          id: userId,
          name: 'user',
          displayName: 'User'
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required'
        },
        timeout: 60000
      }
    });
    
    if (credential) {
      localStorage.setItem('finplan_biometric_id', credential.id);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function authenticateBiometric(): Promise<boolean> {
  try {
    const credentialId = localStorage.getItem('finplan_biometric_id');
    if (!credentialId) return false;
    
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{
          id: Uint8Array.from(atob(credentialId.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
          type: 'public-key'
        }],
        userVerification: 'required',
        timeout: 60000
      }
    });
    
    return !!assertion;
  } catch {
    return false;
  }
}
