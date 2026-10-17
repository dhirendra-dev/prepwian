import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function linkifyEscapedText(value: string) {
  const pattern = /(?:https?:\/\/|www\.)[^\s<>]+|\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?:\/[^\s<>]*)?/gi;
  return value.replace(pattern, (raw) => {
    const punctuation = raw.match(/[.,!?;:)\]}]+$/)?.[0] ?? "";
    const url = punctuation ? raw.slice(0, -punctuation.length) : raw;
    const href = /^www\./i.test(url) ? `https://${url}` : /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="font-medium text-primary underline decoration-primary/50 underline-offset-2 hover:decoration-primary">${escapeHtml(url)}</a>${escapeHtml(punctuation)}`;
  });
}
function renderTeX(src: string, display: boolean) {
  try { return katex.renderToString(src, { displayMode: display, throwOnError: false, output: "html" }); }
  catch { return escapeHtml(display ? `$$${src}$$` : `$${src}$`); }
}
function toHtml(text: string) {
  if (!text) return "";
  const out: string[] = [];
  const re = /(\$\$([\s\S]+?)\$\$)|(\$([^$\n]+?)\$)/g;
  let last = 0;
  for (let m: RegExpExecArray | null; (m = re.exec(text)); ) {
    if (m.index > last) out.push(linkifyEscapedText(escapeHtml(text.slice(last, m.index))));
    if (m[2] != null) out.push(`<div class="my-2">${renderTeX(m[2], true)}</div>`);
    else if (m[4] != null) out.push(renderTeX(m[4], false));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(linkifyEscapedText(escapeHtml(text.slice(last))));
  return out.join("");
}
export function MathText({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => toHtml(text ?? ""), [text]);
  return <div className={`whitespace-pre-wrap break-words ${className ?? ""}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
