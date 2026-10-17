import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

import type {
  CreateYouTubeChecklistInput,
  CreateYouTubeChecklistItemInput,
  UpdateYouTubeChecklistInput,
  YouTubeChecklist,
  YouTubeChecklistItem,
} from "../types";

type ChecklistRow = Omit<YouTubeChecklist, "items">;
type YouTubeChecklistDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Functions"> & {
    Tables: Database["public"]["Tables"] & {
      youtube_checklists: {
        Row: ChecklistRow;
        Insert: Pick<ChecklistRow, "user_id" | "title" | "source_type" | "source_url"> &
          Partial<Omit<ChecklistRow, "user_id" | "title" | "source_type" | "source_url">>;
        Update: Partial<ChecklistRow>;
        Relationships: [];
      };
      youtube_checklist_items: {
        Row: YouTubeChecklistItem;
        Insert: Pick<YouTubeChecklistItem, "checklist_id" | "youtube_video_id" | "title"> &
          Partial<Omit<YouTubeChecklistItem, "checklist_id" | "youtube_video_id" | "title">>;
        Update: Partial<YouTubeChecklistItem>;
        Relationships: [];
      };
    };
    Functions: Database["public"]["Functions"] & {
      recalculate_youtube_checklist_progress: {
        Args: { p_checklist_id: string };
        Returns: undefined;
      };
      toggle_youtube_checklist_item: {
        Args: { p_item_id: string; p_completed: boolean };
        Returns: YouTubeChecklistItem;
      };
    };
  };
};

const checklistSupabase = supabase as unknown as SupabaseClient<YouTubeChecklistDatabase>;

function mapChecklist(row: ChecklistRow, items: YouTubeChecklistItem[] = []): YouTubeChecklist {
  return {
    id: String(row.id),
    user_id: String(row.user_id),

    title: String(row.title),
    description: typeof row.description === "string" ? row.description : null,

    source_type: row.source_type === "playlist" ? "playlist" : "video",

    source_url: String(row.source_url),

    youtube_playlist_id:
      typeof row.youtube_playlist_id === "string" ? row.youtube_playlist_id : null,

    current_item_id: typeof row.current_item_id === "string" ? row.current_item_id : null,

    total_items: Number(row.total_items ?? 0),
    completed_items: Number(row.completed_items ?? 0),

    is_archived: Boolean(row.is_archived),

    created_at: String(row.created_at),
    updated_at: String(row.updated_at),

    items,
  };
}

function mapItem(row: YouTubeChecklistItem): YouTubeChecklistItem {
  return {
    id: String(row.id),
    checklist_id: String(row.checklist_id),

    youtube_video_id: String(row.youtube_video_id),
    title: String(row.title),

    thumbnail_url: typeof row.thumbnail_url === "string" ? row.thumbnail_url : null,

    duration_seconds:
      row.duration_seconds === null || row.duration_seconds === undefined
        ? null
        : Number(row.duration_seconds),

    position: Number(row.position ?? 0),

    is_completed: Boolean(row.is_completed),

    completed_at: typeof row.completed_at === "string" ? row.completed_at : null,

    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function createYouTubeChecklist(
  input: CreateYouTubeChecklistInput,
): Promise<YouTubeChecklist> {
  const { data: authData, error: authError } = await checklistSupabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Sign in to create a YouTube checklist.");

  const { data, error } = await checklistSupabase
    .from("youtube_checklists")
    .insert({
      user_id: authData.user.id,
      title: input.title.trim(),
      description: input.description ?? null,
      source_type: input.sourceType,
      source_url: input.sourceUrl,
      youtube_playlist_id: input.youtubePlaylistId ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapChecklist(data);
}

export async function getYouTubeChecklists(): Promise<YouTubeChecklist[]> {
  const { data: authData, error: authError } = await checklistSupabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return [];

  const { data, error } = await checklistSupabase
    .from("youtube_checklists")
    .select("*")
    .eq("user_id", authData.user.id)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapChecklist(row));
}

export async function getYouTubeChecklist(checklistId: string): Promise<YouTubeChecklist | null> {
  const { data, error } = await checklistSupabase
    .from("youtube_checklists")
    .select("*")
    .eq("id", checklistId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapChecklist(data);
}

export async function getYouTubeChecklistItems(
  checklistId: string,
): Promise<YouTubeChecklistItem[]> {
  const { data, error } = await checklistSupabase
    .from("youtube_checklist_items")
    .select("*")
    .eq("checklist_id", checklistId)
    .order("position", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapItem(row));
}

export async function getYouTubeChecklistWithItems(
  checklistId: string,
): Promise<YouTubeChecklist | null> {
  const [checklist, items] = await Promise.all([
    getYouTubeChecklist(checklistId),
    getYouTubeChecklistItems(checklistId),
  ]);

  if (!checklist) {
    return null;
  }

  return {
    ...checklist,
    items,
  };
}

export async function updateYouTubeChecklist(
  input: UpdateYouTubeChecklistInput,
): Promise<YouTubeChecklist> {
  const updates: Partial<ChecklistRow> = {};

  if (input.title !== undefined) {
    updates.title = input.title.trim();
  }

  if (input.description !== undefined) {
    updates.description = input.description;
  }

  if (input.currentItemId !== undefined) {
    updates.current_item_id = input.currentItemId;
  }

  if (input.isArchived !== undefined) {
    updates.is_archived = input.isArchived;
  }

  const { data, error } = await checklistSupabase
    .from("youtube_checklists")
    .update(updates)
    .eq("id", input.checklistId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapChecklist(data);
}

export async function deleteYouTubeChecklist(checklistId: string): Promise<void> {
  const { error } = await checklistSupabase
    .from("youtube_checklists")
    .delete()
    .eq("id", checklistId);

  if (error) {
    throw error;
  }
}

export async function addYouTubeChecklistItem(
  input: CreateYouTubeChecklistItemInput,
): Promise<YouTubeChecklistItem> {
  const { data, error } = await checklistSupabase
    .from("youtube_checklist_items")
    .insert({
      checklist_id: input.checklistId,
      youtube_video_id: input.youtubeVideoId,
      title: input.title.trim(),
      thumbnail_url: input.thumbnailUrl ?? null,
      duration_seconds: input.durationSeconds ?? null,
      position: input.position ?? 0,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await checklistSupabase.rpc("recalculate_youtube_checklist_progress", {
    p_checklist_id: input.checklistId,
  });

  return mapItem(data);
}

export async function addYouTubeChecklistItems(
  items: CreateYouTubeChecklistItemInput[],
): Promise<YouTubeChecklistItem[]> {
  if (items.length === 0) {
    return [];
  }

  const rows = items.map((item, index) => ({
    checklist_id: item.checklistId,
    youtube_video_id: item.youtubeVideoId,
    title: item.title.trim(),
    thumbnail_url: item.thumbnailUrl ?? null,
    duration_seconds: item.durationSeconds ?? null,
    position: item.position ?? index,
  }));

  const checklistId = items[0].checklistId;

  const { data, error } = await checklistSupabase
    .from("youtube_checklist_items")
    .insert(rows)
    .select("*")
    .order("position", { ascending: true });

  if (error) {
    throw error;
  }

  await checklistSupabase.rpc("recalculate_youtube_checklist_progress", {
    p_checklist_id: checklistId,
  });

  return (data ?? []).map((row) => mapItem(row));
}

export async function toggleYouTubeChecklistItem(
  itemId: string,
  completed: boolean,
): Promise<YouTubeChecklistItem> {
  const { data, error } = await checklistSupabase.rpc("toggle_youtube_checklist_item", {
    p_item_id: itemId,
    p_completed: completed,
  });

  if (error) {
    throw error;
  }

  return mapItem(data);
}

export async function updateYouTubeChecklistItem(
  itemId: string,
  updates: {
    title?: string;
    position?: number;
    isCompleted?: boolean;
  },
): Promise<YouTubeChecklistItem> {
  const payload: Partial<YouTubeChecklistItem> = {};

  if (updates.title !== undefined) {
    payload.title = updates.title.trim();
  }

  if (updates.position !== undefined) {
    payload.position = updates.position;
  }

  if (updates.isCompleted !== undefined) {
    payload.is_completed = updates.isCompleted;
    payload.completed_at = updates.isCompleted ? new Date().toISOString() : null;
  }

  const { data, error } = await checklistSupabase
    .from("youtube_checklist_items")
    .update(payload)
    .eq("id", itemId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (data?.checklist_id) {
    await checklistSupabase.rpc("recalculate_youtube_checklist_progress", {
      p_checklist_id: data.checklist_id,
    });
  }

  return mapItem(data);
}

export async function deleteYouTubeChecklistItem(itemId: string): Promise<void> {
  const { data: item, error: findError } = await checklistSupabase
    .from("youtube_checklist_items")
    .select("checklist_id")
    .eq("id", itemId)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  const { error } = await checklistSupabase
    .from("youtube_checklist_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    throw error;
  }

  if (item?.checklist_id) {
    await checklistSupabase.rpc("recalculate_youtube_checklist_progress", {
      p_checklist_id: item.checklist_id,
    });
  }
}

export async function setCurrentYouTubeChecklistItem(
  checklistId: string,
  itemId: string | null,
): Promise<YouTubeChecklist> {
  return updateYouTubeChecklist({
    checklistId,
    currentItemId: itemId,
  });
}
