import { supabase } from "@/integrations/supabase/client";

const VISITOR_KEY = "jph-search-visitor-id";

type SearchAnalyticsClient = {
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => {
      select: (columns: string) => {
        single: () => PromiseLike<{ data: { id?: string } | null; error: unknown | null }>;
      };
    };
  };
  rpc: (
    functionName: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: { awarded?: boolean } | null; error: unknown | null }>;
};

function getVisitorId() {
  if (typeof window === "undefined") return "server-render";
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_KEY, created);
    return created;
  } catch {
    return `ephemeral-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  }
}

/** Record an intentional search submit without capturing keystrokes or device fingerprints. */
export async function trackSearchQuery(
  rawQuery: string,
  userId?: string | null,
  source: "home" | "menu" | "notes" = "home",
): Promise<{ awarded: boolean }> {
  const query = rawQuery.normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, 120);
  if (query.length < 2) return { awarded: false };

  try {
    const db = supabase as unknown as SearchAnalyticsClient;
    const { data: event, error } = await db.from("search_query_events").insert({
      query,
      visitor_id: getVisitorId(),
      user_id: userId ?? null,
      source,
    }).select("id").single();
    if (!error && userId && event?.id) {
      const { data: reward } = await db.rpc("award_action_xp", {
        p_source_type: "search",
        p_source_id: event.id,
        p_reason: "Completed a search",
      });
      return { awarded: Boolean(reward?.awarded) };
    }
    return { awarded: false };
  } catch {
    // Analytics must never block or surface an error in the study experience.
    return { awarded: false };
  }
}
