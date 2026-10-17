import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { trackSearchQuery } from "@/lib/search-analytics";
import { SearchRecommendations } from "@/features/search/SearchRecommendations";
import { Link } from "@tanstack/react-router";
import { showXpRewardToast } from "@/lib/xp-toast";
import { searchUniversal } from "@/lib/search.functions";
import {
  getSearchCategoryLabel,
  type UniversalSearchResult,
} from "@/features/search/universalSearch";
import {
  ArrowLeft,
  ArrowRight,
  Atom,
  BookOpen,
  CheckCircle,
  FileText,
  HelpCircle,
  Mic,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import "./google-search.css";

type Tab = { id: string; label: string; icon: typeof Search };
const TABS: Tab[] = [
  { id: "all", label: "All", icon: Search },
  { id: "route", label: "Pages", icon: ArrowRight },
  { id: "article", label: "Articles", icon: BookOpen },
  { id: "note", label: "Notes", icon: FileText },
  { id: "material", label: "Materials", icon: FileText },
  { id: "academic", label: "Official JEE", icon: ShieldCheck },
  { id: "community", label: "Community", icon: Users },
  { id: "forum", label: "Forum", icon: Users },
  { id: "message", label: "Group chat", icon: Users },
  { id: "private-message", label: "Private & support", icon: Users },
  { id: "person", label: "People", icon: Users },
  { id: "test", label: "Practice", icon: CheckCircle },
  { id: "video", label: "Lectures", icon: Atom },
  { id: "notice", label: "Notices", icon: FileText },
  { id: "topper", label: "Toppers", icon: HelpCircle },
  { id: "policy", label: "Policies", icon: ShieldCheck },
];
const RECENTS_KEY = "jph_google_search_recent_v1";
const PAGE_SIZE = 10;
const normalize = (value: string) =>
  value.normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, 160);
function readRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
    return Array.isArray(value) ? value.filter((item) => typeof item === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
}
function saveRecent(query: string) {
  if (!query || typeof window === "undefined") return;
  try {
    localStorage.setItem(
      RECENTS_KEY,
      JSON.stringify(
        [
          query,
          ...readRecents().filter((item) => item.toLowerCase() !== query.toLowerCase()),
        ].slice(0, 8),
      ),
    );
  } catch {
    /* local storage is optional */
  }
}
function highlight(text: string, query: string) {
  const terms = query.split(/\s+/).filter((term) => term.length > 1);
  if (!terms.length) return text;
  const escaped = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const parts = text.split(new RegExp(`(${escaped})`, "ig"));
  return parts.map((part, index) =>
    terms.some((term) => part.toLowerCase() === term.toLowerCase()) ? (
      <mark key={`${part}-${index}`} className="rounded bg-primary/15 px-0.5 text-inherit">
        {part}
      </mark>
    ) : (
      <span key={`${index}-${part}`}>{part}</span>
    ),
  );
}
function SpeechButton({
  onTranscript,
  onError,
}: {
  onTranscript: (value: string) => void;
  onError: (value: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<{
    start: () => void;
    stop: () => void;
    onresult:
      | ((event: {
          results?: { [index: number]: { [index: number]: { transcript?: string } } };
        }) => void)
      | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
  } | null>(null);
  useEffect(() => () => recognitionRef.current?.stop(), []);
  const start = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const win = window as Window & {
      SpeechRecognition?: new () => typeof recognitionRef.current;
      webkitSpeechRecognition?: new () => typeof recognitionRef.current;
    };
    const Recognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Recognition) {
      onError("Voice search is not supported here. Type your search instead.");
      return;
    }
    try {
      const recognition = new Recognition();
      if (!recognition) return;
      recognitionRef.current = recognition;
      (
        recognition as typeof recognition & {
          lang: string;
          interimResults: boolean;
          maxAlternatives: number;
        }
      ).lang = "en-IN";
      (
        recognition as typeof recognition & {
          lang: string;
          interimResults: boolean;
          maxAlternatives: number;
        }
      ).interimResults = false;
      (
        recognition as typeof recognition & {
          lang: string;
          interimResults: boolean;
          maxAlternatives: number;
        }
      ).maxAlternatives = 1;
      recognition.onresult = (event) => {
        const value = event.results?.[0]?.[0]?.transcript;
        if (value) onTranscript(value);
      };
      recognition.onerror = () => {
        setListening(false);
        onError("Could not hear that. Please try typing your search.");
      };
      recognition.onend = () => {
        setListening(false);
        recognitionRef.current = null;
      };
      setListening(true);
      recognition.start();
    } catch {
      setListening(false);
      onError("Voice search could not start. You can type your search instead.");
    }
  };
  return (
    <button
      type="button"
      onClick={start}
      className={`jph-google__voice ${listening ? "is-listening" : ""}`}
      aria-label={listening ? "Stop voice search" : "Start voice search"}
      title={listening ? "Stop listening" : "Voice search"}
    >
      <Mic aria-hidden="true" />
    </button>
  );
}
function ResultCard({ item, query }: { item: UniversalSearchResult; query: string }) {
  return (
    <article className="jph-google__result">
      <div className="result-source">
        <span className="source-dot">
          <Search aria-hidden="true" />
        </span>
        {getSearchCategoryLabel(item.category)}
        <span aria-hidden="true">·</span>
        {item.source}
      </div>
      <h2>
        <a href={item.url}>{highlight(item.title, query)}</a>
      </h2>
      <p>{highlight(item.snippet || item.description, query)}</p>
      <div className="result-meta">
        {item.authorName && <span>By {item.authorName}</span>}
        {item.groupName && <span>{item.groupName}</span>}
        {item.subject && <span>{item.subject}</span>}
        {item.classLevel && <span>Class {item.classLevel}</span>}
        {item.createdAt && <span>{new Date(item.createdAt).toLocaleDateString()}</span>}
      </div>
      <a className="result-open" href={item.url}>
        Open result <ArrowRight aria-hidden="true" />
      </a>
    </article>
  );
}

export default function GoogleSearchHome() {
  const { user } = useAuth();
  const initial = useMemo(
    () =>
      typeof window === "undefined"
        ? ""
        : (new URLSearchParams(window.location.search).get("q") ?? ""),
    [],
  );
  const initialType = useMemo(
    () =>
      typeof window === "undefined"
        ? "all"
        : (new URLSearchParams(window.location.search).get("type") ?? "all"),
    [],
  );
  const initialDate = useMemo(
    () =>
      typeof window === "undefined"
        ? "any"
        : (new URLSearchParams(window.location.search).get("date") ?? "any"),
    [],
  );
  const initialSort = useMemo(
    () =>
      typeof window === "undefined"
        ? "relevance"
        : (new URLSearchParams(window.location.search).get("sort") ?? "relevance"),
    [],
  );
  const initialPage = useMemo(() => {
    if (typeof window === "undefined") return 1;
    const value = Number(new URLSearchParams(window.location.search).get("page"));
    return Number.isInteger(value) && value > 0 ? value : 1;
  }, []);
  const [query, setQuery] = useState(initial);
  const [submitted, setSubmitted] = useState(initial.trim().length >= 2);
  const [activeTab, setActiveTab] = useState(
    TABS.some((tab) => tab.id === initialType) ? initialType : "all",
  );
  const [page, setPage] = useState(initialPage);
  const [dateScope, setDateScope] = useState(
    ["any", "month", "year"].includes(initialDate) ? initialDate : "any",
  );
  const [sortBy, setSortBy] = useState(initialSort === "newest" ? "newest" : "relevance");
  const [recents, setRecents] = useState<string[]>(() => readRecents());
  const [voiceError, setVoiceError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const since = useMemo(() => {
    if (dateScope === "any") return null;
    const date = new Date();
    date.setDate(date.getDate() - (dateScope === "month" ? 30 : 365));
    return date.toISOString();
  }, [dateScope]);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  const dataQuery = useQuery({
    queryKey: [
      "universal-search-page",
      normalize(query),
      activeTab,
      page,
      dateScope,
      sortBy,
      user?.id ?? null,
    ],
    queryFn: () =>
      searchUniversal({
        data: {
          query: normalize(query),
          category: activeTab as
            | "all"
            | "route"
            | "person"
            | "note"
            | "material"
            | "article"
            | "academic"
            | "notice"
            | "community"
            | "forum"
            | "message"
            | "private-message"
            | "test"
            | "video"
            | "topper"
            | "policy",
          page,
          pageSize: PAGE_SIZE,
          since,
          sortBy: sortBy as "relevance" | "newest",
        },
      }),
    enabled: submitted && normalize(query).length >= 2,
    staleTime: 15_000,
  });
  const results = dataQuery.data?.results ?? [];
  const total = dataQuery.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const doSearch = (raw = query) => {
    const normalized = normalize(raw);
    setQuery(normalized);
    setPage(1);
    setActiveTab("all");
    setVoiceError("");
    if (!normalized) {
      setSubmitted(false);
      return;
    }
    saveRecent(normalized);
    setRecents(readRecents());
    setSubmitted(true);
    void trackSearchQuery(normalized, user?.id, "menu").then((result) => {
      if (result.awarded) showXpRewardToast(4, "Completed a search");
    });
    const params = new URLSearchParams(window.location.search);
    params.set("q", normalized);
    params.delete("type");
    params.delete("page");
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
    inputRef.current?.blur();
  };
  const selectTab = (value: string) => {
    setActiveTab(value);
    setPage(1);
    const params = new URLSearchParams(window.location.search);
    if (value === "all") params.delete("type");
    else params.set("type", value);
    params.delete("page");
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  };
  const updateFilter = (key: "date" | "sort", value: string) => {
    if (key === "date") setDateScope(value);
    else setSortBy(value);
    setPage(1);
    const params = new URLSearchParams(window.location.search);
    if ((key === "date" && value === "any") || (key === "sort" && value === "relevance"))
      params.delete(key);
    else params.set(key, value);
    params.delete("page");
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  };
  const updatePage = (value: number) => {
    const next = Math.min(pages, Math.max(1, value));
    setPage(next);
    const params = new URLSearchParams(window.location.search);
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  };

  return (
    <main className="jph-google">
      <header className="jph-google__top">
        <div className="jph-google__top-left">
          <a href="/" className="jph-google__mini-brand">
            <b>JEE</b> Prep Hub
          </a>
        </div>
        <div className="jph-google__top-right">
          <a className="nav-glass-btn" href="/" aria-label="Return home">
            <ArrowLeft />
          </a>
        </div>
      </header>
      <section className={`jph-google__hero ${submitted ? "has-results" : ""}`}>
        <h1 className="jph-google__wordmark text-liquid">Find your next study win</h1>
        {!submitted && <p className="jph-google__tagline">Search. Learn. Practice. Succeed.</p>}
        <div className="jph-google__search-wrap">
          <form
            className="jph-google__search"
            role="search"
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              doSearch();
            }}
          >
            <button type="submit" className="jph-google__search-icon" aria-label="Search">
              <Search aria-hidden="true" />
            </button>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the whole PREPWIAN…"
              aria-label="Search PREPWIAN"
              autoComplete="off"
              maxLength={160}
            />
            {query && (
              <button
                type="button"
                className="jph-google__clear"
                onClick={() => {
                  setQuery("");
                  setSubmitted(false);
                  setActiveTab("all");
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
              >
                <X aria-hidden="true" />
              </button>
            )}
            <SpeechButton onTranscript={(value) => doSearch(value)} onError={setVoiceError} />
          </form>
          {voiceError && (
            <p role="status" className="mt-2 text-sm text-destructive">
              {voiceError}
            </p>
          )}
        </div>
        <div className="jph-google__chips" aria-label="Search categories">
          {[
            { label: "Physics", query: "Physics", icon: Atom },
            { label: "Chemistry", query: "Chemistry", icon: Atom },
            { label: "Articles", query: "article", icon: BookOpen },
            { label: "Notes", query: "notes", icon: FileText },
            { label: "Practice", query: "practice", icon: CheckCircle },
            { label: "JEE resources", query: "JEE", icon: ShieldCheck },
          ].map((chip) => (
            <button key={chip.label} type="button" onClick={() => doSearch(chip.query)}>
              <chip.icon aria-hidden="true" />
              {chip.label}
            </button>
          ))}
        </div>
      </section>

      {!submitted && (
        <section className="jph-google__discovery">
          <div className="jph-google__section-heading">
            <div>
              <span className="jph-google__eyebrow">UNIVERSAL SEARCH</span>
              <h2>Find more than pages</h2>
            </div>
            <a href="/">
              Home <ArrowRight aria-hidden="true" />
            </a>
          </div>
          <div className="jph-google__tiles">
            {TABS.filter((tab) => tab.id !== "all")
              .slice(0, 6)
              .map((tab, index) => (
                <button
                  type="button"
                  key={tab.id}
                  className="jph-google__tile text-left"
                  onClick={() => {
                    setActiveTab(tab.id);
                    inputRef.current?.focus();
                  }}
                >
                  <span
                    className={`tile-icon ${index % 3 === 1 ? "purple" : index % 3 === 2 ? "green" : ""}`}
                  >
                    <tab.icon aria-hidden="true" />
                  </span>
                  <strong>{tab.label}</strong>
                  <small>Search this content type</small>
                </button>
              ))}
          </div>
          {recents.length > 0 && (
            <div className="jph-google__recent">
              <div className="jph-google__section-heading">
                <div>
                  <span className="jph-google__eyebrow">ON THIS DEVICE</span>
                  <h2>Recent searches</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.removeItem(RECENTS_KEY);
                    } catch {
                      /* ignore */
                    }
                    setRecents([]);
                  }}
                >
                  Clear
                </button>
              </div>
              {recents.map((item) => (
                <button
                  type="button"
                  className="recent-row"
                  key={item}
                  onClick={() => doSearch(item)}
                >
                  <span>
                    <Search aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                  <span>↗</span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {submitted && (
        <section className="jph-google__results">
          <div className="jph-google__tabs" role="tablist" aria-label="Filter search results">
            {TABS.map((tab) => (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={activeTab === tab.id ? "active" : ""}
                key={tab.id}
                onClick={() => selectTab(tab.id)}
              >
                <tab.icon aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="jph-google__filters">
            <label>
              <span>Date</span>
              <select
                value={dateScope}
                onChange={(event) => updateFilter("date", event.target.value)}
              >
                <option value="any">Any time</option>
                <option value="month">Past 30 days</option>
                <option value="year">Past year</option>
              </select>
            </label>
            <label>
              <span>Sort</span>
              <select value={sortBy} onChange={(event) => updateFilter("sort", event.target.value)}>
                <option value="relevance">Relevance</option>
                <option value="newest">Newest</option>
              </select>
            </label>
          </div>
          <p className="jph-google__result-count">
            {dataQuery.isFetching
              ? "Searching authorized sources…"
              : `${total.toLocaleString()} results · page ${page} of ${pages}`}
          </p>
          {dataQuery.data?.warnings.length ? (
            <p className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
              Some sources could not be searched in this session. Other available results are shown,
              and the app’s existing access rules still apply.
            </p>
          ) : null}
          {dataQuery.isLoading && (
            <div className="jph-google__skeletons" aria-label="Loading search results">
              <article>
                <i />
                <i />
                <i />
              </article>
              <article>
                <i />
                <i />
                <i />
              </article>
            </div>
          )}
          {!dataQuery.isFetching &&
            results.map((item) => (
              <ResultCard
                key={`${item.category}:${item.id}`}
                item={item}
                query={normalize(query)}
              />
            ))}
          {!dataQuery.isFetching && results.length === 0 && (
            <div className="jph-google__empty">
              <span>⌕</span>
              <h2>No matches found</h2>
              <p>Try fewer words, a subject, a feature name, or a distinctive phrase.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSubmitted(false);
                  setActiveTab("all");
                }}
              >
                Start a new search
              </button>
            </div>
          )}
          {total > PAGE_SIZE && (
            <nav className="jph-google__pagination" aria-label="Search result pages">
              <button
                type="button"
                disabled={page <= 1 || dataQuery.isFetching}
                onClick={() => updatePage(page - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} of {pages}
              </span>
              <button
                type="button"
                disabled={page >= pages || dataQuery.isFetching}
                onClick={() => updatePage(page + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </section>
      )}
    </main>
  );
}
