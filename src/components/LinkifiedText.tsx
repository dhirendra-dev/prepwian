import type { ReactNode } from "react";

const URL_PATTERN =
  /(?:https?:\/\/|www\.)[^\s<>]+|\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?:\/[^\s<>]*)?|(?:^|[\s(])\/(?!\/)[a-z0-9_~.!$&'()*+,;=:@%/?#-]*/gi;
const TRAILING_PUNCTUATION = /[.,!?;:)\]}]+$/;

function safeHref(value: string): string | null {
  if (value.startsWith("/")) return value.startsWith("//") ? null : value;
  if (/^www\./i.test(value)) return `https://${value}`;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.[a-z]{2,}/i.test(value)) {
    return `https://${value}`;
  }
  return null;
}

/** Render plain text with safe, clickable URLs while preserving the original whitespace. */
export function LinkifiedText({
  text,
  className,
}: {
  text: string | null | undefined;
  className?: string;
}) {
  const source = text ?? "";
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  URL_PATTERN.lastIndex = 0;

  while ((match = URL_PATTERN.exec(source))) {
    let candidate = match[0];
    let start = match.index;
    // The internal-path alternative includes its preceding whitespace/parenthesis.
    if (/^[\s(]\//.test(candidate)) {
      start += 1;
      candidate = candidate.slice(1);
    }
    const punctuation = candidate.match(TRAILING_PUNCTUATION)?.[0] ?? "";
    const url = punctuation ? candidate.slice(0, -punctuation.length) : candidate;
    const href = safeHref(url);
    if (!href || start < last) continue;
    if (start > last) nodes.push(source.slice(last, start));
    nodes.push(
      <a
        key={`${start}-${url}`}
        href={href}
        target={href.startsWith("/") ? undefined : "_blank"}
        rel={href.startsWith("/") ? undefined : "noopener noreferrer"}
        className="break-all font-medium text-primary underline decoration-primary/50 underline-offset-2 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {url}
      </a>,
    );
    if (punctuation) nodes.push(punctuation);
    last = start + candidate.length;
  }
  if (last < source.length) nodes.push(source.slice(last));

  return <span className={className}>{nodes}</span>;
}
