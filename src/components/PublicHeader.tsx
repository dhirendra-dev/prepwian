import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, LogOut, User as UserIcon } from "lucide-react";
import { Logo } from "@/components/Logo";
import { FeaturesSlideMenu } from "@/components/FeaturesSlideMenu";
import { AppLauncher } from "@/components/AppLauncher";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BackgroundSettings } from "@/components/BackgroundSettings";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PublicHeader() {
  const { user } = useAuth();
  const email = user?.email ?? "";
  const initial = (email || "?").charAt(0).toUpperCase();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setAvatarUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled) setAvatarUrl(data?.avatar_url ?? null);
    })();
    const channel = supabase
      .channel(`profile-avatar-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          const nextAvatar = (payload.new as { avatar_url?: unknown }).avatar_url;
          setAvatarUrl(typeof nextAvatar === "string" ? nextAvatar : null);
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-2 px-3 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4">
      <div className="flex items-center gap-2">
        <FeaturesSlideMenu />
        <Link to="/" className="ml-1 hidden items-center gap-2 sm:flex">
          <Logo className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14" />
          <span className="font-display text-lg font-semibold lg:text-xl">PREPWIAN</span>
        </Link>
      </div>
      {/* Fixed header control row: do not add feature shortcuts here without explicit user approval. */}
      <div className="flex items-center gap-1 sm:gap-2">
        <AppLauncher />
        <BackgroundSettings />
        <ThemeToggle />

        {user && <NotificationBell />}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open profile menu"
              className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">{email || "Account"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to="/u/$userId"
                  params={{ userId: user.id }}
                  className="flex items-center gap-2"
                >
                  <UserIcon className="h-4 w-4" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={async () => {
                  await supabase.auth.signOut();
                }}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            to="/auth"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
