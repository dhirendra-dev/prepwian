import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

type FAQSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function FAQSearch({ value, onChange }: FAQSearchProps) {
  return (
    <div role="search" aria-label="Search FAQs" className="mt-5 sm:max-w-2xl">
      <label htmlFor="faq-search" className="sr-only">
        Search frequently asked questions
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="faq-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder="Search questions, answers, or topics…"
          autoComplete="off"
          aria-controls="faq-results"
          className="h-12 rounded-xl border-border bg-background/80 pl-11 pr-11 text-base focus-visible:ring-2 focus-visible:ring-primary/20"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear FAQ search"
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
