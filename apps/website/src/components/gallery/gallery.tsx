/**
 * The icon gallery: search, collection and variant filters, a virtualized
 * grid and a details panel. Its state is in the URL (`?q=&c=&v=&icon=`), so a
 * search or a selected icon can be shared.
 */

import { Search, X } from 'lucide-react';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { collections, type CollectionInfo } from 'virtual:icon-collections';

import { Details } from './details';
import { IconGrid } from './icon-grid';
import { useIconModules } from './icon-modules';
import { search, type Entry } from './search';

const byId: Readonly<Record<string, CollectionInfo>> = Object.fromEntries(
  collections.map((collection) => [collection.id, collection]),
);
const titles = Object.fromEntries(
  collections.map((collection) => [collection.id, collection.title]),
);
const TOTAL = collections.reduce(
  (sum, collection) => sum + collection.total,
  0,
);

interface State {
  readonly text: string;
  readonly collection?: string;
  /** The variant id each collection shows, when not its first. */
  readonly variants: Readonly<Record<string, string>>;
  readonly selected?: string;
}

function readUrl(): State {
  const params = new URLSearchParams(window.location.search);
  const collection = params.get('c') ?? undefined;
  const variant = params.get('v');
  const valid = collection !== undefined && byId[collection] !== undefined;
  return {
    text: params.get('q') ?? '',
    collection: valid ? collection : undefined,
    variants:
      valid &&
      variant &&
      byId[collection]!.variants.some((item) => item.id === variant)
        ? { [collection]: variant }
        : {},
    selected: params.get('icon') ?? undefined,
  };
}

function writeUrl(state: State): void {
  const params = new URLSearchParams();
  if (state.text) params.set('q', state.text);
  if (state.collection) {
    params.set('c', state.collection);
    const variant = state.variants[state.collection];
    if (variant) params.set('v', variant);
  }
  if (state.selected) params.set('icon', state.selected);
  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  if (
    url !==
    `${window.location.pathname}${window.location.search}${window.location.hash}`
  )
    window.history.replaceState(window.history.state, '', url);
}

export function variantIndex(state: State, collection: string): number {
  const id = state.variants[collection];
  const index =
    byId[collection]?.variants.findIndex((variant) => variant.id === id) ?? -1;
  return Math.max(0, index);
}

export function Gallery() {
  const [state, setState] = useState<State>({ text: '', variants: {} });
  const [entries, setEntries] = useState<readonly Entry[]>();
  const [hydrated, setHydrated] = useState(false);
  const { modules, load } = useIconModules();

  // The URL and the index are the browser's: read after hydration, so the
  // prerendered page and the first client render agree.
  useEffect(() => {
    // Synchronizing with the URL, which the prerendered page cannot know.
    // oxlint-disable-next-line react/set-state-in-effect
    setState(readUrl());
    setHydrated(true);
    void import('virtual:icon-index').then(({ index }) => {
      setEntries(
        index.flatMap(({ id, icons }, rank) =>
          icons.map(([name, upstream, terms, mask]) => ({
            key: `${id}:${name}`,
            collection: id,
            rank,
            name,
            upstream,
            terms,
            mask,
          })),
        ),
      );
    });
  }, []);
  useEffect(() => {
    if (hydrated) writeUrl(state);
  }, [hydrated, state]);

  const text = useDeferredValue(state.text);
  const results = useMemo(
    () =>
      entries === undefined
        ? []
        : search(entries, {
            text,
            collection: state.collection,
            variant: (collection) => variantIndex(state, collection),
            titles,
          }),
    [entries, text, state],
  );
  const selected = useMemo(
    () => entries?.find((entry) => entry.key === state.selected),
    [entries, state.selected],
  );

  const update = useCallback(
    (change: Partial<State>) =>
      setState((current) => ({ ...current, ...change })),
    [],
  );
  const select = useCallback(
    (key: string | undefined) => update({ selected: key }),
    [update],
  );

  const collection = state.collection ? byId[state.collection] : undefined;
  const subpathOf = useCallback(
    (entry: Entry) =>
      byId[entry.collection]!.variants[variantIndex(state, entry.collection)]!
        .subpath,
    [state],
  );

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
      <div className="min-w-0">
        <div className="sticky top-14 z-20 -mx-2 bg-fd-background/90 px-2 pt-3 pb-3 backdrop-blur">
          <label className="relative block">
            <span className="sr-only">Search icons</span>
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-fd-muted-foreground"
            />
            <input
              type="search"
              value={state.text}
              onChange={(event) => update({ text: event.target.value })}
              placeholder={`Search ${TOTAL.toLocaleString('en-US')} icons: play, volume, arrow left…`}
              autoComplete="off"
              spellCheck={false}
              className="h-14 w-full rounded-xl border bg-fd-card pr-12 pl-12 text-lg shadow-sm outline-none placeholder:text-fd-muted-foreground focus-visible:ring-2 focus-visible:ring-fd-primary"
            />
            {state.text && (
              <button
                type="button"
                onClick={() => update({ text: '' })}
                aria-label="Clear the search"
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1.5 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
              >
                <X aria-hidden className="size-4" />
              </button>
            )}
          </label>

          <div
            role="radiogroup"
            aria-label="Collection"
            className="mt-3 flex gap-1.5 overflow-x-auto pb-1"
          >
            <Pill
              checked={state.collection === undefined}
              onClick={() => update({ collection: undefined })}
            >
              All <Count value={TOTAL} />
            </Pill>
            {collections.map((item) => (
              <Pill
                key={item.id}
                checked={state.collection === item.id}
                onClick={() => update({ collection: item.id })}
              >
                {item.title} <Count value={item.total} />
              </Pill>
            ))}
          </div>

          {collection && collection.variants.length > 1 && (
            <div
              role="radiogroup"
              aria-label={`${collection.title} variant`}
              className="mt-2 flex flex-wrap gap-1.5"
            >
              {collection.variants.map((variant, index) => (
                <Pill
                  key={variant.id}
                  small
                  checked={variantIndex(state, collection.id) === index}
                  onClick={() =>
                    update({
                      variants: {
                        ...state.variants,
                        [collection.id]: index === 0 ? '' : variant.id,
                      },
                    })
                  }
                >
                  {variant.title}
                </Pill>
              ))}
            </div>
          )}

          <p
            className="mt-2 text-sm text-fd-muted-foreground"
            aria-live="polite"
            data-testid="result-count"
          >
            {entries === undefined
              ? 'Loading the catalog…'
              : `${results.length.toLocaleString('en-US')} ${results.length === 1 ? 'icon' : 'icons'}${
                  collection ? ` in ${collection.title}` : ''
                }${text ? ` for “${text}”` : ''}`}
          </p>
        </div>

        <IconGrid
          results={results}
          showCollection={state.collection === undefined}
          titles={titles}
          subpathOf={subpathOf}
          modules={modules}
          load={load}
          selected={state.selected}
          onSelect={select}
        />
        {entries !== undefined && results.length === 0 && (
          <p className="py-16 text-center text-fd-muted-foreground">
            No icons match “{text}”. Try another word, or all collections.
          </p>
        )}
      </div>

      {selected && (
        <Details
          key={selected.key}
          entry={selected}
          collection={byId[selected.collection]!}
          variant={variantIndex(state, selected.collection)}
          onVariant={(index) =>
            update({
              variants: {
                ...state.variants,
                [selected.collection]:
                  index === 0
                    ? ''
                    : byId[selected.collection]!.variants[index]!.id,
              },
            })
          }
          modules={modules}
          load={load}
          onClose={() => select(undefined)}
        />
      )}
    </div>
  );
}

function Pill({
  checked,
  onClick,
  small,
  children,
}: {
  readonly checked: boolean;
  readonly onClick: () => void;
  readonly small?: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onClick}
      className={`shrink-0 rounded-full border whitespace-nowrap transition-colors ${
        small ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      } ${
        checked
          ? 'border-fd-primary bg-fd-primary text-fd-primary-foreground'
          : 'bg-fd-card text-fd-muted-foreground hover:text-fd-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function Count({ value }: { readonly value: number }) {
  return (
    <span className="ml-1 tabular-nums opacity-70">
      {value.toLocaleString('en-US')}
    </span>
  );
}
