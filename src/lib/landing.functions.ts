import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type LandingMaterial = {
  id: string;
  title: string;
  subject: string;
  topic: string | null;
  resource_type: string;
  drive_url: string;
  class_level: string | null;
  description: string | null;
  created_at: string;
};

export type LandingGroup = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  invite_url: string;
  icon_emoji: string | null;
};

export type LandingPost = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
};

export type LandingNotice = {
  id: string;
  title: string;
  body: string;
  category: string;
  pinned: boolean;
  link_url: string | null;
  link_label: string | null;
  created_at: string;
};

export type LandingData = {
  materials: LandingMaterial[];
  groups: LandingGroup[];
  posts: LandingPost[];
  notices: LandingNotice[];
  counts: {
    materials: number;
    groups: number;
  };
};


function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

export const getLandingData = createServerFn({ method: "GET" }).handler(async (): Promise<LandingData> => {
  const supabase = publicClient();

  const [materialsRes, groupsRes, statsMatRes, noticesRes] = await Promise.all([
    supabase
      .from("materials")
      .select("id, title, subject, topic, resource_type, drive_url, class_level, description, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("community_groups")
      .select("id, name, description, category, invite_url, icon_emoji", { count: "exact" })
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase.from("materials").select("id", { count: "exact", head: true }),
    supabase
      .from("notices")
      .select("id, title, body, category, pinned, link_url, link_label, created_at")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const allGroups = groupsRes.data ?? [];
  const groupCount = groupsRes.count ?? allGroups.length;

  return {
    materials: materialsRes.data ?? [],
    groups: allGroups.slice(0, 4),
    posts: [],
    notices: noticesRes.data ?? [],
    counts: {
      materials: statsMatRes.count ?? 0,
      groups: groupCount,
    },
  };
});
