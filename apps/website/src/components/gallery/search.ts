/**
 * The gallery's search: client-side, over the compact index. Matches the
 * export name (`arrow left` and `arrowleft` both find `ArrowLeft`), the
 * upstream name, the collection, and the tags and categories the upstream
 * projects publish. Fast enough to run on every keystroke: about 14 000
 * entries, plain string tests.
 */

export interface Entry {
  /** `lucide:Play`. */
  readonly key: string;
  readonly collection: string;
  /** Position of the collection, for a stable order. */
  readonly rank: number;
  readonly name: string;
  readonly upstream: string;
  /** Space-separated, lowercase. */
  readonly terms: string;
  /** Which variants have the icon: bit i is the collection's variant i. */
  readonly mask: number;
}

export interface Query {
  readonly text: string;
  /** A collection id, or undefined for all. */
  readonly collection?: string;
  /** The variant index each collection shows. */
  readonly variant: (collection: string) => number;
  /** Collection titles, searchable too. */
  readonly titles?: Readonly<Record<string, string>>;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\-_.,/]+/)
    .filter(Boolean);
}

/** How well an entry matches; 0 for not at all. */
export function score(
  entry: Entry,
  tokens: readonly string[],
  title = '',
): number {
  if (tokens.length === 0) return 1;
  const compact = tokens.join('');
  const name = entry.name.toLowerCase();
  if (name === compact || entry.upstream === tokens.join('-')) return 5;
  if (name.startsWith(compact)) return 4;
  if (name.includes(compact)) return 3;
  const haystack = ` ${entry.terms} ${title.toLowerCase()} ${entry.collection}`;
  if (tokens.every((token) => haystack.includes(` ${token}`))) return 2;
  if (tokens.every((token) => haystack.includes(token))) return 1;
  return 0;
}

export function search(entries: readonly Entry[], query: Query): Entry[] {
  const tokens = tokenize(query.text);
  const results: { entry: Entry; score: number }[] = [];
  for (const entry of entries) {
    if (query.collection !== undefined && entry.collection !== query.collection)
      continue;
    if ((entry.mask & (1 << query.variant(entry.collection))) === 0) continue;
    const value = score(entry, tokens, query.titles?.[entry.collection]);
    if (value > 0) results.push({ entry, score: value });
  }
  results.sort(
    (a, b) =>
      b.score - a.score ||
      a.entry.rank - b.entry.rank ||
      (a.entry.name < b.entry.name ? -1 : a.entry.name > b.entry.name ? 1 : 0),
  );
  return results.map((result) => result.entry);
}

export interface SnippetOptions {
  readonly size: number;
  readonly color: string;
  /** Only for a stroked variant, when it differs from the default. */
  readonly strokeWidth?: number;
}

/** The import a user copies: the public subpath, never a generated file. */
export function importSnippet(name: string, subpath: string): string {
  return `import { ${name} } from '@soundor/icons/${subpath}';`;
}

export function jsxSnippet(name: string, options: SnippetOptions): string {
  const props = [`size={${options.size}}`, `color="${options.color}"`];
  if (options.strokeWidth !== undefined)
    props.push(`strokeWidth={${options.strokeWidth}}`);
  return `<${name} ${props.join(' ')} />`;
}
