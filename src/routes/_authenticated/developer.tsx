import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DeveloperAccessRestricted } from "@/components/developer/DeveloperAccessRestricted";
import "@/styles/developer-github.css";

type Tab = "overview" | "commits" | "branches" | "releases" | "pulls" | "issues" | "files";
type GHRepo = {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  default_branch: string;
  language: string | null;
  license: { name: string } | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  visibility?: string;
};
type GHCommit = {
  sha: string;
  html_url: string;
  commit: { message: string; author: { name: string; date: string } | null };
  author: { login: string; avatar_url: string; html_url: string } | null;
};
type GHBranch = { name: string; protected: boolean; commit: { sha: string; url: string } };
type GHRelease = {
  id: number;
  name: string | null;
  tag_name: string;
  html_url: string;
  body: string | null;
  published_at: string | null;
  draft: boolean;
  prerelease: boolean;
};
type GHIssue = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: string;
  created_at: string;
  updated_at: string;
  user: { login: string; avatar_url: string; html_url: string } | null;
  labels: { name: string; color: string }[];
  pull_request?: unknown;
  comments: number;
  body: string | null;
};
type GHContent = {
  name: string;
  path: string;
  type: string;
  html_url: string;
  size: number;
  download_url: string | null;
};
type GHContributor = { login: string; avatar_url: string; html_url: string; contributions: number };

const OWNER = (import.meta.env.VITE_GITHUB_OWNER as string | undefined)?.trim() || "dhirendra-dev";
const REPO =
  (import.meta.env.VITE_GITHUB_REPO as string | undefined)?.trim() || "prepwian";
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "◫" },
  { id: "commits", label: "Commits", icon: "⑂" },
  { id: "branches", label: "Branches", icon: "⑃" },
  { id: "releases", label: "Releases", icon: "◉" },
  { id: "pulls", label: "Pull requests", icon: "⇄" },
  { id: "issues", label: "Issues", icon: "◎" },
  { id: "files", label: "Files", icon: "▤" },
];

function fmtDate(value?: string | null) {
  if (!value) return "Date unavailable";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(d);
}
function shortSha(sha?: string) {
  return sha ? sha.slice(0, 7) : "—";
}
function count(value?: number) {
  return new Intl.NumberFormat().format(value ?? 0);
}
function initials(value?: string | null) {
  return (value || "?").slice(0, 1).toUpperCase();
}
function messageTitle(message: string) {
  return message.split("\n")[0] || "Untitled commit";
}

export const Route = createFileRoute("/_authenticated/developer")({
  head: () => ({
    meta: [
      { name: "description", content: "Manage approved development access for JEE Prep Hub." },
      { property: "og:title", content: "Developer Portal — JEE Prep Hub" },
      { property: "og:description", content: "Manage approved development access for JEE Prep Hub." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Developer Portal — JEE Prep Hub" },
      { name: "twitter:description", content: "Manage approved development access for JEE Prep Hub." },

      { title: "Developer Portal — JEE Prep Hub" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async ({ context }) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.user.id)
      .eq("role", "admin")
      .maybeSingle();
    // This table is introduced by the accompanying migration; generated types may lag locally.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: temporaryAccess } = await (supabase as any)
      .from("developer_access_requests")
      .select("id")
      .eq("requester_id", context.user.id)
      .eq("status", "approved")
      .gt("approved_until", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    return {
      isDeveloperAdmin: Boolean(data),
      hasTemporaryDeveloperAccess: Boolean(temporaryAccess),
    };
  },
  component: DeveloperRoute,
});

function DeveloperRoute() {
  const { isDeveloperAdmin, hasTemporaryDeveloperAccess, user } = Route.useRouteContext();

  return isDeveloperAdmin || hasTemporaryDeveloperAccess ? (
    <GitHubDeveloperPortal />
  ) : (
    <DeveloperAccessRestricted userEmail={user.email} />
  );
}

function GitHubDeveloperPortal() {
  const [tab, setTab] = useState<Tab>("overview");
  const [repo, setRepo] = useState<GHRepo | null>(null);
  const [commits, setCommits] = useState<GHCommit[]>([]);
  const [branches, setBranches] = useState<GHBranch[]>([]);
  const [releases, setReleases] = useState<GHRelease[]>([]);
  const [issues, setIssues] = useState<GHIssue[]>([]);
  const [pulls, setPulls] = useState<GHIssue[]>([]);
  const [files, setFiles] = useState<GHContent[]>([]);
  const [contributors, setContributors] = useState<GHContributor[]>([]);
  const [readme, setReadme] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState("");
  const [filePath, setFilePath] = useState("");
  const [fileItems, setFileItems] = useState<GHContent[]>([]);
  const [fileLoading, setFileLoading] = useState(false);

  const configured = Boolean(OWNER && REPO);
  const repoUrl = configured ? `https://github.com/${OWNER}/${REPO}` : "https://github.com";

  const requestSequence = useRef(0);
  const activeController = useRef<AbortController | null>(null);
  const api = useCallback(async <T,>(path: string, signal?: AbortSignal): Promise<T> => {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (!accessToken) throw new Error("Your admin session has expired. Please sign in again.");
    let response: Response;
    try {
      response = await fetch(`/api/developer/github?path=${encodeURIComponent(path)}`, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
        signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      throw new Error(
        "Could not reach the GitHub connection service. Check your connection and try again.",
      );
    }
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      /* handled below */
    }
    if (!response.ok) {
      const message =
        payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof payload.error === "string"
          ? payload.error
          : `GitHub connection failed (${response.status}).`;
      throw new Error(message);
    }
    return payload as T;
  }, []);
  const loadBase = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError("");
    try {
      // Repository metadata is essential and is loaded independently first.
      const repository = await api<GHRepo>("/", controller.signal);
      if (sequence !== requestSequence.current) return;
      setRepo(repository);
      setLoading(false);
      const optional = await Promise.allSettled([
        api<GHCommit[]>("/commits?per_page=8", controller.signal),
        api<GHBranch[]>("/branches?per_page=100", controller.signal),
        api<GHRelease[]>("/releases?per_page=6", controller.signal),
        api<GHIssue[]>("/issues?state=all&per_page=8", controller.signal),
        api<GHIssue[]>("/pulls?state=all&per_page=8", controller.signal),
        api<GHContributor[]>("/contributors?per_page=8", controller.signal),
        api<GHContent[]>("/contents", controller.signal),
        api<{ content?: string; encoding?: string }>("/readme", controller.signal),
      ]);
      if (sequence !== requestSequence.current) return;
      const [
        commitsResult,
        branchesResult,
        releasesResult,
        issuesResult,
        pullsResult,
        contributorsResult,
        filesResult,
        readmeResult,
      ] = optional;
      if (commitsResult.status === "fulfilled") setCommits(commitsResult.value);
      if (branchesResult.status === "fulfilled") setBranches(branchesResult.value);
      if (releasesResult.status === "fulfilled") setReleases(releasesResult.value);
      if (issuesResult.status === "fulfilled")
        setIssues(issuesResult.value.filter((x) => !x.pull_request));
      if (pullsResult.status === "fulfilled") setPulls(pullsResult.value);
      if (contributorsResult.status === "fulfilled") setContributors(contributorsResult.value);
      if (filesResult.status === "fulfilled")
        setFiles(Array.isArray(filesResult.value) ? filesResult.value : []);
      if (
        readmeResult.status === "fulfilled" &&
        readmeResult.value.content &&
        readmeResult.value.encoding === "base64"
      ) {
        try {
          setReadme(
            decodeURIComponent(escape(atob(readmeResult.value.content.replace(/\n/g, "")))),
          );
        } catch {
          setReadme(atob(readmeResult.value.content.replace(/\n/g, "")));
        }
      }
      const failed = optional.filter(
        (result) =>
          result.status === "rejected" &&
          !(result.reason instanceof DOMException && result.reason.name === "AbortError"),
      ).length;
      if (failed)
        setError(
          `Repository loaded, but ${failed} optional section${failed === 1 ? " is" : "s are"} temporarily unavailable. Use Refresh to try again.`,
        );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (sequence !== requestSequence.current) return;
      setError(error instanceof Error ? error.message : "Unable to load the GitHub repository.");
      setLoading(false);
    }
  }, [api, configured]);
  useEffect(() => {
    void loadBase();
    return () => activeController.current?.abort();
  }, [loadBase]);
  const loadTab = async (next: Tab) => {
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    const sequence = ++requestSequence.current;
    setTab(next);
    if (!configured || next === "overview") return;
    setTabLoading(true);
    setError("");
    try {
      if (next === "commits")
        setCommits(await api<GHCommit[]>("/commits?per_page=50", controller.signal));
      if (next === "branches")
        setBranches(await api<GHBranch[]>("/branches?per_page=100", controller.signal));
      if (next === "releases")
        setReleases(await api<GHRelease[]>("/releases?per_page=30", controller.signal));
      if (next === "issues")
        setIssues(
          (await api<GHIssue[]>("/issues?state=all&per_page=50", controller.signal)).filter(
            (x) => !x.pull_request,
          ),
        );
      if (next === "pulls")
        setPulls(await api<GHIssue[]>("/pulls?state=all&per_page=50", controller.signal));
      if (next === "files") {
        setFilePath("");
        setFileItems(await api<GHContent[]>("/contents", controller.signal));
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (sequence === requestSequence.current)
        setError(error instanceof Error ? error.message : "Unable to load this GitHub section.");
    } finally {
      if (sequence === requestSequence.current) setTabLoading(false);
    }
  };
  const openFolder = async (item: GHContent) => {
    if (item.type === "file") {
      window.open(item.html_url, "_blank", "noopener,noreferrer");
      return;
    }
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    const sequence = ++requestSequence.current;
    setFileLoading(true);
    try {
      const path = item.path;
      const next = await api<GHContent[]>(
        `/contents/${path.split("/").map(encodeURIComponent).join("/")}`,
        controller.signal,
      );
      if (sequence !== requestSequence.current) return;
      setFilePath(path);
      setFileItems(Array.isArray(next) ? next : []);
    } catch (error) {
      if (
        !(error instanceof DOMException && error.name === "AbortError") &&
        sequence === requestSequence.current
      )
        setError(error instanceof Error ? error.message : "Could not open this folder.");
    } finally {
      if (sequence === requestSequence.current) setFileLoading(false);
    }
  };
  const visibleCommits = useMemo(
    () =>
      commits.filter((c) =>
        `${messageTitle(c.commit.message)} ${c.author?.login ?? ""} ${c.sha}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [commits, query],
  );
  const visibleIssues = useMemo(
    () =>
      issues.filter((x) =>
        `${x.title} ${x.user?.login ?? ""} ${x.labels.map((l) => l.name).join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [issues, query],
  );
  const visiblePulls = useMemo(
    () =>
      pulls.filter((x) =>
        `${x.title} ${x.user?.login ?? ""}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [pulls, query],
  );

  if (!configured)
    return (
      <main className="gh-portal">
        <div className="gh-wrap">
          <section className="gh-config">
            <div className="gh-brand-icon">⌘</div>
            <p className="gh-overline">JEE PREP HUB · DEVELOPER PORTAL</p>
            <h1>Connect your GitHub repository</h1>
            <p>
              This page displays real repository information: commits, branches, releases, pull
              requests, issues, contributors, and files.
            </p>
            <div className="gh-code-config">
              <code>VITE_GITHUB_OWNER=your-github-username</code>
              <code>VITE_GITHUB_REPO=your-repository-name</code>
            </div>
            <p>
              Add these variables to your project environment, then rebuild. For public
              repositories, no token is needed for basic read-only data.
            </p>
            <a
              className="gh-button gh-button-primary"
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
            >
              Open GitHub ↗
            </a>
          </section>
        </div>
      </main>
    );

  return (
    <main className="gh-portal">
      <div className="gh-wrap">
        <div className="gh-breadcrumb">
          <a href="/">JEE Prep Hub</a>
          <span>/</span>
          <strong>Developer</strong>
          <span className="gh-public-pill">Public project view</span>
        </div>
        {loading ? (
          <div className="gh-loading">
            <span className="gh-spinner" />
            Loading repository from GitHub…
          </div>
        ) : error && !repo ? (
          <section className="gh-error">
            <h2>Couldn't load repository</h2>
            <p>{error}</p>
            <button className="gh-button" onClick={() => void loadBase()}>
              Try again
            </button>
          </section>
        ) : (
          repo && (
            <>
              <header className="gh-repo-head">
                <div className="gh-repo-avatar" aria-hidden="true">
                  <span>J</span>
                  <i>↗</i>
                </div>
                <div className="gh-repo-title">
                  <div>
                    <a href={repoUrl} target="_blank" rel="noreferrer">
                      {repo.full_name}
                    </a>
                    <span className="gh-public-pill">{repo.visibility || "Public"}</span>
                  </div>
                  <h1>{repo.name.replace(/[-_]/g, " ")}</h1>
                  <p>
                    {repo.description || "JEE Prep Hub source repository and development history."}
                  </p>
                </div>
                <div className="gh-head-actions">
                  <button
                    className="gh-button"
                    onClick={() => void loadBase()}
                    title="Refresh GitHub data"
                  >
                    ↻ Refresh
                  </button>
                  <a
                    className="gh-button gh-star-button"
                    href={`${repoUrl}/stargazers`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    ☆ Star <b>{count(repo.stargazers_count)}</b>
                  </a>
                </div>
              </header>

              <nav className="gh-tabs" aria-label="Repository navigation">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => void loadTab(t.id)}
                    className={tab === t.id ? "active" : ""}
                  >
                    <span>{t.icon}</span>
                    {t.label}
                    {t.id === "issues" && repo.open_issues_count > 0 ? (
                      <small>{repo.open_issues_count}</small>
                    ) : null}
                  </button>
                ))}
              </nav>

              {error && (
                <div className="gh-inline-error" role="status">
                  {error}
                  <button onClick={() => setError("")}>Dismiss</button>
                </div>
              )}
              {tab !== "overview" && (
                <div className="gh-filter-bar">
                  <label className="gh-search">
                    <span>⌕</span>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={`Search ${tab}…`}
                    />
                  </label>
                  <span>{tabLoading ? "Refreshing…" : "Live GitHub data"} · Public repository</span>
                </div>
              )}
              {tabLoading && (
                <div className="gh-loading compact">
                  <span className="gh-spinner" />
                  Loading {tab}…
                </div>
              )}

              {!tabLoading && tab === "overview" && (
                <div className="gh-overview-grid">
                  <div className="gh-main-col">
                    <section className="gh-panel gh-about">
                      <div className="gh-panel-title">
                        <h2>About this project</h2>
                        <a href={`${repoUrl}#readme`} target="_blank" rel="noreferrer">
                          View README ↗
                        </a>
                      </div>
                      <p>
                        {repo.description ||
                          "An educational platform built to support JEE aspirants with learning resources and study tools."}
                      </p>
                      {repo.homepage && (
                        <a
                          className="gh-homepage"
                          href={repo.homepage}
                          target="_blank"
                          rel="noreferrer"
                        >
                          ↗ {repo.homepage.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                      <div className="gh-stat-grid">
                        <div>
                          <strong>☆ {count(repo.stargazers_count)}</strong>
                          <span>Stars</span>
                        </div>
                        <div>
                          <strong>⑂ {count(repo.forks_count)}</strong>
                          <span>Forks</span>
                        </div>
                        <div>
                          <strong>◉ {count(repo.open_issues_count)}</strong>
                          <span>Open issues</span>
                        </div>
                        <div>
                          <strong>◷ {fmtDate(repo.pushed_at)}</strong>
                          <span>Last push</span>
                        </div>
                      </div>
                    </section>
                    {readme && (
                      <section className="gh-panel gh-readme-panel">
                        <div className="gh-panel-title">
                          <h2>Project README</h2>
                          <a href={`${repoUrl}#readme`} target="_blank" rel="noreferrer">
                            Full README ↗
                          </a>
                        </div>
                        <pre>
                          {readme.slice(0, 1800)}
                          {readme.length > 1800 ? "\\n\\n… Read the full README on GitHub." : ""}
                        </pre>
                      </section>
                    )}
                    <section className="gh-panel">
                      <div className="gh-panel-title">
                        <h2>Latest commits</h2>
                        <button onClick={() => void loadTab("commits")}>View all →</button>
                      </div>
                      {commits.slice(0, 5).map((c) => (
                        <CommitRow key={c.sha} item={c} repoUrl={repoUrl} />
                      ))}
                      {!commits.length && (
                        <p className="gh-muted gh-pad">No public commits available.</p>
                      )}
                    </section>
                    <section className="gh-panel">
                      <div className="gh-panel-title">
                        <h2>Recent releases</h2>
                        <button onClick={() => void loadTab("releases")}>View all →</button>
                      </div>
                      {releases.slice(0, 3).map((r) => (
                        <ReleaseRow key={r.id} item={r} />
                      ))}
                      {!releases.length && (
                        <p className="gh-muted gh-pad">No published GitHub releases found.</p>
                      )}
                    </section>
                    <section className="gh-panel">
                      <div className="gh-panel-title">
                        <h2>Repository files</h2>
                        <button onClick={() => void loadTab("files")}>Browse files →</button>
                      </div>
                      <FileList items={files.slice(0, 7)} onOpen={openFolder} />
                    </section>
                  </div>
                  <aside className="gh-side-col">
                    <section className="gh-panel">
                      <h2>Repository details</h2>
                      <InfoRow label="Primary language" value={repo.language || "Not detected"} />
                      <InfoRow label="Default branch" value={repo.default_branch} />
                      <InfoRow label="License" value={repo.license?.name || "Not specified"} />
                      <InfoRow label="Created" value={fmtDate(repo.created_at)} />
                      <InfoRow label="Last updated" value={fmtDate(repo.updated_at)} />
                      <InfoRow label="Watchers" value={count(repo.watchers_count)} />
                    </section>
                    <section className="gh-panel">
                      <div className="gh-panel-title">
                        <h2>Contributors</h2>
                        <a href={`${repoUrl}/graphs/contributors`} target="_blank" rel="noreferrer">
                          All ↗
                        </a>
                      </div>
                      {contributors.slice(0, 8).map((c) => (
                        <a
                          className="gh-contributor"
                          href={c.html_url}
                          target="_blank"
                          rel="noreferrer"
                          key={c.login}
                        >
                          <img src={c.avatar_url} alt="" />
                          <span>{c.login}</span>
                          <small>{count(c.contributions)} commits</small>
                        </a>
                      ))}
                      {!contributors.length && (
                        <p className="gh-muted">Contributor data unavailable.</p>
                      )}
                    </section>
                    <section className="gh-panel">
                      <h2>Quick links</h2>
                      <QuickLink href={`${repoUrl}/network/members`} label="Forks" />
                      <QuickLink href={`${repoUrl}/actions`} label="Actions & workflows" />
                      <QuickLink href={`${repoUrl}/security`} label="Security" />
                      <QuickLink href={`${repoUrl}/graphs`} label="Repository insights" />
                      <QuickLink
                        href={`${repoUrl}/commits/${repo.default_branch}`}
                        label="Full commit history"
                      />
                    </section>
                  </aside>
                </div>
              )}

              {!tabLoading && tab === "commits" && (
                <section className="gh-panel gh-list-panel">
                  <div className="gh-panel-title">
                    <h2>Commit history</h2>
                    <a href={`${repoUrl}/commits`} target="_blank" rel="noreferrer">
                      Open on GitHub ↗
                    </a>
                  </div>
                  {visibleCommits.map((c) => (
                    <CommitRow key={c.sha} item={c} repoUrl={repoUrl} />
                  ))}
                  {!visibleCommits.length && <Empty label="No commits match this search." />}
                </section>
              )}
              {!tabLoading && tab === "branches" && (
                <section className="gh-panel gh-list-panel">
                  <div className="gh-panel-title">
                    <h2>Branches</h2>
                    <a href={`${repoUrl}/branches`} target="_blank" rel="noreferrer">
                      Open on GitHub ↗
                    </a>
                  </div>
                  {branches.map((b) => (
                    <div className="gh-branch-row" key={b.name}>
                      <span className="gh-branch-icon">⑂</span>
                      <a
                        href={`${repoUrl}/tree/${b.name.split("/").map(encodeURIComponent).join("/")}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {b.name}
                      </a>
                      {b.protected && <span className="gh-label">Protected</span>}
                      <code>{shortSha(b.commit.sha)}</code>
                    </div>
                  ))}
                  {!branches.length && <Empty label="No branches found." />}
                </section>
              )}
              {!tabLoading && tab === "releases" && (
                <section className="gh-panel gh-list-panel">
                  <div className="gh-panel-title">
                    <h2>Releases</h2>
                    <a href={`${repoUrl}/releases`} target="_blank" rel="noreferrer">
                      All releases ↗
                    </a>
                  </div>
                  {releases.map((r) => (
                    <ReleaseRow key={r.id} item={r} />
                  ))}
                  {!releases.length && (
                    <Empty label="No published releases yet. GitHub releases appear here automatically." />
                  )}
                </section>
              )}
              {!tabLoading && tab === "issues" && (
                <section className="gh-panel gh-list-panel">
                  <div className="gh-panel-title">
                    <h2>Issues</h2>
                    <a href={`${repoUrl}/issues`} target="_blank" rel="noreferrer">
                      Open on GitHub ↗
                    </a>
                  </div>
                  {visibleIssues.map((x) => (
                    <IssueRow key={x.id} item={x} />
                  ))}
                  {!visibleIssues.length && <Empty label="No issues match this search." />}
                </section>
              )}
              {!tabLoading && tab === "pulls" && (
                <section className="gh-panel gh-list-panel">
                  <div className="gh-panel-title">
                    <h2>Pull requests</h2>
                    <a href={`${repoUrl}/pulls`} target="_blank" rel="noreferrer">
                      Open on GitHub ↗
                    </a>
                  </div>
                  {visiblePulls.map((x) => (
                    <IssueRow key={x.id} item={x} isPull />
                  ))}
                  {!visiblePulls.length && <Empty label="No pull requests match this search." />}
                </section>
              )}
              {!tabLoading && tab === "files" && (
                <section className="gh-panel gh-list-panel">
                  <div className="gh-panel-title">
                    <h2>Repository files</h2>
                    <a href={repoUrl} target="_blank" rel="noreferrer">
                      Open repository ↗
                    </a>
                  </div>
                  <div className="gh-file-path">
                    <button
                      onClick={() => {
                        setFilePath("");
                        void api<GHContent[]>("/contents").then((x) => setFileItems(x));
                      }}
                    >
                      ⌂ {repo.name}
                    </button>
                    {filePath && <span> / {filePath}</span>}
                  </div>
                  {fileLoading && <p className="gh-muted gh-pad">Loading folder…</p>}
                  <FileList items={fileItems} onOpen={openFolder} />
                  {!fileItems.length && !fileLoading && (
                    <Empty label="This directory is empty or unavailable." />
                  )}
                </section>
              )}
              <footer className="gh-footer">
                <span>Repository data is fetched from the GitHub REST API.</span>
                <a href={repoUrl} target="_blank" rel="noreferrer">
                  View full repository on GitHub ↗
                </a>
              </footer>
            </>
          )
        )}
      </div>
    </main>
  );
}

function CommitRow({ item, repoUrl }: { item: GHCommit; repoUrl: string }) {
  return (
    <div className="gh-commit-row">
      <div className="gh-avatar">
        {item.author?.avatar_url ? (
          <img src={item.author.avatar_url} alt="" />
        ) : (
          initials(item.commit.author?.name)
        )}
      </div>
      <div className="gh-row-main">
        <a className="gh-row-title" href={item.html_url} target="_blank" rel="noreferrer">
          {messageTitle(item.commit.message)}
        </a>
        <div className="gh-row-sub">
          {item.author?.login || item.commit.author?.name || "Unknown author"} committed{" "}
          {fmtDate(item.commit.author?.date)}
        </div>
      </div>
      <a className="gh-sha" href={item.html_url} target="_blank" rel="noreferrer">
        {shortSha(item.sha)}
      </a>
    </div>
  );
}
function ReleaseRow({ item }: { item: GHRelease }) {
  return (
    <article className="gh-release-row">
      <div className="gh-release-icon">◉</div>
      <div className="gh-row-main">
        <a className="gh-row-title" href={item.html_url} target="_blank" rel="noreferrer">
          {item.name || item.tag_name}
        </a>
        <div className="gh-row-sub">
          <span className="gh-label">{item.tag_name}</span> ·{" "}
          {item.draft ? "Draft" : item.prerelease ? "Pre-release" : "Release"} ·{" "}
          {fmtDate(item.published_at)}
        </div>
        {item.body && (
          <p className="gh-release-body">
            {item.body.slice(0, 220)}
            {item.body.length > 220 ? "…" : ""}
          </p>
        )}
      </div>
    </article>
  );
}
function IssueRow({ item, isPull = false }: { item: GHIssue; isPull?: boolean }) {
  return (
    <article className="gh-issue-row">
      <span className={`gh-issue-state ${item.state === "open" ? "open" : "closed"}`}>
        {isPull ? "⇄" : "◎"}
      </span>
      <div className="gh-row-main">
        <a className="gh-row-title" href={item.html_url} target="_blank" rel="noreferrer">
          {item.title}
        </a>
        <div className="gh-row-sub">
          #{item.number} opened by {item.user?.login || "unknown"} · {fmtDate(item.created_at)} ·{" "}
          {item.comments} comments
        </div>
        <div className="gh-labels">
          {item.labels.map((l) => (
            <span
              className="gh-label"
              key={l.name}
              style={{ borderColor: `#${l.color}`, background: `#${l.color}22` }}
            >
              {l.name}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
function FileList({ items, onOpen }: { items: GHContent[]; onOpen: (item: GHContent) => void }) {
  return (
    <div className="gh-file-list">
      {items.map((item) => (
        <button className="gh-file-row" key={item.path} onClick={() => onOpen(item)}>
          <span>{item.type === "dir" ? "📁" : "▤"}</span>
          <strong>{item.name}</strong>
          <small>{item.type === "dir" ? "Folder" : `${count(item.size)} bytes`}</small>
        </button>
      ))}
    </div>
  );
}
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="gh-info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a className="gh-quick-link" href={href} target="_blank" rel="noreferrer">
      {label}
      <span>↗</span>
    </a>
  );
}
function Empty({ label }: { label: string }) {
  return (
    <div className="gh-empty">
      <span>⌕</span>
      <p>{label}</p>
    </div>
  );
}
