import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Scale, Mail, Award, MessageSquare, Clock, Flame, ShieldCheck, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/my-activity")({
  head: () => ({ meta: [
      { name: "description", content: "Review your personal study and community activity." },
      { property: "og:title", content: "My Activity — JEE Prep Hub" },
      { property: "og:description", content: "Review your personal study and community activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "My Activity — JEE Prep Hub" },
      { name: "twitter:description", content: "Review your personal study and community activity." },
{ title: "My Activity — JEE Prep Hub" }, { name: "robots", content: "noindex" }] }),
  component: MyActivity,
});

function MyActivity() {
  const { user } = Route.useRouteContext();
  const uid = user.id;

  const q = useQuery({
    queryKey: ["my-activity", uid],
    queryFn: async () => {
      const [appeals, contacts, certs, dms, sessions, consent] = await Promise.all([
        supabase.from("moderation_appeals").select("id,status,created_at,message,admin_response").eq("user_id", uid).order("created_at", { ascending: false }).limit(10),
        supabase.from("contact_messages").select("id,subject,status,created_at,admin_reply").eq("user_id", uid).order("created_at", { ascending: false }).limit(10),
        supabase.from("user_certificates").select("id,verification_code,awarded_at,certificate_types(name)").eq("user_id", uid).order("awarded_at", { ascending: false }).limit(10),
        supabase.from("direct_messages").select("id", { count: "exact", head: true }).eq("recipient_id", uid),
        supabase.from("study_sessions").select("duration_seconds").eq("user_id", uid),
        supabase.from("user_consents").select("id,consented_at").eq("user_id", uid).maybeSingle(),
      ]);
      const totalSec = (sessions.data ?? []).reduce((a: number, r: any) => a + (r.duration_seconds ?? 0), 0);
      return {
        appeals: appeals.data ?? [],
        contacts: contacts.data ?? [],
        certs: certs.data ?? [],
        dmCount: dms.count ?? 0,
        totalHours: Math.round(totalSec / 3600),
        consent: consent.data,
      };
    },
  });

  const d = q.data;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">My Activity</h1>
          <p className="text-sm text-muted-foreground">Everything about your account in one place.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={Clock} label="Total hours" value={`${d?.totalHours ?? 0}h`} />
          <Stat icon={Award} label="Certificates" value={String(d?.certs.length ?? 0)} />
          <Stat icon={MessageSquare} label="DMs received" value={String(d?.dmCount ?? 0)} />
          <Stat icon={ShieldCheck} label="Consent" value={d?.consent ? "Given" : "Pending"} />
        </div>

        {!d?.consent && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">Complete your consent & profile details</div>
                <p className="mt-0.5 text-sm text-muted-foreground">Share your details securely to unlock verification and personalized features.</p>
              </div>
              <Link to="/consent" className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
                Open <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        <Section title="My appeals" icon={Scale} link="/appeal" linkLabel="New appeal">
          {d?.appeals.length ? (
            <ul className="divide-y divide-border">
              {d.appeals.map((a: any) => (
                <li key={a.id} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      <StatusPill status={a.status} />
                    </span>
                    <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm">{a.message}</p>
                  {a.admin_response && <p className="mt-1 text-xs text-muted-foreground"><b>Admin:</b> {a.admin_response}</p>}
                </li>
              ))}
            </ul>
          ) : <Empty text="No appeals filed." />}
        </Section>

        <Section title="Contact tickets" icon={Mail} link="/contact" linkLabel="New message">
          {d?.contacts.length ? (
            <ul className="divide-y divide-border">
              {d.contacts.map((c: any) => (
                <li key={c.id} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{c.subject}</span>
                    <StatusPill status={c.status} />
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</div>
                  {c.admin_reply && <p className="mt-1 text-xs text-muted-foreground"><b>Reply:</b> {c.admin_reply.slice(0, 140)}</p>}
                </li>
              ))}
            </ul>
          ) : <Empty text="No tickets yet." />}
        </Section>

        <Section title="Certificates" icon={Award} link="/certificates" linkLabel="View all">
          {d?.certs.length ? (
            <ul className="divide-y divide-border">
              {d.certs.map((c: any) => (
                <li key={c.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium">{c.certificate_types?.name ?? "Certificate"}</div>
                    <div className="text-xs text-muted-foreground">Code: {c.verification_code}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(c.awarded_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : <Empty text="No certificates yet." />}
        </Section>

        <div className="grid gap-3 sm:grid-cols-3">
          <QuickLink to="/dashboard" label="Study dashboard" icon={Flame} />
          <QuickLink to="/messages" label="Inbox" icon={MessageSquare} />
          <QuickLink to="/profile" label="My profile" icon={ShieldCheck} />
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <div className="mt-1 font-display text-xl font-bold">{value}</div>
    </div>
  );
}

function Section({ title, icon: Icon, link, linkLabel, children }: any) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold"><Icon className="h-4 w-4 text-accent" /> {title}</h2>
        {link && <Link to={link} className="text-xs font-medium text-accent hover:underline">{linkLabel} →</Link>}
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) { return <p className="py-3 text-sm text-muted-foreground">{text}</p>; }

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600",
    new: "bg-blue-500/10 text-blue-600",
    in_progress: "bg-blue-500/10 text-blue-600",
    approved: "bg-emerald-500/10 text-emerald-600",
    resolved: "bg-emerald-500/10 text-emerald-600",
    rejected: "bg-red-500/10 text-red-600",
    closed: "bg-muted text-muted-foreground",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${map[status] ?? "bg-muted text-muted-foreground"}`}>{status.replace("_", " ")}</span>;
}

function QuickLink({ to, label, icon: Icon }: any) {
  return (
    <Link to={to} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 hover:bg-muted">
      <span className="flex items-center gap-2 text-sm font-medium"><Icon className="h-4 w-4 text-accent" /> {label}</span>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
