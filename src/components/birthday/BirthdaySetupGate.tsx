import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Cake, CalendarDays, CheckCircle2, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { birthdayRpc } from "@/lib/birthday-rpc";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: new Intl.DateTimeFormat("en", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2024, index, 1)),
  ),
}));

type BirthdayFields = { birthday_month: number | null; birthday_day: number | null };
type GateState = "checking" | "setup" | "complete" | "error";
const checkedReminderSessions = new Set<string>();

function daysInMonth(month: number) {
  if (month === 2) return 29; // The year is not collected, so allow Feb 29.
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function hasValidBirthday(month: number | null | undefined, day: number | null | undefined) {
  return (
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    (month ?? 0) >= 1 &&
    (month ?? 0) <= 12 &&
    (day ?? 0) >= 1 &&
    (day ?? 0) <= daysInMonth(month ?? 0)
  );
}

async function generateBirthdayRemindersOnce(userId: string) {
  if (typeof window === "undefined") return 0;
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const key = `birthday-reminders:${userId}:${today}`;
  if (checkedReminderSessions.has(key)) return 0;

  try {
    if (window.sessionStorage.getItem(key)) {
      checkedReminderSessions.add(key);
      return 0;
    }
  } catch {
    // Continue; the database ledger still makes concurrent checks idempotent.
  }

  try {
    const { data, error } = await birthdayRpc<number>("birthday_generate_my_reminders");
    if (error) return 0;
    checkedReminderSessions.add(key);
    try {
      window.sessionStorage.setItem(key, "checked");
    } catch {
      // Session storage may be unavailable in private browsing.
    }
    return typeof data === "number" ? data : 0;
  } catch {
    return 0;
  }
}

export function BirthdaySetupGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [state, setState] = useState<GateState>("checking");
  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let active = true;
    let generation = 0;
    const timers = new Set<number>();

    const checkUser = async (user: User | null) => {
      const requestGeneration = ++generation;
      if (!user) {
        if (active && requestGeneration === generation) {
          setVerifiedUserId(null);
          setState("complete");
        }
        return;
      }
      if (active) {
        setVerifiedUserId(null);
        setState("checking");
        setErrorMessage("");
      }
      try {
        const { data, error } = await birthdayRpc<BirthdayFields[]>("birthday_my_settings");
        if (!active || requestGeneration !== generation) return;
        if (error) {
          setVerifiedUserId(null);
          setErrorMessage(
            "We couldn't verify your saved birthday right now. Your account data is safe; retry to check again.",
          );
          setState("error");
          return;
        }
        const row = Array.isArray(data) ? data[0] : null;
        setMonth(row?.birthday_month ? String(row.birthday_month) : "");
        setDay(row?.birthday_day ? String(row.birthday_day) : "");
        const birthdayIsValid = hasValidBirthday(row?.birthday_month, row?.birthday_day);
        setVerifiedUserId(birthdayIsValid ? user.id : null);
        setState(birthdayIsValid ? "complete" : "setup");
      } catch {
        if (!active || requestGeneration !== generation) return;
        setVerifiedUserId(null);
        setErrorMessage("We couldn't reach the birthday service. Check your connection and retry.");
        setState("error");
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        ![
          "SIGNED_IN",
          "SIGNED_OUT",
          "TOKEN_REFRESHED",
          "USER_UPDATED",
          "PASSWORD_RECOVERY",
        ].includes(event)
      )
        return;
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        void checkUser(session?.user ?? null);
      }, 0);
      timers.add(timer);
    });

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setErrorMessage("We couldn't confirm your account session. Retry to continue securely.");
          setState("error");
          return;
        }
        void checkUser(data.session?.user ?? null);
      })
      .catch(() => {
        if (!active) return;
        setErrorMessage(
          "We couldn't confirm your account session. Check your connection and retry.",
        );
        setState("error");
      });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [attempt]);

  useEffect(() => {
    if (state !== "complete" || !user?.id || verifiedUserId !== user.id) return;
    let active = true;
    void generateBirthdayRemindersOnce(user.id).then((created) => {
      if (active && created > 0) {
        void queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
      }
    });
    return () => {
      active = false;
    };
  }, [queryClient, state, user?.id, verifiedUserId]);

  useEffect(() => {
    if (state === "complete") return;
    const previousOverflow = document.body.style.overflow;
    const inertTargets = Array.from(
      document.querySelectorAll<HTMLElement>(".site-global-header, nav"),
    ).map((element) => ({ element, wasInert: element.inert }));
    document.body.style.overflow = "hidden";
    inertTargets.forEach(({ element }) => {
      element.inert = true;
    });
    headingRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      inertTargets.forEach(({ element, wasInert }) => {
        element.inert = wasInert;
      });
    };
  }, [state]);

  async function saveBirthday(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedMonth = Number(month);
    const parsedDay = Number(day);
    if (!hasValidBirthday(parsedMonth, parsedDay)) {
      setErrorMessage(
        "Choose a valid month and day. February 29 is accepted for leap-day birthdays.",
      );
      return;
    }

    setSaving(true);
    setErrorMessage("");
    try {
      const { data, error } = await birthdayRpc<boolean>("birthday_save_my_settings", {
        _birthday_month: parsedMonth,
        _birthday_day: parsedDay,
        _visibility: "private",
        _notifications_enabled: true,
        _music_enabled: true,
        _birthday_reminders_enabled: true,
        _birthday_reminder_days_before: 1,
      });
      if (error) {
        setErrorMessage(error.message || "Your birthday couldn't be saved. Please try again.");
        return;
      }
      if (data !== true) {
        setErrorMessage("We couldn't confirm that your birthday was saved. Please retry.");
        return;
      }
      setVerifiedUserId(user?.id ?? null);
      setState("complete");
    } catch {
      setErrorMessage(
        "We couldn't reach the birthday service. Your entry hasn't been confirmed; please retry.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (state === "complete") return <>{children}</>;

  return (
    <main
      role="dialog"
      aria-modal="true"
      aria-labelledby="birthday-setup-title"
      aria-describedby="birthday-setup-description"
      className="fixed inset-0 z-[200] flex h-[100dvh] min-h-[100svh] w-full items-start justify-center overflow-y-auto overscroll-contain bg-[radial-gradient(ellipse_at_10%_0%,rgba(251,191,36,.16),transparent_34%),radial-gradient(ellipse_at_92%_100%,rgba(244,114,182,.15),transparent_36%),linear-gradient(145deg,hsl(var(--background)),hsl(var(--background))_60%,rgba(99,102,241,.08))] px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:px-6 sm:py-8"
      aria-busy={state === "checking" || saving}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-20 top-14 h-52 w-52 rounded-full bg-amber-300/15 blur-3xl" />
        <div className="absolute -right-12 bottom-12 h-64 w-64 rounded-full bg-fuchsia-400/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-40 w-40 -translate-x-1/2 rounded-full bg-sky-300/10 blur-3xl" />
      </div>

      <section className="relative z-10 mx-auto w-full max-w-xl overflow-hidden rounded-3xl border border-amber-200/60 bg-card/95 shadow-[0_28px_100px_-38px_rgba(190,24,93,.38)] backdrop-blur-xl dark:border-white/10 dark:bg-card/90 sm:rounded-[2rem]">
        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-rose-400 to-violet-500" />
        <div className="px-4 py-5 sm:px-10 sm:py-9">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 via-rose-300 to-fuchsia-300 text-rose-950 shadow-[0_12px_35px_-12px_rgba(244,63,94,.65)] sm:h-16 sm:w-16 sm:rounded-[1.4rem]">
            <Cake className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
          </div>
          <div className="mt-4 text-center sm:mt-5">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/[.07] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.2em] text-amber-800 dark:text-amber-200">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> A quick welcome step
            </p>
            <h1
              id="birthday-setup-title"
              ref={headingRef}
              tabIndex={-1}
              className="mt-3 font-display text-2xl font-black tracking-tight text-foreground outline-none sm:mt-4 sm:text-4xl"
            >
              Let’s celebrate you
            </h1>
            <p
              id="birthday-setup-description"
              className="mx-auto mt-2 max-w-lg text-[13px] leading-5 text-muted-foreground sm:mt-3 sm:text-base sm:leading-6"
            >
              Add your birthday to unlock your personalized celebration and join the PREPWIAN
              birthday community.
            </p>
          </div>

          {state === "checking" ? (
            <div
              className="mx-auto mt-8 flex max-w-sm items-center justify-center gap-3 rounded-2xl border border-border/70 bg-background/70 p-5"
              role="status"
              aria-live="polite"
            >
              <span
                className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
                aria-hidden="true"
              />
              <span className="text-sm text-muted-foreground">Checking your saved birthday…</span>
            </div>
          ) : state === "error" ? (
            <div className="mx-auto mt-7 max-w-lg rounded-2xl border border-destructive/25 bg-destructive/[.04] p-5 text-center">
              <p role="alert" className="text-sm leading-6 text-foreground">
                {errorMessage}
              </p>
              <Button
                type="button"
                onClick={() => setAttempt((value) => value + 1)}
                className="mt-4 min-h-11 rounded-xl px-6"
              >
                Retry birthday check
              </Button>
            </div>
          ) : (
            <>
              <div className="mt-5 grid gap-2.5 sm:mt-7 sm:grid-cols-2 sm:gap-3">
                <div className="flex items-start gap-2.5 rounded-2xl border border-border/70 bg-background/65 p-3 sm:gap-3 sm:p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300 sm:h-10 sm:w-10">
                    <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-[13px] font-bold sm:text-sm">Only month and day</h2>
                    <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground sm:mt-1 sm:text-xs sm:leading-5">
                      We never ask for a birth year. New entries save only month and day.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-2xl border border-border/70 bg-background/65 p-3 sm:gap-3 sm:p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 sm:h-10 sm:w-10">
                    <LockKeyhole className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-[13px] font-bold sm:text-sm">Private by default</h2>
                    <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground sm:mt-1 sm:text-xs sm:leading-5">
                      Only you can see it unless you later change its visibility.
                    </p>
                  </div>
                </div>
              </div>

              <form
                onSubmit={(event) => void saveBirthday(event)}
                className="mt-5 rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[.055] via-background/80 to-rose-500/[.055] p-3 sm:mt-7 sm:rounded-3xl sm:p-6"
              >
                <fieldset disabled={saving} className="min-w-0">
                  <legend className="sr-only">Required birthday</legend>
                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    <div className="space-y-2">
                      <label htmlFor="required-birthday-month" className="text-sm font-semibold">
                        Birth month
                      </label>
                      <Select
                        value={month}
                        onValueChange={(value) => {
                          setMonth(value);
                          setDay("");
                          setErrorMessage("");
                        }}
                      >
                        <SelectTrigger
                          id="required-birthday-month"
                          className="h-11 rounded-xl bg-background sm:h-12"
                          aria-label="Choose your birth month"
                        >
                          <SelectValue placeholder="Choose a month" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="z-[220]">
                          {MONTHS.map((item) => (
                            <SelectItem key={item.value} value={String(item.value)}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="required-birthday-day" className="text-sm font-semibold">
                        Birth day
                      </label>
                      <Select
                        value={day}
                        onValueChange={(value) => {
                          setDay(value);
                          setErrorMessage("");
                        }}
                        disabled={!month}
                      >
                        <SelectTrigger
                          id="required-birthday-day"
                          className="h-11 rounded-xl bg-background sm:h-12"
                          aria-label="Choose your birth day"
                        >
                          <SelectValue
                            placeholder={month ? "Choose a day" : "Select a month first"}
                          />
                        </SelectTrigger>
                        <SelectContent position="popper" className="z-[220] max-h-64">
                          {month &&
                            Array.from(
                              { length: daysInMonth(Number(month)) },
                              (_, index) => index + 1,
                            ).map((value) => (
                              <SelectItem key={value} value={String(value)}>
                                {value}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </fieldset>

                <div className="mt-3 flex items-start gap-2 rounded-xl bg-background/75 px-3 py-2.5 text-[11px] leading-[1.15rem] text-muted-foreground sm:mt-4 sm:gap-2.5 sm:px-3.5 sm:py-3 sm:text-xs sm:leading-5">
                  <ShieldCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                  <p>
                    We use this only for your birthday check and celebration. It is saved securely
                    to your account, with visibility set to{" "}
                    <strong className="text-foreground">Private</strong>. You can review your
                    birthday preferences later in Profile.
                  </p>
                </div>

                {errorMessage && (
                  <p
                    role="alert"
                    className="mt-3 rounded-xl border border-destructive/20 bg-destructive/[.04] px-3 py-2.5 text-[13px] text-destructive sm:mt-4 sm:px-3.5 sm:py-3 sm:text-sm"
                  >
                    {errorMessage}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={saving || !month || !day}
                  className="mt-4 min-h-11 w-full rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-500 text-sm font-bold text-white shadow-[0_12px_35px_-14px_rgba(225,29,72,.75)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55 sm:mt-5 sm:min-h-12 sm:text-base"
                >
                  {saving ? (
                    "Saving your birthday…"
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" aria-hidden="true" /> Save birthday &
                      continue
                    </>
                  )}
                </Button>
                <p className="mt-2 text-center text-[10px] leading-4 text-muted-foreground sm:mt-3 sm:text-[11px] sm:leading-5">
                  This one-time setup is required before opening protected PREPWIAN pages.
                </p>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
