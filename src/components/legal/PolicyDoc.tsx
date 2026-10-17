import { Link } from "@tanstack/react-router";
import { ChevronLeft, FileText } from "lucide-react";
import type { PolicyDoc as PolicyDocType } from "@/lib/legal/content";
import { POLICY_DOCS } from "@/lib/legal/content";

function slug(heading: string) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function Body({ lines }: { lines: string[] }) {
  const blocks: Array<{ kind: "p" | "h" | "ul"; items: string[] }> = [];
  for (const line of lines) {
    if (line.startsWith("### ")) {
      blocks.push({ kind: "h", items: [line.slice(4)] });
    } else if (line.startsWith("- ")) {
      const last = blocks[blocks.length - 1];
      if (last?.kind === "ul") last.items.push(line.slice(2));
      else blocks.push({ kind: "ul", items: [line.slice(2)] });
    } else {
      blocks.push({ kind: "p", items: [line] });
    }
  }

  return (
    <div className="space-y-3">
      {blocks.map((b, i) => {
        if (b.kind === "h")
          return (
            <h4 key={i} className="pt-2 font-display text-sm font-semibold text-foreground">
              {b.items[0]}
            </h4>
          );
        if (b.kind === "ul")
          return (
            <ul key={i} className="ml-4 list-disc space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              {b.items.map((it, j) => (
                <li key={j}>{it}</li>
              ))}
            </ul>
          );
        return (
          <p key={i} className="text-sm leading-relaxed text-muted-foreground">
            {b.items[0]}
          </p>
        );
      })}
    </div>
  );
}

export function PolicyDocView({ doc }: { doc: PolicyDocType }) {
  return (
    <div className="space-y-5">
      <Link to="/legal" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-3.5 w-3.5" /> All policies
      </Link>

      <header className="glass-surface rounded-2xl border border-border/60 p-5">
        <div className="mb-2 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-bold">{doc.title}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{doc.summary}</p>
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-muted-foreground">
          PREPWIAN is a student-run, independent educational initiative. It is not affiliated with NTA, JEE Main,
          JEE Advanced, JoSAA, the IITs or the Government of India. Text shown in [SQUARE BRACKETS] is a placeholder
          our administrators still need to complete — please do not treat it as a published fact.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <nav className="glass-surface hidden h-fit rounded-2xl border border-border/60 p-4 lg:sticky lg:top-4 lg:block">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">On this page</p>
          <ul className="space-y-1.5">
            {doc.sections.map((s) => (
              <li key={s.heading}>
                <a href={`#${slug(s.heading)}`} className="text-xs text-muted-foreground hover:text-foreground">
                  {s.heading}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="space-y-4">
          {doc.sections.map((s, i) => (
            <section
              key={s.heading}
              id={slug(s.heading)}
              className="glass-surface scroll-mt-20 rounded-2xl border border-border/60 p-5"
            >
              <h2 className="mb-3 font-display text-lg font-semibold">
                <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                {s.heading}
              </h2>
              <Body lines={s.body} />
            </section>
          ))}

          <div className="glass-surface rounded-2xl border border-border/60 p-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Other policies
            </p>
            <div className="flex flex-wrap gap-2">
              {POLICY_DOCS.filter((d) => d.id !== doc.id).map((d) => (
                <Link
                  key={d.id}
                  to="/legal/$docId"
                  params={{ docId: d.id }}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  {d.title}
                </Link>
              ))}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
