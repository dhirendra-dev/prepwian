import { supabase } from "@/integrations/supabase/client";

// The notes_* tables are new and not in the generated Supabase types yet,
// so we use an untyped handle here. RLS still protects everything server-side.
const db = supabase as any;

export type Subject = "physics" | "chemistry" | "mathematics" | "biology";
export type ClassLevel = 11 | 12;
export type ResourceType =
  | "notes"
  | "quick_revision"
  | "summary"
  | "ncert_notes"
  | "concepts"
  | "formula_sheet"
  | "questions"
  | "solutions"
  | "additional";
export type FileKind = "pdf" | "image" | "link" | "text";

export const SUBJECTS: { id: Subject; label: string; emoji: string; tint: string }[] = [
  { id: "physics", label: "Physics", emoji: "⚛️", tint: "from-sky-500/20 to-blue-500/5 text-sky-600 dark:text-sky-300" },
  { id: "chemistry", label: "Chemistry", emoji: "🧪", tint: "from-amber-500/20 to-orange-500/5 text-amber-600 dark:text-amber-300" },
  { id: "mathematics", label: "Mathematics", emoji: "📐", tint: "from-indigo-500/20 to-violet-500/5 text-indigo-600 dark:text-indigo-300" },
  { id: "biology", label: "Biology", emoji: "🧬", tint: "from-emerald-500/20 to-green-500/5 text-emerald-600 dark:text-emerald-300" },
];

export const RESOURCE_TYPES: { id: ResourceType; label: string; emoji: string; blurb: string }[] = [
  { id: "notes", label: "Chapter Notes", emoji: "📚", blurb: "Complete detailed notes" },
  { id: "quick_revision", label: "Quick Revision", emoji: "⚡", blurb: "Most important points" },
  { id: "ncert_notes", label: "NCERT", emoji: "📖", blurb: "NCERT-focused notes" },
  { id: "summary", label: "Summary", emoji: "🧠", blurb: "Concise chapter summary" },
  { id: "concepts", label: "Important Concepts", emoji: "📌", blurb: "Definitions, graphs, derivations" },
  { id: "formula_sheet", label: "Formula Sheet", emoji: "🔢", blurb: "All key formulas" },
  { id: "questions", label: "Questions", emoji: "❓", blurb: "Practice by difficulty" },
  { id: "solutions", label: "Solutions", emoji: "✅", blurb: "Detailed solutions" },
  { id: "additional", label: "More", emoji: "🗂️", blurb: "Extra resources" },
];

export const typeMeta = (t: string) => RESOURCE_TYPES.find((r) => r.id === t);
export const subjectMeta = (s: string) => SUBJECTS.find((x) => x.id === s);

export type Chapter = {
  id: string;
  class_level: ClassLevel;
  subject: Subject;
  chapter_number: number;
  name: string;
  description: string | null;
  status: "draft" | "published";
};

export type Resource = {
  id: string;
  chapter_id: string;
  resource_type: ResourceType;
  title: string;
  description: string | null;
  file_kind: FileKind;
  file_url: string | null;
  storage_path: string | null;
  content_md: string | null;
  source: "official" | "ai_draft";
  downloadable: boolean;
  display_order: number;
  published: boolean;
};

export type Progress = {
  chapter_id: string;
  viewed_types: ResourceType[];
  completed: boolean;
  favourite: boolean;
  last_opened_at: string;
};

export const pad2 = (n: number) => String(n).padStart(2, "0");

/** 0–100 for a chapter, based on which available resource types were opened. */
export function chapterPct(available: ResourceType[], p?: Progress) {
  if (p?.completed) return 100;
  if (!p || available.length === 0) return 0;
  const seen = available.filter((t) => p.viewed_types.includes(t)).length;
  return Math.round((seen / available.length) * 100);
}

/* ------------------------------ queries ------------------------------ */

export async function fetchMyProgress(): Promise<Progress[]> {
  const { data, error } = await db.from("notes_progress").select("chapter_id,viewed_types,completed,favourite,last_opened_at");
  if (error) throw error;
  return (data ?? []) as Progress[];
}

/** Slim list of every published chapter — used for subject cards, favourites, "continue". */
export async function fetchOverview() {
  const [ch, progress] = await Promise.all([
    db
      .from("notes_chapters")
      .select("id,class_level,subject,chapter_number,name")
      .eq("status", "published")
      .order("chapter_number"),
    fetchMyProgress(),
  ]);
  if (ch.error) throw ch.error;
  return { chapters: (ch.data ?? []) as Pick<Chapter, "id" | "class_level" | "subject" | "chapter_number" | "name">[], progress };
}

export async function fetchChapterList(cls: ClassLevel, subject: Subject) {
  const { data, error } = await db
    .from("notes_chapters")
    .select("*")
    .eq("class_level", cls)
    .eq("subject", subject)
    .eq("status", "published")
    .order("chapter_number");
  if (error) throw error;
  const chapters = (data ?? []) as Chapter[];
  const types: Record<string, ResourceType[]> = {};
  if (chapters.length) {
    const res = await db
      .from("notes_resources")
      .select("chapter_id,resource_type")
      .in("chapter_id", chapters.map((c) => c.id))
      .eq("published", true);
    if (res.error) throw res.error;
    for (const r of res.data ?? []) {
      (types[r.chapter_id] ??= []);
      if (!types[r.chapter_id].includes(r.resource_type)) types[r.chapter_id].push(r.resource_type);
    }
  }
  return { chapters, types, progress: await fetchMyProgress() };
}

export async function fetchChapterDetail(chapterId: string) {
  const [c, r, p] = await Promise.all([
    db.from("notes_chapters").select("*").eq("id", chapterId).maybeSingle(),
    db
      .from("notes_resources")
      .select("*")
      .eq("chapter_id", chapterId)
      .eq("published", true)
      .order("display_order")
      .order("created_at"),
    db.from("notes_progress").select("chapter_id,viewed_types,completed,favourite,last_opened_at").eq("chapter_id", chapterId).maybeSingle(),
  ]);
  if (c.error) throw c.error;
  if (r.error) throw r.error;
  return {
    chapter: (c.data ?? null) as Chapter | null,
    resources: (r.data ?? []) as Resource[],
    progress: (p.data ?? null) as Progress | null,
  };
}

export async function searchNotes(raw: string) {
  // Strip characters that would break the PostgREST or() filter syntax.
  const q = raw.replace(/[%,()*\\]/g, " ").replace(/\s+/g, " ").trim();
  if (q.length < 2) return { chapters: [] as Chapter[], resources: [] as any[] };
  const like = `%${q}%`;
  const lower = q.toLowerCase();
  const subj = SUBJECTS.find((s) => s.id === lower);
  const cls = lower.match(/^class\s*(11|12)$/);

  let cq = db.from("notes_chapters").select("*").eq("status", "published");
  if (subj) cq = cq.eq("subject", subj.id);
  else if (cls) cq = cq.eq("class_level", Number(cls[1]));
  else cq = cq.or(`name.ilike.${like},description.ilike.${like}`);

  const [c, r] = await Promise.all([
    cq.order("class_level").order("chapter_number").limit(40),
    db
      .from("notes_resources")
      .select("id,chapter_id,resource_type,title,description,chapter:notes_chapters(id,class_level,subject,chapter_number,name)")
      .eq("published", true)
      .or(`title.ilike.${like},description.ilike.${like},content_md.ilike.${like}`)
      .limit(40),
  ]);
  if (c.error) throw c.error;
  if (r.error) throw r.error;
  return { chapters: (c.data ?? []) as Chapter[], resources: (r.data ?? []) as any[] };
}

/* ------------------------------ mutations ------------------------------ */

export async function markViewed(chapterId: string, type: ResourceType) {
  try {
    await db.rpc("notes_mark_viewed", { _chapter_id: chapterId, _type: type });
  } catch {
    /* progress is best-effort */
  }
}

export async function setChapterFlag(
  userId: string,
  chapterId: string,
  patch: Partial<Pick<Progress, "completed" | "favourite">>,
) {
  const { error } = await db
    .from("notes_progress")
    .upsert({ user_id: userId, chapter_id: chapterId, ...patch }, { onConflict: "user_id,chapter_id" });
  if (error) throw error;
}

/* ------------------------------ file helpers ------------------------------ */

export const NOTES_BUCKET = "notes-files";

export async function resolveResourceUrl(r: Pick<Resource, "storage_path" | "file_url">, download = false) {
  if (r.storage_path) {
    const { data, error } = await supabase.storage
      .from(NOTES_BUCKET)
      .createSignedUrl(r.storage_path, 60 * 60, download ? { download: true } : undefined);
    if (error) throw error;
    return data.signedUrl;
  }
  return r.file_url ?? "";
}

/** Google Drive share links -> embeddable preview links. */
export function toEmbedUrl(url: string) {
  const m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  return m ? `https://drive.google.com/file/d/${m[1]}/preview` : url;
}