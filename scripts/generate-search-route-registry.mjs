import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const routesRoot = path.join(root, "src/routes");
const output = path.join(root, "src/features/search/routeRegistry.generated.ts");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(absolute);
      return /\.(tsx|ts)$/.test(entry.name) ? [absolute] : [];
    }),
  );
  return nested.flat();
}

function cleanPath(routePath) {
  let value = routePath
    .replace(/\/_authenticated(?=\/|$)/g, "")
    .replace(/\/(?:_[^/]+|\([^/]+\))(?=\/|$)/g, "")
    .replace(/\[\.\]/g, ".")
    .replace(/\/$/, "");
  if (!value) value = "/";
  const dynamicAt = value.split("/").findIndex((part) => part.startsWith("$"));
  if (dynamicAt >= 0) value = value.split("/").slice(0, dynamicAt).join("/") || "/";
  return value;
}

function fallbackTitle(routePath) {
  const parts = routePath
    .split("/")
    .filter(Boolean)
    .filter((part) => !part.startsWith("$"));
  const title = (parts.at(-1) || "Home")
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
  return title || "Home";
}

const files = await walk(routesRoot);
const routes = [];
for (const file of files) {
  const source = await readFile(file, "utf8");
  const routeMatch = source.match(/createFileRoute\(\s*["'`]([^"'`]+)["'`]/);
  if (!routeMatch) continue;
  let rawPath = routeMatch[1].replace(/\/_authenticated(?=\/|$)/g, "");
  rawPath = rawPath.replace(/\/$/, "") || "/";
  const fileRelative = path.relative(routesRoot, file).replaceAll(path.sep, "/");
  if (
    /(^|\/)route\.(tsx|ts)$/.test(fileRelative) ||
    /(^|\/)(__root|not-found)\.(tsx|ts)$/.test(fileRelative)
  )
    continue;
  if (routeMatch[1] === "/_authenticated" || routeMatch[1] === "/_public") continue;
  if (/^\/(?:api|sitemap|robots)(?:\/|$)/i.test(rawPath) || rawPath.endsWith(".xml")) continue;
  const titleMatch = source.match(/\btitle\s*:\s*["'`]([^"'`]{2,120})["'`]/);
  const headingMatch = source.match(/<h1[^>]*>([\s\S]{1,160}?)<\/h1>/i);
  const rawHeading = headingMatch?.[1]
    ?.replace(/<[^>]+>/g, " ")
    .replace(/\{[^}]+\}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const title = (titleMatch?.[1] || rawHeading || fallbackTitle(rawPath))
    .replace(/\s*[—|·]\s*JEE Prep Hub.*$/i, "")
    .trim();
  const descriptionMatch = source.match(
    /name\s*:\s*["'`]description["'`]\s*,\s*content\s*:\s*["'`]([^"'`]{8,280})["'`]/i,
  );
  const description = descriptionMatch?.[1] || `${title} on JEE Prep Hub.`;
  const href = cleanPath(rawPath);
  const isAdmin = /(?:^|\/)admin(?:\/|$)/i.test(rawPath) || /(?:^|\/)admin\./i.test(fileRelative);
  const requiresAuth = fileRelative.split("/").includes("_authenticated");
  const routeKeywords = rawPath
    .split("/")
    .filter((part) => part && !part.startsWith("$"))
    .join(" ");
  routes.push({
    id: fileRelative.replace(/\.(tsx|ts)$/, ""),
    path: rawPath,
    href,
    title,
    description,
    keywords: `${routeKeywords} ${path
      .basename(fileRelative)
      .replace(/\.(tsx|ts)$/, "")
      .replace(/[._-]+/g, " ")}`.trim(),
    requiresAuth,
    requiresAdmin: isAdmin,
  });
}

routes.sort((a, b) => a.href.localeCompare(b.href) || a.id.localeCompare(b.id));
const contents = `/* Generated from src/routes at dev/build time. Do not edit by hand. */\nexport type SearchRouteEntry = {\n  id: string; path: string; href: string; title: string; description: string; keywords: string;\n  requiresAuth: boolean; requiresAdmin: boolean;\n};\nexport const ROUTE_REGISTRY: SearchRouteEntry[] = ${JSON.stringify(routes, null, 2)};\n`;
await writeFile(output, contents, "utf8");
console.log(`Generated search route registry for ${routes.length} route modules.`);
