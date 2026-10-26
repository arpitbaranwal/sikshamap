/**
 * Enterprise Cryptographic Authentication & File Integrity Subsystem
 *
 * Implements:
 * 1. PBKDF2 (Password-Based Key Derivation Function 2) with SHA-256 and 100,000 iterations
 * 2. Cryptographic Salt Generation (128-bit CSPRNG)
 * 3. Constant-time Hash Verification against timing attacks
 * 4. SHA-256 Document Checksum Calculation for regulatory non-repudiation
 */

// Convert ArrayBuffer to Hex String
export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex String to Uint8Array
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Generate a cryptographically secure random salt (default 16 bytes / 128 bits)
 */
export function generateSalt(length = 16): string {
  const randomBytes = new Uint8Array(length);
  window.crypto.getRandomValues(randomBytes);
  return bufferToHex(randomBytes);
}

/**
 * Derives a PBKDF2-SHA256 hash from a plaintext password and unique salt.
 * 100,000 iterations to withstand brute-force/GPU dictionary attacks.
 */
export async function hashPassword(password: string, saltHex: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBytes = hexToBytes(saltHex);

  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer as unknown as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    256 // 256 bits = 32 bytes
  );

  return bufferToHex(derivedBits);
}

/**
 * Constant-time comparison between stored PBKDF2 hash and input attempt
 */
export async function verifyPassword(
  attemptPassword: string,
  storedSaltHex: string,
  storedHashHex: string
): Promise<boolean> {
  const computedHash = await hashPassword(attemptPassword, storedSaltHex);
  if (computedHash.length !== storedHashHex.length) return false;

  let mismatch = 0;
  for (let i = 0; i < computedHash.length; i++) {
    mismatch |= computedHash.charCodeAt(i) ^ storedHashHex.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Computes a SHA-256 digital fingerprint for any uploaded file or buffer
 */
export async function calculateFileHash(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
  return bufferToHex(hashBuffer);
}
