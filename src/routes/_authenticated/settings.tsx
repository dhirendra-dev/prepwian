import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Activity,
  AlertTriangle,
  BellRing,
  CalendarDays,
  Check,
  ChevronRight,
  CircleCheck,
  Copy,
  Clock3,
  Download,
  Eye,
  EyeOff,
  Fingerprint,
  Laptop,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Layers3,
  Monitor,
  Palette,
  PanelBottom,
  PanelLeft,
  RefreshCw,
  Search,
  Settings2,
  Shield,
  Save,
  ShieldCheck,
  Sparkles,
  SunMoon,
  Target,
  Timer,
  Type,
  Trash2,
  UserRound,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { deleteMyAccount, exportMyAccountData, signOutAllAccountSessions } from "@/lib/account.functions";
import { useAppStore } from "@/lib/jee360/store";
import { canNotify, requestNotificationPermission } from "@/lib/jee360/notifications";
import { NotificationStyleSetting } from "@/components/NotificationStyleSetting";
import { DailyChecklist } from "@/components/DailyChecklist";
import { SiteDiagnosisCard } from "@/components/SiteDiagnosisCard";
import { JEE_ALERT_SOUNDS, playJeeAlertSound, useJeeAlertPreferences } from "@/lib/jee360/alert-preferences";
import { useTheme } from "@/lib/theme";
import { useColorPalette, type ColorPalette } from "@/lib/color-palette";
import { useUiMode } from "@/lib/ui-mode";
import { BG_PRESETS, useBgMotion, type BgPresetKey } from "@/lib/bg-motion";
import { useMenuStyle } from "@/lib/menu-style";
import { BACKGROUND_COLORS, useBackgroundColor, type BackgroundColorPreset } from "@/lib/bg-color";
import { THEME_PRESETS } from "@/lib/theme-presets";
import { SCHOLAR_FONTS, useScholarTypography } from "@/lib/scholar-typography";
import {
  clearAIConfig,
  getAIConfig,
  saveAIConfig,
  testAIConnection,
  type AIProvider,
} from "@/lib/ai";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [
      { property: "og:title", content: "Account Settings — JEE Prep Hub" },
      { property: "og:description", content: "Manage your account and study preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Account Settings — JEE Prep Hub" },
      { name: "twitter:description", content: "Manage your account and study preferences." },
{ title: "Account Settings — JEE Prep Hub" }, { name: "description", content: "Manage your account and study preferences." }] }),

  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const plannerSettings = useAppStore((state) => state.settings);
  const updatePlannerSettings = useAppStore((state) => state.updateSettings);
  const jeeAlerts = useJeeAlertPreferences();
  const { theme, set: setTheme } = useTheme();
  const palette = useColorPalette();
  const uiMode = useUiMode();
  const backgroundMotion = useBgMotion();
  const pageBackground = useBackgroundColor();
  const menuStyle = useMenuStyle();
  const scholarTypography = useScholarTypography();
  const [securityEvents, setSecurityEvents] = useState<Array<{
    id: string;
    event_type: string;
    user_agent: string | null;
    created_at: string;
  }>>([]);
  const [loginCount, setLoginCount] = useState<number | null>(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityRefresh, setActivityRefresh] = useState(0);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityType, setActivityType] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [accountBusy, setAccountBusy] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const existing = getAIConfig();

  const [provider, setProvider] = useState<AIProvider>(
    existing?.provider ?? "openai"
  );

  const [apiKey, setApiKey] = useState(
    existing?.apiKey ?? ""
  );

  const [model, setModel] = useState(
    existing?.model ?? "gpt-5.6"
  );

  const [baseUrl, setBaseUrl] = useState(
    existing?.baseUrl ?? ""
  );

  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const configured = Boolean(existing?.apiKey);
  const selectedScholarFont = SCHOLAR_FONTS.find((font) => font.id === scholarTypography.preference.font) ?? SCHOLAR_FONTS[0];

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    void (async () => {
      const [events, logins] = await Promise.all([
        supabase
          .from("user_security_events")
          .select("id,event_type,user_agent,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("user_security_events")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("event_type", "login"),
      ]);
      if (!active) return;
      if (events.error || logins.error) {
        toast.error("Some account activity details could not be loaded.");
      } else {
        setSecurityEvents(events.data ?? []);
        setLoginCount(logins.count ?? 0);
      }
      setActivityLoading(false);
    })();
    return () => { active = false; };
  }, [user?.id, activityRefresh]);

  const filteredEvents = securityEvents.filter((event) => {
    const matchesType = activityType === "all" || event.event_type === activityType;
    const query = activitySearch.trim().toLowerCase();
    const matchesSearch = !query || event.event_type.toLowerCase().includes(query)
      || event.created_at.toLowerCase().includes(query)
      || (event.user_agent ?? "").toLowerCase().includes(query);
    return matchesType && matchesSearch;
  });

  const copyAccountId = async () => {
    if (!user?.id) return;
    try {
      await navigator.clipboard.writeText(user.id);
      toast.success("Account ID copied.");
    } catch {
      toast.error("Couldn't copy the account ID.");
    }
  };

  const togglePlannerNotifications = async () => {
    if (plannerSettings.notificationsEnabled) {
      updatePlannerSettings({ notificationsEnabled: false });
      toast.success("JEE 360 reminders turned off.");
      return;
    }
    const permitted = await requestNotificationPermission();
    if (permitted) {
      updatePlannerSettings({ notificationsEnabled: true });
      toast.success("JEE 360 reminder notifications enabled.");
    } else {
      toast.error("Notifications aren't available or permission was denied. You can enable them in your browser settings.");
    }
  };

  const toggleJeeDesktopAlerts = async () => {
    if (jeeAlerts.preferences.desktopEnabled) {
      jeeAlerts.update({ desktopEnabled: false });
      toast.success("High-priority desktop alerts turned off.");
      return;
    }
    if (!canNotify()) {
      toast.error("This browser doesn't support desktop notifications.");
      return;
    }
    if (Notification.permission === "denied") {
      toast.error("Notifications are blocked by your browser. Allow them in site settings, then try again.");
      return;
    }
    const permitted = await requestNotificationPermission();
    if (!permitted) {
      toast.error("Notification permission wasn't granted.");
      return;
    }
    jeeAlerts.update({ desktopEnabled: true });
    toast.success("High-priority desktop alerts enabled.");
  };

  const toggleJeeAlertSound = () => {
    const enabled = !jeeAlerts.preferences.soundEnabled;
    jeeAlerts.update({ soundEnabled: enabled });
    if (enabled) {
      playJeeAlertSound(jeeAlerts.preferences.sound);
      toast.success("High-priority alert sound enabled.");
    } else {
      toast.success("High-priority alert sound turned off.");
    }
  };

  const applyThemePreset = (preset: (typeof THEME_PRESETS)[number]) => {
    setTheme(preset.theme);
    palette.set(preset.palette);
    uiMode.set(preset.surface);
    const background = BACKGROUND_COLORS[preset.background];
    pageBackground.update({ preset: preset.background, color: background.color, strength: preset.backgroundStrength });
    backgroundMotion.update(BG_PRESETS[preset.motion]);
    toast.success(`${preset.name} theme applied.`);
  };

  const downloadAccountSnapshot = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const database = await exportMyAccountData();
      const localStorageKeys = [
        "jee-360-v1", "focuszone:state:v1", "aichat:convos:v1", "aichat:active:v1",
        "jee-prep-hub-material-bookmarks", "jee-focus-timer-" + user.id,
        "theme", "jph-ui-mode", "jph-color-palette", "jph-menu-style", "bg-motion", "jph-background-color", "jph-scholar-typography", "jph-jee-alert-preferences",
        `jph-dashboard-layout:v1:${user.id}`,
        "jph_last_series", "eng-likes", "eng-theme", "jph:pro:vol",
      ];
      const localBrowserData: Record<string, unknown> = {};
      for (const key of localStorageKeys) {
        const value = localStorage.getItem(key);
        if (value === null) continue;
        try { localBrowserData[key] = JSON.parse(value); }
        catch { localBrowserData[key] = value; }
      }
      const archive = {
        format: "JEE Prep Hub personal data archive",
        formatVersion: 1,
        exportedAt: new Date().toISOString(),
        account: {
          id: user.id,
          email: user.email ?? null,
          createdAt: user.created_at,
          lastSignInAt: user.last_sign_in_at ?? null,
          emailConfirmedAt: user.email_confirmed_at ?? null,
          metadata: user.user_metadata,
        },
        database,
        localBrowserData,
        securitySummary: { recordedLoginCount: loginCount, recentSecurityActivity: securityEvents },
        privacyNotes: [
          "Only records directly owned, authored, sent, received, or associated with this account are included.",
          "Third-party API keys, OAuth credentials, active access tokens, and private records belonging only to other users are intentionally excluded.",
          "Some browser-only information exists only on the device where this export is created.",
        ],
      };
      const blob = new Blob([JSON.stringify(archive, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `jee-prep-hub-data-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      if (database.unavailableTables.length) {
        toast.warning(`Archive downloaded with ${database.unavailableTables.length} unavailable data source(s); see the archive notes.`);
      } else {
        toast.success(`Full data archive downloaded (${database.recordCount} records across ${database.tableCount} data sets).`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't prepare your data archive.");
    } finally {
      setExporting(false);
    }
  };

  const signOutEverywhere = async () => {
    if (!window.confirm("Sign out this account on every device? Your account and saved data will remain.")) return;
    setAccountBusy(true);
    try {
      await signOutAllAccountSessions({ data: {} });
      await supabase.auth.signOut();
      toast.success("Signed out on all devices.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't end all sessions.");
    } finally {
      setAccountBusy(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") return;
    setAccountBusy(true);
    try {
      await deleteMyAccount({ data: { confirmation: "DELETE" } });
      void supabase.auth.signOut({ scope: "local" });
      toast.success("Your account has been deleted.");
      void navigate({ to: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Account deletion failed.");
      setAccountBusy(false);
    }
  };

  const providerModels: Record<AIProvider, string[]> = {
    openai: [
      "gpt-5.6",
      "gpt-5.6-mini",
    ],
    gemini: [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
    ],
    "openai-compatible": [
      "gpt-4o-mini",
      "gpt-4o",
    ],
  };

  const testConnection = async () => {
    if (!apiKey.trim()) {
      toast.error("Enter your API key first.");
      return;
    }

    setTesting(true);

    try {
      await testAIConnection({
        provider,
        apiKey: apiKey.trim(),
        model,
        baseUrl:
          provider === "openai-compatible"
            ? baseUrl.trim()
            : undefined,
      });

      toast.success("AI connection successful.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Connection failed."
      );
    } finally {
      setTesting(false);
    }
  };

  const save = () => {
    if (!apiKey.trim()) {
      toast.error("Enter an API key.");
      return;
    }

    setSaving(true);

    try {
      saveAIConfig({
        provider,
        apiKey: apiKey.trim(),
        model,
        baseUrl:
          provider === "openai-compatible"
            ? baseUrl.trim()
            : undefined,
      });

      toast.success("AI settings saved.");
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    clearAIConfig();

    setApiKey("");
    setModel("gpt-5.6");
    setBaseUrl("");

    toast.success("AI configuration removed.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/[0.035] via-background to-background">
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-5 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => void navigate({ to: "/" })} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background/75 px-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
          <ArrowLeft className="h-4 w-4"/>Back to Hub
        </button>
        <nav aria-label="Settings sections" className="flex max-w-full gap-2 overflow-x-auto pb-1 text-xs">
          <a href="#account" className="shrink-0 rounded-full border border-border bg-background/70 px-3 py-2 font-semibold transition hover:bg-muted">Account</a>
          <a href="#daily-study" className="shrink-0 rounded-full border border-primary/25 bg-primary/10 px-3 py-2 font-semibold text-primary transition hover:bg-primary/15">Daily study</a>
          <a href="#site-diagnosis" className="shrink-0 rounded-full border border-border bg-background/70 px-3 py-2 font-semibold transition hover:bg-muted">Website diagnosis</a>
          <a href="#activity" className="shrink-0 rounded-full border border-border bg-background/70 px-3 py-2 font-semibold transition hover:bg-muted">Activity &amp; data</a>
          <a href="#study-preferences" className="shrink-0 rounded-full border border-border bg-background/70 px-3 py-2 font-semibold transition hover:bg-muted">Study preferences</a>
          <a href="#alert-delivery" className="shrink-0 rounded-full border border-border bg-background/70 px-3 py-2 font-semibold transition hover:bg-muted">JEE alerts</a>
          <a href="#appearance" className="shrink-0 rounded-full border border-border bg-background/70 px-3 py-2 font-semibold transition hover:bg-muted">Theme &amp; look</a>
          <a href="#ai-settings" className="shrink-0 rounded-full border border-border bg-background/70 px-3 py-2 font-semibold transition hover:bg-muted">AI settings</a>
        </nav>
      </div>
      <header className="relative isolate overflow-hidden rounded-[32px] border border-primary/15 bg-gradient-to-br from-card via-card to-primary/[0.07] p-5 shadow-[0_24px_80px_-45px_rgba(20,35,70,0.28)] sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/20"><Settings2 className="h-7 w-7"/></div>
            <div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Personal control center</p><h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Settings</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Make JEE Prep Hub work for you—manage your account, learning targets, privacy, appearance, and AI tools in one place.</p></div>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-border/70 bg-background/65 px-4 py-3 shadow-sm"><div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 font-bold text-primary">{user?.email?.slice(0, 1).toUpperCase() ?? "S"}</div><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Signed in as</p><p className="max-w-[220px] truncate text-sm font-semibold">{user?.email ?? "Your account"}</p></div></div>
        </div>
      </header>
      {user && (
        <section id="daily-study" className="scroll-mt-24 rounded-[30px] border border-primary/15 bg-card/65 p-5 shadow-[0_24px_80px_-40px_rgba(20,35,70,0.22)] backdrop-blur-2xl sm:p-6">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Personal study plan</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">Daily streak &amp; goals</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Set a small target for today and tomorrow, tick your real study habits, and keep your best streak moving.</p>
          </div>
          <DailyChecklist userId={user.id} />
        </section>
      )}
      {user && <SiteDiagnosisCard />}
      <section className="overflow-hidden rounded-[30px] border border-white/60 bg-white/55 shadow-[0_24px_80px_-40px_rgba(28,48,35,0.25)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055]">
        <div id="account" className="border-b border-border/60 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><UserRound className="h-6 w-6" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Your account</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">Account &amp; activity</h1>
              <p className="mt-1 text-sm text-muted-foreground">See your sign-in history, review account details, and control your data.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4"><span className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Mail className="h-4 w-4"/>Email</span><p className="mt-2 break-all text-sm font-semibold">{user?.email ?? "Not available"}</p></div>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4"><span className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Activity className="h-4 w-4"/>Recorded logins</span><p className="mt-2 text-sm font-semibold">{activityLoading ? "Loading…" : loginCount ?? "Unavailable"}</p><p className="mt-1 text-xs text-muted-foreground">Since security logging began</p></div>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4"><span className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Clock3 className="h-4 w-4"/>Last sign-in</span><p className="mt-2 text-sm font-semibold">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Not available"}</p></div>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4"><span className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><CalendarDays className="h-4 w-4"/>Member since</span><p className="mt-2 text-sm font-semibold">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Not available"}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">{user?.email_confirmed_at ? <><CircleCheck className="h-3 w-3 text-emerald-600"/>Email verified</> : "Email verification status unavailable"}</p></div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/50 p-3.5">
            <div className="min-w-0"><p className="text-xs font-semibold">Account ID</p><p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{user?.id ?? "Loading account…"}</p></div>
            <button type="button" onClick={() => void copyAccountId()} disabled={!user} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold transition hover:bg-muted disabled:opacity-50"><Copy className="h-3.5 w-3.5"/>Copy ID</button>
          </div>
        </div>

        <div id="activity" className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="flex items-center gap-2 font-semibold"><Shield className="h-4 w-4 text-primary"/>Recent security activity</h2><p className="mt-1 text-xs text-muted-foreground">Only activity recorded by JEE Prep Hub is shown. Device details depend on what was captured at sign-in.</p></div>
            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setActivityLoading(true); setActivityRefresh((value) => value + 1); }} disabled={activityLoading} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background/70 px-3 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${activityLoading ? "animate-spin" : ""}`}/>Refresh</button><button type="button" onClick={() => void downloadAccountSnapshot()} disabled={!user || exporting} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 text-sm font-semibold text-primary transition hover:bg-primary/15 disabled:opacity-50">{exporting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Download className="h-4 w-4"/>}{exporting ? "Preparing archive…" : "Export all my data"}</button></div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><span className="sr-only">Search activity</span><input value={activitySearch} onChange={(event) => setActivitySearch(event.target.value)} placeholder="Search activity or device…" className="h-10 w-full rounded-xl border border-border bg-background/70 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"/></label>
            <label className="sr-only" htmlFor="activity-type">Filter activity type</label><select id="activity-type" value={activityType} onChange={(event) => setActivityType(event.target.value)} className="h-10 rounded-xl border border-border bg-background/70 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><option value="all">All activity</option>{[...new Set(securityEvents.map((event) => event.event_type))].map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select>
          </div>
          <div className="mt-4 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70">
            {activityLoading ? <div className="p-4 text-sm text-muted-foreground">Loading account activity…</div> : filteredEvents.length ? filteredEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3 p-3.5 sm:p-4">
                <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Fingerprint className="h-4 w-4"/></div>
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{event.event_type.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase())}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5"/>{new Date(event.created_at).toLocaleString()}</p>{event.user_agent && <p className="mt-1 flex items-start gap-1.5 break-all text-[11px] text-muted-foreground"><Laptop className="mt-0.5 h-3 w-3 shrink-0"/>{event.user_agent}</p>}</div>
              </div>
            )) : <div className="p-4 text-sm text-muted-foreground">{securityEvents.length ? "No activity matches your search or filter." : "No security events have been recorded yet. Login totals may only include events recorded since this feature was enabled."}</div>}
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">Your full archive combines account-owned database records with JEE 360, focus, saved chat, bookmarks, and preferences stored in this browser. It intentionally omits API keys and OAuth tokens. The activity list above shows the latest 50 security events; the export includes all available account-owned security events.</p>
        </div>

        <div className="grid gap-3 border-t border-border/60 p-5 sm:grid-cols-2 sm:p-6">
          <div className="rounded-2xl border border-border/70 bg-background/50 p-4"><h3 className="font-semibold">Sign out everywhere</h3><p className="mt-1 text-sm text-muted-foreground">End all active sessions on your devices. Your account and data remain saved.</p><button type="button" onClick={() => void signOutEverywhere()} disabled={accountBusy} className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold transition hover:bg-muted disabled:opacity-50">{accountBusy ? <Loader2 className="h-4 w-4 animate-spin"/> : <LogOut className="h-4 w-4"/>}Sign out all devices</button></div>
          <div className="rounded-2xl border border-destructive/25 bg-destructive/[0.035] p-4"><h3 className="flex items-center gap-2 font-semibold text-destructive"><AlertTriangle className="h-4 w-4"/>Delete account</h3><p className="mt-1 text-sm text-muted-foreground">Permanently removes your sign-in account. Some shared content may be retained or anonymized under the site’s data rules.</p>{!deleteMode ? <button type="button" onClick={() => setDeleteMode(true)} disabled={accountBusy} className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-destructive/35 px-3 text-sm font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-50"><Trash2 className="h-4 w-4"/>Continue to deletion</button> : <div className="mt-4 space-y-3"><label className="block text-xs font-medium text-muted-foreground">Type <span className="font-bold text-destructive">DELETE</span> to permanently remove your account.<input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} autoComplete="off" className="mt-2 h-10 w-full rounded-xl border border-destructive/25 bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-destructive/20"/></label><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void deleteAccount()} disabled={accountBusy || deleteConfirmation !== "DELETE"} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-destructive px-3 text-sm font-semibold text-destructive-foreground disabled:opacity-40">{accountBusy && <Loader2 className="h-4 w-4 animate-spin"/>}Delete permanently</button><button type="button" onClick={() => { setDeleteMode(false); setDeleteConfirmation(""); }} disabled={accountBusy} className="h-10 rounded-xl border border-border px-3 text-sm font-semibold">Cancel</button></div></div>}</div>
        </div>
      </section>

      <section id="study-preferences" className="scroll-mt-6 rounded-[30px] border border-white/60 bg-white/55 p-5 shadow-[0_24px_80px_-40px_rgba(28,48,35,0.22)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055] sm:p-6">
        <div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Target className="h-5 w-5"/></div><div><h2 className="text-lg font-bold">Study preferences</h2><p className="mt-1 text-sm text-muted-foreground">Set your JEE 360 planning targets and reminder behavior. These preferences are saved on this device.</p></div></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-semibold"><CalendarDays className="h-4 w-4 text-muted-foreground"/>Target exam date</span><input type="date" value={plannerSettings.examDate} onChange={(event) => updatePlannerSettings({ examDate: event.target.value })} className="h-11 w-full rounded-xl border border-border bg-background/75 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"/></label>
          <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-semibold"><Timer className="h-4 w-4 text-muted-foreground"/>Daily study target</span><div className="flex items-center gap-3"><input type="range" min="1" max="16" step="0.5" value={plannerSettings.dailyHours} onChange={(event) => updatePlannerSettings({ dailyHours: Number(event.target.value) })} className="min-w-0 flex-1 accent-primary"/><span className="w-14 rounded-lg bg-muted px-2 py-1 text-center text-sm font-bold">{plannerSettings.dailyHours}h</span></div><span className="mt-1 block text-xs text-muted-foreground">1–16 hours per day</span></label>
          <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-semibold"><Clock3 className="h-4 w-4 text-muted-foreground"/>Reminder lead time</span><select value={plannerSettings.reminderLeadMinutes} onChange={(event) => updatePlannerSettings({ reminderLeadMinutes: Number(event.target.value) })} className="h-11 w-full rounded-xl border border-border bg-background/75 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><option value={0}>At start time</option><option value={5}>5 minutes before</option><option value={15}>15 minutes before</option><option value={30}>30 minutes before</option><option value={60}>1 hour before</option></select></label>
        </div>
        <div className="mt-4 flex flex-col justify-between gap-3 rounded-2xl border border-border/70 bg-background/55 p-4 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold">JEE 360 reminder notifications</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Browser notifications for planner reminders. Your browser may ask for permission.</p></div><button type="button" role="switch" aria-checked={plannerSettings.notificationsEnabled} onClick={() => void togglePlannerNotifications()} className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${plannerSettings.notificationsEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}><span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${plannerSettings.notificationsEnabled ? "translate-x-6" : "translate-x-1"}`}/><span className="sr-only">{plannerSettings.notificationsEnabled ? "Turn off" : "Turn on"} JEE 360 notifications</span></button></div>
      </section>

      <section id="alert-delivery" aria-labelledby="alert-delivery-title" className="scroll-mt-24 rounded-[30px] border border-white/60 bg-white/55 p-5 shadow-[0_24px_80px_-40px_rgba(28,48,35,0.2)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055] sm:p-6">
        <div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><BellRing className="h-5 w-5"/></div><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">Important updates</p><h2 id="alert-delivery-title" className="mt-1 text-lg font-bold">High-priority JEE alerts</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">Choose how you want to hear about urgent exam, deadline, and preparation updates. Standard announcements stay quiet.</p></div></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/55 p-4">
            <div className="flex min-w-0 items-start gap-3"><Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-primary"/><div><p className="text-sm font-semibold">Alert sound</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Play your selected chime only for high-priority alerts.</p></div></div>
            <button type="button" role="switch" aria-checked={jeeAlerts.preferences.soundEnabled} aria-label="High-priority alert sound" onClick={toggleJeeAlertSound} className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${jeeAlerts.preferences.soundEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}><span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${jeeAlerts.preferences.soundEnabled ? "translate-x-6" : "translate-x-1"}`}/></button>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/55 p-4">
            <div className="flex min-w-0 items-start gap-3"><Monitor className="mt-0.5 h-4 w-4 shrink-0 text-primary"/><div><p className="text-sm font-semibold">Desktop notifications</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Show a browser system notification for high-priority JEE alerts. Requires permission.</p></div></div>
            <button type="button" role="switch" aria-checked={jeeAlerts.preferences.desktopEnabled} aria-label="Desktop notifications for high-priority JEE alerts" onClick={() => void toggleJeeDesktopAlerts()} className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${jeeAlerts.preferences.desktopEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}><span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${jeeAlerts.preferences.desktopEnabled ? "translate-x-6" : "translate-x-1"}`}/></button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label className="block"><span className="mb-2 block text-xs font-semibold">Sound effect</span><select value={jeeAlerts.preferences.sound} onChange={(event) => { const sound = event.target.value as typeof jeeAlerts.preferences.sound; jeeAlerts.update({ sound }); if (jeeAlerts.preferences.soundEnabled) playJeeAlertSound(sound); }} className="h-11 w-full rounded-xl border border-border bg-background/75 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30">{JEE_ALERT_SOUNDS.map((sound) => <option key={sound.id} value={sound.id}>{sound.label} · {sound.description}</option>)}</select></label>
          <button type="button" onClick={() => playJeeAlertSound(jeeAlerts.preferences.sound)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background/70 px-4 text-sm font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><Volume2 className="h-4 w-4"/>Preview sound</button>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-muted-foreground">Desktop notifications arrive while JEE Prep Hub is open in a browser tab. This project does not currently have a background push service for alerts when the browser is closed.</p>
      </section>

      <NotificationStyleSetting />
      <section id="appearance" className="scroll-mt-24 overflow-hidden rounded-[30px] border border-white/60 bg-white/55 shadow-[0_24px_80px_-40px_rgba(28,48,35,0.25)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055]">
        <div className="border-b border-border/60 bg-gradient-to-r from-primary/[0.08] via-transparent to-accent/[0.08] p-5 sm:p-6">
          <div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Palette className="h-5 w-5"/></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Make it yours</p><h2 className="mt-1 text-xl font-bold">Theme &amp; interface</h2><p className="mt-1 text-sm text-muted-foreground">Mix an accent palette, page background color, surface style, background motion, and navigation layout. Changes apply immediately and are saved on this browser.</p></div></div>
        </div>
        <div className="space-y-6 p-5 sm:p-6">
          <div>
            <div className="mb-3"><h3 className="font-semibold">Theme presets</h3><p className="text-xs text-muted-foreground">Apply a coordinated look instantly, then fine-tune any color below.</p></div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
              {THEME_PRESETS.map((preset) => {
                const selected = theme === preset.theme && palette.palette === preset.palette && uiMode.mode === preset.surface && pageBackground.background.preset === preset.background && backgroundMotion.preset === preset.motion;
                return <button key={preset.id} type="button" onClick={() => applyThemePreset(preset)} aria-pressed={selected} className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${selected ? "border-primary bg-primary/[0.07] ring-2 ring-primary/15" : "border-border/80 bg-background/55 hover:border-primary/35"}`}>
                  <span className="mb-2 flex h-8 overflow-hidden rounded-lg border border-border/50" aria-hidden="true"><span className="flex-1" style={{ backgroundColor: BACKGROUND_COLORS[preset.background].color }}/><span className="w-1/3" style={{ backgroundColor: ({ ocean: "#3977ba", forest: "#39845c", coral: "#d97057", violet: "#7851b9", rose: "#bd527d", amber: "#b38622" } satisfies Record<ColorPalette, string>)[preset.palette] }}/></span>
                  <span className="block text-xs font-bold">{preset.name}</span><span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">{preset.description}</span>
                </button>;
              })}
            </div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/45 p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="flex items-center gap-2 font-semibold"><Type className="h-4 w-4 text-primary"/>Typography · Scholar Desk</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Choose the reading voice and text size for this style. Liquid Glass typography is unaffected.</p></div><span className="shrink-0 rounded-full border border-border bg-background/70 px-2.5 py-1 text-[10px] font-semibold">Local</span></div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
              {SCHOLAR_FONTS.map((font) => <button key={font.id} type="button" onClick={() => scholarTypography.update({ font: font.id })} aria-pressed={scholarTypography.preference.font === font.id} className={`min-w-0 rounded-xl border p-3 text-left transition ${scholarTypography.preference.font === font.id ? "border-primary bg-primary/[0.07] ring-2 ring-primary/15" : "border-border bg-background/55 hover:border-primary/35"}`}>
                <span className="block truncate text-lg font-bold" style={{ fontFamily: font.family }}>Aa 123</span><span className="mt-1 block text-xs font-semibold">{font.label}</span><span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">{font.description}</span>
              </button>)}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="block"><span className="mb-2 flex items-center justify-between text-xs font-semibold"><span>Typography scale</span><span className="text-muted-foreground">{Math.round(scholarTypography.preference.scale * 100)}%</span></span><input type="range" min="85" max="120" step="5" value={Math.round(scholarTypography.preference.scale * 100)} onChange={(event) => scholarTypography.update({ scale: Number(event.target.value) / 100 })} aria-label="Scholar Desk typography scale" className="w-full accent-primary"/><span className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>Compact · 85%</span><span>Roomy · 120%</span></span></label>
              <button type="button" onClick={scholarTypography.reset} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background/70 px-3 text-xs font-semibold transition hover:bg-muted"><RefreshCw className="h-3.5 w-3.5"/>Reset typography</button>
            </div>
            <div className="mt-4 rounded-xl border border-border/70 bg-card p-4" style={{ fontFamily: selectedScholarFont.family }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Live sample · JEE Prep Hub</p>
              <p className="mt-2 font-bold leading-tight" style={{ fontSize: `${24 * scholarTypography.preference.scale}px` }}>Make every study session count.</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Clear notes. Confident practice. Your choice of type, sized for comfortable reading.</p>
            </div>
          </div>
          <div>
            <div className="mb-3 flex items-end justify-between gap-2"><div><h3 className="font-semibold">Color palette</h3><p className="text-xs text-muted-foreground">Accent, focus rings, and highlights throughout the site</p></div><span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold capitalize">{palette.palette}</span></div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {([
                { key: "ocean", label: "Ocean", swatch: "bg-palette-ocean", detail: "Cool blue" },
                { key: "forest", label: "Forest", swatch: "bg-palette-forest", detail: "Calm green" },
                { key: "coral", label: "Coral", swatch: "bg-palette-coral", detail: "Warm coral" },
                { key: "violet", label: "Violet", swatch: "bg-palette-violet", detail: "Electric purple" },
                { key: "rose", label: "Rose", swatch: "bg-palette-rose", detail: "Soft rose" },
                { key: "amber", label: "Amber", swatch: "bg-palette-amber", detail: "Golden glow" },
              ] as { key: ColorPalette; label: string; swatch: string; detail: string }[]).map((option) => (
                <button key={option.key} type="button" onClick={() => palette.set(option.key)} aria-pressed={palette.palette === option.key} className={`group flex items-center gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${palette.palette === option.key ? "border-primary bg-primary/[0.08] ring-2 ring-primary/20" : "border-border/80 bg-background/50 hover:border-primary/35"}`}>
                  <span className={`h-9 w-9 shrink-0 rounded-xl shadow-inner ring-1 ring-black/5 ${option.swatch}`} />
                  <span className="min-w-0"><span className="block text-sm font-bold">{option.label}</span><span className="block text-[10px] text-muted-foreground">{option.detail}</span></span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/45 p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div><h3 className="font-semibold">Page background color</h3><p className="mt-1 text-xs text-muted-foreground">A gentle tint behind your content; dark mode automatically keeps it subtle.</p></div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background/70 p-2"><span className="h-7 w-7 rounded-lg border border-border/70" style={{ backgroundColor: pageBackground.background.color }} aria-hidden="true"/><span className="font-mono text-xs uppercase">{pageBackground.background.color}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {(Object.entries(BACKGROUND_COLORS) as [Exclude<BackgroundColorPreset, "custom">, { label: string; color: string }][]).map(([key, option]) => (
                <button key={key} type="button" onClick={() => pageBackground.update({ preset: key, color: option.color })} aria-pressed={pageBackground.background.preset === key} className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition ${pageBackground.background.preset === key ? "border-primary bg-primary/[0.07] ring-2 ring-primary/15" : "border-border bg-background/50 hover:border-primary/30"}`}>
                  <span className="h-7 w-7 shrink-0 rounded-lg border border-black/10 shadow-inner" style={{ backgroundColor: option.color }}/><span className="text-xs font-semibold">{option.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="block"><span className="mb-2 block text-xs font-semibold">Tint strength <span className="font-normal text-muted-foreground">{pageBackground.background.strength}%</span></span><input type="range" min="20" max="100" step="5" value={pageBackground.background.strength} onChange={(event) => pageBackground.update({ strength: Number(event.target.value) })} className="w-full accent-primary"/></label>
              <label className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background/70 px-3 text-xs font-semibold">Custom color<input type="color" aria-label="Choose a custom page background color" value={pageBackground.background.color} onChange={(event) => pageBackground.update({ preset: "custom", color: event.target.value })} className="h-7 w-9 cursor-pointer rounded-md border-0 bg-transparent p-0"/></label>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div><h3 className="mb-1 font-semibold">Light or dark</h3><p className="mb-3 text-xs text-muted-foreground">Choose the contrast style used across the website</p><div className="grid grid-cols-2 gap-2">{([{ key: "light", label: "Light", icon: SunMoon, sample: "bg-white text-slate-800 border-slate-200" }, { key: "dark", label: "Dark", icon: SunMoon, sample: "bg-slate-950 text-slate-100 border-slate-700" }] as const).map((option) => <button key={option.key} type="button" onClick={() => setTheme(option.key)} aria-pressed={theme === option.key} className={`flex items-center justify-between rounded-2xl border p-3 text-sm font-semibold transition ${theme === option.key ? "border-primary ring-2 ring-primary/20" : "border-border"} ${option.sample}`}><span className="flex items-center gap-2"><option.icon className="h-4 w-4"/>{option.label}</span><span className="flex gap-1"><i className="h-4 w-4 rounded-full bg-primary"/><i className="h-4 w-4 rounded-full bg-accent"/></span></button>)}</div></div>
            <div><h3 className="mb-1 font-semibold">Surface style</h3><p className="mb-3 text-xs text-muted-foreground">Choose the site-wide visual identity</p><div className="grid grid-cols-2 gap-2">{([{ key: "glass", label: "Liquid Glass", desc: "Soft translucent depth", icon: Layers3 }, { key: "legacy", label: "Scholar Desk", desc: "Ruled-paper warmth, ink surfaces & crisp editorial edges", icon: PanelLeft }] as const).map((option) => <button key={option.key} type="button" onClick={() => uiMode.set(option.key)} aria-pressed={uiMode.mode === option.key} className={`flex min-h-20 items-start gap-3 rounded-2xl border p-3 text-left transition ${uiMode.mode === option.key ? "border-primary bg-primary/[0.08] ring-2 ring-primary/15" : "border-border bg-background/50 hover:border-primary/35"}`}><option.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary"/><span><b className="block text-sm">{option.label}</b><small className="mt-1 block text-[11px] text-muted-foreground">{option.desc}</small></span></button>)}</div></div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
            <div className="rounded-2xl border border-border/70 bg-background/45 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3"><div><h3 className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-primary"/>Animated background</h3><p className="mt-1 text-xs text-muted-foreground">Tune the ambient color wash or turn it off to keep the interface static.</p></div><button type="button" role="switch" aria-label="Animate background" aria-checked={backgroundMotion.motion.enabled} onClick={() => backgroundMotion.update({ enabled: !backgroundMotion.motion.enabled })} className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 ${backgroundMotion.motion.enabled ? "bg-primary" : "bg-muted-foreground/30"}`}><span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${backgroundMotion.motion.enabled ? "translate-x-6" : "translate-x-1"}`}/></button></div>
              <div className="mt-4 grid grid-cols-3 gap-2">{([{ key: "default", label: "Vibrant", desc: "Color drift" }, { key: "soft", label: "Soft", desc: "Slow & subtle" }, { key: "off", label: "Static", desc: "No animation" }] as { key: BgPresetKey; label: string; desc: string }[]).map((option) => <button key={option.key} type="button" onClick={() => backgroundMotion.update(BG_PRESETS[option.key])} aria-pressed={backgroundMotion.preset === option.key} className={`rounded-xl border p-2 text-left transition ${backgroundMotion.preset === option.key ? "border-primary bg-primary/[0.08] text-primary" : "border-border hover:bg-muted/50"}`}><span className="block text-xs font-bold">{option.label}</span><span className="mt-0.5 block text-[10px] text-muted-foreground">{option.desc}</span></button>)}</div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block"><span className="mb-1 flex justify-between text-xs"><span>Intensity</span><span className="text-muted-foreground">{Math.round(backgroundMotion.motion.strength * 100)}%</span></span><input aria-label="Background intensity" type="range" min="20" max="140" step="5" value={Math.round(backgroundMotion.motion.strength * 100)} onChange={(event) => backgroundMotion.update({ strength: Number(event.target.value) / 100 })} className="w-full accent-primary"/></label>
                <label className="block"><span className="mb-1 flex justify-between text-xs"><span>Drift speed</span><span className="text-muted-foreground">{backgroundMotion.motion.speed}s</span></span><input aria-label="Background drift speed" type="range" min="6" max="60" step="2" value={backgroundMotion.motion.speed} onChange={(event) => backgroundMotion.update({ speed: Number(event.target.value) })} className="w-full accent-primary"/></label>
              </div>
              <label className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-muted/35 p-3 text-xs"><span><b className="block">Cycle accent hues</b><span className="text-muted-foreground">Slowly shift through complementary colors</span></span><input type="checkbox" checked={backgroundMotion.motion.hue} onChange={(event) => backgroundMotion.update({ hue: event.target.checked })} className="h-4 w-4 accent-primary"/></label>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/45 p-4 sm:p-5">
              <h3 className="flex items-center gap-2 font-semibold"><PanelBottom className="h-4 w-4 text-primary"/>Mobile menu layout</h3><p className="mt-1 text-xs text-muted-foreground">Pick how the feature menu enters on smaller screens. Desktop navigation remains unchanged.</p>
              <div className="mt-4 grid gap-2">{([{ key: "drawer", label: "Side drawer", desc: "Slides in from the left", icon: PanelLeft }, { key: "sheet", label: "Bottom sheet", desc: "Rises from the bottom", icon: PanelBottom }] as const).map((option) => <button key={option.key} type="button" onClick={() => menuStyle.setStyle(option.key)} aria-pressed={menuStyle.style === option.key} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${menuStyle.style === option.key ? "border-primary bg-primary/[0.08]" : "border-border hover:bg-muted/50"}`}><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><option.icon className="h-4 w-4"/></span><span className="flex-1"><b className="block text-sm">{option.label}</b><small className="text-xs text-muted-foreground">{option.desc}</small></span><span className={`h-4 w-4 rounded-full border-2 ${menuStyle.style === option.key ? "border-primary bg-primary ring-2 ring-primary/20" : "border-muted-foreground/40"}`}/></button>)}</div>
              <button type="button" onClick={() => { setTheme("light"); palette.set("ocean"); uiMode.set("glass"); menuStyle.setStyle("drawer"); backgroundMotion.update(BG_PRESETS.default); pageBackground.update({ preset: "default", color: BACKGROUND_COLORS.default.color, strength: 72 }); scholarTypography.reset(); }} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold transition hover:bg-muted"><RefreshCw className="h-3.5 w-3.5"/>Restore default look</button>
            </div>
          </div>
          <p className="text-[11px] leading-5 text-muted-foreground">Customization is stored locally in this browser. Your operating system’s reduced-motion preference is always respected by site animations.</p>
        </div>
      </section>

      {/* Header */}
      <div id="ai-settings" className="scroll-mt-6 rounded-[30px] border border-white/60 bg-white/55 p-6 shadow-[0_24px_80px_-40px_rgba(28,48,35,0.3)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055]">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-foreground/10">
            <Sparkles className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              AI Study Intelligence
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Connect your own AI API key and unlock AI-powered
              study planning, coaching, weakness analysis and
              revision tools.
            </p>
          </div>
        </div>
      </div>

      {/* Provider */}
      <section className="rounded-[30px] border border-white/60 bg-white/55 p-5 shadow-[0_24px_80px_-40px_rgba(28,48,35,0.25)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055]">
        <div className="mb-5">
          <h2 className="font-semibold">
            AI Provider
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Choose the service that will process your AI requests.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ["openai", "OpenAI"],
              ["gemini", "Google Gemini"],
              ["openai-compatible", "OpenAI-compatible"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setProvider(value);
                setModel(
                  value === "openai"
                    ? "gpt-5.6"
                    : value === "gemini"
                      ? "gemini-2.5-flash"
                      : "gpt-4o-mini"
                );
              }}
              className={`rounded-2xl border p-4 text-left transition ${
                provider === value
                  ? "border-foreground/30 bg-foreground/10"
                  : "border-white/50 bg-white/35 hover:bg-white/55 dark:border-white/10 dark:bg-white/[0.035] dark:hover:bg-white/[0.08]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {label}
                </span>

                {provider === value && (
                  <Check className="h-4 w-4" />
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* API configuration */}
      <section className="rounded-[30px] border border-white/60 bg-white/55 p-5 shadow-[0_24px_80px_-40px_rgba(28,48,35,0.25)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055]">
        <div className="mb-5">
          <h2 className="font-semibold">
            API Configuration
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Your key is kept locally in this browser.
          </p>
        </div>

        {/* API Key */}
        <label className="block">
          <span className="mb-2 block text-sm font-medium">
            API Key
          </span>

          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(event) =>
                setApiKey(event.target.value)
              }
              placeholder="Enter your API key"
              className="h-12 w-full rounded-2xl border border-white/60 bg-white/45 pl-10 pr-12 outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10 dark:border-white/10 dark:bg-white/[0.04]"
              autoComplete="off"
            />

            <button
              type="button"
              onClick={() => setShowKey((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label={
                showKey ? "Hide API key" : "Show API key"
              }
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </label>

        {/* Model */}
        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-medium">
            Model
          </span>

          <select
            value={model}
            onChange={(event) =>
              setModel(event.target.value)
            }
            className="h-12 w-full rounded-2xl border border-white/60 bg-white/45 px-4 outline-none dark:border-white/10 dark:bg-white/[0.04]"
          >
            {providerModels[provider].map(
              (item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              )
            )}
          </select>
        </label>

        {/* Custom endpoint */}
        {provider === "openai-compatible" && (
          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-medium">
              Base URL
            </span>

            <input
              value={baseUrl}
              onChange={(event) =>
                setBaseUrl(event.target.value)
              }
              placeholder="https://your-provider.com/v1"
              className="h-12 w-full rounded-2xl border border-white/60 bg-white/45 px-4 outline-none focus:border-foreground/30 dark:border-white/10 dark:bg-white/[0.04]"
            />
          </label>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={testConnection}
            disabled={testing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/60 bg-white/50 px-5 text-sm font-semibold transition hover:bg-white/70 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.1]"
          >
            {testing && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            Test Connection
          </button>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            Save AI Settings
          </button>

          {configured && (
            <button
              type="button"
              onClick={remove}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-destructive/20 px-5 text-sm font-semibold text-destructive transition hover:bg-destructive/5"
            >
              <Trash2 className="h-4 w-4" />
              Remove Key
            </button>
          )}
        </div>
      </section>

      {/* Privacy */}
      <section className="rounded-[30px] border border-white/60 bg-white/45 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.035]">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-semibold">
              Your key stays on this device
            </p>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              JEE Prep Hub does not need to store your API key.
              AI requests are sent directly from your browser to
              the selected provider.
            </p>
          </div>
        </div>
      </section>
      </main>
    </div>
  );
        }
