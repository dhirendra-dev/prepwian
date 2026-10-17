const BLOCK_TAGS = new Set([
  "box",
  "card",
  "callout",
  "center",
  "col",
  "column",
  "columns",
  "container",
  "figure",
  "grid",
  "layout",
  "row",
  "section",
  "stack",
]);

const HEADING_TAGS = new Map([
  ["h1", "#"],
  ["h2", "##"],
  ["h3", "###"],
  ["h4", "####"],
]);

function decodeAttribute(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function getAttribute(attributes: string, name: string): string | null {
  const match = attributes.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );
  return match ? decodeAttribute(match[1] ?? match[2] ?? match[3] ?? "") : null;
}

function toSafeImageMarkdown(attributes: string): string | null {
  const src = getAttribute(attributes, "src");
  if (!src || !/^https?:\/\//i.test(src)) return null;

  const alt =
    getAttribute(attributes, "alt") ?? getAttribute(attributes, "title") ?? "Article image";
  return `![${alt.replaceAll("[", "").replaceAll("]", "")}](${src.replace(/[()]/g, "\\$&")})`;
}

function normalizeHtmlTables(content: string): string {
  return content.replace(/<table\b[^>]*>([\s\S]*?)<\/table>/gi, (_table, tableBody: string) => {
    const rows = [...tableBody.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
      .map((row) =>
        [...row[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((cell) =>
          cell[1]
            .replace(/<[^>]+>/g, "")
            .replace(/\s+/g, " ")
            .trim(),
        ),
      )
      .filter((row) => row.length > 0);

    if (!rows.length) return "";
    const width = Math.max(...rows.map((row) => row.length));
    const padded = rows.map((row) => [...row, ...Array(Math.max(0, width - row.length)).fill("")]);
    const header = padded[0];
    const separator = header.map(() => "---");
    return `\n\n| ${header.join(" | ")} |\n| ${separator.join(" | ")} |\n${padded
      .slice(1)
      .map((row) => `| ${row.join(" | ")} |`)
      .join("\n")}\n\n`;
  });
}

/**
 * Converts the legacy article authoring vocabulary into safe Markdown. We do
 * this at render time so existing database records remain byte-for-byte
 * unchanged and future records can still use normal Markdown.
 */
export function normalizeArticleContent(rawContent: string | null | undefined): string {
  let content = (rawContent ?? "").replace(/\uFEFF/g, "").replace(/\r\n?/g, "\n");

  // Support both Markdown math delimiters and the LaTeX delimiters commonly
  // pasted by authors. remark-math understands the former consistently.
  content = content
    .replace(
      /\\\x5b([\s\S]*?)\\\x5d/g,
      (_match, expression: string) => `\n\n$$\n${expression}\n$$\n\n`,
    )
    .replace(/\\\(([\s\S]*?)\\\)/g, (_match, expression: string) => `$${expression.trim()}$`)
    .replace(/<!--([\s\S]*?)-->/g, "");

  content = normalizeHtmlTables(content);

  // Preserve useful images and links while never enabling arbitrary raw HTML.
  content = content.replace(/<img\b([^>]*?)\/?>/gi, (_match, attributes: string) => {
    return toSafeImageMarkdown(attributes) ?? "";
  });
  content = content.replace(
    /<a\b([^>]*?)>([\s\S]*?)<\/a>/gi,
    (_match, attributes: string, children: string) => {
      const href = getAttribute(attributes, "href");
      return href && /^(?:https?:\/\/|mailto:)/i.test(href)
        ? `[${children.replace(/<[^>]+>/g, "").trim()}](${href.replace(/[()]/g, "\\$&")})`
        : children;
    },
  );

  // Turn raw HTML lists/headings/paragraphs into Markdown before removing the
  // remaining legacy JSX tags. This keeps their structure readable.
  content = content
    .replace(/<h([1-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_match, level: string, text: string) => {
      return `\n\n${"#".repeat(Number(level))} ${text.replace(/<[^>]+>/g, "").trim()}\n\n`;
    })
    .replace(
      /<li\b[^>]*>([\s\S]*?)<\/li>/gi,
      (_match, text: string) => `\n- ${text.replace(/<[^>]+>/g, "").trim()}`,
    )
    .replace(/<\/?(?:ul|ol)\b[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "  \n")
    .replace(/<\/?p\b[^>]*>/gi, "\n\n");

  // Layout tags are presentation-only. Drop their props (className, gap,
  // icon names, etc.) and retain all authored children. A title/label remains
  // as a real Markdown heading so it is not lost as visual hierarchy.
  content = content.replace(
    /<\/?([A-Za-z][\w.-]*)([^<>]*?)(\/?)>/g,
    (match: string, tagName: string, attributes: string, selfClosing: string) => {
      const tag = tagName.toLowerCase();
      if (HEADING_TAGS.has(tag)) return match;
      if (tag === "icon") {
        if (!selfClosing) return "";
        const label = getAttribute(attributes, "name") ?? getAttribute(attributes, "label");
        return label ? `[${label}]` : "";
      }
      if (BLOCK_TAGS.has(tag)) {
        if (selfClosing) return "\n\n";
        if (!match.startsWith("</")) {
          const heading =
            getAttribute(attributes, "title") ??
            getAttribute(attributes, "heading") ??
            getAttribute(attributes, "label");
          return heading ? `\n\n### ${heading}\n\n` : "\n\n";
        }
        return "\n\n";
      }
      // Never expose arbitrary JSX/HTML tags or component props to readers.
      return "";
    },
  );

  return content
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
