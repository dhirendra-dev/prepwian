import { createFileRoute, redirect } from "@tanstack/react-router";
import { LinkifiedText } from "@/components/LinkifiedText";
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
import { toast } from "sonner";
import { Trash2, Send, Bell } from "lucide-react";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  head: () => ({ meta: [{ title: "Admin · Notifications — JEE Prep Hub" }] }),
  ssr: false,
  beforeLoad: async ({ context }) => {
    await requirePermission(context.user.id, "notifications");
  },
  component: AdminNotifications,
});

const schema = z.object({
  title: z.string().trim().min(1, "Title required").max(200),
  body: z.string().trim().max(2000).optional(),
  link: z.string().trim().max(2000).optional().or(z.literal("")),
  audience: z.enum(["all", "user"]),
  priority: z.enum(["normal", "high"]),
  target_user_id: z.string().uuid().optional().or(z.literal("")),
});

function AdminNotifications() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    body: "",
    link: "",
    audience: "all" as "all" | "user",
    priority: "normal" as "normal" | "high",
    target_user_id: "",
  });

  const list = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const send = useMutation({
    mutationFn: async () => {
      const parsed = schema.parse(form);
      if (parsed.audience === "user" && !parsed.target_user_id) {
        throw new Error("Provide a target user ID for direct notifications.");
      }
      const { error } = await supabase.from("notifications").insert({
        title: parsed.title,
        body: parsed.body || null,
        link: parsed.link || null,
        audience: parsed.audience,
        priority: parsed.priority,
        target_user_id: parsed.audience === "user" ? parsed.target_user_id : null,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notification sent");
      setForm({ title: "", body: "", link: "", audience: "all", priority: "normal", target_user_id: "" });
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-display text-2xl font-semibold">Admin · Notifications</h1>
            <p className="text-sm text-muted-foreground">Send announcements to all users or a specific member, with an optional high-priority JEE alert flag.</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Compose</h2>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="New material added: Physics Mechanics" />
            </div>
            <div>
              <Label htmlFor="body">Message</Label>
              <Textarea id="body" rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Optional details…" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="link">Link (optional)</Label>
                <Input id="link" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/materials or https://…" />
              </div>
              <div>
                <Label>Audience</Label>
                <Select value={form.audience} onValueChange={(v: "all" | "user") => setForm({ ...form, audience: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="user">Specific user</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="max-w-sm">
              <Label>Alert priority</Label>
              <Select value={form.priority} onValueChange={(v: "normal" | "high") => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Standard announcement</SelectItem>
                  <SelectItem value="high">High-priority JEE alert</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">Only high-priority alerts can play user-selected sounds or raise desktop notifications.</p>
            </div>
            {form.audience === "user" && (
              <div>
                <Label htmlFor="uid">Target user ID</Label>
                <Input id="uid" value={form.target_user_id} onChange={(e) => setForm({ ...form, target_user_id: e.target.value })} placeholder="UUID from Admin · Users" />
              </div>
            )}
            <Button onClick={() => send.mutate()} disabled={send.isPending} className="w-fit">
              <Send className="mr-2 h-4 w-4" />
              {send.isPending ? "Sending…" : "Send notification"}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Recent ({list.data?.length ?? 0})</h2>
          {list.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : list.data && list.data.length > 0 ? (
            <ul className="divide-y">
              {list.data.map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium">{n.title}{n.priority === "high" && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">High priority</span>}</p>
                    {n.body && <p className="text-sm text-muted-foreground"><LinkifiedText text={n.body} /></p>}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {n.audience === "all" ? "Everyone" : `User ${n.target_user_id?.slice(0, 8)}…`}
                      {" · "}
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      {n.link && ` · ${n.link}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove.mutate(n.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No notifications sent yet.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
