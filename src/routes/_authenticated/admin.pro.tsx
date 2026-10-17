import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { requirePermission } from "@/lib/admin-guard";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Crown, ChevronLeft } from "lucide-react";
import { grantPro, revokePro } from "@/lib/pro.functions";

export const Route = createFileRoute("/_authenticated/admin/pro")({
  head: () => ({ meta: [{ title: "Admin · Pro Members — JEE Prep Hub" }] }),
  ssr: false,
  beforeLoad: async ({ context }) => {
    await requirePermission(context.user.id, "pro");
  },
  component: AdminPro,
});

function AdminPro() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const subs = useQuery({
    queryKey: ["admin-pro-subs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pro_subscriptions")
        .select("id, user_id, plan, status, started_at, expires_at, note")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map((s) => s.user_id)));
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids)
        : { data: [] as any[] };
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      return (data ?? []).map((s) => ({ ...s, profile: map.get(s.user_id) }));
    },
  });

  const users = useQuery({
    queryKey: ["admin-pro-user-search", search],
    queryFn: async () => {
      if (!search.trim()) return [];
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .ilike("full_name", `%${search}%`)
        .limit(10);
      return data ?? [];
    },
  });

  const grant = useMutation({
    mutationFn: (v: { user_id: string; plan: "trial" | "monthly" | "yearly" | "lifetime" }) => grantPro({ data: v }),
    onSuccess: () => { toast.success("Pro granted"); qc.invalidateQueries({ queryKey: ["admin-pro-subs"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: (user_id: string) => revokePro({ data: { user_id } }),
    onSuccess: () => { toast.success("Pro revoked"); qc.invalidateQueries({ queryKey: ["admin-pro-subs"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-5 py-6">
        <Link to="/admin" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
          <ChevronLeft className="h-4 w-4" /> Admin Center
        </Link>
        <div className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-amber-500 dark:text-amber-300" />
          <h1 className="font-display text-2xl font-bold">Pro Members</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Grant or revoke JEE Prep Hub Pro membership.</p>

        <div className="mt-6 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Grant Pro to a user</h2>
          <Input placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} className="mt-3" />
          {users.data && users.data.length > 0 && (
            <div className="mt-3 divide-y divide-border rounded-lg border border-border">
              {users.data.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3">
                  <img src={u.avatar_url ?? "/favicon.ico"} alt="" className="h-8 w-8 rounded-full object-cover" />
                  <span className="flex-1 text-sm">{u.full_name}</span>
                  {(["trial", "monthly", "yearly", "lifetime"] as const).map((plan) => (
                    <Button key={plan} size="sm" variant="outline" disabled={grant.isPending} onClick={() => grant.mutate({ user_id: u.id, plan })}>
                      {plan}
                    </Button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4 text-sm font-semibold">Active & recent subscriptions</div>
          <div className="divide-y divide-border">
            {(subs.data ?? []).map((s: any) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 p-4">
                <img src={s.profile?.avatar_url ?? "/favicon.ico"} alt="" className="h-8 w-8 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{s.profile?.full_name ?? s.user_id.slice(0, 8)}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.plan} · {s.status} · {s.expires_at ? `expires ${new Date(s.expires_at).toLocaleDateString()}` : "no expiry"}
                  </div>
                </div>
                {s.status === "active" && (
                  <Button size="sm" variant="destructive" disabled={revoke.isPending} onClick={() => revoke.mutate(s.user_id)}>
                    Revoke
                  </Button>
                )}
              </div>
            ))}
            {(subs.data ?? []).length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">No Pro subscriptions yet.</div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
