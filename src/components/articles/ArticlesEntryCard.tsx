import { Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, GraduationCap } from "lucide-react";
import { GlassSurface } from "@/components/GlassSurface";

type Props = {
  articlesHref?: string;
  mainHubHref?: string;
};

export function ArticlesEntryCard({ articlesHref = "/articles", mainHubHref = "/" }: Props) {
  return (
    <section
      className="mt-4 grid gap-4 md:grid-cols-2"
      aria-label="Choose your JEE Prep Hub experience"
    >
      <GlassSurface
        as={Link}
        to={articlesHref as "/articles"}
        interactive
        className="group flex min-h-[220px] flex-col items-start rounded-3xl p-6 no-underline sm:p-7"
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-muted/50 text-accent ring-1 ring-border/60 transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105">
          <BookOpen className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="mt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
          Read · write · grow
        </span>
        <strong className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.7rem]">
          Explore Articles
        </strong>
        <span className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Clear concept explainers, exam strategies and ideas from fellow learners.
        </span>
        <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-accent">
          Visit Articles
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
        <span
          className="pointer-events-none absolute -bottom-8 right-5 font-display text-[9rem] font-bold leading-none text-accent/10"
          aria-hidden="true"
        >
          Aa
        </span>
      </GlassSurface>

      <GlassSurface
        as={Link}
        to={mainHubHref as "/dashboard"}
        interactive
        className="group flex min-h-[220px] flex-col items-start rounded-3xl p-6 no-underline sm:p-7"
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-muted/50 text-primary ring-1 ring-border/60 transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105">
          <GraduationCap className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="mt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
          Your study workspace
        </span>
        <strong className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.7rem]">
          Open JEE Prep Hub
        </strong>
        <span className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Return to your learning dashboard, resources, practice and study tools.
        </span>
        <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-primary">
          Open Study Hub
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </GlassSurface>
    </section>
  );
}
