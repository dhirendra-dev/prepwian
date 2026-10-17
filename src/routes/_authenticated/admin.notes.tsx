import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowDown, ArrowUp, Pencil, Trash2, Upload } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NOTES_BUCKET, RESOURCE_TYPES, SUBJECTS, pad2, type Chapter, type Resource } from "@/lib/notes";

const db = supabase as any;

export const Route = createFileRoute("/_authenticated/admin/notes")({
  head: () => ({ meta: [{ title: "Admin · Notes — PREPWIAN" }] }),
  ssr: false,
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", context.user.id).eq("role", "admin").maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: AdminNotes,
});

const chapterSchema = z.object({
  chapter_number: z.coerce.number().int().min(1).max(99),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(["draft", "published"]),
});

const emptyRes = {
  resource_type: "notes",
  title: "",
  description: "",
  file_kind: "pdf",
  file_url: "",
  content_md: "",
  source: "official",
  downloadable: false,
  published: false,
};

function AdminNotes() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [cls, setCls] = useState("11");
  const [subject, setSubject] = useState("physics");
  const [chapterId, setChapterId] = useState<string | null>(null);

  const chapters = useQuery({
    queryKey: ["admin-notes-chapters", cls, subject],
    queryFn: async () => {
      const { data, error } = await db.from("notes_chapters").select("*").eq("class_level", Number(cls)).eq("subject", subject).order("chapter_number");
      if (error) throw error;
      return (data ?? []) as Chapter[];
    },
  });

  const chapter = chapters.data?.find((c) => c.id === chapterId) ?? null;

  const invalidateStudent = () => {
    qc.invalidateQueries({ queryKey: ["notes-chapters"] });
    qc.invalidateQueries({ queryKey: ["notes-chapter"] });
    qc.invalidateQueries({ queryKey: ["notes-overview"] });
  };

  return (
    <AppShell>
      <div className="mx-auto mb-6 flex max-w-6xl flex-wrap gap-2">
        <Link to="/admin/materials" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Materials</Link>
        <Link to="/admin/notes" className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">Notes</Link>
        <Link to="/notes" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">View as student</Link>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold">Chapters</h2>
          <div className="grid grid-cols-2 gap-3">
            <Select value={cls} onValueChange={(v) => { setCls(v); setChapterId(null); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="11">Class 11</SelectItem>
                <SelectItem value="12">Class 12</SelectItem>
              </SelectContent>
            </Select>
            <Select value={subject} onValueChange={(v) => { setSubject(v); setChapterId(null); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="max-h-[45vh] divide-y divide-border overflow-y-auto">
            {chapters.data?.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setChapterId(c.id)}
                className={`flex w-full items-center gap-2 px-2 py-2 text-left text-sm ${c.id === chapterId ? "bg-accent/40" : "hover:bg-muted/50"}`}
              >
                <span className="w-6 text-xs text-muted-foreground">{pad2(c.chapter_number)}</span>
                <span className="flex-1 truncate">{c.name}</span>
                {c.status === "draft" && <span className="rounded bg-amber-500/15 dark:bg-amber-400/15 px-1.5 text-[10px] text-amber-600 dark:text-amber-300">draft</span>}
              </button>
            ))}
            {chapters.data?.length === 0 && <p className="py-4 text-sm text-muted-foreground">No chapters yet.</p>}
          </div>

          <ChapterForm
            key={chapter?.id ?? `new-${cls}-${subject}`}
            chapter={chapter}
            cls={Number(cls)}
            subject={subject}
            nextNumber={(chapters.data?.at(-1)?.chapter_number ?? 0) + 1}
            onDone={() => { qc.invalidateQueries({ queryKey: ["admin-notes-chapters"] }); invalidateStudent(); }}
            onDeleted={() => setChapterId(null)}
            onNew={() => setChapterId(null)}
          />
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          {chapter ? (
            <ResourcesPanel chapter={chapter} userId={user.id} onChange={invalidateStudent} />
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">Select a chapter to manage its resources.</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}

/* ------------------------------- chapters ------------------------------- */

function ChapterForm({ chapter, cls, subject, nextNumber, onDone, onDeleted, onNew }: {
  chapter: Chapter | null; cls: number; subject: string; nextNumber: number;
  onDone: () => void; onDeleted: () => void; onNew: () => void;
}) {
  const [f, setF] = useState({
    chapter_number: String(chapter?.chapter_number ?? nextNumber),
    name: chapter?.name ?? "",
    description: chapter?.description ?? "",
    status: (chapter?.status ?? "published") as "draft" | "published",
  });

  const save = useMutation({
    mutationFn: async () => {
      const parsed = chapterSchema.parse(f);
      const row = { ...parsed, description: parsed.description || null };
      const q = chapter
        ? db.from("notes_chapters").update(row).eq("id", chapter.id)
        : db.from("notes_chapters").insert({ ...row, class_level: cls, subject });
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => { toast.success(chapter ? "Chapter updated" : "Chapter created"); if (!chapter) setF({ ...f, chapter_number: String(Number(f.chapter_number) + 1), name: "", description: "" }); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async () => {
      if (!chapter) return;
      // Remove uploaded files first, then the chapter (resources cascade).
      const { data } = await db.from("notes_resources").select("storage_path").eq("chapter_id", chapter.id);
      const paths = (data ?? []).map((r: any) => r.storage_path).filter(Boolean);
      if (paths.length) await supabase.storage.from(NOTES_BUCKET).remove(paths);
      const { error } = await db.from("notes_chapters").delete().eq("id", chapter.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Chapter deleted"); onDeleted(); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form className="space-y-3 border-t border-border pt-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{chapter ? "Edit chapter" : "Add chapter"}</h3>
        {chapter && <Button type="button" size="sm" variant="ghost" onClick={onNew}>+ New</Button>}
      </div>
      <div className="grid grid-cols-[5rem_1fr] gap-3">
        <div className="space-y-1.5"><Label className="text-xs">No.</Label><Input type="number" min={1} value={f.chapter_number} onChange={(e) => setF({ ...f, chapter_number: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={200} required /></div>
      </div>
      <div className="space-y-1.5"><Label className="text-xs">Description</Label><Textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={2000} /></div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs"><Switch checked={f.status === "published"} onCheckedChange={(v) => setF({ ...f, status: v ? "published" : "draft" })} /> Published</label>
        <div className="flex gap-2">
          {chapter && (
            <Button type="button" size="sm" variant="outline" className="text-destructive" disabled={del.isPending}
              onClick={() => { if (window.confirm(`Delete "${chapter.name}" and all its resources?`)) del.mutate(); }}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button type="submit" size="sm" disabled={save.isPending}>{chapter ? "Save" : "Add chapter"}</Button>
        </div>
      </div>
    </form>
  );
}

/* ------------------------------- resources ------------------------------- */

const safeName = (n: string) => n.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80);

function ResourcesPanel({ chapter, userId, onChange }: { chapter: Chapter; userId: string; onChange: () => void }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Resource | null>(null);
  const [f, setF] = useState<any>(emptyRes);
  const [file, setFile] = useState<File | null>(null);

  const list = useQuery({
    queryKey: ["admin-notes-resources", chapter.id],
    queryFn: async () => {
      const { data, error } = await db.from("notes_resources").select("*").eq("chapter_id", chapter.id).order("display_order").order("created_at");
      if (error) throw error;
      return (data ?? []) as Resource[];
    },
  });

  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-notes-resources", chapter.id] }); onChange(); };
  const reset = () => { setEditing(null); setF(emptyRes); setFile(null); };

  const save = useMutation({
    mutationFn: async () => {
      const title = f.title.trim();
      if (!title) throw new Error("Title is required");
      let storage_path: string | null = editing?.storage_path ?? null;
      let file_url: string | null = f.file_url.trim() || null;
      let content_md: string | null = f.content_md.trim() || null;

      if (f.file_kind === "text") {
        if (!content_md) throw new Error("Add some text content");
        file_url = null; storage_path = null;
      } else if (file) {
        if (file.size > 50 * 1024 * 1024) throw new Error("File is larger than 50 MB");
        const path = `${chapter.id}/${crypto.randomUUID()}-${safeName(file.name)}`;
        const up = await supabase.storage.from(NOTES_BUCKET).upload(path, file, { contentType: file.type || undefined, upsert: false });
        if (up.error) throw up.error;
        if (editing?.storage_path) await supabase.storage.from(NOTES_BUCKET).remove([editing.storage_path]);
        storage_path = path; file_url = null; content_md = null;
      } else if (file_url) {
        z.string().url().parse(file_url);
        if (editing?.storage_path) await supabase.storage.from(NOTES_BUCKET).remove([editing.storage_path]);
        storage_path = null; content_md = null;
      } else if (!storage_path) {
        throw new Error("Upload a file, paste a URL, or choose Text");
      }

      const row = {
        resource_type: f.resource_type,
        title,
        description: f.description.trim() || null,
        file_kind: f.file_kind,
        file_url, storage_path, content_md,
        source: f.source,
        downloadable: f.downloadable,
        published: f.published,
      };
      const q = editing
        ? db.from("notes_resources").update(row).eq("id", editing.id)
        : db.from("notes_resources").insert({ ...row, chapter_id: chapter.id, created_by: userId, display_order: (list.data?.length ?? 0) });
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => { toast.success(editing ? "Resource updated" : "Resource added"); reset(); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePublish = useMutation({
    mutationFn: async (r: Resource) => {
      const { error } = await db.from("notes_resources").update({ published: !r.published }).eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (r: Resource) => {
      if (r.storage_path) await supabase.storage.from(NOTES_BUCKET).remove([r.storage_path]);
      const { error } = await db.from("notes_resources").delete().eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); reset(); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const move = useMutation({
    mutationFn: async ({ i, d }: { i: number; d: -1 | 1 }) => {
      const items = [...(list.data ?? [])];
      const j = i + d;
      if (j < 0 || j >= items.length) return;
      [items[i], items[j]] = [items[j], items[i]];
      const results = await Promise.all(items.map((r, idx) => db.from("notes_resources").update({ display_order: idx }).eq("id", r.id)));
      const bad = results.find((r: any) => r.error);
      if (bad) throw bad.error;
    },
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const startEdit = (r: Resource) => {
    setEditing(r);
    setFile(null);
    setF({ ...emptyRes, ...r, description: r.description ?? "", file_url: r.file_url ?? "", content_md: r.content_md ?? "" });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-semibold">{pad2(chapter.chapter_number)} — {chapter.name}</h2>
        <p className="text-xs text-muted-foreground">Class {chapter.class_level} · {chapter.subject}</p>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border">
        {list.data?.map((r, i) => (
          <div key={r.id} className="flex items-center gap-2 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{r.title}</p>
              <p className="text-[11px] text-muted-foreground">
                {RESOURCE_TYPES.find((t) => t.id === r.resource_type)?.label} · {r.file_kind}{r.source === "ai_draft" ? " · AI draft" : ""}
              </p>
            </div>
            <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Switch checked={r.published} onCheckedChange={() => togglePublish.mutate(r)} /> Live
            </label>
            <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === 0} onClick={() => move.mutate({ i, d: -1 })} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === (list.data?.length ?? 0) - 1} onClick={() => move.mutate({ i, d: 1 })} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(r)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (window.confirm(`Delete "${r.title}"?`)) del.mutate(r); }} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        ))}
        {list.data?.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted-foreground">No resources yet.</p>}
      </div>

      <form className="space-y-3 border-t border-border pt-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{editing ? "Edit resource" : "Add resource"}</h3>
          {editing && <Button type="button" size="sm" variant="ghost" onClick={reset}>Cancel</Button>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Section</Label>
            <Select value={f.resource_type} onValueChange={(v) => setF({ ...f, resource_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{RESOURCE_TYPES.map((t) => <SelectItem key={t.id} value={t.id}>{t.emoji} {t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Format</Label>
            <Select value={f.file_kind} onValueChange={(v) => setF({ ...f, file_kind: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="link">Link (Drive / web page)</SelectItem>
                <SelectItem value="text">Text (supports $LaTeX$)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={200} required /></div>
        <div className="space-y-1.5"><Label className="text-xs">Description</Label><Textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={2000} /></div>

        {f.file_kind === "text" ? (
          <div className="space-y-1.5"><Label className="text-xs">Content</Label><Textarea rows={8} value={f.content_md} onChange={(e) => setF({ ...f, content_md: e.target.value })} maxLength={200000} placeholder="Use $x^2$ for inline and $$…$$ for display maths." /></div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-xs"><Upload className="h-3 w-3" /> Upload file (max 50 MB){editing?.storage_path && !file ? " — a file is already attached" : ""}</Label>
              <Input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">…or paste a URL</Label>
              <Input type="url" value={f.file_url} onChange={(e) => setF({ ...f, file_url: e.target.value })} placeholder="https://drive.google.com/file/d/…" disabled={!!file} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Source</Label>
            <Select value={f.source} onValueChange={(v) => setF({ ...f, source: v, published: v === "ai_draft" ? false : f.published })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="official">Official (admin-approved)</SelectItem>
<SelectItem value="ai_draft">AI-generated draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col justify-end gap-2 pb-1">
            <label className="flex items-center gap-2 text-xs"><Switch checked={f.downloadable} onCheckedChange={(v) => setF({ ...f, downloadable: v })} /> Allow download</label>
            <label className="flex items-center gap-2 text-xs"><Switch checked={f.published} onCheckedChange={(v) => setF({ ...f, published: v })} /> Published</label>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={save.isPending}>{save.isPending ? "Saving…" : editing ? "Save changes" : "Add resource"}</Button>
      </form>
    </div>
  );
}
