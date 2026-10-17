import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { requirePermission } from "@/lib/admin-guard";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, Pencil, X } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/admin/community")({
  head: () => ({ meta: [{ title: "Admin · Community — JEE Prep Hub" }] }),
  ssr: false,
  beforeLoad: async ({ context }) => {
    await requirePermission(context.user.id, "community");
  },
  component: AdminCommunity,
});

const CATEGORIES = ["main", "batch", "notes", "discussion", "doubt", "problem_solving", "resources"] as const;
const PLATFORMS = ["whatsapp", "telegram", "discord", "other"] as const;

const schema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(CATEGORIES),
  platform: z.enum(PLATFORMS),
  invite_url: z.string().url().max(2000),
  icon_emoji: z.string().min(1).max(10),
  sort_order: z.number().int().min(0).max(1000),
  is_active: z.boolean(),
});

type FormState = z.infer<typeof schema>;

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  category: "discussion",
  platform: "whatsapp",
  invite_url: "",
  icon_emoji: "💬",
  sort_order: 0,
  is_active: true,
};

function AdminCommunity() {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["admin-community-groups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("community_groups").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async (input: FormState) => {
      const parsed = schema.parse(input);
      const { error } = await supabase.from("community_groups").insert({ ...parsed });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Group added");
      setForm(EMPTY_FORM);
      qc.invalidateQueries({ queryKey: ["admin-community-groups"] });
      qc.invalidateQueries({ queryKey: ["community-groups"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: FormState }) => {
      const parsed = schema.parse(input);
      const { error } = await supabase.from("community_groups").update(parsed).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Group updated");
      setEditingId(null);
      setForm(EMPTY_FORM);
      qc.invalidateQueries({ queryKey: ["admin-community-groups"] });
      qc.invalidateQueries({ queryKey: ["community-groups"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("community_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Group deleted");
      qc.invalidateQueries({ queryKey: ["admin-community-groups"] });
      qc.invalidateQueries({ queryKey: ["community-groups"] });
    },
  });

  function startEdit(group: {
    id: string;
    name: string;
    description: string | null;
    category: (typeof CATEGORIES)[number];
    platform: (typeof PLATFORMS)[number];
    invite_url: string;
    icon_emoji: string;
    sort_order: number;
    is_active: boolean;
  }) {
    setEditingId(group.id);
    setForm({
      name: group.name,
      description: group.description ?? "",
      category: group.category,
      platform: group.platform,
      invite_url: group.invite_url,
      icon_emoji: group.icon_emoji,
      sort_order: group.sort_order,
      is_active: group.is_active,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      update.mutate({ id: editingId, input: form });
    } else {
      create.mutate(form);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto mb-6 flex max-w-6xl gap-2">
        <Link to="/admin/materials" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Materials</Link>
        <Link to="/admin/community" className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">Community</Link>
        <Link to="/admin/certificates" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Certificates</Link>
        <Link to="/admin/users" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Users</Link>
        <Link to="/admin/audit" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Audit Log</Link>
      </div>
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold">
            {editingId ? "Edit group" : "Add community group"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            WhatsApp, Telegram, or Discord links that appear on the public Community page.
          </p>
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <Field label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={200} />
            </Field>
            <Field label="Invite URL">
              <Input value={form.invite_url} onChange={(e) => setForm({ ...form, invite_url: e.target.value })} required type="url" placeholder="https://chat.whatsapp.com/..." />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as FormState["category"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Platform">
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v as FormState["platform"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Icon emoji">
                <Input value={form.icon_emoji} onChange={(e) => setForm({ ...form, icon_emoji: e.target.value })} maxLength={10} />
              </Field>
              <Field label="Sort order">
                <Input
                  type="number"
                  min={0}
                  max={1000}
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value || "0", 10) })}
                />
              </Field>
            </div>
            <Field label="Description">
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} rows={3} />
            </Field>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label className="text-xs">Active (visible on public page)</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={create.isPending || update.isPending} className="flex-1">
                {editingId ? "Update group" : "Add group"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold">All groups ({list.data?.length ?? 0})</h2>
          <div className="mt-4 max-h-[70vh] divide-y divide-border overflow-y-auto">
            {list.data?.map((g) => (
              <div key={g.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span>{g.icon_emoji}</span>
                    <div className="truncate text-sm font-medium">{g.name}</div>
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {g.category.replace("_", " ")} · {g.platform} · order {g.sort_order}
                  </div>
                  <a href={g.invite_url} target="_blank" rel="noopener noreferrer" className="line-clamp-1 break-all text-[11px] text-accent hover:underline">
                    {g.invite_url}
                  </a>
                  {!g.is_active && <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">Inactive</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(g)} className="rounded-md p-2 text-muted-foreground hover:bg-muted" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => del.mutate(g.id)} className="rounded-md p-2 text-destructive hover:bg-destructive/10" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {list.data?.length === 0 && <p className="py-6 text-sm text-muted-foreground">No groups yet.</p>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
