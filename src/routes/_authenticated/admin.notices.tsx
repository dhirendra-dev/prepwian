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
import { Trash2, Send, Megaphone, Pin, PinOff, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/notices")({
  head: () => ({ meta: [{ title: "Admin · Notice Board — PREPWIAN" }] }),
  ssr: false,
  beforeLoad: async ({ context }) => {
    await requirePermission(context.user.id, "notices");
  },
  component: AdminNoticesPage,
});

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "exam", label: "Exam" },
  { value: "result", label: "Result" },
  { value: "event", label: "Event" },
  { value: "urgent", label: "Urgent" },
];

function AdminNoticesPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    body: "",
    category: "general",
    pinned: false,
    link_url: "",
    link_label: "",
    expires_at: "",
  });

  const list = useQuery({
    queryKey: ["admin-notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim(),
        body: form.body.trim(),
        category: form.category,
        pinned: form.pinned,
        link_url: form.link_url.trim() || null,
        link_label: form.link_label.trim() || null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        created_by: user.id,
      };
      if (!payload.title || !payload.body) throw new Error("Title and body are required");
      const { error } = await supabase.from("notices").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notice published — everyone has been notified");
      setForm({ title: "", body: "", category: "general", pinned: false, link_url: "", link_label: "", expires_at: "" });
      qc.invalidateQueries({ queryKey: ["admin-notices"] });
      qc.invalidateQueries({ queryKey: ["notices", "public"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePin = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase.from("notices").update({ pinned: !pinned }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notices"] });
      qc.invalidateQueries({ queryKey: ["notices", "public"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notice deleted");
      qc.invalidateQueries({ queryKey: ["admin-notices"] });
      qc.invalidateQueries({ queryKey: ["notices", "public"] });
    },
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Megaphone className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-xl font-bold">Notice Board</h1>
              <p className="text-xs text-muted-foreground">Publish official updates — every member is auto-notified.</p>
            </div>
          </div>
          <Link to="/notices" className="text-xs text-primary hover:underline">View public board →</Link>
        </div>

        {/* Composer */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="mb-4 text-sm font-semibold">New notice</h2>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. JEE Main 2027 Session 1 dates announced"
                maxLength={200}
              />
            </div>
            <div>
              <Label htmlFor="body">Details</Label>
              <Textarea
                id="body"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Full announcement…"
                rows={5}
                maxLength={2000}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="expires">Expires (optional)</Label>
                <Input
                  id="expires"
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="link">Link URL (optional)</Label>
                <Input
                  id="link"
                  value={form.link_url}
                  onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
                  placeholder="https://…"
                />
              </div>
              <div>
                <Label htmlFor="linklabel">Link button label</Label>
                <Input
                  id="linklabel"
                  value={form.link_label}
                  onChange={(e) => setForm((f) => ({ ...f, link_label: e.target.value }))}
                  placeholder="Open notification"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Pin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <Label htmlFor="pinned" className="cursor-pointer text-sm">Pin to top of the board</Label>
              </div>
              <Switch id="pinned" checked={form.pinned} onCheckedChange={(v) => setForm((f) => ({ ...f, pinned: v }))} />
            </div>
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending || !form.title.trim() || !form.body.trim()}
              className="w-full sm:w-auto"
            >
              <Send className="mr-2 h-4 w-4" />
              {create.isPending ? "Publishing…" : "Publish notice"}
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="mb-3 text-sm font-semibold">Published notices</h2>
          {list.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {list.data && list.data.length === 0 && (
            <p className="text-sm text-muted-foreground">No notices yet.</p>
          )}
          <div className="space-y-2">
            {list.data?.map((n) => (
              <div key={n.id} className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold uppercase tracking-wide text-primary">
                      {n.category}
                    </span>
                    {n.pinned && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 dark:bg-amber-400/15 px-2 py-0.5 font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                        <Pin className="h-2.5 w-2.5" /> Pinned
                      </span>
                    )}
                    <span className="text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                  {n.link_url && (
                    <a href={n.link_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" /> {n.link_label || n.link_url}
                    </a>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title={n.pinned ? "Unpin" : "Pin"}
                    onClick={() => togglePin.mutate({ id: n.id, pinned: n.pinned })}
                  >
                    {n.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete"
                    onClick={() => { if (confirm("Delete this notice?")) remove.mutate(n.id); }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
