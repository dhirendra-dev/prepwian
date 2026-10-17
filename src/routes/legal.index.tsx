import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { POLICY_DOCS, POLICY_VERSION, POLICY_LAST_UPDATED } from "@/lib/legal/content";

const TITLE = "Policies, Terms & Community Rules — JEE Prep Hub";
const DESC =
  "Terms of Use, Community Guidelines, Privacy Policy, Copyright Policy, Safety rules and disclaimers for JEE Prep Hub, an independent student-run JEE preparation community.";

export const Route = createFileRoute("/legal/")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },

      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LegalIndex,
});

function LegalIndex() {
  return (
    <AppShell>
      <div className="space-y-5">
        <header className="glass-surface rounded-2xl border border-border/60 p-6">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Policies & Community Rules</h1>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            JEE Prep Hub is a student-run, independent educational initiative for students preparing for JEE Main, JEE
            Advanced and related engineering entrance examinations. These documents explain how the community works,
            what we do and do not promise, and how your information is handled.
          </p>
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Not an official JEE authority.</strong> We are not affiliated with,
            endorsed by or authorised by NTA, JEE Main, JEE Advanced, JoSAA, the IITs, any coaching institute or the
            Government of India. Always verify examination dates, eligibility, syllabus, counselling and results with
            the official authority.
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Version {POLICY_VERSION} · Last updated {POLICY_LAST_UPDATED} · Items in [SQUARE BRACKETS] are placeholders
            our administrators must still fill in.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          {POLICY_DOCS.map((doc) => (
            <Link
              key={doc.id}
              to="/legal/$docId"
              params={{ docId: doc.id }}
              className="glass-surface glass-hover group rounded-2xl border border-border/60 p-5"
            >
              <div className="mb-1.5 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="font-display text-base font-semibold group-hover:underline">{doc.title}</h2>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{doc.summary}</p>
              <p className="mt-3 text-[11px] text-muted-foreground">{doc.sections.length} sections</p>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
