import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const secretInput = z.object({
  provider: z.enum(["openai", "anthropic", "google_gemini", "groq", "custom"]),
  label: z.string().trim().min(2).max(80),
  secret: z.string().trim().min(8).max(8192),
});

async function assertFullAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden: full administrator access required");
}

function encryptionKeyBytes(): ArrayBuffer {
  const encoded = process.env.SYSTEM_SETTINGS_ENCRYPTION_KEY;
  if (!encoded) throw new Error("SYSTEM_SETTINGS_ENCRYPTION_KEY is not configured on the server");
  let decoded: Uint8Array;
  try {
    decoded = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  } catch {
    throw new Error("SYSTEM_SETTINGS_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  }
  if (decoded.byteLength !== 32) {
    throw new Error("SYSTEM_SETTINGS_ENCRYPTION_KEY must decode to exactly 32 bytes");
  }
  const keyBuffer = new ArrayBuffer(decoded.byteLength);
  new Uint8Array(keyBuffer).set(decoded);
  return keyBuffer;
}

async function encryptSecret(value: string) {
  const key = await crypto.subtle.importKey("raw", encryptionKeyBytes(), "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value));
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

async function getAdminDb(context: any) {
  await assertFullAdmin(context.supabase, context.userId);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

export const adminListSystemSecrets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await getAdminDb(context);
    const { data, error } = await db
      .from("admin_system_secrets")
      .select("id, provider, label, key_hint, created_at, updated_at, last_validated_at, enabled")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return { rows: data ?? [], encryptionConfigured: Boolean(process.env.SYSTEM_SETTINGS_ENCRYPTION_KEY) };
  });

export const adminSaveSystemSecret = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => secretInput.parse(d))
  .handler(async ({ data, context }) => {
    const db = await getAdminDb(context);
    const encrypted = await encryptSecret(data.secret);
    const keyHint = `••••${data.secret.slice(-4)}`;
    const { data: saved, error } = await db
      .from("admin_system_secrets")
      .upsert({
        provider: data.provider,
        label: data.label,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        key_hint: keyHint,
        enabled: true,
        created_by: context.userId,
        updated_by: context.userId,
        updated_at: new Date().toISOString(),
      }, { onConflict: "provider,label" })
      .select("id, provider, label, key_hint, created_at, updated_at, last_validated_at, enabled")
      .single();
    if (error) throw error;
    // Only non-secret metadata is written to the audit table.
    await db.from("audit_logs").insert({
      actor_id: context.userId,
      actor_email: context.claims?.email ?? null,
      action: "admin.system_secret.save",
      target_user_id: null,
      target_email: null,
      metadata: { provider: data.provider, label: data.label, key_hint: keyHint },
    });
    return { row: saved };
  });

export const adminDeleteSystemSecret = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await getAdminDb(context);
    const { data: existing, error: lookupError } = await db
      .from("admin_system_secrets")
      .select("provider,label")
      .eq("id", data.id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!existing) throw new Error("Integration key not found");
    const { error } = await db.from("admin_system_secrets").delete().eq("id", data.id);
    if (error) throw error;
    await db.from("audit_logs").insert({
      actor_id: context.userId,
      actor_email: context.claims?.email ?? null,
      action: "admin.system_secret.delete",
      target_user_id: null,
      target_email: null,
      metadata: { provider: existing.provider, label: existing.label },
    });
    return { ok: true };
  });
