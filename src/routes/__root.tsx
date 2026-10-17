import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useLocation,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { lazy, Suspense, useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LogoSplash } from "@/components/LogoSplash";
import { AuthGate } from "@/components/AuthGate";
import { PresenceProvider } from "@/contexts/PresenceContext";
import { Toaster } from "@/components/ui/sonner";
import { GlassFilterDefs } from "@/components/GlassFilterDefs";
import { IOS27SpatialLight } from "@/components/IOS27SpatialLight";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import { SiteMotion } from "@/components/SiteMotion";
import { PageTransition, ScrollHeader } from "@/components/ScrollMotion";
import { JeeAlertListener } from "@/components/JeeAlertListener";
import { PublicHeader } from "@/components/PublicHeader";
import { MobileDesktopModeNotice } from "@/components/MobileDesktopModeNotice";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";

const MembershipWelcome = lazy(() =>
  import("@/components/MembershipWelcome").then((m) => ({ default: m.MembershipWelcome })),
);
const PromoPopup = lazy(() => import("@/components/PromoPopup"));

const PerfDebugPanel = lazy(() =>
  import("@/components/PerfDebugPanel").then((m) => ({ default: m.PerfDebugPanel })),
);

function perfDebugEnabled() {
  if (typeof window === "undefined") return false;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("debug") === "1") {
      window.localStorage.setItem("lovable_perf_debug", "1");
      return true;
    }
    if (url.searchParams.get("debug") === "0") {
      window.localStorage.removeItem("lovable_perf_debug");
      return false;
    }
    return window.localStorage.getItem("lovable_perf_debug") === "1";
  } catch {
    return false;
  }
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(err);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "google-site-verification", content: "NerLHIaXz3SznqEtcwLVEa2kQxoXNsjLeODX4RHsHVk" },
      { name: "author", content: "PREPWIAN" },
      { name: "application-name", content: "PREPWIAN" },
      { name: "apple-mobile-web-app-title", content: "PREPWIAN" },
      {
        httpEquiv: "Content-Security-Policy",
        content:
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.lovable.app https://*.lovable.dev https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://s.ytimg.com https://pagead2.googlesyndication.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.lovable.app https://*.lovable.dev https://api.openai.com https://ipapi.co https://ipwho.is https://api.ipify.org https://ipinfo.io https://www.youtube.com https://www.youtube-nocookie.com https://*.googlevideo.com https://play.google.com; frame-src 'self' https://challenges.cloudflare.com https://www.youtube-nocookie.com https://www.youtube.com; base-uri 'self'; form-action 'self'; object-src 'none';",
      },
      { httpEquiv: "X-Content-Type-Options", content: "nosniff" },
      { httpEquiv: "Referrer-Policy", content: "strict-origin-when-cross-origin" },
      {
        name: "permissions-policy",
        content: "camera=(), microphone=(), geolocation=(self), payment=()",
      },
      { property: "og:site_name", content: "PREPWIAN" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4633303401534615",
        async: true,
        crossOrigin: "anonymous",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&family=Kalam:wght@400;700&family=Urbanist:wght@500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="liquid-glass" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var r=document.documentElement;var t=localStorage.getItem('theme');if(t==='dark'){r.classList.add('dark');}else{r.classList.remove('dark');}r.dataset.theme=(t==='dark'?'dark':'light');r.style.colorScheme=(t==='dark'?'dark':'light');var u=localStorage.getItem('jph-ui-mode');r.dataset.ui=(u==='legacy'||u==='ios27'?u:'glass');var p=localStorage.getItem('jph-color-palette');r.dataset.palette=(['forest','coral','violet','rose','amber'].indexOf(p)>=0?p:'ocean');var b=JSON.parse(localStorage.getItem('jph-background-color')||'null');if(b&&/^#[0-9a-f]{6}$/i.test(b.color)){r.dataset.backgroundColor=b.preset||'custom';r.style.setProperty('--jph-page-bg-color',b.color);r.style.setProperty('--jph-page-bg-strength',Math.min(100,Math.max(20,Number(b.strength)||72))+'%');}else{r.dataset.backgroundColor='default';}var ty=JSON.parse(localStorage.getItem('jph-scholar-typography')||'null');var fonts={editorial:"Georgia, 'Times New Roman', serif",epilogue:"'Epilogue', system-ui, sans-serif",urbanist:"'Urbanist', system-ui, sans-serif",system:"system-ui, -apple-system, 'Segoe UI', sans-serif",mono:"'JetBrains Mono', ui-monospace, SFMono-Regular, monospace"};if(ty&&Object.prototype.hasOwnProperty.call(fonts,ty.font)){var scale=Number(ty.scale);if(!isFinite(scale)){scale=1;}scale=Math.min(1.2,Math.max(.85,scale));r.style.setProperty('--scholar-font-family',fonts[ty.font]);r.style.setProperty('--scholar-display-family',fonts[ty.font]);var sizes={xs:.75,sm:.875,base:1,lg:1.125,xl:1.25,'2xl':1.5,'3xl':1.875,'4xl':2.25,'5xl':3,'6xl':3.75,'7xl':4.5,'8xl':6,'9xl':8};Object.keys(sizes).forEach(function(k){r.style.setProperty('--scholar-text-'+k,(16*sizes[k]*scale).toFixed(2)+'px');});}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const location = useLocation();
  const debug = typeof window !== "undefined" && perfDebugEnabled();
  const isHeaderlessRoute =
    location.pathname === "/auth" ||
    location.pathname === "/engineering" ||
    location.pathname === "/community" ||
    (location.pathname.startsWith("/watch/") && location.pathname !== "/watch/");
  const hideHeaderOnMobile =
    (location.pathname.startsWith("/squad/") && !location.pathname.startsWith("/squad/join/")) ||
    location.pathname.startsWith("/tests/attempt/") ||
    location.pathname.startsWith("/jee360") ||
    location.pathname.startsWith("/focus") ||
    location.pathname === "/ai-chat";
  useEffect(() => {
    if (!debug) return;
    let cancelled = false;
    import("@/lib/perf-logger").then((m) => {
      if (!cancelled) m.startPerfLogger();
    });
    return () => {
      cancelled = true;
    };
  }, [debug]);

  return (
    <QueryClientProvider client={queryClient}>
      <LogoSplash />
      <Toaster />
      <MobileDesktopModeNotice />
      <SiteMotion />
      <GlassFilterDefs />
      <IOS27SpatialLight />
      <MaintenanceGuard>
        <AuthGate>
          {!isHeaderlessRoute && (
            <ScrollHeader
              className={`site-global-header sticky top-0 z-50 isolate w-full border-b border-border/50 bg-background/85 backdrop-blur-xl ${hideHeaderOnMobile ? "hidden md:block" : ""}`}
            >
              <PublicHeader />
            </ScrollHeader>
          )}
          <PresenceProvider>
            <JeeAlertListener />
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <PageTransition
              pathKey={location.pathname}
              disabled={location.pathname.startsWith("/tests/attempt/")}
            >
              <Outlet />
            </PageTransition>
            <MobileBottomNav />
            <Suspense fallback={null}>
              <MembershipWelcome />
              <PromoPopup />
            </Suspense>
          </PresenceProvider>
        </AuthGate>
      </MaintenanceGuard>
      {debug ? (
        <Suspense fallback={null}>
          <PerfDebugPanel />
        </Suspense>
      ) : null}
    </QueryClientProvider>
  );
}
