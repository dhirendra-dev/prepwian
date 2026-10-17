import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/lib/admin-guard";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  MapPin,
  Smartphone,
  Globe,
  User,
  GraduationCap,
  ShieldCheck,
  Clock3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Phone,
  CalendarDays,
  School,
  Users,
  MonitorSmartphone,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/consents")({
  head: () => ({
    meta: [
      { title: "Verification Center — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),

  beforeLoad: async ({ context }) => {
    await requirePermission(context.user.id, "consents");
  },

  component: AdminConsents,
});

type ReviewState = "pending" | "approved";

function AdminConsents() {
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const [reviewStates, setReviewStates] = useState<
    Record<string, ReviewState>
  >({});

  const [approvingId, setApprovingId] =
    useState<string | null>(null);

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-consents"],

    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "admin_get_consents_decrypted"
      );

      if (error) throw error;

      const rows = data ?? [];

      const ids = Array.from(
        new Set(rows.map((r: any) => r.user_id))
      );

      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", ids);

        const map = new Map(
          (profs ?? []).map((p: any) => [
            p.id,
            p,
          ])
        );

        rows.forEach((r: any) => {
          r._profile = map.get(r.user_id);
        });
      }

      return rows as any[];
    },
  });

  const filtered = useMemo(() => {
    if (!q.trim()) return data ?? [];

    const s = q.toLowerCase().trim();

    return (data ?? []).filter((r: any) =>
      [
        r.full_name,
        r._profile?.full_name,
        r.phone,
        r.city,
        r.state,
        r.school,
        r.class_level,
        r.ip_country,
        r.user_id,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(s)
        )
    );
  }, [data, q]);

  const pendingCount = (data ?? []).filter(
    (r: any) =>
      reviewStates[r.id] !== "approved"
  ).length;

  const approvedCount = (data ?? []).filter(
    (r: any) =>
      reviewStates[r.id] === "approved"
  ).length;

  const approveAccount = async (
    userId: string,
    consentId: string
  ) => {
    if (approvingId) return;

    const confirmed = window.confirm(
      "Approve this verification and restore normal account access?"
    );

    if (!confirmed) return;

    setApprovingId(consentId);

    try {
      const { data: result, error } =
        await supabase.rpc(
          "admin_approve_account_restriction",
          {
            _user_id: userId,
          }
        );

      if (error) {
        console.error(
          "[AdminConsents] Approval failed:",
          error
        );

        window.alert(
          error.message ||
            "Unable to approve this account."
        );

        return;
      }

      console.log(
        "[AdminConsents] Account approved:",
        result
      );

      setReviewStates((previous) => ({
        ...previous,
        [consentId]: "approved",
      }));
    } catch (error) {
      console.error(
        "[AdminConsents] Unexpected approval error:",
        error
      );

      window.alert(
        "Something went wrong while approving this account."
      );
    } finally {
      setApprovingId(null);
    }
  };
    return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">

        {/* Header */}
        <div className="mb-6 overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
          <div className="relative p-5 sm:p-7">

            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-20 left-20 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <div className="mb-2 flex items-center gap-2">

                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>

                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                    Admin
                  </span>

                </div>

                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  Verification Center
                </h1>

                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Review submitted account verification information before restoring access.
                </p>
              </div>

              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    isFetching ? "animate-spin" : ""
                  }`}
                />

                Refresh
              </button>

            </div>

            {/* Statistics */}
            <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">

              <StatCard
                icon={FileText}
                label="Submissions"
                value={data?.length ?? 0}
              />

              <StatCard
                icon={Clock3}
                label="Pending review"
                value={pendingCount}
              />

              <StatCard
                icon={CheckCircle2}
                label="Approved this session"
                value={approvedCount}
              />

            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-5 rounded-2xl border border-border bg-card p-3 shadow-soft sm:p-4">

          <div className="relative">

            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, phone, city, school, class or user ID..."
              className="h-11 rounded-xl border-border bg-background pl-10"
            />

          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-soft">

            <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />

            <p className="mt-3 text-sm text-muted-foreground">
              Loading verification submissions...
            </p>

          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">

            <div className="font-semibold">
              Failed to load verification records
            </div>

            <div className="mt-1">
              {(error as Error).message}
            </div>

          </div>
        )}

        {/* Empty */}
        {!isLoading &&
          !error &&
          !filtered.length && (
            <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-soft">

              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />

              <h2 className="mt-3 font-semibold">
                No verification submissions
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                No records match your current search.
              </p>

            </div>
          )}

        {/* Records */}
        {!isLoading &&
          !error &&
          filtered.length > 0 && (
            <div className="space-y-4">

              {filtered.map((c: any) => {

                const isOpen = openId === c.id;

                const status =
                  reviewStates[c.id] ?? "pending";

                const isApproving =
                  approvingId === c.id;

                return (
                  <article
                    key={c.id}
                    className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:shadow-md"
                  >

                    {/* Applicant summary */}
                    <button
                      type="button"
                      onClick={() =>
                        setOpenId(
                          isOpen ? null : c.id
                        )
                      }
                      className="w-full p-4 text-left sm:p-5"
                    >

                      <div className="flex items-start gap-3">

                        {/* Avatar */}
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary">

                          {c._profile?.avatar_url ? (
                            <img
                              src={c._profile.avatar_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5" />
                          )}

                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                            <div className="min-w-0">

                              <h2 className="truncate text-base font-bold sm:text-lg">
                                {c.full_name ||
                                  c._profile?.full_name ||
                                  "Unnamed applicant"}
                              </h2>

                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">

                                {c.phone && (
                                  <span className="inline-flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {c.phone}
                                  </span>
                                )}

                                {c.city && (
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {c.city}
                                    {c.state
                                      ? `, ${c.state}`
                                      : ""}
                                  </span>
                                )}

                                {c.class_level && (
                                  <span className="inline-flex items-center gap-1">
                                    <GraduationCap className="h-3 w-3" />
                                    Class {c.class_level}
                                  </span>
                                )}

                              </div>

                            </div>

                            <div className="flex items-center gap-2">

                              <StatusBadge
                                status={status}
                              />

                              <span className="hidden h-8 w-8 items-center justify-center rounded-lg bg-muted sm:flex">

                                {isOpen ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}

                              </span>

                            </div>

                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">

                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">

                              <CalendarDays className="h-3 w-3" />

                              {c.consented_at
                                ? new Date(
                                    c.consented_at
                                  ).toLocaleString(
                                    undefined,
                                    {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    }
                                  )
                                : "Unknown time"}

                            </span>

                            {c.school && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">

                                <School className="h-3 w-3" />

                                {c.school}

                              </span>
                            )}

                            {c.ip_country && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">

                                <Globe className="h-3 w-3" />

                                {c.ip_country}

                              </span>
                            )}

                          </div>

                        </div>

                      </div>

                    </button>

                    {/* Expanded review */}
                    {isOpen && (
                      <div className="border-t border-border bg-muted/10 p-4 sm:p-5">

                        {/* Review status */}
                        <div
                          className={`mb-4 rounded-2xl border p-4 ${
                            status === "approved"
                              ? "border-emerald-500/20 dark:border-emerald-400/30 bg-emerald-500/10 dark:bg-emerald-400/15"
                              : "border-amber-500/20 dark:border-amber-400/30 bg-amber-500/10 dark:bg-amber-400/15"
                          }`}
                        >

                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                            <div className="flex items-start gap-3">

                              {status === "approved" ? (
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500 dark:text-emerald-400" />
                              ) : (
                                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-500 dark:text-amber-400" />
                              )}

                              <div>

                                <div className="font-semibold">
                                  {status === "approved"
                                    ? "Approved"
                                    : "Pending admin review"}
                                </div>

                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {status === "approved"
                                    ? "Access restoration has been approved."
                                    : "Review the submitted information before restoring account access."}
                                </p>

                              </div>

                            </div>

                            {status !== "approved" && (
                              <button
                                type="button"
                                disabled={isApproving}
                                onClick={() =>
                                  approveAccount(
                                    c.user_id,
                                    c.id
                                  )
                                }
                                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                              >

                                {isApproving ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Approving...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Approve & Restore Access
                                  </>
                                )}

                              </button>
                            )}

                          </div>

                        </div>

                        {/* Information grid */}
                        <div className="grid gap-4 lg:grid-cols-2">
                                                    <Section
                            icon={User}
                            title="Profile"
                          >
                            <Row
                              k="Full name"
                              v={c.full_name}
                            />

                            <Row
                              k="Phone"
                              v={c.phone}
                            />

                            <Row
                              k="Date of birth"
                              v={c.dob}
                            />

                            <Row
                              k="Address"
                              v={c.address_line}
                            />

                            <Row
                              k="City"
                              v={c.city}
                            />

                            <Row
                              k="State"
                              v={c.state}
                            />

                            <Row
                              k="Pincode"
                              v={c.pincode}
                            />
                          </Section>

                          <Section
                            icon={GraduationCap}
                            title="Student & Guardian"
                          >
                            <Row
                              k="Class"
                              v={c.class_level}
                            />

                            <Row
                              k="School / coaching"
                              v={c.school}
                            />

                            <Row
                              k="Parent / guardian"
                              v={c.parent_name}
                            />

                            <Row
                              k="Parent phone"
                              v={c.parent_phone}
                            />
                          </Section>

                          <Section
                            icon={MonitorSmartphone}
                            title="Device & Browser"
                          >
                            <Row
                              k="OS"
                              v={c.os}
                            />

                            <Row
                              k="Browser"
                              v={c.browser}
                            />

                            <Row
                              k="Platform"
                              v={c.platform}
                            />

                            <Row
                              k="Language"
                              v={c.language}
                            />

                            <Row
                              k="Timezone"
                              v={c.timezone}
                            />

                            <Row
                              k="Screen"
                              v={c.screen_size}
                            />

                            <Row
                              k="DPR"
                              v={c.device_pixel_ratio}
                            />

                            <Row
                              k="User agent"
                              v={c.user_agent}
                            />
                          </Section>

                          <Section
                            icon={Globe}
                            title="Network / IP"
                          >
                            <Row
                              k="IP address"
                              v={c.ip_address}
                            />

                            <Row
                              k="City"
                              v={c.ip_city}
                            />

                            <Row
                              k="Region"
                              v={c.ip_region}
                            />

                            <Row
                              k="Country"
                              v={c.ip_country}
                            />

                            <Row
                              k="ISP"
                              v={c.ip_isp}
                            />
                          </Section>

                          <Section
                            icon={MapPin}
                            title="GPS Verification"
                          >
                            <Row
                              k="Latitude"
                              v={c.gps_latitude}
                            />

                            <Row
                              k="Longitude"
                              v={c.gps_longitude}
                            />

                            <Row
                              k="Accuracy"
                              v={
                                c.gps_accuracy !== null &&
                                c.gps_accuracy !== undefined
                                  ? `${c.gps_accuracy} m`
                                  : null
                              }
                            />

                            {c.gps_latitude !== null &&
                              c.gps_latitude !== undefined &&
                              c.gps_longitude !== null &&
                              c.gps_longitude !== undefined && (
                                <a
                                  href={`https://www.google.com/maps?q=${c.gps_latitude},${c.gps_longitude}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary underline"
                                >
                                  Open location
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                          </Section>

                          <Section
                            icon={Users}
                            title="Submission"
                          >
                            <Row
                              k="Consent purpose"
                              v={c.purpose}
                            />

                            <Row
                              k="Consent version"
                              v={c.consent_version}
                            />

                            <Row
                              k="Submitted"
                              v={
                                c.consented_at
                                  ? new Date(
                                      c.consented_at
                                    ).toLocaleString()
                                  : null
                              }
                            />
                          </Section>
                        </div>

                        {/* User ID */}
                        <div className="mt-4 rounded-xl border border-border bg-background p-3">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            User ID
                          </div>

                          <code className="mt-1 block break-all text-[11px]">
                            {c.user_id}
                          </code>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
      </div>
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/70 p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>

      <div className="mt-2 text-2xl font-bold tracking-tight">
        {value}
      </div>
    </div>
  );
}
function StatusBadge({
  status,
}: {
  status: ReviewState;
}) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 dark:bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        Approved
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 dark:bg-amber-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
      <Clock3 className="h-3 w-3" />
      Pending Review
    </span>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>

        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      </div>

      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

function Row({
  k,
  v,
}: {
  k: string;
  v: any;
}) {
  if (
    v === null ||
    v === undefined ||
    v === ""
  ) {
    return null;
  }

  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <span className="shrink-0 text-xs text-muted-foreground">
        {k}
      </span>

      <span className="max-w-[70%] break-all text-right text-xs font-semibold">
        {String(v)}
      </span>
    </div>
  );
}
