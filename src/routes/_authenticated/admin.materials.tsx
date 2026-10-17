import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, KeyRound } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getMaterialPasswordMeta, setMaterialPassword } from "@/lib/materials-gate.functions";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/admin/materials")({
  head: () => ({ meta: [{ title: "Admin · Materials — JEE Prep Hub" }] }),
  ssr: false,
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", context.user.id).eq("role", "admin").maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: AdminMaterials,
});

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional(),
  subject: z.enum(["physics", "chemistry", "mathematics", "general"]),
  class_level: z.enum(["class_11", "class_12", "dropper", "both"]),
  topic: z.string().max(200).optional(),
  drive_url: z.string().url().max(2000),
  resource_type: z.enum(["notes", "module", "pyq", "test_series", "book", "short_notes", "video", "other"]),
});

function AdminMaterials() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "physics" as const,
    class_level: "both" as const,
    topic: "",
    drive_url: "",
    resource_type: "notes" as const,
  });

  const list = useQuery({
    queryKey: ["admin-materials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("materials").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async (input: typeof form) => {
      const parsed = schema.parse(input);
      const { error } = await supabase.from("materials").insert({ ...parsed, uploaded_by: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Material added");
      setForm({ ...form, title: "", description: "", topic: "", drive_url: "" });
      qc.invalidateQueries({ queryKey: ["admin-materials"] });
      qc.invalidateQueries({ queryKey: ["materials"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-materials"] });
      qc.invalidateQueries({ queryKey: ["materials"] });
    },
  });

  return (
    <AppShell>
      <div className="mx-auto mb-6 flex max-w-6xl gap-2">
        <Link to="/admin/materials" className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">Materials</Link>
<Link to="/admin/notes" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Notes</Link>
        <Link to="/admin/community" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Community</Link>
        <Link to="/admin/certificates" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Certificates</Link>
        <Link to="/admin/users" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Users</Link>
        <Link to="/admin/audit" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Audit Log</Link>
      </div>
      <div className="mx-auto mb-6 max-w-6xl">
        <MaterialPasswordCard />
      </div>
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold">Add material</h2>
          <p className="mt-1 text-xs text-muted-foreground">Paste a Google Drive link and tag it.</p>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => { e.preventDefault(); create.mutate(form); }}
          >
            <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={200} /></Field>
            <Field label="Google Drive URL"><Input value={form.drive_url} onChange={(e) => setForm({ ...form, drive_url: e.target.value })} required type="url" placeholder="https://drive.google.com/..." /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Subject">
                <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v as typeof form.subject })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physics">Physics</SelectItem>
                    <SelectItem value="chemistry">Chemistry</SelectItem>
                    <SelectItem value="mathematics">Mathematics</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Class">
                <Select value={form.class_level} onValueChange={(v) => setForm({ ...form, class_level: v as typeof form.class_level })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class_11">Class 11</SelectItem>
                    <SelectItem value="class_12">Class 12</SelectItem>
                    <SelectItem value="dropper">Dropper</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Topic"><Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} maxLength={200} placeholder="e.g. Mechanics" /></Field>
              <Field label="Type">
                <Select value={form.resource_type} onValueChange={(v) => setForm({ ...form, resource_type: v as typeof form.resource_type })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["notes","module","pyq","test_series","book","short_notes","video","other"].map(t => (
                      <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={2000} rows={3} /></Field>
            <Button type="submit" disabled={create.isPending} className="w-full">Add material</Button>
          </form>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold">All materials ({list.data?.length ?? 0})</h2>
          <div className="mt-4 max-h-[70vh] divide-y divide-border overflow-y-auto">
            {list.data?.map((m) => (
              <div key={m.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{m.title}</div>
                  <div className="text-xs text-muted-foreground capitalize">{m.subject} · {m.class_level.replace("_"," ")} · {m.resource_type}</div>
                  <a href={m.drive_url} target="_blank" rel="noopener noreferrer" className="line-clamp-1 break-all text-[11px] text-accent hover:underline">{m.drive_url}</a>
                </div>
                <button onClick={() => del.mutate(m.id)} className="rounded-md p-2 text-destructive hover:bg-destructive/10" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {list.data?.length === 0 && <p className="py-6 text-sm text-muted-foreground">No materials yet.</p>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}

function MaterialPasswordCard() {
  const meta = useServerFn(getMaterialPasswordMeta);
  const save = useServerFn(setMaterialPassword);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");

  const info = useQuery({ queryKey: ["material-password-meta"], queryFn: () => meta() });

  const mutate = useMutation({
    mutationFn: async () => {
      if (pw.trim().length < 6) throw new Error("Use at least 6 characters");
      if (pw !== confirm) throw new Error("The two passwords do not match");
      await save({ data: { password: pw.trim() } });
    },
    onSuccess: () => {
      toast.success("Access password updated — share it with your students");
      setPw(""); setConfirm("");
      info.refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <KeyRound className="h-4 w-4" /> Study material access password
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Students must enter this to open the materials library and the physics / mathematics resource pages.
            Change it as often as you like — everyone gets logged out of the library within 12 hours.
          </p>
        </div>
        {info.data?.updatedAt && (
          <span className="text-[11px] text-muted-foreground">
            Last changed {new Date(info.data.updatedAt).toLocaleString()}
          </span>
        )}
      </div>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => { e.preventDefault(); mutate.mutate(); }}
      >
        <Field label="New password"><Input type="text" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="e.g. JPH-Materials-Feb" /></Field>
        <Field label="Confirm password"><Input type="text" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
        <Button type="submit" disabled={mutate.isPending}>{mutate.isPending ? "Saving…" : "Update password"}</Button>
      </form>
    </section>
  );
}
