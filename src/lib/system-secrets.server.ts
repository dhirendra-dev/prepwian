/**
 * Server-only access to centrally encrypted integration secrets.
 * Import this module only from trusted server functions; never expose results to clients.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Provider = "openai" | "anthropic" | "google_gemini" | "groq" | "custom";

function getEncryptionKey(): ArrayBuffer {
  const encoded = process.env.SYSTEM_SETTINGS_ENCRYPTION_KEY;
  if (!encoded) throw new Error("SYSTEM_SETTINGS_ENCRYPTION_KEY is not configured");
  const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  if (bytes.byteLength !== 32) throw new Error("SYSTEM_SETTINGS_ENCRYPTION_KEY must decode to 32 bytes");
  const keyBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(keyBuffer).set(bytes);
  return keyBuffer;
}

/** Returns plaintext only to trusted server-side callers. Never send this value to a browser. */
export async function getSystemSecret(provider: Provider, label = "Primary key"): Promise<string | null> {
  const { data, error } = await (supabaseAdmin as any)
    .from("admin_system_secrets")
    .select("ciphertext, iv, enabled")
    .eq("provider", provider)
    .eq("label", label)
    .maybeSingle();
  if (error) throw error;
  if (!data || !data.enabled) return null;

  const key = await crypto.subtle.importKey("raw", getEncryptionKey(), "AES-GCM", false, ["decrypt"]);
  const ciphertext = Uint8Array.from(atob(data.ciphertext), (character) => character.charCodeAt(0));
  const iv = Uint8Array.from(atob(data.iv), (character) => character.charCodeAt(0));
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}
