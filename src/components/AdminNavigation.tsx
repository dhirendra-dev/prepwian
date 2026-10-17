import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Award,
  Bell,
  BookOpen,
  CalendarClock,
  ChevronDown,
  Command,
  FileClock,
  FileText,
  FlaskConical,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  Mail,
  Megaphone,
  MessageSquare,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Users,
  UserCog,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAdminAccess, useAuth } from "@/hooks/use-auth";
import type { PermissionKey } from "@/lib/permissions";

type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: PermissionKey;
  fullAdmin?: boolean;
};

type AdminNavGroup = { label: string; items: AdminNavItem[] };

const GROUPS: AdminNavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Admin overview", href: "/admin/", icon: LayoutDashboard, permission: "users" },
    ],
  },
  {
    label: "People & support",
    items: [
      { label: "Users", href: "/admin/users", icon: Users, permission: "users" },
      {
        label: "Account verification",
        href: "/admin/verification",
        icon: ShieldCheck,
        fullAdmin: true,
      },
      { label: "Moderators", href: "/admin/moderators", icon: UserCog, fullAdmin: true },
      { label: "Consent records", href: "/admin/consents", icon: FileText, permission: "consents" },
      {
        label: "Consent settings",
        href: "/admin/consent-settings",
        icon: Settings2,
        fullAdmin: true,
      },
      { label: "Appeals", href: "/admin/appeals", icon: ShieldAlert, permission: "appeals" },
      { label: "Contact inbox", href: "/admin/contact", icon: Mail, permission: "contact" },
      { label: "Feedback", href: "/admin/feedback", icon: MessageSquare, fullAdmin: true },
    ],
  },
  {
    label: "Learning & content",
    items: [
      { label: "Study materials", href: "/admin/materials", icon: BookOpen, fullAdmin: true },
      { label: "Notes", href: "/admin/notes", icon: FileText, fullAdmin: true },
      { label: "Video lectures", href: "/admin/videos", icon: Video, fullAdmin: true },
      { label: "Notices", href: "/admin/notices", icon: Megaphone, permission: "notices" },
      {
        label: "Certificates",
        href: "/admin/certificates",
        icon: Award,
        permission: "certificates",
      },
      {
        label: "Community groups",
        href: "/admin/community",
        icon: MessageSquare,
        permission: "community",
      },
      { label: "Exam toppers", href: "/admin/toppers", icon: GraduationCap, fullAdmin: true },
      { label: "NTA tools", href: "/admin/nta", icon: FlaskConical, permission: "users" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Test library", href: "/admin/tests/", icon: FlaskConical, fullAdmin: true },
      {
        label: "Test approvals",
        href: "/admin/tests/approvals",
        icon: ShieldCheck,
        fullAdmin: true,
      },
      {
        label: "Scheduled tests",
        href: "/admin/scheduled-tests",
        icon: CalendarClock,
        fullAdmin: true,
      },
      {
        label: "Notifications",
        href: "/admin/notifications",
        icon: Bell,
        permission: "notifications",
      },
      { label: "Pro members", href: "/admin/pro", icon: Activity, permission: "pro" },
      { label: "Email center", href: "/admin/email", icon: Mail, fullAdmin: true },
      {
        label: "Developer access",
        href: "/admin/developer-access",
        icon: KeyRound,
        fullAdmin: true,
      },
      { label: "Search analytics", href: "/admin/search-analytics", icon: Search, fullAdmin: true },
      { label: "Audit log", href: "/admin/audit", icon: FileClock, fullAdmin: true },
      { label: "Security", href: "/admin/security", icon: ShieldAlert, fullAdmin: true },
      { label: "System control", href: "/admin/system", icon: Settings2, fullAdmin: true },
    ],
  },
];

function normalizedPath(path: string) {
  return path.length > 1 ? path.replace(/\/$/, "") : path;
}

function isActive(pathname: string, href: string) {
  const current = normalizedPath(pathname);
  const target = normalizedPath(href);
  return current === target || (target !== "/admin" && current.startsWith(`${target}/`));
}

function AdminNavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: AdminNavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      to={item.href as never}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`group flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {active && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      )}
    </Link>
  );
}

export function AdminNavigation({ pathname }: { pathname: string }) {
  const { user, loading: authLoading } = useAuth();
  const { role, hasPermission, loading } = useAdminAccess(user?.id);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      } else if (event.key === "Escape") {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const visibleGroups = useMemo(
    () =>
      GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (role === "admin") return true;
          if (!role || item.fullAdmin || !item.permission) return false;
          return hasPermission(item.permission);
        }),
      })).filter((group) => group.items.length > 0),
    [hasPermission, role],
  );

  const allItems = useMemo(() => visibleGroups.flatMap((group) => group.items), [visibleGroups]);
  const matches = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return needle
      ? allItems.filter((item) => `${item.label} ${item.href}`.toLowerCase().includes(needle))
      : allItems;
  }, [allItems, search]);

  if (authLoading || loading || !role) return null;

  return (
    <>
      <aside className="sticky top-[4.5rem] hidden h-[calc(100dvh-5rem)] w-64 shrink-0 flex-col self-start rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm backdrop-blur-xl lg:flex">
        <Link
          to="/admin"
          className="mb-3 flex items-center gap-3 rounded-xl px-2 py-2.5 text-foreground hover:bg-muted"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-950 to-blue-900 text-amber-200 shadow">
            <Command className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold">JEE Prep Hub</span>
            <span className="block text-[11px] text-muted-foreground">Admin workspace</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="mb-3 flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background/70 px-3 text-left text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          aria-label="Search admin pages"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1">Find a page or tool</span>
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">
            Ctrl/⌘K
          </kbd>
        </button>
        <nav
          aria-label="Admin navigation"
          className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1"
        >
          {visibleGroups.map((group) => (
            <div key={group.label}>
              <h2 className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {group.label}
              </h2>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <AdminNavLink key={item.href} item={item} pathname={pathname} />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-3 rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">
            {role === "admin" ? "Full administrator" : "Moderator"}
          </span>
          <span className="mt-0.5 block">Navigation follows your current access.</span>
        </div>
      </aside>

      <div className="mb-3 w-full min-w-0 lg:hidden">
        <div className="flex items-center gap-2">
          <details className="group/admin-menu min-w-0 flex-1 rounded-xl border border-border/70 bg-card/85 shadow-sm backdrop-blur-xl">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
              <Command className="h-4 w-4 text-primary" />
              <span className="min-w-0 flex-1 truncate">Admin workspace</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open/admin-menu:rotate-180" />
            </summary>
            <nav
              aria-label="Admin navigation"
              className="max-h-[55dvh] overflow-y-auto border-t border-border/70 p-2"
            >
              {visibleGroups.map((group) => (
                <div key={group.label} className="mb-3 last:mb-0">
                  <h2 className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    {group.label}
                  </h2>
                  <div className="grid grid-cols-2 gap-1.5 min-[480px]:grid-cols-3">
                    {group.items.map((item) => (
                      <AdminNavLink key={item.href} item={item} pathname={pathname} />
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </details>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-card/85 text-muted-foreground shadow-sm backdrop-blur-xl hover:text-foreground"
            aria-label="Search admin pages"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {paletteOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/55 px-3 pt-[12vh] backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPaletteOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-command-title"
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <h2 id="admin-command-title" className="sr-only">
              Search admin pages and tools
            </h2>
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search pages and tools…"
                aria-label="Search admin pages and tools"
                className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={() => setPaletteOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav aria-label="Search results" className="max-h-[60dvh] overflow-y-auto p-2">
              {matches.length ? (
                matches.map((item) => (
                  <AdminNavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onNavigate={() => {
                      setPaletteOpen(false);
                      setSearch("");
                    }}
                  />
                ))
              ) : (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No matching admin pages.
                </p>
              )}
            </nav>
            <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
              <span>Jump to an authorized page</span>
              <span>Esc to close</span>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
