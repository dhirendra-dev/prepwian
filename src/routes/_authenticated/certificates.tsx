import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn as useFn } from "@tanstack/react-start";
import {
  Award, Search, Download, Share2, Eye, Lock, Flame, Clock,
  Users, Atom, Trophy, Sparkles, Medal,
  CalendarDays, CheckCircle2, ArrowUpRight, LayoutGrid, List,
  ChevronRight, RefreshCw, BookOpen, Target, GraduationCap,
  HeartHandshake, Crown, Zap, X, SlidersHorizontal, FileBadge,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { HTMLAttributes } from "react";
import { AppShell } from "@/components/AppShell";
import {
  getMyCertificateData,
  type CertificateType,
  type EarnedCertificate,
} from "@/lib/certificates.functions";
import {
  generateCertificatePdf,
  downloadCertificate,
} from "@/lib/certificate-pdf";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/certificates")({
  head: () => ({
    meta: [
      { name: "description", content: "Explore your PREPWIAN certificates and achievements." },
      { property: "og:title", content: "Certificates | PREPWIAN" },
      { property: "og:description", content: "Explore your PREPWIAN certificates and achievements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Certificates | PREPWIAN" },
      { name: "twitter:description", content: "Explore your PREPWIAN certificates and achievements." },
{ title: "Certificates | PREPWIAN" }],
  }),
  component: CertificatesPage,
});

type Category =
  | "All"
  | "Membership"
  | "Study"
  | "Test Series"
  | "Academic"
  | "Community"
  | "Special";

type ViewMode = "grid" | "list";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  membership: Users,
  pomodoro: Flame,
  streak: Zap,
  hours: Clock,
  mastery: Atom,
  social: HeartHandshake,
  academic: GraduationCap,
  test_series: Trophy,
  competition: Medal,
  courses: BookOpen,
  challenges: Target,
  preparation: BookOpen,
  community: Users,
  leadership: Crown,
  recognition: Award,
  events: Sparkles,
};

const FILTERS: { label: Category; icon: LucideIcon }[] = [
  { label: "All", icon: LayoutGrid },
  { label: "Membership", icon: Users },
  { label: "Study", icon: Flame },
  { label: "Test Series", icon: Trophy },
  { label: "Academic", icon: GraduationCap },
  { label: "Community", icon: HeartHandshake },
  { label: "Special", icon: Sparkles },
];

function categoryOf(type?: CertificateType | null): Exclude<Category, "All"> {
  const category = type?.category?.toLowerCase() ?? "";

  if (["membership", "account_membership"].includes(category)) return "Membership";
  if (["pomodoro", "streak", "hours", "focus", "consistency"].includes(category)) return "Study";
  if (["test_series", "test-series", "competition"].includes(category)) return "Test Series";
  if (["mastery", "academic", "jee_neet"].includes(category)) return "Academic";
  if (["social", "community", "leadership"].includes(category)) return "Community";

  return "Special";
}

function formatDate(date?: string | null) {
  if (!date) return "Date unavailable";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Date unavailable";

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getIcon(type?: CertificateType | null): LucideIcon {
  return (type?.icon && CATEGORY_ICONS[type.icon]) ||
    CATEGORY_ICONS[type?.category ?? ""] ||
    Award;
}

function getCertificateTitle(c: EarnedCertificate, t?: CertificateType | null) {
  return c.title_snapshot ?? t?.name ?? c.type?.name ?? c.custom_title ?? "Certificate";
}

function getCertificateDescription(
  c: EarnedCertificate,
  t?: CertificateType | null,
) {
  return (
    c.description_snapshot ??
    t?.description ??
    c.type?.description ??
    c.custom_description ??
    "Recognition for your learning journey."
  );
}

function getCertificateDetails(c: EarnedCertificate) {
  const snapshot = c.details_snapshot;
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return [];
  const fields = (snapshot as { fields?: unknown }).fields;
  if (!Array.isArray(fields)) return [];
  return fields.filter(
    (field): field is { key: string; label: string; value: string } =>
      !!field &&
      typeof field === "object" &&
      typeof (field as { key?: unknown }).key === "string" &&
      typeof (field as { label?: unknown }).label === "string" &&
      typeof (field as { value?: unknown }).value === "string" &&
      !!(field as { value: string }).value.trim(),
  );
}

function GlassPanel({
  children,
  className = "",
  ...sectionProps
}: HTMLAttributes<HTMLElement>) {
  return (
    <section
      {...sectionProps}
      className={`relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/75 dark:border-white/10 dark:bg-slate-900/65 shadow-[0_10px_32px_-22px_rgba(30,64,110,0.24)] backdrop-blur-md sm:backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/65 ${className}`}
    >
      {children}
    </section>
  );
}

function CertificateArtwork({
  title,
  category,
  icon: Icon,
  compact = false,
}: {
  title: string;
  category: string;
  icon: LucideIcon;
  compact?: boolean;
}) {
  return (
    <div
      className={`group/art relative isolate overflow-hidden rounded-2xl border border-amber-300/50 bg-gradient-to-br from-[#06152d] via-[#102b50] to-[#071226] text-white shadow-lg ${
        compact ? "aspect-[1.48]" : "aspect-[1.48] min-[400px]:aspect-[1.38] sm:aspect-[1.55]"
      }`}
    >
      <div className="pointer-events-none absolute inset-[5px] rounded-xl border border-amber-300/50" />
      <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-sky-400/15 blur-3xl transition group-hover/art:bg-sky-400/30" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-amber-400/15 blur-3xl" />

      <div className="relative flex h-full flex-col items-center justify-center px-3 py-4 text-center">
        <div className="mb-1.5 flex items-center gap-1 text-[7px] font-bold tracking-[0.15em] text-amber-200 min-[420px]:text-[8px] sm:mb-2 sm:gap-1.5 sm:tracking-[0.24em] sm:text-[10px]">
          <Sparkles className="h-3 w-3" />
          PREPWIAN
        </div>
        <div className="text-[7px] font-medium tracking-[0.12em] text-sky-100/80 sm:text-[10px] sm:tracking-[0.2em]">
          CERTIFICATE
        </div>
        <div className="mt-0.5 line-clamp-2 max-w-full break-words text-[12px] font-semibold uppercase leading-tight tracking-normal text-amber-200 min-[400px]:text-[10px] min-[480px]:text-[11px] sm:text-lg sm:tracking-wide">
          {title}
        </div>
        <div className="my-2 flex h-8 w-8 items-center justify-center rounded-full border border-amber-300/70 bg-amber-200/10 sm:my-3 sm:h-12 sm:w-12">
          <Icon className="h-4 w-4 text-amber-200 sm:h-6 sm:w-6" />
        </div>
        <div className="max-w-full truncate text-[7px] text-sky-100/80 sm:text-[9px]">
          {category.toUpperCase()}
        </div>
        <div className="mt-2 h-px w-2/3 bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
        <div className="mt-1.5 text-[6px] tracking-[0.1em] text-white/60 sm:mt-2 sm:text-[7px] sm:tracking-[0.18em]">
          LEARN · GROW · SUCCEED
        </div>
      </div>
    </div>
  );
}

// Theme is intentionally inherited from the app-wide theme provider/Tailwind `dark` class.
// Do not add a page-specific theme state, provider, or toggle here.
function CertificatesPage() {
  const fetchData = useFn(getMyCertificateData);
  const q = useQuery({
    queryKey: ["my-certificates"],
    queryFn: () => fetchData(),
  });

  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sort, setSort] = useState("latest");
  const [showLocked, setShowLocked] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<{
    earned: EarnedCertificate;
    type?: CertificateType | null;
  } | null>(null);

  const earned = q.data?.earned ?? [];
  const types = q.data?.types ?? [];
  const progress = q.data?.progress;

  const earnedByTypeId = useMemo(
    () =>
      new Map(
        earned
          .filter((c) => c.certificate_type_id)
          .map((c) => [c.certificate_type_id!, c]),
      ),
    [earned],
  );

  const customs = earned.filter((c) => !c.certificate_type_id);

  const items = useMemo(() => {
    const rows: {
      earned: EarnedCertificate | null;
      type: CertificateType | null;
      title: string;
      description: string;
      category: Exclude<Category, "All">;
      date: string | null;
    }[] = [];

    for (const type of types) {
      const cert = earnedByTypeId.get(type.id) ?? null;
      if (!cert && !showLocked) continue;

      rows.push({
        earned: cert,
        type,
        title: cert ? getCertificateTitle(cert, type) : type.name,
        description: cert ? getCertificateDescription(cert, type) : type.description,
        category: categoryOf(type),
        date: cert?.awarded_at ?? null,
      });
    }

    for (const cert of customs) {
      rows.push({
        earned: cert,
        type: cert.type ?? null,
        title: getCertificateTitle(cert),
        description: getCertificateDescription(cert),
        category: categoryOf(cert.type),
        date: cert.awarded_at,
      });
    }

    const needle = search.trim().toLowerCase();
    const filtered = rows.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesSearch =
        !needle ||
        item.title.toLowerCase().includes(needle) ||
        item.description.toLowerCase().includes(needle) ||
        item.category.toLowerCase().includes(needle);

      return matchesCategory && matchesSearch;
    });

    return filtered.sort((a, b) => {
      if (sort === "oldest")
        return (a.date ? new Date(a.date).getTime() : Infinity) -
          (b.date ? new Date(b.date).getTime() : Infinity);
      if (sort === "name") return a.title.localeCompare(b.title);
      return (b.date ? new Date(b.date).getTime() : 0) -
        (a.date ? new Date(a.date).getTime() : 0);
    });
  }, [types, earnedByTypeId, customs, activeCategory, search, sort, showLocked]);

  const earnedCount = earned.length;
  const categoriesEarned = new Set(
    earned.map((c) => {
      const type = types.find((t) => t.id === c.certificate_type_id);
      return categoryOf(type ?? c.type);
    }),
  ).size;

  const categoryCount = (category: Category) =>
    category === "All"
      ? earnedCount
      : earned.filter((c) => {
          const type = types.find((t) => t.id === c.certificate_type_id);
          return categoryOf(type ?? c.type) === category;
        }).length;

  const download = async (cert: EarnedCertificate, type?: CertificateType | null) => {
    if (cert.revoked_at) {
      toast.error("This certificate has been revoked.");
      return;
    }

    const title = getCertificateTitle(cert, type);
    const verifyUrl =
      `${window.location.origin}/certificates/verify/${encodeURIComponent(cert.verification_code)}`;

    setDownloadingId(cert.id);
    try {
      const bytes = await generateCertificatePdf({
        recipientName: q.data?.recipientName ?? "JEE Aspirant",
        title,
        description: getCertificateDescription(cert, type),
        awardedAt: cert.awarded_at,
        verificationCode: cert.verification_code,
        verifyUrl,
        subtitle: cert.subtitle_snapshot ?? type?.subtitle ?? cert.type?.subtitle,
        category: cert.category_snapshot ?? type?.category ?? cert.type?.category,
        templateKey: cert.template_key_snapshot ?? type?.template_key ?? cert.type?.template_key,
        details: getCertificateDetails(cert),
        certificateKind: cert.certificate_kind,
        examCategory: cert.exam_category,
        testName: cert.test_name,
        rankText: cert.rank_text,
        score: cert.score,
        maximumMarks: cert.maximum_marks,
        issuerName: cert.issuer_name,
        revoked: false,
      });

      downloadCertificate(bytes, `${title.replace(/[^a-z0-9_-]/gi, "_")}_certificate.pdf`);
      toast.success("Your certificate is ready.");
    } catch (error) {
      console.error("[certificates] PDF generation failed", error);
      toast.error("Could not generate PDF", {
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const share = async (cert: EarnedCertificate, type?: CertificateType | null) => {
    const title = getCertificateTitle(cert, type);
    const url =
      `${window.location.origin}/certificates/verify/${encodeURIComponent(cert.verification_code)}`;
    const text = `I earned "${title}" on PREPWIAN! Verify my certificate: ${url}`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success("Certificate link copied.");
      } else {
        window.prompt("Copy your certificate link:", url);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        toast.error("Unable to share this certificate.");
      }
    }
  };

  const clearFilters = () => {
    setSearch("");
    setActiveCategory("All");
    setShowLocked(true);
  };

  return (
    <AppShell>
      <div className="relative isolate mx-auto min-h-screen max-w-[1440px] overflow-hidden px-2 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden sm:block">
          <div className="absolute -left-40 top-10 h-72 w-72 rounded-full bg-sky-400/12 blur-3xl" />
          <div className="absolute -right-24 top-72 h-80 w-80 rounded-full bg-violet-400/12 blur-3xl" />
          <div className="absolute bottom-40 left-1/3 h-64 w-64 rounded-full bg-cyan-400/8 blur-3xl" />
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-6 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/40 bg-gradient-to-br from-slate-950 to-blue-950 text-amber-300 shadow-lg">
              <FileBadge className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                PREPWIAN
              </p>
              <h1 className="text-lg font-bold tracking-tight sm:text-2xl">Certificates</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Every milestone matters
          </div>
        </div>

        <GlassPanel className="mb-4 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white dark:border-white/15 sm:mb-6">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-[80px]" />
          <div className="pointer-events-none absolute bottom-0 right-1/3 h-40 w-40 rounded-full bg-amber-400/10 blur-[70px]" />
          <div className="relative grid items-center gap-5 p-4 sm:gap-8 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200/25 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-amber-100 backdrop-blur-xl">
                <Sparkles className="h-3.5 w-3.5" />
                YOUR LEARNING JOURNEY
              </div>
              <h2 className="max-w-2xl text-[2rem] font-black leading-[1.04] tracking-tight min-[420px]:text-4xl sm:text-5xl lg:text-6xl">
                Small steps.
                <span className="block bg-gradient-to-r from-amber-200 via-yellow-400 to-orange-300 bg-clip-text text-transparent">
                  Lasting impact.
                </span>
              </h2>
              <p className="mt-3 max-w-xl text-[13px] leading-5 text-blue-100/80 sm:mt-4 sm:text-base sm:leading-6">
                Celebrate your consistency, academic progress, test performance, and contributions to the PREPWIAN community.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5 sm:mt-6 sm:gap-3">
                <Button
                  onClick={() => document.getElementById("my-certificates")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="min-h-10 rounded-full bg-gradient-to-r from-amber-200 to-yellow-400 px-4 text-xs font-bold sm:px-5 sm:text-sm text-slate-950 shadow-[0_0_28px_rgba(251,191,36,0.18)] hover:from-amber-100 hover:to-yellow-300"
                >
                  <Award className="mr-2 h-4 w-4" />
                  View my certificates
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveCategory("All");
                    setShowLocked(true);
                    document.getElementById("my-certificates")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="min-h-10 rounded-full border-white/25 bg-white/10 text-xs text-white backdrop-blur-sm hover:bg-white/20 hover:text-white sm:text-sm"
                >
                  Explore milestones
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative mx-auto hidden w-full max-w-md lg:block">
              <div className="absolute inset-8 rounded-full bg-blue-400/20 blur-3xl" />
              <div className="relative rotate-[-3deg] rounded-[28px] border border-white/20 bg-white/[0.07] p-3 shadow-2xl backdrop-blur-xl transition duration-500 motion-reduce:transition-none motion-reduce:transform-none hover:rotate-0">
                <CertificateArtwork title="Achievement" category="Excellence & Progress" icon={Trophy} />
                <div className="absolute -right-2 -top-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-200 to-amber-500 text-slate-950 shadow-xl">
                  <Crown className="h-6 w-6" />
                </div>
              </div>
              <div className="absolute -bottom-3 -left-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-xl backdrop-blur-2xl">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Your achievements</p>
                    <p className="text-[10px] text-blue-100/70">Earned, stored and verifiable</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassPanel>

        <div className="mb-4 grid grid-cols-2 gap-2.5 sm:mb-6 sm:gap-3 xl:grid-cols-4">
          {[
            { label: "Certificates earned", value: earnedCount, icon: Award, tone: "from-amber-400/20 to-orange-400/5", color: "text-amber-700 dark:text-amber-300" },
            { label: "Categories represented", value: categoriesEarned, icon: LayoutGrid, tone: "from-sky-400/20 to-blue-400/5", color: "text-sky-700 dark:text-sky-300" },
            { label: "Study hours", value: progress ? Math.floor(progress.totalHours) : "—", icon: Clock, tone: "from-emerald-400/20 to-teal-400/5", color: "text-emerald-700 dark:text-emerald-300" },
            { label: "Longest study streak", value: progress ? `${progress.longestStreak} days` : "—", icon: Flame, tone: "from-violet-400/20 to-purple-400/5", color: "text-violet-700 dark:text-violet-300" },
          ].map((stat) => (
            <GlassPanel key={stat.label} className={`bg-gradient-to-br ${stat.tone}`}>
              <div className="flex items-center gap-2.5 p-3 sm:gap-3 sm:p-5">
                <div className={`rounded-xl bg-white/60 p-2.5 shadow-sm dark:bg-white/10 sm:rounded-2xl sm:p-3 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-black tracking-tight sm:text-2xl">{stat.value}</p>
                  <p className="text-[10px] leading-4 text-muted-foreground min-[420px]:text-[11px] sm:text-xs">{stat.label}</p>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>

        <div className="mb-4 -mx-2 flex gap-2 overflow-x-auto px-2 pb-2 sm:mx-0 sm:mb-5 sm:px-0">
          {FILTERS.map(({ label, icon: Icon }) => {
            const active = activeCategory === label;
            return (
              <button
                key={label}
                onClick={() => setActiveCategory(label)}
                className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:gap-2 sm:px-4 sm:text-xs ${
                  active
                    ? "border-blue-900 bg-gradient-to-r from-slate-950 to-blue-950 text-white shadow-lg dark:border-blue-300/30"
                    : "border-white/70 bg-white/55 text-muted-foreground backdrop-blur-xl hover:border-blue-300 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {label !== "All" && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/15 text-white" : "bg-muted text-muted-foreground"}`}>
                    {categoryCount(label)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <GlassPanel id="my-certificates" className="scroll-mt-5">
          <div className="border-b border-slate-200/70 p-3 dark:border-white/10 sm:p-6">
            <div className="flex flex-col gap-3 sm:gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 to-blue-900 text-amber-200 shadow-lg">
                  <FileBadge className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">My certificates</h2>
                  <p className="text-xs text-muted-foreground">{earnedCount} earned · {types.length} milestones available</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-0 flex-1 sm:min-w-[220px] sm:flex-none">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    aria-label="Search certificates"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search certificates..."
                    className="h-10 w-full rounded-xl border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-slate-900/60 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-400 dark:text-slate-100 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-blue-400/20 dark:border-white/10 dark:bg-white/5"
                  />
                </div>
                <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-slate-900/60 px-3 dark:border-white/10 dark:bg-white/5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                  <select aria-label="Sort certificates" value={sort} onChange={(e) => setSort(e.target.value)} className="max-w-[100px] bg-transparent text-xs text-slate-900 outline-none dark:text-slate-100 sm:max-w-none">
                    <option className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100" value="latest">Latest</option>
                    <option className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100" value="oldest">Oldest</option>
                    <option className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100" value="name">Name A–Z</option>
                  </select>
                </label>
                <div className="flex rounded-xl border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-slate-900/60 p-1 dark:border-white/10 dark:bg-white/5">
                  <button aria-label="Grid view" aria-pressed={viewMode === "grid"} onClick={() => setViewMode("grid")} className={`rounded-lg p-2 ${viewMode === "grid" ? "bg-blue-950 text-white shadow-md" : "text-muted-foreground"}`}>
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button aria-label="List view" aria-pressed={viewMode === "list"} onClick={() => setViewMode("list")} className={`rounded-lg p-2 ${viewMode === "list" ? "bg-blue-950 text-white shadow-md" : "text-muted-foreground"}`}>
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={showLocked} onChange={(e) => setShowLocked(e.target.checked)} className="accent-blue-800" />
              Show locked milestones
            </label>
          </div>

          {q.isLoading ? (
            <div className="grid place-items-center gap-3 p-16 text-center">
              <RefreshCw className="h-7 w-7 animate-spin text-blue-500" />
              <p className="text-sm text-muted-foreground">Loading your achievements...</p>
            </div>
          ) : q.isError ? (
            <div className="grid place-items-center gap-3 p-12 text-center">
              <div className="rounded-2xl bg-destructive/10 p-4 text-destructive"><RefreshCw className="h-6 w-6" /></div>
              <p className="font-semibold">Couldn't load certificates</p>
              <p className="max-w-sm text-sm text-muted-foreground">Your awards have not been deleted. Try refreshing your certificate data.</p>
              <Button variant="outline" onClick={() => q.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Try again</Button>
            </div>
          ) : items.length === 0 ? (
            <div className="grid place-items-center gap-3 px-6 py-16 text-center">
              <div className="rounded-3xl border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-slate-900/60 p-5 text-blue-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-200"><Search className="h-7 w-7" /></div>
              <h3 className="text-lg font-bold">No certificates found</h3>
              <p className="max-w-sm text-sm text-muted-foreground">Try another search or category, or clear your filters.</p>
              <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 gap-3 p-3 min-[400px]:grid-cols-2 min-[400px]:gap-3 sm:gap-4 sm:p-5 xl:grid-cols-3" : "flex flex-col gap-3 p-3 sm:p-5"}>
              {items.map((item) => {
                const cert = item.earned;
                const Icon = getIcon(item.type);
                const locked = !cert;

                if (viewMode === "list") {
                  return (
                    <div key={cert?.id ?? item.type?.id ?? item.title} className="group flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-slate-900/55 p-3 transition hover:border-blue-300/70 hover:bg-white/80 dark:border-white/10 dark:bg-white/[0.035] dark:hover:bg-white/[0.07] sm:flex-row sm:items-center">
                      <div className="w-full shrink-0 sm:w-44"><CertificateArtwork title={item.title} category={item.category} icon={Icon} compact /></div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold text-blue-800 dark:text-blue-300">{item.category}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${locked ? "bg-slate-500/10 text-muted-foreground" : cert.revoked_at ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}>
                            {locked ? <Lock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                            {locked ? "Locked" : cert.revoked_at ? "Revoked" : "Earned"}
                          </span>
                        </div>
                        <h3 className="truncate font-bold">{item.title}</h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.description}</p>
                        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{cert ? formatDate(cert.awarded_at) : "Complete the milestone to unlock"}</p>
                      </div>
                      {cert && (
                        <div className="flex shrink-0 gap-2 sm:flex-col">
                          <Button size="sm" variant="outline" onClick={() => setSelected({ earned: cert, type: item.type })} className="rounded-xl"><Eye className="mr-1.5 h-4 w-4" />View</Button>
                          <Button size="sm" onClick={() => download(cert, item.type)} disabled={!!cert.revoked_at || downloadingId === cert.id} className="rounded-xl bg-blue-950 text-white hover:bg-blue-900">{downloadingId === cert.id ? <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}{downloadingId === cert.id ? "Preparing" : "PDF"}</Button>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <article key={cert?.id ?? item.type?.id ?? item.title} className={`group relative min-w-0 overflow-hidden rounded-2xl border bg-white/55 p-3 shadow-sm backdrop-blur-xl transition duration-300 dark:bg-white/[0.035] ${locked ? "border-dashed border-slate-300/80 opacity-80 dark:border-white/15" : "border-white/70 hover:-translate-y-1 hover:border-blue-300/70 hover:shadow-xl hover:shadow-blue-950/5 dark:border-white/10"}`}>
                    <div className="mb-2 sm:mb-3">
                      <CertificateArtwork title={item.title} category={item.category} icon={Icon} />
                      {!locked && <div className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full border border-white/80 bg-emerald-500 text-white shadow-lg"><CheckCircle2 className="h-4 w-4" /></div>}
                      {locked && <div className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full border border-white/80 bg-slate-900/75 text-white shadow-lg"><Lock className="h-3.5 w-3.5" /></div>}
                    </div>
                    <div className="flex min-h-5 items-center justify-between gap-1">
                      <span className="max-w-[68%] truncate rounded-full bg-blue-500/10 px-2 py-1 text-[9px] font-semibold leading-4 text-blue-800 dark:text-blue-300 sm:max-w-[72%] sm:px-2.5 sm:text-[10px]">{item.category}</span>
                      <span className={`text-[9px] font-semibold sm:text-[10px] ${locked ? "text-muted-foreground" : cert?.revoked_at ? "text-red-600" : "text-emerald-700 dark:text-emerald-300"}`}>{locked ? "LOCKED" : cert?.revoked_at ? "REVOKED" : "EARNED"}</span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 min-h-9 break-words text-[12px] font-bold leading-snug tracking-tight min-[420px]:text-[13px] sm:mt-3 sm:min-h-11 sm:text-base">{item.title}</h3>
                    <p className="mt-1 line-clamp-2 min-h-8 text-[10px] leading-4 text-muted-foreground sm:min-h-10 sm:text-xs sm:leading-5">{item.description}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-[9px] text-muted-foreground sm:mt-3 sm:gap-2 sm:text-[11px]"><CalendarDays className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" /><span className="truncate">{cert ? formatDate(cert.awarded_at) : "Milestone not yet completed"}</span></div>
                    {cert ? (
                      <div className="mt-3 grid grid-cols-3 gap-1.5 sm:mt-4 sm:gap-2">
                        <Button size="sm" variant="outline" aria-label={`View ${item.title}`} onClick={() => setSelected({ earned: cert, type: item.type })} className="min-h-10 min-w-0 rounded-xl border-slate-200/80 bg-white/90 dark:border-white/10 dark:bg-slate-900/60 px-1 text-[10px] dark:border-white/10 dark:bg-white/5 sm:text-xs"><Eye className="mr-1 h-3.5 w-3.5" />View</Button>
                        <Button size="sm" aria-label={`Download ${item.title} PDF`} onClick={() => download(cert, item.type)} disabled={!!cert.revoked_at || downloadingId === cert.id} className="min-h-10 min-w-0 rounded-xl bg-gradient-to-r from-slate-950 to-blue-900 px-1 text-[10px] text-white hover:from-blue-950 hover:to-blue-800 sm:text-xs">{downloadingId === cert.id ? <RefreshCw className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1 h-3.5 w-3.5" />}{downloadingId === cert.id ? "Wait" : "PDF"}</Button>
                        <Button size="sm" variant="ghost" aria-label={`Share ${item.title}`} onClick={() => share(cert, item.type)} className="min-h-10 min-w-0 rounded-xl px-1 text-[10px] text-muted-foreground hover:bg-blue-500/10 sm:text-xs"><Share2 className="mr-1 h-3.5 w-3.5" />Share</Button>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-dashed border-slate-300/70 bg-white/30 px-3 py-2.5 text-center text-xs text-muted-foreground dark:border-white/10 dark:bg-white/[0.025]">Keep learning to unlock</div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {!q.isLoading && !q.isError && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 px-4 py-4 text-xs text-muted-foreground dark:border-white/10 sm:px-6">
              <span>Showing {items.length} certificate {items.length === 1 ? "item" : "items"}</span>
              <button onClick={() => q.refetch()} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-medium transition hover:bg-white/60 hover:text-foreground dark:hover:bg-white/10"><RefreshCw className="h-3.5 w-3.5" />Refresh</button>
            </div>
          )}
        </GlassPanel>

        <GlassPanel className="mt-4 bg-gradient-to-r from-blue-950 via-slate-950 to-indigo-950 text-white sm:mt-6">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200/30 bg-amber-200/10 text-amber-200"><Zap className="h-6 w-6" /></div>
              <div>
                <h3 className="font-bold sm:text-lg">Your next milestone awaits.</h3>
                <p className="mt-1 text-xs leading-5 text-blue-100/70 sm:text-sm">Stay consistent, practise deliberately, and keep building your future.</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => { setActiveCategory("All"); setShowLocked(true); document.getElementById("my-certificates")?.scrollIntoView({ behavior: "smooth" }); }} className="shrink-0 rounded-full border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              Explore milestones <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </GlassPanel>

        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-sm sm:items-center sm:p-4 sm:backdrop-blur-md"
            onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
          >
            <div role="dialog" aria-modal="true" aria-labelledby="certificate-dialog-title" className="relative my-auto w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-4 text-slate-900 shadow-2xl backdrop-blur-md dark:border-white/15 dark:bg-slate-950/95 dark:text-slate-100 sm:p-7 sm:backdrop-blur-2xl">
              <button aria-label="Close certificate details" onClick={() => setSelected(null)} className="absolute right-4 top-4 z-10 rounded-full border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900/80 p-2 text-muted-foreground shadow-sm hover:text-foreground dark:border-white/10 dark:bg-white/10"><X className="h-4 w-4" /></button>
              <div className="mb-5 pr-10">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-300"><Award className="h-4 w-4" />Certificate details</div>
                <h2 id="certificate-dialog-title" className="text-xl font-bold">{getCertificateTitle(selected.earned, selected.type)}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{getCertificateDescription(selected.earned, selected.type)}</p>
              </div>
              <CertificateArtwork title={getCertificateTitle(selected.earned, selected.type)} category={categoryOf(selected.type)} icon={getIcon(selected.type)} />
              <div className="mt-5 space-y-3 rounded-2xl border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-slate-900/55 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Recipient</span><span className="text-right font-semibold">{q.data?.recipientName || "JEE Aspirant"}</span></div>
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Issue date</span><span className="text-right font-semibold">{formatDate(selected.earned.awarded_at)}</span></div>
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Certificate ID</span><span className="max-w-[60%] break-all text-right font-mono text-xs font-semibold">{selected.earned.verification_code}</span></div>
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Status</span><span className={`font-semibold ${selected.earned.revoked_at ? "text-red-600" : "text-emerald-700 dark:text-emerald-300"}`}>{selected.earned.revoked_at ? "Revoked" : "Issued"}</span></div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => share(selected.earned, selected.type)} className="rounded-xl"><Share2 className="mr-2 h-4 w-4" />Share</Button>
                <Button onClick={() => download(selected.earned, selected.type)} disabled={!!selected.earned.revoked_at || downloadingId === selected.earned.id} className="rounded-xl bg-gradient-to-r from-slate-950 to-blue-900 text-white">{downloadingId === selected.earned.id ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}{downloadingId === selected.earned.id ? "Preparing…" : "Download PDF"}</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
