// ============================================================================
// AADHAAR ENCRYPTION UTILITIES
// ============================================================================
// Compliant with UIDAI guidelines for Aadhaar data handling
// Uses AES-256-GCM for encryption (symmetric, reversible)
// ============================================================================

import { CONFIG } from "@/config/config";

// Get encryption key from environment
function getEncryptionKey(): ArrayBuffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be a 64-character hex string (32 bytes)"
    );
  }
  const bytes = new Uint8Array(
    keyHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
  return bytes.buffer as ArrayBuffer;
}

// Convert string to ArrayBuffer
function stringToArrayBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer as ArrayBuffer;
}

// Convert ArrayBuffer to string
function arrayBufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer);
}

// Convert ArrayBuffer to hex string
function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Convert hex string to ArrayBuffer
function hexToArrayBuffer(hex: string): ArrayBuffer {
  const matches = hex.match(/.{1,2}/g);
  if (!matches) throw new Error("Invalid hex string");
  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)))
    .buffer as ArrayBuffer;
}

/**
 * Encrypt Aadhaar number using AES-256-GCM
 * Returns hex encoded string containing: iv + ciphertext + authTag
 */
export async function encryptAadhaar(aadhaarNumber: string): Promise<string> {
  // Validate Aadhaar format
  if (!CONFIG.validation.aadhaar.pattern.test(aadhaarNumber)) {
    throw new Error("Invalid Aadhaar number format");
  }

  const key = getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  const ivBuffer = iv.buffer as ArrayBuffer;
  const plaintext = stringToArrayBuffer(aadhaarNumber);

  // Import key
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBuffer },
    cryptoKey,
    plaintext
  );

  // Combine iv + ciphertext (authTag is included in ciphertext by WebCrypto)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  // Return as hex string
  return arrayBufferToHex(combined.buffer as ArrayBuffer);
}

/**
 * Decrypt Aadhaar number
 * Input should be hex encoded string from encryptAadhaar
 */
export async function decryptAadhaar(encryptedData: string): Promise<string> {
  const key = getEncryptionKey();
  const combined = new Uint8Array(hexToArrayBuffer(encryptedData));

  // Extract IV (first 12 bytes)
  const iv = combined.slice(0, 12).buffer as ArrayBuffer;
  const ciphertext = combined.slice(12).buffer as ArrayBuffer;

  // Import key
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  // Decrypt
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    ciphertext
  );

  return arrayBufferToString(plaintext);
}

/**
 * Create masked Aadhaar for display (XXXX XXXX 1234)
 * Never show full Aadhaar in UI
 */
export function maskAadhaar(aadhaarNumber: string): string {
  if (!aadhaarNumber || aadhaarNumber.length !== 12) {
    return "XXXX XXXX XXXX";
  }
  const lastFour = aadhaarNumber.slice(-4);
  return `XXXX XXXX ${lastFour}`;
}

/**
 * Validate Aadhaar number format
 */
export function validateAadhaar(aadhaarNumber: string): boolean {
  return CONFIG.validation.aadhaar.pattern.test(aadhaarNumber);
}
