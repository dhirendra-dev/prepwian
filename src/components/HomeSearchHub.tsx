import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Clock3,
  Command,
  Compass,
  History,
  Menu,
  Search,
  X,
} from "lucide-react";
import { GlassSurface } from "@/components/GlassSurface";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { trackSearchQuery } from "@/lib/search-analytics";
import { showXpRewardToast } from "@/lib/xp-toast";
import { rankSearchResults, type RankableResult } from "@/features/search/rankSearchResults";
import { getQuickSearchRoutes, searchUniversal } from "@/lib/search.functions";
import {
  getSearchCategoryLabel,
  type UniversalSearchResult,
} from "@/features/search/universalSearch";
import {
  addSearchHistory,
  clearSearchHistory,
  readSavedSearches,
  readSearchBookmarks,
  readSearchHistory,
  toggleSavedSearch,
  toggleSearchBookmark,
  type SearchHistoryItem,
} from "@/features/search/searchHistory";

export function HomeSearchHub({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    setHistory(readSearchHistory());
    setSavedSearches(readSavedSearches());
    setBookmarks(readSearchBookmarks());
  }, []);

  const normalizedQuery = query.normalize("NFKC").trim();
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(normalizedQuery), 250);
    return () => window.clearTimeout(timer);
  }, [normalizedQuery]);
  const resultsQuery = useQuery({
    queryKey: ["universal-search", debouncedQuery, user?.id ?? null],
    queryFn: () => searchUniversal({ data: { query: debouncedQuery, pageSize: 8 } }),
    enabled: debouncedQuery.length >= 2,
    staleTime: 15_000,
  });
  const routesQuery = useQuery({
    queryKey: ["universal-search-quick-routes", user?.id ?? null],
    queryFn: () => getQuickSearchRoutes({ data: { limit: 6 } }),
    enabled: !normalizedQuery,
    staleTime: 5 * 60_000,
  });
  const recent = history.slice(0, 5);
  const searchReady = normalizedQuery === debouncedQuery;
  const shownResults: UniversalSearchResult[] = normalizedQuery
    ? searchReady
      ? (resultsQuery.data?.results ?? [])
      : []
    : ((routesQuery.data ?? []) as UniversalSearchResult[]);

  const submit = (value = query) => {
    const normalized = value.trim();
    if (!normalized) return;
    setHistory(addSearchHistory(normalized));
    setQuery(normalized);
    void trackSearchQuery(normalized, user?.id, "home").then((result) => {
      if (result.awarded) showXpRewardToast(4, "Completed a search");
    });
  };

  const toggleSave = () => {
    if (!normalizedQuery) return;
    setSavedSearches(toggleSavedSearch(normalizedQuery));
  };

  const reset = () => {
    setQuery("");
  };

  return (
    <section
      className="relative isolate flex min-h-[calc(100svh-5.25rem)] items-center overflow-hidden border-b border-border/60 px-4 py-8 sm:px-6 sm:py-12"
      aria-labelledby="search-hub-title"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,hsl(var(--primary)/0.2),transparent_34%),radial-gradient(circle_at_85%_75%,hsl(var(--accent)/0.16),transparent_35%)]" />
      <div className="pointer-events-none absolute -left-28 top-20 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-0 -z-10 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(300px,.92fr)] lg:gap-12">
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-primary">
              <Command className="h-3 w-3" /> JEE Prep Hub
            </span>
            <span className="rounded-full border border-border/70 bg-card/50 px-3 py-1.5">
              One search, across the hub
            </span>
          </div>
          <h1
            id="search-hub-title"
            className="max-w-3xl font-display text-[clamp(2.5rem,7vw,5.75rem)] font-bold leading-[0.98] tracking-[-0.04em]"
          >
            Find your next<span className="block text-liquid">study move.</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Search published study content, academic resources, community discussions, permitted
            messages, profiles, policies and every available page.
          </p>

          <form
            className="relative mt-7 max-w-2xl"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
            role="search"
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-primary" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search JEE resources, posts, messages, people…"
              aria-label="Search JEE Prep Hub"
              autoComplete="off"
              maxLength={200}
              className="h-14 rounded-2xl border-primary/25 bg-card/80 pl-12 pr-24 text-base shadow-xl shadow-primary/5 backdrop-blur-xl"
            />
            {query && (
              <button
                type="button"
                onClick={reset}
                aria-label="Clear search"
                className="absolute right-14 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"
            >
              Search
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {onOpenMenu && (
              <button
                type="button"
                onClick={onOpenMenu}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 font-semibold hover:border-primary/40 hover:text-foreground"
              >
                <Menu className="h-3.5 w-3.5" /> Browse the site menu
              </button>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5">
              <Clock3 className="h-3.5 w-3.5" /> Search history stays on this device
            </span>
          </div>

          {!normalizedQuery && recent.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  <History className="h-3.5 w-3.5" /> Recent searches
                </p>
                <button
                  type="button"
                  onClick={() => {
                    clearSearchHistory();
                    setHistory([]);
                  }}
                  className="text-[11px] font-semibold text-accent hover:underline"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((item) => (
                  <button
                    type="button"
                    key={item.query}
                    onClick={() => submit(item.query)}
                    className="rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-xs hover:border-primary/40 hover:text-primary"
                  >
                    {item.query}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <GlassSurface className="rounded-[2rem] border-primary/15 bg-card/60 p-4 shadow-2xl shadow-primary/5 backdrop-blur-xl sm:p-5">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {normalizedQuery ? "Cross-site search" : "Explore JEE Prep Hub"}
              </p>
              <h2 className="mt-1 font-display text-xl font-bold">
                {normalizedQuery ? `Results for “${normalizedQuery}”` : "Popular starting points"}
              </h2>
              {normalizedQuery && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {resultsQuery.isFetching
                    ? "Searching authorized sources…"
                    : `${resultsQuery.data?.total ?? 0} matching records`}
                </p>
              )}
            </div>
            {normalizedQuery && (
              <button
                type="button"
                onClick={toggleSave}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1.5 text-xs font-semibold hover:border-primary/40"
                aria-pressed={savedSearches.includes(normalizedQuery)}
              >
                {savedSearches.includes(normalizedQuery) ? (
                  <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5" />
                )}
                Save
              </button>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {shownResults.map((item) => {
              const saved = bookmarks.includes(item.url);
              return (
                <div key={`${item.category}:${item.id}`} className="group flex items-center gap-2">
                  <a
                    href={item.url}
                    onClick={() => normalizedQuery && submit()}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-transparent p-2.5 transition hover:border-border/70 hover:bg-muted/50"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted/70 text-primary">
                      <Compass className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{item.title}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {item.snippet || item.description}
                      </span>
                      {(item.authorName || item.groupName) && (
                        <span className="block truncate text-[10px] text-muted-foreground">
                          {item.authorName ? `By ${item.authorName}` : ""}
                          {item.authorName && item.groupName ? " · " : ""}
                          {item.groupName || ""}
                        </span>
                      )}
                      {normalizedQuery && (
                        <span className="mt-1 inline-flex rounded-full border border-border/60 px-2 py-0.5 text-[9px] text-muted-foreground">
                          {getSearchCategoryLabel(item.category)} · {item.source}
                        </span>
                      )}
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setBookmarks(toggleSearchBookmark(item.url))}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary"
                    aria-label={saved ? `Remove ${item.title} bookmark` : `Bookmark ${item.title}`}
                    aria-pressed={saved}
                  >
                    {saved ? (
                      <BookmarkCheck className="h-4 w-4 text-primary" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </button>
                </div>
              );
            })}
            {normalizedQuery && (!searchReady || resultsQuery.isFetching) && (
              <p className="rounded-xl px-3 py-5 text-center text-xs text-muted-foreground">
                Searching searchable content and pages…
              </p>
            )}
            {normalizedQuery &&
              searchReady &&
              !resultsQuery.isFetching &&
              (resultsQuery.data?.results.length ?? 0) === 0 && (
                <p className="rounded-xl px-3 py-5 text-center text-xs text-muted-foreground">
                  No matches found. Try a subject, feature name, title, or phrase.
                </p>
              )}
            {!normalizedQuery && routesQuery.isFetching && (
              <p className="px-3 py-5 text-center text-xs text-muted-foreground">
                Loading site routes…
              </p>
            )}
            {normalizedQuery && searchReady && (resultsQuery.data?.warnings.length ?? 0) > 0 && (
              <p className="border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                Some sources are unavailable for this session; results shown still follow the site’s
                access rules.
              </p>
            )}
          </div>
          {normalizedQuery &&
            resultsQuery.data &&
            resultsQuery.data.total > resultsQuery.data.results.length && (
              <a
                href={`/searches?q=${encodeURIComponent(normalizedQuery)}`}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 px-3 py-2.5 text-xs font-bold text-muted-foreground hover:border-primary/40 hover:text-primary"
              >
                See all {resultsQuery.data.total} results <ArrowRight className="h-3.5 w-3.5" />
              </a>
            )}
          <a
            href={
              normalizedQuery ? `/searches?q=${encodeURIComponent(normalizedQuery)}` : "/searches"
            }
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 px-3 py-2.5 text-xs font-bold text-muted-foreground hover:border-primary/40 hover:text-primary"
          >
            {normalizedQuery ? "Open full search results" : "Explore all content types"}
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </GlassSurface>
      </div>
    </section>
  );
}
