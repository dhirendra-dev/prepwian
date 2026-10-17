import type { ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { AdminNavigation } from "@/components/AdminNavigation";
import { SiteFooter } from "@/components/SiteFooter";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <div data-lg-root className="min-h-screen w-full overflow-x-clip bg-aurora-shift dark:bg-none">
      <div
        className={
          isAdminRoute
            ? "mx-auto flex min-h-screen w-full max-w-[1760px] min-w-0 flex-col gap-3 px-2 sm:gap-4 sm:px-4 lg:flex-row lg:gap-5 lg:px-5"
            : "w-full"
        }
      >
        {isAdminRoute && <AdminNavigation pathname={pathname} />}
        <div className={isAdminRoute ? "min-w-0 flex-1" : "w-full"}>
          <main
            className={
              isAdminRoute
                ? "mx-auto min-w-0 w-full px-0 py-3 sm:py-4 lg:py-6"
                : "mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 md:px-8 lg:px-10 lg:py-8"
            }
          >
            {children}
          </main>
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
