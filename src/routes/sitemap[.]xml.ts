import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://jeeprephub.co.in";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        // Only public, indexable routes. Authenticated app routes
        // (dashboard, materials, timer, forum, groups, leaderboard,
        // profile, certificates, admin/*) require sign-in and are
        // intentionally omitted.
        const entries: SitemapEntry[] = [
          { path: "/", priority: "1.0", changefreq: "weekly" },
          { path: "/auth", priority: "0.5", changefreq: "monthly" },
          { path: "/community", priority: "0.8", changefreq: "weekly" },
          { path: "/feed", priority: "0.8", changefreq: "daily" },
          { path: "/jee-advanced-math-problems", priority: "0.9", changefreq: "weekly" },
          { path: "/jee-advanced-physics-problems", priority: "0.9", changefreq: "weekly" },
          { path: "/jee-advanced-chemistry-problems", priority: "0.9", changefreq: "weekly" },

        ];
        const urls = entries
          .map((e) =>
            [
              `  <url>`,
              `    <loc>${BASE_URL}${e.path}</loc>`,
              e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
              e.priority ? `    <priority>${e.priority}</priority>` : null,
              `  </url>`,
            ]
              .filter(Boolean)
              .join("\n"),
          )
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
