import { supabase } from "@/integrations/supabase/client";

export type XpReward = {
  awarded: boolean;
  amount: number;
  total_xp: number;
};

const rpcClient = supabase as unknown as {
  rpc: (
    name: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: XpReward | null; error: Error | null }>;
};

export async function claimLoginXp() {
  const { data, error } = await rpcClient.rpc("claim_login_xp");
  if (error) throw error;
  return data ?? { awarded: false, amount: 0, total_xp: 0 };
}

export async function awardActionXp(sourceType: string, sourceId: string, reason: string) {
  const { data, error } = await rpcClient.rpc("award_action_xp", {
    p_source_type: sourceType,
    p_source_id: sourceId,
    p_reason: reason,
  });
  if (error) throw error;
  return data ?? { awarded: false, amount: 0, total_xp: 0 };
}

export function xpLevel(totalXp: number) {
  return Math.max(1, Math.floor(Math.max(0, totalXp) / 100) + 1);
}
