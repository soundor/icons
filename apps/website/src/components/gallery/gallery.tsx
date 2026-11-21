/**
 * The icon browser that fills the /browse page: collection and variant filters
 * in a sidebar, search and a virtualized grid in its own scroll area, and a
 * details panel. Its state is in the URL (`?q=&c=&v=&icon=`), so a search or
 * a selected icon can be shared.
 */

import { Link } from '@tanstack/react-router';
import { MousePointerClick, Search, X } from 'lucide-react';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
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

export function variantIndex(
  state: Pick<State, 'variants'>,
  collection: string,
): number {
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
  const searchBox = useRef<HTMLInputElement>(null);

  // The URL and the index are the browser's: read after hydration, so the
  // prerendered page and the first client render agree.
  useEffect(() => {
    // Synchronizing with the URL, which the prerendered page cannot know.
    const initial = readUrl();
    // oxlint-disable-next-line react/set-state-in-effect
    setState(initial);
    setHydrated(true);
    // The page is for searching: start in the box, unless an icon is open or
    // focusing would bring up an on-screen keyboard.
    if (!initial.selected && matchMedia('(pointer: fine)').matches)
      searchBox.current?.focus();
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
            variant: (collection) =>
              variantIndex({ variants: state.variants }, collection),
            titles,
          }),
    // Not the whole state: selecting an icon must not make new results.
    [entries, text, state.collection, state.variants],
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

  const chooseVariant = (id: string, index: number) =>
    update({
      variants: {
        ...state.variants,
        [id]: index === 0 ? '' : byId[id]!.variants[index]!.id,
      },
    });

  return (
    <div className="flex h-full min-h-0">
      <nav
        aria-label="Collections"
        className="hidden w-60 shrink-0 overflow-y-auto border-r px-3 py-4 lg:block"
      >
        <p className="px-2 pb-2 text-xs font-medium text-fd-muted-foreground">
          Collections
        </p>
        <div role="radiogroup" aria-label="Collection" className="grid gap-0.5">
          <SideItem
            checked={state.collection === undefined}
            onClick={() => update({ collection: undefined })}
            count={TOTAL}
          >
            All
          </SideItem>
          {collections.map((item) => (
            <div key={item.id}>
              <SideItem
                checked={state.collection === item.id}
                onClick={() => update({ collection: item.id })}
                count={item.total}
              >
                {item.title}
              </SideItem>
              {state.collection === item.id && item.variants.length > 1 && (
                <div
                  role="radiogroup"
                  aria-label={`${item.title} variant`}
                  className="my-1 ml-3 grid gap-0.5 border-l pl-2"
                >
                  {item.variants.map((variant, index) => (
                    <SideItem
                      key={variant.id}
                      small
                      checked={variantIndex(state, item.id) === index}
                      onClick={() => chooseVariant(item.id, index)}
                      count={variant.count}
                    >
                      {variant.title}
                    </SideItem>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="mt-6 px-2 text-xs text-fd-muted-foreground">
          Each collection keeps its own license.{' '}
          <Link
            className="underline underline-offset-2"
            to="/docs/$"
            params={{ _splat: 'licensing' }}
          >
            Licensing
          </Link>
        </p>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="shrink-0 px-2 pt-3 pb-2 sm:px-4 lg:pt-4">
          <label className="relative block">
            <span className="sr-only">Search icons</span>
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-fd-muted-foreground"
            />
            <input
              type="search"
              value={state.text}
              onChange={(event) => update({ text: event.target.value })}
              placeholder={`Search ${TOTAL.toLocaleString('en-US')} icons: play, volume, arrow left…`}
              autoComplete="off"
              spellCheck={false}
              ref={searchBox}
              className="h-11 w-full rounded-xl border bg-fd-card pr-11 pl-10 text-base shadow-sm outline-none placeholder:text-fd-muted-foreground focus-visible:ring-2 focus-visible:ring-fd-primary"
            />
            {state.text && (
              <button
                type="button"
                onClick={() => update({ text: '' })}
                aria-label="Clear the search"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1.5 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
              >
                <X aria-hidden className="size-4" />
              </button>
            )}
          </label>

          {/* The sidebar's filters, on screens too narrow for it. */}
          <div className="lg:hidden">
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
                className="mt-2 flex gap-1.5 overflow-x-auto pb-1"
              >
                {collection.variants.map((variant, index) => (
                  <Pill
                    key={variant.id}
                    small
                    checked={variantIndex(state, collection.id) === index}
                    onClick={() => chooseVariant(collection.id, index)}
                  >
                    {variant.title}
                  </Pill>
                ))}
              </div>
            )}
          </div>

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

        {entries !== undefined && results.length === 0 ? (
          <p className="px-4 py-16 text-center text-fd-muted-foreground">
            No icons match “{text}”. Try another word, or all collections.
          </p>
        ) : (
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
        )}
      </div>

      {selected ? (
        <Details
          key={selected.key}
          entry={selected}
          collection={byId[selected.collection]!}
          variant={variantIndex(state, selected.collection)}
          onVariant={(index) => chooseVariant(selected.collection, index)}
          modules={modules}
          load={load}
          onClose={() => select(undefined)}
        />
      ) : (
        <aside className="hidden w-[340px] shrink-0 flex-col items-center justify-center gap-2 border-l p-8 text-center text-sm text-fd-muted-foreground lg:flex">
          <MousePointerClick aria-hidden className="size-6 opacity-60" />
          Pick an icon to see its variants, try its props and copy its import.
        </aside>
      )}
    </div>
  );
}

function SideItem({
  checked,
  onClick,
  count,
  small,
  children,
}: {
  readonly checked: boolean;
  readonly onClick: () => void;
  readonly count: number;
  readonly small?: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-md px-2 text-left transition-colors ${
        small ? 'py-1 text-xs' : 'py-1.5 text-sm'
      } ${
        checked
          ? 'bg-fd-primary/10 font-medium text-fd-primary'
          : 'text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground'
      }`}
    >
      <span className="truncate">{children}</span>
      <span className="text-xs tabular-nums opacity-70">
        {count.toLocaleString('en-US')}
      </span>
    </button>
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
