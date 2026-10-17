import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { requirePermission } from "@/lib/admin-guard";
import { supabase } from "@/integrations/supabase/client";
import { adminListAuditLogs } from "@/lib/audit.functions";
import { adminListAwardRequests } from "@/lib/certificates.functions";
import { adminListTests } from "@/lib/tests.functions";
import { useAdminAccess } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  ShieldCheck,
  Scale,
  Mail,
  Users,
  Bell,
  ShieldAlert,
  BookOpen,
  Megaphone,
  Award,
  FileText,
  ArrowRight,
  Activity,
  MessageSquare,
  Crown,
  UserCog,
  CalendarClock,
  RefreshCw,
  Settings2,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [{ title: "Admin Center — JEE Prep Hub" }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: async ({ context }) => {
    await requirePermission(context.user.id, "users");
  },
  component: AdminCenter,
});

function isPendingTest(value: unknown): value is { approval_status: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "approval_status" in value &&
    (value as { approval_status?: unknown }).approval_status === "pending"
  );
}

function AdminCenter() {
  const { user } = Route.useRouteContext();
  const { role, loading, hasPermission } = useAdminAccess(user.id);
  const isAdmin = role !== null;
  const isFullAdmin = role === "admin";
  const navigate = useNavigate();
  const recentAuditFn = useServerFn(adminListAuditLogs);
  const listAwardRequestsFn = useServerFn(adminListAwardRequests);
  const listTestsFn = useServerFn(adminListTests);

  const q = useQuery({
    queryKey: ["admin-center-counts"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const [
        appealsPending,
        contactsNew,
        contactsUnread,
        usersTotal,
        notices,
        materials,
        sessionsToday,
        feedToday,
        consents,
        banned,
      ] = await Promise.all([
        supabase
          .from("moderation_appeals")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("contact_messages")
          .select("id", { count: "exact", head: true })
          .eq("status", "new"),
        supabase
          .from("contact_messages")
          .select("id", { count: "exact", head: true })
          .is("replied_at", null),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("notices").select("id", { count: "exact", head: true }),
        supabase.from("materials").select("id", { count: "exact", head: true }),
        supabase
          .from("study_sessions")
          .select("id", { count: "exact", head: true })
          .gte("ended_at", new Date(Date.now() - 86400000).toISOString()),
        supabase
          .from("feed_posts")
          .select("id", { count: "exact", head: true })
          .gte("created_at", new Date(Date.now() - 86400000).toISOString()),
        supabase.from("user_consents").select("id", { count: "exact", head: true }),
        supabase
          .from("user_moderation")
          .select("user_id", { count: "exact", head: true })
          .in("status", ["banned", "suspended"]),
      ]);
      return {
        appealsPending: appealsPending.count ?? 0,
        contactsNew: contactsNew.count ?? 0,
        contactsUnread: contactsUnread.count ?? 0,
        usersTotal: usersTotal.count ?? 0,
        notices: notices.count ?? 0,
        materials: materials.count ?? 0,
        sessionsToday: sessionsToday.count ?? 0,
        feedToday: feedToday.count ?? 0,
        consents: consents.count ?? 0,
        banned: banned.count ?? 0,
      };
    },
  });

  const activityQuery = useQuery({
    queryKey: ["admin-center-recent-activity"],
    enabled: isFullAdmin,
    queryFn: () => recentAuditFn({ data: { page: 1 } }),
  });

  const workQueueQuery = useQuery({
    queryKey: ["admin-center-work-queue"],
    enabled: isFullAdmin,
    queryFn: async () => {
      const [testsResult, awardsResult, verificationsResult] = await Promise.allSettled([
        listTestsFn(),
        listAwardRequestsFn(),
        (
          supabase as unknown as {
            rpc: (name: string) => PromiseLike<{ data: unknown; error: unknown }>;
          }
        ).rpc("admin_list_pending_account_verifications"),
      ]);
      const tests = testsResult.status === "fulfilled" ? testsResult.value : null;
      const awards = awardsResult.status === "fulfilled" ? awardsResult.value : null;
      const verificationData =
        verificationsResult.status === "fulfilled" && !verificationsResult.value.error
          ? verificationsResult.value.data
          : null;
      return {
        tests: Array.isArray(tests) ? tests.filter(isPendingTest).length : null,
        awards: Array.isArray(awards) ? awards.length : null,
        verifications: Array.isArray(verificationData) ? verificationData.length : null,
      };
    },
  });

  if (!loading && !isAdmin) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <h1 className="font-display text-xl font-bold">Admins only</h1>
          <p className="mt-1 text-sm text-muted-foreground">You do not have admin access.</p>
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Back to dashboard
          </button>
        </div>
      </AppShell>
    );
  }

  const d = q.data;
  const workItems = [
    {
      label: "Moderation appeals",
      count: d?.appealsPending,
      href: "/admin/appeals",
      icon: Scale,
      visible: hasPermission("appeals"),
    },
    {
      label: "New contact messages",
      count: d?.contactsNew,
      href: "/admin/contact",
      icon: Mail,
      visible: hasPermission("contact"),
    },
    ...(isFullAdmin
      ? [
          {
            label: "Account verifications",
            count: workQueueQuery.data?.verifications,
            href: "/admin/verification",
            icon: ShieldCheck,
            visible: true,
          },
          {
            label: "Certificate requests",
            count: workQueueQuery.data?.awards,
            href: "/admin/certificates",
            icon: Award,
            visible: true,
          },
          {
            label: "Test approvals",
            count: workQueueQuery.data?.tests,
            href: "/admin/tests/approvals",
            icon: BookOpen,
            visible: true,
          },
        ]
      : []),
  ].filter((item) => item.visible);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Admin Center</h1>
          <p className="text-sm text-muted-foreground">
            Overview of everything happening across the platform.
          </p>
        </div>

        {isFullAdmin && <ConsentEnabledCard />}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Kpi label="Appeals pending" value={d?.appealsPending} accent="amber" icon={Scale} />
          <Kpi label="New contacts" value={d?.contactsNew} accent="blue" icon={Mail} />
          <Kpi label="Unread contacts" value={d?.contactsUnread} accent="blue" icon={Mail} />
          <Kpi label="Total users" value={d?.usersTotal} icon={Users} />
          <Kpi label="Banned/suspended" value={d?.banned} accent="red" icon={ShieldAlert} />
          <Kpi label="Sessions (24h)" value={d?.sessionsToday} icon={Activity} />
          <Kpi label="New posts (24h)" value={d?.feedToday} icon={MessageSquare} />
          <Kpi label="Notices" value={d?.notices} icon={Megaphone} />
          <Kpi label="Materials" value={d?.materials} icon={BookOpen} />
          <Kpi label="Consents captured" value={d?.consents} icon={FileText} />
        </div>

        <section className="rounded-2xl border border-border bg-card/80 p-4 shadow-soft backdrop-blur-xl sm:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold">Action center</h2>
              <p className="text-xs text-muted-foreground">
                Pending work available to your current access level.
              </p>
            </div>
            {workItems.length === 0 && (
              <span className="text-xs text-muted-foreground">
                No queues assigned to this role.
              </span>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {workItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href as never}
                  className="group flex min-w-0 items-center gap-3 rounded-xl border border-border/80 bg-background/70 p-3 transition hover:border-primary/40 hover:bg-muted/60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{item.label}</span>
                    <span className="text-xs text-muted-foreground">Open queue</span>
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-sm font-bold tabular-nums">
                    {item.count ?? "—"}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {isFullAdmin && (
          <section className="rounded-2xl border border-border bg-card/80 p-4 shadow-soft backdrop-blur-xl sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-semibold">Recent admin activity</h2>
                <p className="text-xs text-muted-foreground">
                  Latest audited actions across the workspace.
                </p>
              </div>
              <Link
                to="/admin/audit"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Open audit log <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
              </Link>
            </div>
            {activityQuery.isLoading ? (
              <p className="py-5 text-center text-sm text-muted-foreground">Loading activity…</p>
            ) : (
              <div className="divide-y divide-border">
                {(activityQuery.data?.rows ?? []).slice(0, 6).map((row) => (
                  <div
                    key={row.id}
                    className="flex min-w-0 flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {row.action.replaceAll(".", " · ")}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.actor_email ?? "System"}
                        {row.target_email ? ` → ${row.target_email}` : ""}
                      </p>
                    </div>
                    <time
                      className="shrink-0 text-[11px] text-muted-foreground"
                      dateTime={row.created_at}
                    >
                      {new Date(row.created_at).toLocaleString()}
                    </time>
                  </div>
                ))}
                {!activityQuery.data?.rows.length && !activityQuery.isError && (
                  <p className="py-5 text-center text-sm text-muted-foreground">
                    No recent audit activity.
                  </p>
                )}
                {activityQuery.isError && (
                  <p className="py-4 text-sm text-destructive">
                    Recent activity is temporarily unavailable.
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {hasPermission("appeals") && (
            <AdminLink
              to="/admin/appeals"
              label="Appeals"
              desc="Review moderation appeals"
              icon={Scale}
              badge={d?.appealsPending}
            />
          )}
          {hasPermission("contact") && (
            <AdminLink
              to="/admin/contact"
              label="Contact inbox"
              desc="Reply to user messages"
              icon={Mail}
              badge={d?.contactsNew}
            />
          )}
          {hasPermission("users") && (
            <AdminLink
              to="/admin/users"
              label="Users"
              desc={isFullAdmin ? "Manage / ban / role" : "Suspend / ban only"}
              icon={Users}
            />
          )}
          {isFullAdmin && (
            <AdminLink
              to="/admin/verification"
              label="Account Verification"
              desc="Verify new user accounts"
              icon={ShieldCheck}
            />
          )}
          {isFullAdmin && (
            <AdminLink
              to="/admin/email"
              label="Email Center"
              desc="Send email to users"
              icon={Mail}
            />
          )}
          {hasPermission("notifications") && (
            <AdminLink
              to="/admin/notifications"
              label="Notifications"
              desc="Broadcast to everyone"
              icon={Bell}
            />
          )}
          {hasPermission("notices") && (
            <AdminLink
              to="/admin/notices"
              label="Notice board"
              desc="Post announcements"
              icon={Megaphone}
            />
          )}
          {isFullAdmin && (
            <AdminLink
              to="/admin/materials"
              label="Materials"
              desc="Manage study material"
              icon={BookOpen}
            />
          )}
          {hasPermission("certificates") && (
            <AdminLink
              to="/admin/certificates"
              label="Certificates"
              desc="Issue & manage certs"
              icon={Award}
            />
          )}
          {isFullAdmin && (
            <AdminLink
              to="/admin/consent-settings"
              label="Consent settings"
              desc="Turn the verification step on or off"
              icon={ShieldCheck}
            />
          )}
          {hasPermission("consents") && (
            <AdminLink
              to="/admin/consents"
              label="Captured consents"
              desc="View user verification data"
              icon={FileText}
              badge={d?.consents}
            />
          )}
          {hasPermission("community") && (
            <AdminLink
              to="/admin/community"
              label="Community groups"
              desc="WhatsApp links"
              icon={MessageSquare}
            />
          )}
          {hasPermission("pro") && (
            <AdminLink
              to="/admin/pro"
              label="Pro members"
              desc="Grant / revoke Pro membership"
              icon={Crown}
            />
          )}
          {isFullAdmin && (
            <AdminLink
              to="/admin/scheduled-tests"
              label="Scheduled tests"
              desc="Auto-generated test runs, retries & dates"
              icon={CalendarClock}
            />
          )}
          {isFullAdmin && (
            <AdminLink
              to="/admin/moderators"
              label="Moderators"
              desc="Create & manage limited-access admins"
              icon={UserCog}
            />
          )}
          {isFullAdmin && (
            <AdminLink
              to="/admin/security"
              label="Security"
              desc="Events & blocked IPs"
              icon={ShieldAlert}
            />
          )}
          {isFullAdmin && (
            <AdminLink
              to="/admin/audit"
              label="Audit log"
              desc="Every action recorded"
              icon={FileText}
            />
          )}
          {isFullAdmin && (
            <AdminLink
              to="/admin/system"
              label="System Control Center"
              desc="API credentials & system settings"
              icon={Settings2}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string | null | undefined;
  icon: LucideIcon;
  accent?: "amber" | "blue" | "red";
}) {
  const tone =
    accent === "amber"
      ? "text-amber-600 dark:text-amber-400"
      : accent === "blue"
        ? "text-blue-600 dark:text-blue-400"
        : accent === "red"
          ? "text-red-600 dark:text-red-400"
          : "text-accent";
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <div className="mt-1 font-display text-2xl font-bold">{value ?? "—"}</div>
    </div>
  );
}

function AdminLink({
  to,
  label,
  desc,
  icon: Icon,
  badge,
}: {
  to: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  badge?: number | null;
}) {
  return (
    <Link
      to={to as never}
      className="group flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:bg-muted"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{label}</span>
            {badge ? (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {badge}
              </span>
            ) : null}
          </div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition" />
    </Link>
  );
}

/** Inline on/off switch so admins can disable the consent step without leaving this page. */
function ConsentEnabledCard() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-consent-enabled"],
    queryFn: async () => {
      const { data } = await supabase
        .from("consent_settings")
        .select("consent_enabled")
        .eq("id", 1)
        .maybeSingle();
      return { enabled: data?.consent_enabled ?? true };
    },
  });
  const m = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from("consent_settings")
        .update({ consent_enabled: enabled, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (error) throw error;
      return enabled;
    },
    onSuccess: (enabled) => {
      qc.invalidateQueries({ queryKey: ["admin-consent-enabled"] });
      qc.invalidateQueries({ queryKey: ["consent-skipped-banner"] });
      toast.success(
        enabled
          ? "Consent form is ON for new users"
          : "Consent form is OFF — new users skip verification",
      );
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Could not update"),
  });

  const enabled = q.data?.enabled ?? true;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <div className="font-semibold">Consent form for new users</div>
          <div className="text-xs text-muted-foreground">
            {enabled
              ? "New users must complete device, network and GPS verification."
              : 'Verification is skipped — users see a clear "nothing was collected" notice.'}
          </div>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Toggle consent form for new users"
        disabled={q.isLoading || m.isPending}
        onClick={() => m.mutate(!enabled)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition disabled:opacity-50 ${enabled ? "border-primary bg-primary" : "border-border bg-muted"}`}
      >
        <span
          className={`ml-0.5 block h-5 w-5 rounded-full bg-card shadow-soft transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}
