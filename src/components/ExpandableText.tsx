import { useState } from "react";
import { LinkifiedText } from "@/components/LinkifiedText";

/**
 * Truncates long text to a max number of visual lines when collapsed.
 * Shows a "Read more" toggle. Preserves line breaks.
 */
export function ExpandableText({
  text,
  chars = 220,
  className = "",
}: {
  text: string;
  chars?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const trimmed = text.trim();
  const lineCount = trimmed.split("\n").length;
  const overflow = trimmed.length > chars || lineCount > 5;

  if (!overflow) {
    return <p className={`whitespace-pre-wrap break-words ${className}`}><LinkifiedText text={trimmed} /></p>;
  }

  return (
    <div className={className}>
      <p className={`whitespace-pre-wrap break-words ${open ? "" : "line-clamp-5"}`}><LinkifiedText text={trimmed} /></p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-1 text-xs font-semibold text-primary hover:underline"
      >
        {open ? "Show less" : "Read more"}
      </button>
    </div>
  );
}
