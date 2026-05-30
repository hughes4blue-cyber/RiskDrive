import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is required to encrypt/decrypt telematics credentials");
  }
  if (!cachedKey) {
    cachedKey = scryptSync(secret, "riskdrive-telematics-creds", 32);
  }
  return cachedKey;
}

/**
 * Encrypts a UTF-8 string with AES-256-GCM. Returns "iv:tag:ciphertext" (base64 parts).
 * Used for provider API credentials stored at rest in the DB.
 */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":");
}

/** Reverses {@link encryptSecret}. Throws if the payload is malformed or tampered with. */
export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Malformed encrypted credential payload");
  }
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
}
