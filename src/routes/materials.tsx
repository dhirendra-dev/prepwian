import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { AppShell } from "@/components/AppShell";
import { MaterialsUnlock } from "@/components/MaterialsUnlock";
import {
  listMaterials,
  lockMaterials,
  type GatedMaterial,
} from "@/lib/materials-gate.functions";

import {
  Search,
  SlidersHorizontal,
  ExternalLink,
  Eye,
  Lock,
  Loader2,
  BookOpen,
  Atom,
  FlaskConical,
  Sigma,
  FileText,
  Target,
  Bookmark,
  Library,
  Sparkles,
  ChevronRight,
  Download,
  Grid2X2,
  List,
  X,
} from "lucide-react";

export const Route = createFileRoute(
  "/materials",
)({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Study Material — PREPWIAN" },
      { property: "og:description", content: "Explore Physics, Chemistry and Mathematics notes, modules, previous-year questions, books and test series for Class 11, Class 12 and droppers." },
      { name: "twitter:description", content: "Explore Physics, Chemistry and Mathematics notes, modules, previous-year questions, books and test series for Class 11, Class 12 and droppers." },
      { property: "og:url", content: "https://jeeprephub.co.in/materials" },

      {
        title: "Study Material — PREPWIAN",
      },
      {
        name: "description",
        content:
          "PREPWIAN study material library for Physics, Chemistry, Mathematics and more.",
      },
      {
        property: "og:title",
        content: "Study Material — PREPWIAN",
      },
      {
        property: "og:type",
        content: "website",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://jeeprephub.co.in/materials",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://jeeprephub.co.in" },
            { "@type": "ListItem", position: 2, name: "Study Material", item: "https://jeeprephub.co.in/materials" },
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "PREPWIAN Study Material Library",
          description:
            "Curated JEE study materials for Physics, Chemistry and Mathematics — notes, modules, PYQs, test series and books.",
          url: "https://jeeprephub.co.in/materials",
        }),
      },
    ],
  }),
  component: () => <ClientOnly fallback={<AppShell><MaterialsSkeleton /></AppShell>}><MaterialsPage /></ClientOnly>,
});

const SUBJECTS = [
  "all",
  "physics",
  "chemistry",
  "mathematics",
  "general",
] as const;

const CLASSES = [
  "all",
  "class_11",
  "class_12",
  "dropper",
  "both",
] as const;

const PAGE_SIZE = 30;
const SEARCH_DEBOUNCE_MS = 200;
const BOOKMARKS_KEY = "jee-prep-hub-material-bookmarks";

type Subject = (typeof SUBJECTS)[number];
type ClassLevel = (typeof CLASSES)[number];

function driveToPreview(url: string) {
  const fileMatch = url.match(
    /\/file\/d\/([^/]+)/,
  );

  if (fileMatch) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }

  return url;
}

function prettyLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) =>
      c.toUpperCase(),
    );
}

function subjectIcon(subject: string) {
  switch (subject) {
    case "physics":
      return Atom;

    case "chemistry":
      return FlaskConical;

    case "mathematics":
      return Sigma;

    default:
      return BookOpen;
  }
}

function subjectColor(subject: string) {
  switch (subject) {
    case "physics":
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-500/20",
        gradient:
          "from-blue-600 to-indigo-600",
      };

    case "chemistry":
      return {
        bg: "bg-orange-500/10",
        text: "text-orange-600 dark:text-orange-400",
        border: "border-orange-500/20",
        gradient:
          "from-orange-500 to-red-500",
      };

    case "mathematics":
      return {
        bg: "bg-violet-500/10",
        text: "text-violet-600 dark:text-violet-400",
        border: "border-violet-500/20",
        gradient:
          "from-violet-600 to-purple-600",
      };

    default:
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-500/20",
        gradient:
          "from-emerald-500 to-teal-600",
      };
  }
}

function resourceIcon(
  resourceType: string,
) {
  const type =
    resourceType.toLowerCase();

  if (
    type.includes("dpp") ||
    type.includes("practice")
  ) {
    return Target;
  }

  if (
    type.includes("pyq") ||
    type.includes("question")
  ) {
    return FileText;
  }

  if (
    type.includes("book") ||
    type.includes("module")
  ) {
    return Library;
  }

  if (
    type.includes("formula") ||
    type.includes("revision")
  ) {
    return Sparkles;
  }

  return FileText;
}

function resourceTone(
  resourceType: string,
) {
  const type =
    resourceType.toLowerCase();

  if (type.includes("dpp")) {
    return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
  }

  if (type.includes("pyq")) {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  }

  if (
    type.includes("book") ||
    type.includes("module")
  ) {
    return "bg-violet-500/10 text-violet-600 dark:text-violet-400";
  }

  if (
    type.includes("formula") ||
    type.includes("revision")
  ) {
    return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
  }

  return "bg-red-500/10 text-red-600 dark:text-red-400";
}

function UnlockCard({
  onUnlocked,
}: {
  onUnlocked: () => void;
}) {
  return (
    <MaterialsUnlock
      onUnlocked={onUnlocked}
      title="Study Materials are locked"
    />
  );
}

function MaterialsPage() {
  const qc = useQueryClient();

  const fetchMaterials =
    useServerFn(listMaterials);

  const lock =
    useServerFn(lockMaterials);

  const [q, setQ] = useState("");
  const [search, setSearch] =
    useState("");
  const searchDraft = q.trim().replace(/\s+/g, " ");

  const [subject, setSubject] =
    useState<Subject>("all");

  const [cls, setCls] =
    useState<ClassLevel>("all");

  const [resourceFilter, setResourceFilter] =
    useState("all");

  const [view, setView] =
    useState<"grid" | "list">("grid");

  const [showFilters, setShowFilters] =
    useState(false);

  const [savedOnly, setSavedOnly] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(BOOKMARKS_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed)
        ? parsed.filter((value): value is string => typeof value === "string")
        : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    } catch {
      // Ignore storage errors.
    }
  }, [bookmarks]);

  const toggleBookmark = (id: string) => {
    setBookmarks((current) =>
      current.includes(id)
        ? current.filter((bookmarkId) => bookmarkId !== id)
        : [...current, id],
    );
  };

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        setSearch(searchDraft);
      }, SEARCH_DEBOUNCE_MS);

    return () =>
      window.clearTimeout(timer);
  }, [searchDraft]);

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "materials-gated",
      subject,
      cls,
      search,
    ],

    initialPageParam: 1,

    queryFn: ({
      pageParam,
    }) =>
      fetchMaterials({
        data: {
          subject,
          class_level: cls,
          search,
          page: pageParam,
          pageSize: PAGE_SIZE,
        },
      }),

    getNextPageParam:
      (lastPage) =>
        lastPage.hasNextPage
          ? lastPage.page + 1
          : undefined,

    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  const firstPage =
    data?.pages[0];

  const locked =
    firstPage?.locked ?? false;

  const materials =
    data?.pages.flatMap(
      (page) => page.materials,
    ) ?? [];

  const total =
    firstPage?.total ?? 0;

  const resourceTypes =
    useMemo(() => {
      const values =
        new Set<string>();

      for (
        const material of materials
      ) {
        if (
          material.resource_type
        ) {
          values.add(
            material.resource_type,
          );
        }
      }

      return [
        "all",
        ...Array.from(values),
      ];
    }, [materials]);

  const filteredMaterials =
    useMemo(() => {
      let result = materials;
      if (savedOnly) {
        result = result.filter((material) => bookmarks.includes(material.id));
      }
      if (resourceFilter !== "all") {
        result = result.filter((material) => material.resource_type === resourceFilter);
      }
      return result;
    }, [materials, resourceFilter, savedOnly, bookmarks]);

  const subjectCounts =
    useMemo(() => {
      const counts: Record<
        string,
        number
      > = {};

      for (
        const material of materials
      ) {
        counts[
          material.subject
        ] =
          (counts[
            material.subject
          ] ?? 0) + 1;
      }

      return counts;
    }, [materials]);

  const featured =
    filteredMaterials.slice(
      0,
      6,
    );


  if (isLoading) {
    return (
      <AppShell>
        <MaterialsSkeleton />
      </AppShell>
    );
  }

  if (locked) {
    return (
      <AppShell>
        <UnlockCard
          onUnlocked={() =>
            qc.invalidateQueries(
              {
                queryKey: [
                  "materials-gated",
                ],
              },
            )
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl pb-10">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[28px] border border-border/50 bg-gradient-to-br from-[#071a42] via-[#0c2d68] to-[#1266d6] p-5 text-white shadow-xl sm:p-7">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-blue-400/20 blur-3xl" />

          <div className="absolute -bottom-24 right-20 h-52 w-52 rounded-full bg-orange-400/20 blur-3xl" />

          <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_320px] lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold backdrop-blur dark:border-white/10 dark:bg-white/5">
                <Sparkles className="h-3.5 w-3.5 text-orange-300" />
                PREPWIAN LIBRARY
              </div>

              <h1 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Study Material
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                Everything you need for
                JEE preparation —
                organised, searchable and
                ready to study.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur dark:bg-white/5">
                  Class 11
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur dark:bg-white/5">
                  Class 12
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur dark:bg-white/5">
                  JEE Main
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur dark:bg-white/5">
                  JEE Advanced
                </span>
              </div>
            </div>

            <div className="hidden lg:flex lg:justify-end">
              <div className="relative flex h-56 w-64 items-center justify-center">
                <div className="absolute h-44 w-44 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]" />

                <div className="absolute h-32 w-32 rounded-full bg-orange-400/20 blur-xl" />

                <div className="relative rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                  <BookOpen className="h-24 w-24 text-white/90 dark:text-white/80" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH */}
        <section className="relative z-20 mt-4 px-0 sm:mt-5 sm:px-6">
          <div className="mx-auto flex w-full max-w-5xl items-center gap-2 rounded-2xl border border-border/60 bg-card/95 p-2 shadow-lg backdrop-blur-xl">
            <Search className="ml-2 h-5 w-5 shrink-0 text-muted-foreground" />

            <input
              value={q}
              aria-label="Search study materials and PDFs"
              aria-busy={searchDraft !== search || (isFetching && !isFetchingNextPage)}
              autoComplete="off"
              enterKeyHint="search"
              onChange={(e) =>
                setQ(e.target.value)
              }
              placeholder="Search notes, PYQs, DPPs, books..."
              className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
            />
            {(searchDraft !== search || (isFetching && !isFetchingNextPage)) && (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-label="Updating results" />
            )}

            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setSearch("");
                }}
                className="rounded-full p-2 hover:bg-muted"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setShowFilters(
                  (v) => !v,
                )
              }
              className="rounded-xl border border-border/60 p-2.5 hover:bg-muted"
              aria-label="Filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* FILTER PANEL */}
        {showFilters && (
          <section className="mt-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <FilterGroup
                title="Class"
                values={CLASSES.map(
                  (value) => ({
                    value,
                    label:
                      value ===
                      "all"
                        ? "All classes"
                        : prettyLabel(
                            value,
                          ),
                  }),
                )}
                selected={cls}
                onChange={(value) =>
                  setCls(
                    value as ClassLevel,
                  )
                }
              />

              <FilterGroup
                title="Resource type"
                values={resourceTypes.map(
                  (value) => ({
                    value,
                    label:
                      value ===
                      "all"
                        ? "All types"
                        : prettyLabel(
                            value,
                          ),
                  }),
                )}
                selected={
                  resourceFilter
                }
                onChange={
                  setResourceFilter
                }
              />
            </div>
          </section>
        )}

        {/* SUBJECTS */}
        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">
                Subjects
              </h2>

              <p className="text-xs text-muted-foreground">
                Pick a subject to
                explore its library.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {SUBJECTS.map(
              (item) => {
                const Icon =
                  subjectIcon(
                    item,
                  );

                const active =
                  subject ===
                  item;

                const colors =
                  subjectColor(
                    item,
                  );

                const count =
                  item === "all"
                    ? total
                    : subjectCounts[
                        item
                      ] ?? 0;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setSubject(item);
                      setSavedOnly(false);
                    }}
                    className={`group rounded-2xl border p-3 text-left transition-all duration-200 ${
                      active
                        ? `border-transparent bg-gradient-to-br ${colors.gradient} text-white shadow-lg`
                        : `border-border/60 bg-card hover:-translate-y-0.5 hover:shadow-md`
                    }`}
                  >
                    <div
                      className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${
                        active
                          ? "bg-white/15"
                          : colors.bg
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          active
                            ? "text-white"
                            : colors.text
                        }`}
                      />
                    </div>

                    <p className="text-sm font-bold">
                      {item ===
                      "all"
                        ? "All"
                        : prettyLabel(
                            item,
                          )}
                    </p>

                    <p
                      className={`mt-0.5 text-[11px] ${
                        active
                          ? "text-white/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {count.toLocaleString()}{" "}
                      files
                    </p>
                  </button>
                );
              },
            )}
          </div>
        </section>

        {/* QUICK ACCESS */}
        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">
                Quick Access
              </h2>

              <p className="text-xs text-muted-foreground">
                Jump straight into the
                material you need.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            <QuickCard
              icon={FileText}
              title="Class Notes"
              subtitle="Chapter notes"
              tone="blue"
              onClick={() => {
                    setSavedOnly(false);
                    setResourceFilter(
                      findType(resourceTypes, "note") ?? "all",
                    );
                  }}
            />

            <QuickCard
              icon={Target}
              title="DPPs"
              subtitle="Daily practice"
              tone="red"
              onClick={() => {
                    setSavedOnly(false);
                    setResourceFilter(
                      findType(resourceTypes, "dpp") ?? "all",
                    );
                  }}
            />

            <QuickCard
              icon={FileText}
              title="PYQs"
              subtitle="Previous years"
              tone="green"
              onClick={() => {
                    setSavedOnly(false);
                    setResourceFilter(
                      findType(resourceTypes, "pyq") ?? "all",
                    );
                  }}
            />

            <QuickCard
              icon={Library}
              title="Books"
              subtitle="Reference material"
              tone="purple"
              onClick={() => {
                    setSavedOnly(false);
                    setResourceFilter(
                      findType(resourceTypes, "book") ?? "all",
                    );
                  }}
            />

            <QuickCard
              icon={Sparkles}
              title="Revision"
              subtitle="Quick revision"
              tone="orange"
              onClick={() => {
                    setSavedOnly(false);
                    setResourceFilter(
                      findType(resourceTypes, "revision") ?? "all",
                    );
                  }}
            />

            <QuickCard
              icon={Bookmark}
              title="Saved"
              subtitle="Your collection"
              tone="cyan"
              onClick={() => {
                setResourceFilter("all");
                setSavedOnly(true);
              }}
            />
          </div>
        </section>

        {/* LATEST */}
        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-bold">
                {search ||
                subject !==
                  "all"
                  ? "Search Results"
                  : "Latest Materials"}
              </h2>

              <p className="text-xs text-muted-foreground">
                {filteredMaterials.length.toLocaleString()}{" "}
                materials shown
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card p-1">
                 <button
                type="button"
                onClick={() =>
                  setView("grid")
                }
                className={`rounded-lg p-1.5 ${
                  view === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
                aria-label="Grid view"
              >
                <Grid2X2 className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setView("list")
                }
                className={`rounded-lg p-1.5 ${
                  view === "list"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {filteredMaterials.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />

              <p className="mt-3 text-sm font-semibold">
                No materials found
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Try another search or filter.
              </p>
            </div>
          ) : view === "grid" ? (
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMaterials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                   isBookmarked={bookmarks.includes(material.id)}
                   onToggleBookmark={() => toggleBookmark(material.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMaterials.map((material) => (
                <MaterialListRow
                  key={material.id}
                  material={material}
                   isBookmarked={bookmarks.includes(material.id)}
                   onToggleBookmark={() => toggleBookmark(material.id)}
                />
              ))}
            </div>
          )}

          {hasNextPage && (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() =>
                  fetchNextPage()
                }
                disabled={isFetchingNextPage}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-bold shadow-sm transition hover:bg-muted disabled:opacity-60"
              >
                {isFetchingNextPage && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {isFetchingNextPage
                  ? "Loading..."
                  : `Load more · ${materials.length.toLocaleString()} of ${total.toLocaleString()}`}
              </button>
            </div>
          )}
        </section>

        {/* RECOMMENDED */}
        {featured.length > 2 && (
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">
                  Recommended for You
                </h2>

                <p className="text-xs text-muted-foreground">
                  A few useful resources from the library.
                </p>
              </div>

              <Sparkles className="h-5 w-5 text-orange-500" />
            </div>

            <div className="grid min-w-0 gap-2 sm:grid-cols-3">
              {featured.slice(0, 3).map((material) => (
                <RecommendedCard
                  key={material.id}
                  material={material}
                   isBookmarked={bookmarks.includes(material.id)}
                   onToggleBookmark={() => toggleBookmark(material.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* LOCK AGAIN */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={async () => {
              await lock();

              qc.removeQueries({
                queryKey: ["materials-gated"],
              });
            }}
            className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted"
          >
            <Lock className="h-3.5 w-3.5" />
            Lock materials
          </button>
        </div>
      </div>
    </AppShell>
  );
                                        }
function MaterialCard({
  material,
  isBookmarked,
  onToggleBookmark,
}: {
  material: GatedMaterial;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}) {
  const Icon = resourceIcon(material.resource_type);
  const tone = resourceTone(material.resource_type);
  const colors = subjectColor(material.subject);

  return (
    <article className="group flex min-w-0 w-full max-w-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex min-w-0 gap-3 p-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon className="h-6 w-6" /></div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex min-w-0 items-start gap-2">
            <h3 className="min-w-0 flex-1 break-words line-clamp-2 text-sm font-bold leading-snug">{material.title}</h3>
            <span className={`max-w-[38%] shrink-0 truncate rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${colors.bg} ${colors.text}`}>{prettyLabel(material.subject)}</span>
          </div>
          {material.description && <p className="mt-1.5 line-clamp-2 break-words text-[11px] leading-5 text-muted-foreground">{material.description}</p>}
        </div>
      </div>
      <div className="mt-auto min-w-0 px-4 pb-3">
        <div className="flex min-w-0 flex-wrap gap-1.5">
          <span className="max-w-full truncate rounded-full bg-muted px-2 py-1 text-[9px] font-semibold text-muted-foreground">{prettyLabel(material.resource_type)}</span>
          <span className="max-w-full truncate rounded-full bg-muted px-2 py-1 text-[9px] font-semibold text-muted-foreground">{prettyLabel(material.class_level)}</span>
          {material.topic && <span className="max-w-[150px] truncate rounded-full bg-muted px-2 py-1 text-[9px] font-semibold text-muted-foreground">{material.topic}</span>}
        </div>
      </div>
      <div className="flex min-w-0 gap-2 border-t border-border/50 bg-card/70 p-3 backdrop-blur-sm">
        <a href={material.drive_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90"><ExternalLink className="h-3.5 w-3.5 shrink-0" /><span>Open</span></a>
        <a href={driveToPreview(material.drive_url)} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs font-bold transition hover:bg-muted"><Eye className="h-3.5 w-3.5 shrink-0" /><span>Preview</span></a>
        <button type="button" onClick={onToggleBookmark} aria-label={isBookmarked ? "Remove bookmark" : "Bookmark material"} aria-pressed={isBookmarked} className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${isBookmarked ? "border-amber-400/40 bg-amber-400/10 text-amber-500" : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} /></button>
      </div>
    </article>
  );
}

function MaterialListRow({
  material,
  isBookmarked,
  onToggleBookmark,
}: {
  material: GatedMaterial;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}) {
  const Icon = resourceIcon(material.resource_type);
  const tone = resourceTone(material.resource_type);
  return (
    <article className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm transition hover:shadow-md">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1 overflow-hidden"><h3 className="truncate text-sm font-bold">{material.title}</h3><div className="mt-1 flex min-w-0 flex-wrap gap-1.5"><span className="truncate text-[10px] text-muted-foreground">{prettyLabel(material.subject)}</span><span className="text-[10px] text-muted-foreground">•</span><span className="truncate text-[10px] text-muted-foreground">{prettyLabel(material.resource_type)}</span>{material.topic && <><span className="text-[10px] text-muted-foreground">•</span><span className="max-w-[180px] truncate text-[10px] text-muted-foreground">{material.topic}</span></>}</div></div>
      <button type="button" onClick={onToggleBookmark} aria-label={isBookmarked ? "Remove bookmark" : "Bookmark material"} aria-pressed={isBookmarked} className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${isBookmarked ? "border-amber-400/40 bg-amber-400/10 text-amber-500" : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} /></button>
      <a href={material.drive_url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"><Download className="h-3.5 w-3.5" />Open</a>
    </article>
  );
}

function RecommendedCard({
  material,
  isBookmarked,
  onToggleBookmark,
}: {
  material: GatedMaterial;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}) {
  const colors = subjectColor(material.subject);
  return (
    <div className="group min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-border/60 bg-card p-3 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex min-w-0 items-center gap-3">
        <a href={material.drive_url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors.bg}`}><FileText className={`h-5 w-5 ${colors.text}`} /></div><div className="min-w-0 flex-1 overflow-hidden"><p className="truncate text-xs font-bold">{material.title}</p><p className="mt-0.5 truncate text-[10px] text-muted-foreground">{prettyLabel(material.subject)} · {prettyLabel(material.resource_type)}</p></div></a>
        <button type="button" onClick={onToggleBookmark} aria-label={isBookmarked ? "Remove bookmark" : "Bookmark material"} aria-pressed={isBookmarked} className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${isBookmarked ? "border-amber-400/40 bg-amber-400/10 text-amber-500" : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} /></button>
        <a href={material.drive_url} target="_blank" rel="noopener noreferrer" aria-label="Open material" className="shrink-0 rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"><ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></a>
      </div>
    </div>
  );
}

function QuickCard({
  icon: Icon,
  title,
  subtitle,
  tone,
  onClick,
}: {
  icon: typeof FileText;
  title: string;
  subtitle: string;
  tone:
    | "blue"
    | "red"
    | "green"
    | "purple"
    | "orange"
    | "cyan";
  onClick: () => void;
}) {
  const tones = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
    green:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    purple:
      "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    orange:
      "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-border/60 bg-card p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
      </div>

      <p className="mt-3 text-xs font-bold">
        {title}
      </p>

      <p className="mt-0.5 text-[10px] text-muted-foreground">
        {subtitle}
      </p>
    </button>
  );
}
function FilterGroup({
  title,
  values,
  selected,
  onChange,
}: {
  title: string;
  values: {
    value: string;
    label: string;
  }[];
  selected: string;
  onChange: (
    value: string,
  ) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>

      <div className="flex flex-wrap gap-2">
        {values.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() =>
              onChange(item.value)
            }
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              selected === item.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function findType(
  values: string[],
  needle: string,
) {
  return values.find((value) =>
    value
      .toLowerCase()
      .includes(needle),
  );
}

function MaterialsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-6">
      <div className="h-64 rounded-[28px] bg-muted" />

      <div className="h-14 rounded-2xl bg-muted" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Array.from({
          length: 5,
        }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-muted"
          />
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({
          length: 6,
        }).map((_, i) => (
          <div
            key={i}
            className="h-48 rounded-2xl bg-muted"
          />
        ))}
      </div>
    </div>
  );
}
