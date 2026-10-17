import {
  createFileRoute,
} from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { requireFullAdmin } from "@/lib/admin-guard";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  UserCheck,
  Clock,
  Search,
  Mail,
  ArrowLeft,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/admin/verification",
)({
  head: () => ({
    meta: [
      {
        title: "Admin · Account Verification — JEE Prep Hub",
      },
      {
        name: "robots",
        content: "noindex,nofollow",
      },
    ],
  }),

  ssr: false,

  beforeLoad: async ({ context }) => {
    await requireFullAdmin(context.user.id);
  },

  component: AdminVerification,
});

type VerificationRow = {
  user_id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  status: string;
  created_at: string;
  last_code_sent_at: string | null;
  code_expires_at: string | null;
  attempts: number;
};

type GeneratedCode = {
  success?: boolean;
  message?: string;
  code?: string;
  email?: string;
  username?: string;
  expires_at?: string;
};

function AdminVerification() {
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [generated, setGenerated] =
    useState<Record<string, GeneratedCode>>({});

  const pendingQuery = useQuery({
    queryKey: ["admin-pending-account-verifications"],

    queryFn: async () => {
      const { data, error } =
        await (supabase as any).rpc(
          "admin_list_pending_account_verifications",
        );

      if (error) {
        throw new Error(
          error.message ||
            "Could not load pending verifications.",
        );
      }

      return (data ?? []) as VerificationRow[];
    },
  });

  const generateCode = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } =
        await (supabase as any).rpc(
          "admin_generate_account_verification_code",
          {
            _user_id: userId,
          },
        );

      if (error) {
        throw new Error(
          error.message ||
            "Could not generate verification code.",
        );
      }

      return data as GeneratedCode;
    },

    onSuccess: (data, userId) => {
      setGenerated((current) => ({
        ...current,
        [userId]: data,
      }));

      toast.success(
        data?.code
          ? "Verification code generated."
          : data?.message ||
              "Verification request completed.",
      );

      qc.invalidateQueries({
        queryKey: [
          "admin-pending-account-verifications",
        ],
      });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const manualVerify = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } =
        await (supabase as any).rpc(
          "admin_verify_account",
          {
            _user_id: userId,
            _source: "admin_manual",
          },
        );

      if (error) {
        throw new Error(
          error.message ||
            "Could not verify account.",
        );
      }

      return data;
    },

    onSuccess: () => {
      toast.success(
        "Account verified successfully.",
      );

      qc.invalidateQueries({
        queryKey: [
          "admin-pending-account-verifications",
        ],
      });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const rows = pendingQuery.data ?? [];

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return rows;

    return rows.filter((user) => {
      return (
        (user.email ?? "")
          .toLowerCase()
          .includes(query) ||
        (user.username ?? "")
          .toLowerCase()
          .includes(query) ||
        (user.full_name ?? "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [rows, search]);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied.");
    } catch {
      toast.error(
        "Could not copy automatically. Please copy it manually.",
      );
    }
  }

  function formatDate(value: string | null) {
    if (!value) return "—";

    return new Date(value).toLocaleString(
      undefined,
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    );
  }

  function isCodeExpired(
    expiresAt: string | null,
  ) {
    if (!expiresAt) return true;

    return (
      new Date(expiresAt).getTime() <=
      Date.now()
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <VerificationModeCard />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Link
                to="/admin"
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Admin Center
              </Link>
            </div>

            <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
              Account Verification
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Review new accounts, generate verification
              codes, and manually verify users.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() =>
              pendingQuery.refetch()
            }
            disabled={pendingQuery.isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                pendingQuery.isFetching
                  ? "animate-spin"
                  : ""
              }`}
            />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Pending
              </span>

              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>

            <div className="mt-1 font-display text-2xl font-bold">
              {rows.length}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Search results
              </span>

              <Search className="h-4 w-4 text-accent" />
            </div>

            <div className="mt-1 font-display text-2xl font-bold">
              {filteredRows.length}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Security
              </span>

              <ShieldCheck className="h-4 w-4 text-accent" />
            </div>

            <div className="mt-1 text-sm font-semibold">
              Admin only
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">
                Pending accounts
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Generate a one-time 6-digit code and provide
                it to the user through your approved support
                channel.
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                className="pl-9"
                placeholder="Search name, username or email…"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>
          </div>

          {pendingQuery.isLoading && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading pending accounts…
            </div>
          )}

          {pendingQuery.isError && (
            <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">
                Could not load pending accounts.
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {pendingQuery.error instanceof Error
                  ? pendingQuery.error.message
                  : "Unknown error"}
              </p>

              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() =>
                  pendingQuery.refetch()
                }
              >
                Try again
              </Button>
            </div>
          )}

          {!pendingQuery.isLoading &&
            !pendingQuery.isError &&
            filteredRows.length === 0 && (
              <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
                <ShieldCheck className="mx-auto h-10 w-10 text-accent" />

                <h3 className="mt-3 font-semibold">
                  No pending accounts
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  All currently existing accounts are
                  verified.
                </p>
              </div>
            )}

          <div className="mt-5 space-y-4">
            {filteredRows.map((user) => {
              const result =
                generated[user.user_id];

              const codeExpired =
                isCodeExpired(
                  result?.expires_at ??
                    user.code_expires_at,
                );

              return (
                <div
                  key={user.user_id}
                  className="rounded-2xl border border-border bg-background p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <UserCheck className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="font-semibold">
                            {user.full_name ||
                              user.username ||
                              "Unnamed user"}
                          </div>

                          {user.username && (
                            <div className="text-xs text-muted-foreground">
                              @{user.username}
                            </div>
                          )}

                          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="break-all">
                              {user.email ||
                                "No email"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
                        <div className="rounded-lg bg-muted/40 p-2.5">
                          <span className="text-muted-foreground">
                            Account created
                          </span>

                          <div className="mt-0.5 font-medium">
                            {formatDate(
                              user.created_at,
                            )}
                          </div>
                        </div>

                        <div className="rounded-lg bg-muted/40 p-2.5">
                          <span className="text-muted-foreground">
                            Attempts
                          </span>

                          <div className="mt-0.5 font-medium">
                            {user.attempts} / 8
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-[280px]">
                      {result?.code ? (
                        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                          <div className="text-xs font-medium text-muted-foreground">
                            Verification code
                          </div>

                          <div className="mt-1 flex items-center justify-between gap-2">
                            <span className="font-mono text-2xl font-bold tracking-[0.25em]">
                              {result.code}
                            </span>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                copyCode(
                                  result.code!,
                                )
                              }
                            >
                              <Copy className="mr-1.5 h-3.5 w-3.5" />
                              Copy
                            </Button>
                          </div>

                          <div className="mt-2 text-[11px] text-muted-foreground">
                            Expires:{" "}
                            {formatDate(
                              result.expires_at ??
                                null,
                            )}
                          </div>

                          {codeExpired && (
                            <div className="mt-2 text-xs font-medium text-destructive">
                              This code is expired.
                              Generate a new one.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                          No active code generated.
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          disabled={
                            generateCode.isPending
                          }
                          onClick={() =>
                            generateCode.mutate(
                              user.user_id,
                            )
                          }
                        >
                          <RefreshCw
                            className={`mr-2 h-4 w-4 ${
                              generateCode.isPending
                                ? "animate-spin"
                                : ""
                            }`}
                          />

                          {result?.code
                            ? "Generate new code"
                            : "Generate code"}
                        </Button>

                        <Button
                          variant="outline"
                          disabled={
                            manualVerify.isPending
                          }
                          onClick={() => {
                            const confirmed =
                              window.confirm(
                                `Manually verify ${
                                  user.email ??
                                  user.full_name ??
                                  "this account"
                                }?`,
                              );

                            if (!confirmed) return;

                            manualVerify.mutate(
                              user.user_id,
                            );
                          }}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Verify
                        </Button>
                      </div>

                      {user.last_code_sent_at && (
                        <p className="text-[11px] text-muted-foreground">
                          Previous code generated:{" "}
                          {formatDate(
                            user.last_code_sent_at,
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="rounded-xl border border-amber-500/20 dark:border-amber-300/30 bg-amber-500/5 dark:bg-amber-500/10 p-4 text-xs text-muted-foreground">
          <strong className="text-foreground">
            Security note:
          </strong>{" "}
          Verification codes are generated by the database
          and only their hash is stored. The plaintext code is
          returned to the authorized administrator when it is
          generated. Do not post verification codes publicly
          or place them in the community feed.
        </div>
      </div>
    </AppShell>
  );
}
function VerificationModeCard() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["account-verification-mode"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("id, account_verification_required")
        .order("id")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const m = useMutation({
    mutationFn: async (next: boolean) => {
      if (!q.data) throw new Error("Settings row not found");
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("app_settings")
        .update({ account_verification_required: next, updated_by: u.user?.id ?? null, updated_at: new Date().toISOString() })
        .eq("id", q.data.id)
        .select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Only admins can change this setting");
    },
    onSuccess: (_d, next) => {
      toast.success(`Account Verification Mode ${next ? "ON" : "OFF"}`);
      qc.invalidateQueries({ queryKey: ["account-verification-mode"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const on = q.data?.account_verification_required ?? true;
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
      <div>
        <p className="text-sm font-semibold">Account Verification Mode</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {on
            ? "ON — new accounts must enter an admin code before using the platform."
            : "OFF — new accounts are verified automatically."}{" "}
          Existing accounts are not affected.
        </p>
      </div>
      <Button
        variant={on ? "default" : "outline"}
        disabled={q.isLoading || m.isPending}
        onClick={() => m.mutate(!on)}
        aria-pressed={on}
      >
        {on ? "ON" : "OFF"}
      </Button>
    </div>
  );
}
