import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { GlassSurface } from "@/components/GlassSurface";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { ArrowLeft, Star, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { NotesReader } from "@/components/notes/NotesReader";
import {
  RESOURCE_TYPES,
  chapterPct,
  fetchChapterDetail,
  markViewed,
  pad2,
  setChapterFlag,
  subjectMeta,
  type Resource,
  type ResourceType,
} from "@/lib/notes";

export const Route = createFileRoute("/_authenticated/notes/chapter/$chapterId")({
  head: () => ({ meta: [
      { name: "description", content: "Study chapter notes, formulas, summaries and practice questions." },
      { property: "og:title", content: "Chapter Notes — PREPWIAN" },
      { property: "og:description", content: "Study chapter notes, formulas, summaries and practice questions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Chapter Notes — PREPWIAN" },
      { name: "twitter:description", content: "Study chapter notes, formulas, summaries and practice questions." },
{ title: "Chapter Notes — PREPWIAN" }] }),
  component: ChapterPage,
  errorComponent: ({ error }: { error: unknown }) => <div className="p-6 text-sm text-destructive">{error instanceof Error ? error.message : String(error)}</div>,
});

// The checklist shown to students (kept simple on purpose).
const CHECKLIST: { id: ResourceType; label: string }[] = [
  { id: "notes", label: "Notes opened" },
  { id: "summary", label: "Summary viewed" },
  { id: "ncert_notes", label: "NCERT viewed" },
  { id: "questions", label: "Questions attempted" },
  { id: "solutions", label: "Solutions viewed" },
];

function ChapterPage() {
  const { chapterId } = Route.useParams();
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [section, setSection] = useState<ResourceType | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["notes-chapter", chapterId],
    queryFn: () => fetchChapterDetail(chapterId),
    staleTime: 30_000,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["notes-chapter", chapterId] });
    qc.invalidateQueries({ queryKey: ["notes-chapters"] });
    qc.invalidateQueries({ queryKey: ["notes-overview"] });
  };

  const flag = useMutation({
    mutationFn: (patch: { completed?: boolean; favourite?: boolean }) => setChapterFlag(user.id, chapterId, patch),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const byType = useMemo(() => {
    const m = new Map<ResourceType, Resource[]>();
    for (const r of data?.resources ?? []) {
      const list = m.get(r.resource_type) ?? [];
      list.push(r);
      m.set(r.resource_type, list);
    }
    return m;
  }, [data]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="mx-auto h-64 max-w-3xl animate-pulse rounded-2xl bg-muted/50" />
      </AppShell>
    );
  }

  const chapter = data?.chapter;
  if (!chapter) {
    return (
      <AppShell>
        <p className="p-6 text-sm text-muted-foreground">This chapter isn't available.</p>
      </AppShell>
    );
  }

  const p = data?.progress ?? undefined;
  const avail = [...byType.keys()];
  const pct = chapterPct(avail, p);
  const sMeta = subjectMeta(chapter.subject);
  const list = section ? byType.get(section) ?? [] : [];
  const open = list.find((r) => r.id === openId) ?? (list.length === 1 ? list[0] : null);

  const openResource = (r: Resource) => {
    setOpenId(r.id);
    void markViewed(chapterId, r.resource_type).then(refresh);
  };

  const pickSection = (t: ResourceType) => {
    setSection(t);
    const items = byType.get(t) ?? [];
    setOpenId(items.length === 1 ? items[0].id : null);
    if (items.length === 1) void markViewed(chapterId, t).then(refresh);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-start gap-3">
          <Button asChild size="icon" variant="outline" className="h-9 w-9 shrink-0 rounded-full">
            <Link to="/notes/$classId/$subject" params={{ classId: String(chapter.class_level), subject: chapter.subject }} aria-label="Back to chapters">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {sMeta?.emoji} {sMeta?.label} · Class {chapter.class_level} · Chapter {pad2(chapter.chapter_number)}
            </p>
            <h1 className="font-display text-xl font-bold leading-tight sm:text-2xl">{chapter.name}</h1>
            {chapter.description && <p className="mt-1 text-xs text-muted-foreground">{chapter.description}</p>}
          </div>
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 shrink-0 rounded-full"
            onClick={() => flag.mutate({ favourite: !p?.favourite })}
            aria-label={p?.favourite ? "Remove from favourites" : "Add to favourites"}
          >
            <Star className={`h-4 w-4 ${p?.favourite ? "fill-amber-400 text-amber-400" : ""}`} />
          </Button>
        </div>

        <GlassSurface className="space-y-3 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <ProgressBar value={pct} className="h-2 flex-1" />
            <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {CHECKLIST.map((c) => {
              const on = p?.viewed_types?.includes(c.id);
              return (
                <span key={c.id} className={`inline-flex items-center gap-1 text-[11px] ${on ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                  {on ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                  {c.label}
                </span>
              );
            })}
          </div>
          <Button
            type="button"
            size="sm"
            variant={p?.completed ? "secondary" : "default"}
            className="w-full rounded-xl"
            onClick={() => flag.mutate({ completed: !p?.completed })}
            disabled={flag.isPending}
          >
            {p?.completed ? "Completed ✓ — tap to undo" : "Mark chapter as completed"}
          </Button>
        </GlassSurface>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {RESOURCE_TYPES.filter((t) => t.id !== "additional" || byType.has("additional")).map((t) => {
            const count = byType.get(t.id)?.length ?? 0;
            const active = section === t.id;
            return (
              <button
                key={t.id}
                type="button"
                disabled={count === 0}
                onClick={() => pickSection(t.id)}
                className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-colors ${
                  active ? "border-primary bg-primary/10" : "border-border bg-card/60 hover:bg-muted/60"
                } ${count === 0 ? "cursor-not-allowed opacity-45" : ""}`}
              >
                <span className="text-xl">{t.emoji}</span>
                <span className="text-xs font-semibold leading-tight">{t.label}</span>
                <span className="text-[10px] text-muted-foreground">{count === 0 ? "Coming soon" : `${count} ${count === 1 ? "item" : "items"}`}</span>
              </button>
            );
          })}
        </div>

        {section && list.length > 1 && (
          <div className="space-y-2">
            {list.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => openResource(r)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm ${
                  openId === r.id ? "border-primary bg-primary/10" : "border-border bg-card/60 hover:bg-muted/60"
                }`}
              >
                <span className="flex-1 truncate font-medium">{r.title}</span>
                {r.source === "ai_draft" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-600 dark:text-fuchsia-300">
                    <Sparkles className="h-3 w-3" /> AI draft
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {open && <NotesReader resource={open} />}
      </div>
    </AppShell>
  );
}