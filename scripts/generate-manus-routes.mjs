import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const routesRoot = path.join(root, "src/routes");
const output = path.join(root, "public/manus-routes.json");

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

function routePath(rawPath) {
  const normalized =
    rawPath
      .replace(/\/\_authenticated(?=\/|$)/g, "")
      .replace(/\/\_public(?=\/|$)/g, "")
      .replace(/\[\.\]/g, ".")
      .replace(/\/$/, "") || "/";
  return normalized.replace(/\$([A-Za-z0-9_]+)/g, ":$1");
}

function fallbackTitle(routePathValue) {
  const part = routePathValue.split("/").filter(Boolean).at(-1) || "Home";
  return part
    .replace(/^:/, "")
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const files = await walk(routesRoot);
const routes = new Map();
for (const file of files) {
  const source = await readFile(file, "utf8");
  const routeMatch = source.match(/createFileRoute\(\s*["'`]([^"'`]+)["'`]/);
  if (!routeMatch) continue;

  const fileRelative = path.relative(routesRoot, file).replaceAll(path.sep, "/");
  if (/(^|\/)(route|__root|not-found)\.(tsx|ts)$/.test(fileRelative)) continue;
  const rawPath = routeMatch[1];
  if (/^\/(?:api|sitemap|robots|lovable)(?:\/|$)/i.test(rawPath) || rawPath.endsWith(".xml"))
    continue;

  const pathValue = routePath(rawPath);
  const titleMatch = source.match(/\btitle\s*:\s*["'`]([^"'`]{2,120})["'`]/);
  const title = (titleMatch?.[1] || fallbackTitle(pathValue))
    .replace(/\s*[—|·]\s*JEE Prep Hub.*$/i, "")
    .trim();
  routes.set(pathValue, { path: pathValue, title });
}

const contents =
  JSON.stringify(
    { routes: [...routes.values()].sort((a, b) => a.path.localeCompare(b.path)) },
    null,
    2,
  ) + "\n";
await writeFile(output, contents, "utf8");
console.log(`Generated public route manifest for ${routes.size} routes.`);
