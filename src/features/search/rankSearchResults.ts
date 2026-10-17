export type RankableResult = {
  title: string;
  description?: string | null;
  keywords?: string[];
  rank?: number | null;
};

/** Rank small, already-loaded navigation/search result lists without a network call. */
export function rankSearchResults<T extends RankableResult>(results: T[], rawQuery: string): T[] {
  const query = rawQuery.normalize("NFKC").toLocaleLowerCase().trim();
  const terms = query.split(/\s+/).filter(Boolean);
  const score = (item: T) => {
    const title = item.title.toLocaleLowerCase();
    const description = (item.description ?? "").toLocaleLowerCase();
    const keywords = (item.keywords ?? []).join(" ").toLocaleLowerCase();
    let value = Number(item.rank ?? 0);

    if (query && title === query) value += 100;
    else if (query && title.startsWith(query)) value += 35;
    else if (query && title.includes(query)) value += 20;

    for (const term of terms) {
      if (title.includes(term)) value += 8;
      if (description.includes(term)) value += 2;
      if (keywords.includes(term)) value += 4;
    }
    return value;
  };

  return [...results].sort((a, b) => score(b) - score(a));
}
