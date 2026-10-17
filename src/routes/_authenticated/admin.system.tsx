import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SiteDiagnosisCard } from "@/components/SiteDiagnosisCard";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Plus,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import {
  adminDeleteSystemSecret,
  adminListSystemSecrets,
  adminSaveSystemSecret,
} from "@/lib/system-control.functions";

export const Route = createFileRoute("/_authenticated/admin/system")({
  head: () => ({ meta: [{ title: "System Control Center — JEE Prep Hub" }] }),
  ssr: false,
  beforeLoad: async ({ context }) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: SystemControlCenter,
});

const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google_gemini", label: "Google Gemini" },
  { value: "groq", label: "Groq" },
  { value: "custom", label: "Custom provider" },
] as const;

type Provider = (typeof PROVIDERS)[number]["value"];

type SystemSecretRow = {
  id: string;
  provider: string;
  label: string;
  key_hint: string | null;
  updated_at: string | null;
};

function SystemControlCenter() {
  const qc = useQueryClient();
  const [provider, setProvider] = useState<Provider>("openai");
  const [label, setLabel] = useState("Primary key");
  const [secret, setSecret] = useState("");
  const [showForm, setShowForm] = useState(false);
  const secrets = useQuery({
    queryKey: ["admin-system-secrets"],
    queryFn: () => adminListSystemSecrets(),
    retry: false,
  });

  const save = useMutation({
    mutationFn: () => adminSaveSystemSecret({ data: { provider, label, secret } }),
    onSuccess: () => {
      setSecret("");
      setShowForm(false);
      toast.success("Encrypted integration credential saved");
      qc.invalidateQueries({ queryKey: ["admin-system-secrets"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteSystemSecret({ data: { id } }),
    onSuccess: () => {
      toast.success("Credential removed");
      qc.invalidateQueries({ queryKey: ["admin-system-secrets"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = (secrets.data?.rows ?? []) as SystemSecretRow[];
  return (
    <AppShell>
      <main className="mx-auto max-w-6xl space-y-6 px-4 pb-12">
        <nav className="flex flex-wrap gap-2" aria-label="Admin navigation">
          <Link
            to="/admin"
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
          >
            Overview
          </Link>
          <Link
            to="/admin/users"
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
          >
            Users
          </Link>
          <Link
            to="/admin/audit"
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
          >
            Audit log
          </Link>
          <Link
            to="/admin/security"
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
          >
            Security
          </Link>
          <span className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
            System control
          </span>
        </nav>

        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> Full-admin area
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              System Control Center
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              A central place for sensitive integrations and platform diagnostics. Configuration is
              stored server-side, not in browser storage.
            </p>
          </div>
          <Button variant="outline" onClick={() => secrets.refetch()} disabled={secrets.isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${secrets.isFetching ? "animate-spin" : ""}`} />
            Refresh status
          </Button>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            icon={<KeyRound className="h-4 w-4" />}
            label="Saved integrations"
            value={secrets.isLoading ? "…" : String(rows.length)}
          />
          <Metric
            icon={<LockKeyhole className="h-4 w-4" />}
            label="Secret storage"
            value={secrets.data?.encryptionConfigured ? "Configured" : "Needs setup"}
          />
          <Metric
            icon={<Users className="h-4 w-4" />}
            label="Account controls"
            value="Existing admin tools"
          />
          <Metric icon={<Activity className="h-4 w-4" />} label="Audit trail" value="Enabled" />
        </section>
        <SiteDiagnosisCard advanced />

        {!secrets.data?.encryptionConfigured && !secrets.isLoading && (
          <div className="flex gap-3 rounded-xl border border-amber-500/40 dark:border-amber-300/40 bg-amber-500/5 dark:bg-amber-500/10 p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold">Encryption key required before saving credentials</p>
              <p className="mt-1 text-muted-foreground">
                Set <code>SYSTEM_SETTINGS_ENCRYPTION_KEY</code> in the server deployment
                environment. It must be base64 encoding of exactly 32 random bytes. Never commit it
                to GitHub.
              </p>
            </div>
          </div>
        )}

        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <KeyRound className="h-5 w-5" /> API & integration credentials
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Secrets are encrypted before database storage. Existing values are never returned to
                the browser.
              </p>
            </div>
            <Button onClick={() => setShowForm((v) => !v)}>
              <Plus className="mr-2 h-4 w-4" />
              {showForm ? "Cancel" : "Add credential"}
            </Button>
          </div>
          {showForm && (
            <form
              className="mt-5 grid gap-4 rounded-lg border border-border p-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <label className="grid gap-1.5 text-sm">
                Provider
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as Provider)}
                  className="h-10 rounded-md border border-input bg-background px-3"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm">
                Label
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder="Primary key"
                />
              </label>
              <label className="grid gap-1.5 text-sm md:col-span-2">
                API key / secret
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  required
                  minLength={8}
                  maxLength={8192}
                  placeholder="Paste secret here"
                />
              </label>
              <p className="text-xs text-muted-foreground md:col-span-2">
                The secret is write-only here. To rotate it, save a replacement with the same
                provider and label. Do not paste Supabase service-role keys into a provider slot.
              </p>
              <div className="flex justify-end md:col-span-2">
                <Button
                  type="submit"
                  disabled={
                    save.isPending ||
                    !secrets.data?.encryptionConfigured ||
                    secret.trim().length < 8
                  }
                >
                  {save.isPending ? "Encrypting and saving…" : "Save securely"}
                </Button>
              </div>
            </form>
          )}
          <div className="mt-5 space-y-2">
            <div className="space-y-2 sm:hidden">
              {secrets.isLoading && (
                <div className="rounded-xl border border-border p-5 text-center text-sm text-muted-foreground">
                  Loading secure settings…
                </div>
              )}
              {!secrets.isLoading && rows.length === 0 && (
                <div className="rounded-xl border border-border p-5 text-center text-sm text-muted-foreground">
                  No credentials saved yet.
                </div>
              )}
              {rows.map((row) => (
                <article
                  key={`mobile-${row.id}`}
                  className="rounded-xl border border-border bg-background/60 p-3"
                >
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {PROVIDERS.find((provider) => provider.value === row.provider)?.label ??
                          row.provider}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{row.label}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-mono text-[10px]">
                      {row.key_hint ?? "••••"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                    <time
                      className="text-[10px] text-muted-foreground"
                      dateTime={row.updated_at ?? undefined}
                    >
                      {row.updated_at ? new Date(row.updated_at).toLocaleString() : "Not updated"}
                    </time>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={remove.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remove ${row.label} for ${row.provider}? This cannot be undone.`,
                          )
                        )
                          remove.mutate(row.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-3 font-medium">Provider</th>
                    <th className="py-3 pr-3 font-medium">Label</th>
                    <th className="py-3 pr-3 font-medium">Stored key</th>
                    <th className="py-3 pr-3 font-medium">Updated</th>
                    <th className="py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {secrets.isLoading && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Loading secure settings…
                      </td>
                    </tr>
                  )}
                  {!secrets.isLoading && rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No credentials saved yet.
                      </td>
                    </tr>
                  )}
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="py-3 pr-3 font-medium">
                        {PROVIDERS.find((p) => p.value === row.provider)?.label ?? row.provider}
                      </td>
                      <td className="py-3 pr-3">{row.label}</td>
                      <td className="py-3 pr-3 font-mono text-xs">{row.key_hint ?? "••••"}</td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground">
                        {row.updated_at ? new Date(row.updated_at).toLocaleString() : "—"}
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={remove.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Remove ${row.label} for ${row.provider}? This cannot be undone.`,
                              )
                            )
                              remove.mutate(row.id);
                          }}
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Note: this page securely stores credentials centrally. Existing AI features must be
            explicitly migrated to read these secrets through trusted server functions before they
            will use a newly saved key.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <InfoCard
            icon={<Users className="h-5 w-5" />}
            title="Account management"
            description="Use the existing Users and Security pages for account lookup, moderation, session controls, and supported deletion workflows."
            links={[
              { label: "Manage users", to: "/admin/users" },
              { label: "Security controls", to: "/admin/security" },
            ]}
          />
          <InfoCard
            icon={<ServerCog className="h-5 w-5" />}
            title="Operations & audit"
            description="Use the existing audit page for recorded administrative and authentication events. Additional system actions should be instrumented before they are presented as monitored."
            links={[{ label: "Open audit log", to: "/admin/audit" }]}
          />
        </section>
        {secrets.isError && (
          <p role="alert" className="text-sm text-destructive">
            Could not load system settings. Confirm the migration is applied, the encryption
            environment variable is set, and your account has the full admin role. Details:{" "}
            {(secrets.error as Error).message}
          </p>
        )}
        <div className="flex items-start gap-2 rounded-lg border border-border p-3 text-xs text-muted-foreground">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          Secret values are write-only. Access checks are enforced again on the server for every
          operation.
        </div>
      </main>
    </AppShell>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-3 text-lg font-semibold">{value}</p>
    </div>
  );
}
function InfoCard({
  icon,
  title,
  description,
  links,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  links: { label: string; to: "/admin/users" | "/admin/security" | "/admin/audit" }[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 font-semibold">
        {icon}
        {title}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {links.map((link) => (
          <Button key={link.to} variant="outline" size="sm" asChild>
            <Link to={link.to}>{link.label}</Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
