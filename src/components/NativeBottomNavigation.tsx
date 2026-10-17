import { BookOpen, Home, Search, Settings } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  NATIVE_NAVIGATION_ITEMS,
  shouldShowNativeBottomNavigation,
} from "@/components/native-bottom-navigation-config";

const ICONS = { home: Home, search: Search, articles: BookOpen, settings: Settings } as const;

export function NativeBottomNavigation() {
  const pathname = useLocation({ select: (location) => location.pathname });
  if (!shouldShowNativeBottomNavigation(pathname)) return null;

  return (
    <nav
      aria-label="Primary navigation"
      className="native-bottom-navigation fixed inset-x-0 bottom-0 z-[60] mx-auto flex w-full max-w-2xl items-center gap-1 border border-border bg-background p-2 shadow-[0_-18px_45px_-28px_rgba(15,23,42,.55)] sm:bottom-3 sm:rounded-3xl sm:px-3"
    >
      {NATIVE_NAVIGATION_ITEMS.map((item) => {
        const active = item.match(pathname);
        const Icon = ICONS[item.icon];
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={`native-bottom-navigation__item group relative flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[10px] font-bold transition duration-200 ease-out active:scale-95 sm:min-h-14 sm:text-[11px] ${active ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"}`}
          >
            <span
              className={`grid h-7 w-9 place-items-center rounded-xl transition duration-200 ${active ? "bg-primary text-primary-foreground shadow-sm" : "group-hover:bg-background/80"}`}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <span>{item.label}</span>
            {active && (
              <span
                className="absolute bottom-1 h-1 w-1 rounded-full bg-primary"
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
