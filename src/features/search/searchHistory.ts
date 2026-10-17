export type SearchHistoryItem = { query: string; usedAt: number };

const HISTORY_KEY = "jph-search-history";
const SAVED_KEY = "jph-saved-searches";
const BOOKMARK_KEY = "jph-search-bookmarks";
const MAX_ITEMS = 8;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local storage can be disabled; search remains fully usable without it.
  }
}

export function readSearchHistory() {
  return read<SearchHistoryItem[]>(HISTORY_KEY, []).filter((item) => item.query);
}

export function addSearchHistory(rawQuery: string) {
  const query = rawQuery.normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, 120);
  if (!query) return readSearchHistory();
  const next = [
    { query, usedAt: Date.now() },
    ...readSearchHistory().filter((item) => item.query !== query),
  ].slice(0, MAX_ITEMS);
  write(HISTORY_KEY, next);
  return next;
}

export function clearSearchHistory() {
  write(HISTORY_KEY, []);
}

export function readSavedSearches() {
  return read<string[]>(SAVED_KEY, []);
}

export function toggleSavedSearch(rawQuery: string) {
  const query = rawQuery.trim();
  const current = readSavedSearches();
  const next = current.includes(query)
    ? current.filter((item) => item !== query)
    : [query, ...current].slice(0, MAX_ITEMS);
  write(SAVED_KEY, next);
  return next;
}

export function readSearchBookmarks() {
  return read<string[]>(BOOKMARK_KEY, []);
}

export function toggleSearchBookmark(path: string) {
  const current = readSearchBookmarks();
  const next = current.includes(path)
    ? current.filter((item) => item !== path)
    : [...current, path];
  write(BOOKMARK_KEY, next);
  return next;
}
