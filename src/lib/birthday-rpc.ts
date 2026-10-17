import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type BirthdayRpcError = { message: string; code?: string; details?: string };
type BirthdayRpcResponse = { data: unknown; error: BirthdayRpcError | null };
type BirthdayRpcClient = {
  rpc: (name: string, args?: Record<string, unknown>) => Promise<BirthdayRpcResponse>;
};

/** Typed boundary for birthday functions until the next Supabase schema type generation. */
export async function birthdayRpc<T>(name: string, args?: Record<string, unknown>) {
  const client = supabase as unknown as BirthdayRpcClient;
  const { data, error } = await client.rpc(name, args);
  return { data: data as T | null, error };
}

export function isAnonymousAccount(user: User | null | undefined) {
  return Boolean(
    user && "is_anonymous" in user && (user as User & { is_anonymous?: boolean }).is_anonymous,
  );
}
