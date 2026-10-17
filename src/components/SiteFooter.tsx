import { Link } from "@tanstack/react-router";
import { POLICY_DOCS } from "@/lib/legal/content";

const DOC_LINKS: Array<{ id: string; label: string }> = [
  { id: "about", label: "About PREPWIAN" },
  { id: "terms", label: "Terms of Use" },
  { id: "privacy", label: "Privacy Policy" },
  { id: "community-guidelines", label: "Community Guidelines" },
  { id: "copyright", label: "Copyright Policy" },
  { id: "safety", label: "Safety & Report Abuse" },
  { id: "academic-integrity", label: "Academic Integrity & AI" },
  { id: "disclaimer", label: "Disclaimer" },
  { id: "cookies", label: "Cookie Policy" },
  { id: "accessibility", label: "Accessibility" },
  { id: "contact", label: "Contact & Legal Notices" },
];

export function SiteFooter() {
  const available = DOC_LINKS.filter((l) => POLICY_DOCS.some((d) => d.id === l.id));
  return (
    <footer className="mx-auto mt-10 max-w-6xl px-4 pb-10 lg:px-5">
      <div className="glass-surface rounded-2xl border border-border/60 p-5">
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {available.map((l) => (
            <Link
              key={l.id}
              to="/legal/$docId"
              params={{ docId: l.id }}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              {l.label}
            </Link>
          ))}
          <Link to="/contact" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
            Contact
          </Link>
          <Link to="/legal" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
            All policies
          </Link>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          PREPWIAN is a student-run, independent educational initiative. It is not affiliated with, endorsed by or
          authorised by NTA, JEE Main, JEE Advanced, JoSAA, the IITs, any coaching institute or the Government of India.
          Always verify examination information with the official authority.
        </p>
      </div>
    </footer>
  );
}
