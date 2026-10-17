import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const encoded = process.env.GMAIL_TOKEN_ENCRYPTION_KEY;

  if (!encoded) {
    throw new Error("GMAIL_TOKEN_ENCRYPTION_KEY is not configured");
  }

  const key = Buffer.from(encoded, "base64");

  if (key.length !== 32) {
    throw new Error(
      "GMAIL_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes"
    );
  }

  return key;
}

export function encryptGmailToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptGmailToken(ciphertext: string): string {
  const parts = ciphertext.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted Gmail token format");
  }

  const [ivBase64, authTagBase64, encryptedBase64] = parts;

  const key = getEncryptionKey();
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");
  const encrypted = Buffer.from(encryptedBase64, "base64");

  if (iv.length !== IV_LENGTH) {
    throw new Error("Invalid Gmail token IV");
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Invalid Gmail token authentication tag");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}