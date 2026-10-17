import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle2, XCircle, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/squad/join/$code")({
  head: () => ({ meta: [
      { name: "description", content: "Join a PREPWIAN study squad using its invitation link." },
      { property: "og:title", content: "Join Squad — PREPWIAN" },
      { property: "og:description", content: "Join a PREPWIAN study squad using its invitation link." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Join Squad — PREPWIAN" },
      { name: "twitter:description", content: "Join a PREPWIAN study squad using its invitation link." },
{ title: "Join Squad — PREPWIAN" }] }),
  component: JoinSquadPage,
});

function JoinSquadPage() {
  const { code } = Route.useParams();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "ok" | "already" | "notfound" | "error">("loading");
  const [group, setGroup] = useState<{ id: string; name: string; description: string | null } | null>(null);
  const [errMsg, setErrMsg] = useState<string>("");

  useEffect(() => {
    (async () => {
      // Private squads are not directly readable any more (invite codes stay
      // hidden), so resolve the invite through a safe lookup.
      const { data: rows, error } = await (supabase as never as {
        rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: { id: string; name: string; description: string | null }[] | null; error: unknown }>;
      }).rpc("group_by_invite_code", { _code: code });
      const g = rows?.[0] ?? null;
      if (error || !g) { setStatus("notfound"); return; }
      setGroup(g);
      const { data: existing } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", g.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (existing) { setStatus("already"); return; }
      // Invite-only squads can only be joined through this validated routine.
      const { error: joinErr } = await (supabase as never as {
        rpc: (n: string, a: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
      }).rpc("join_group_via_invite", { _code: code });
      if (joinErr) { setStatus("error"); setErrMsg(joinErr.message); return; }
      toast.success(`Joined ${g.name}!`);
      setStatus("ok");
    })();
  }, [code, user.id]);

  return (
    <AppShell>
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
          {status === "loading" && (
            <>
              <Users className="mx-auto h-10 w-10 animate-pulse text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">Checking invite…</p>
            </>
          )}
          {status === "notfound" && (
            <>
              <XCircle className="mx-auto h-10 w-10 text-destructive" />
              <h1 className="mt-3 font-display text-xl font-bold">Invite not found</h1>
              <p className="mt-2 text-sm text-muted-foreground">This invite link is invalid or expired.</p>
              <Button className="mt-4" onClick={() => navigate({ to: "/groups" })}>Browse squads</Button>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="mx-auto h-10 w-10 text-destructive" />
              <h1 className="mt-3 font-display text-xl font-bold">Could not join</h1>
              <p className="mt-2 text-sm text-muted-foreground">{errMsg}</p>
              <Button className="mt-4" onClick={() => navigate({ to: "/groups" })}>Back to squads</Button>
            </>
          )}
          {(status === "ok" || status === "already") && group && (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
              <h1 className="mt-3 font-display text-xl font-bold">{group.name}</h1>
              {group.description && <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>}
              <p className="mt-3 text-sm text-muted-foreground">
                {status === "ok" ? "You're in! Welcome to the squad." : "You're already a member."}
              </p>
              <Button
                className="mt-4 gap-1"
                onClick={() => navigate({ to: "/squad/$groupId", params: { groupId: group.id } })}
              >
                <MessageCircle className="h-4 w-4" /> Open chat
              </Button>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
