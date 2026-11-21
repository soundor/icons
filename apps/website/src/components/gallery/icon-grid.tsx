/**
 * The grid of results, in its own scroll area and virtualized by row: only
 * the rows on screen (and a few around them) are mounted, so thousands of
 * results cost a few hundred SVG elements. Arrow keys, Home and End move
 * between icons.
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { Check, Copy } from 'lucide-react';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import type { IconModule } from 'virtual:icon-collections';

import { importSnippet, type Entry } from './search';

const CELL = 104;
const ROW = 108;

export function IconGrid({
  results,
  showCollection,
  titles,
  subpathOf,
  modules,
  load,
  selected,
  onSelect,
}: {
  readonly results: readonly Entry[];
  readonly showCollection: boolean;
  readonly titles: Readonly<Record<string, string>>;
  readonly subpathOf: (entry: Entry) => string;
  readonly modules: Readonly<Record<string, IconModule>>;
  readonly load: (subpath: string) => void;
  readonly selected?: string;
  readonly onSelect: (key: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(6);
  const [focus, setFocus] = useState(0);
  const pendingFocus = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    const element = container.current;
    if (!element) return;
    const measure = () =>
      setColumns(Math.max(2, Math.floor(element.clientWidth / CELL)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const rows = Math.ceil(results.length / columns);
  // TanStack Virtual returns fresh functions each render; this component is
  // not compiled by React Compiler, so nothing memoizes them.
  // oxlint-disable-next-line react/incompatible-library
  const virtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => scroller.current,
    estimateSize: () => ROW,
    overscan: 3,
  });
  const items = virtualizer.getVirtualItems();

  // The variants on screen, loaded once each.
  useEffect(() => {
    for (const row of items)
      for (
        let index = row.index * columns;
        index < Math.min(results.length, (row.index + 1) * columns);
        index++
      )
        load(subpathOf(results[index]!));
  }, [items, columns, results, load, subpathOf]);

  // New results keep the selected icon in view when they still have it, and
  // start at the top when they do not. Selecting an icon is not new results.
  const selection = useRef(selected);
  useLayoutEffect(() => {
    selection.current = selected;
  }, [selected]);
  useLayoutEffect(() => {
    const index = results.findIndex((entry) => entry.key === selection.current);
    if (index === -1) {
      scroller.current?.scrollTo({ top: 0 });
      setFocus(0);
    } else {
      setFocus(index);
      virtualizer.scrollToIndex(Math.floor(index / columns), {
        align: 'auto',
      });
    }
    // Only new results move the grid: not a resize, and not a selection.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  useEffect(() => {
    const index = pendingFocus.current;
    if (index === undefined) return;
    const button = container.current?.querySelector<HTMLButtonElement>(
      `[data-icon-index="${index}"]`,
    );
    if (button) {
      button.focus();
      pendingFocus.current = undefined;
    }
  });

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: columns,
      ArrowUp: -columns,
    };
    let next: number | undefined;
    if (event.key in moves) next = focus + moves[event.key]!;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = results.length - 1;
    if (next === undefined || results.length === 0) return;
    event.preventDefault();
    next = Math.min(results.length - 1, Math.max(0, next));
    setFocus(next);
    pendingFocus.current = next;
    virtualizer.scrollToIndex(Math.floor(next / columns), { align: 'auto' });
  };

  return (
    <div
      ref={scroller}
      data-testid="grid-scroller"
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-6 sm:px-4"
    >
      <div
        ref={container}
        role="list"
        aria-label="Icons"
        onKeyDown={onKeyDown}
        className="relative"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {items.map((row) => (
          <div
            key={row.key}
            className="absolute inset-x-0 grid"
            style={{
              top: row.start,
              height: ROW,
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {results
              .slice(row.index * columns, (row.index + 1) * columns)
              .map((entry, column) => {
                const index = row.index * columns + column;
                return (
                  <Cell
                    key={entry.key}
                    entry={entry}
                    index={index}
                    subpath={subpathOf(entry)}
                    module={modules[subpathOf(entry)]}
                    collectionTitle={
                      showCollection ? titles[entry.collection] : undefined
                    }
                    tabbable={index === focus}
                    selected={entry.key === selected}
                    onSelect={() => {
                      setFocus(index);
                      onSelect(entry.key);
                    }}
                  />
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}

function Cell({
  entry,
  index,
  subpath,
  module,
  collectionTitle,
  tabbable,
  selected,
  onSelect,
}: {
  readonly entry: Entry;
  readonly index: number;
  readonly subpath: string;
  readonly module?: IconModule;
  readonly collectionTitle?: string;
  readonly tabbable: boolean;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  const Icon = module?.[entry.name];
  const [copied, setCopied] = useState(false);
  const label = collectionTitle
    ? `${entry.name}, ${collectionTitle}`
    : entry.name;
  return (
    <div role="listitem" className="group relative p-1">
      <button
        type="button"
        data-icon-index={index}
        tabIndex={tabbable ? 0 : -1}
        aria-label={label}
        aria-pressed={selected}
        onClick={onSelect}
        className={`flex size-full flex-col items-center justify-center gap-2 rounded-xl border px-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-fd-primary ${
          selected
            ? 'border-fd-primary bg-fd-primary/10'
            : 'border-transparent hover:border-fd-border hover:bg-fd-card'
        }`}
      >
        <span className="flex size-8 items-center justify-center text-fd-foreground">
          {Icon ? (
            <Icon size={28} />
          ) : (
            <span className="size-6 animate-pulse rounded bg-fd-muted" />
          )}
        </span>
        <span className="w-full truncate text-center text-[11px] text-fd-muted-foreground">
          {entry.name}
        </span>
        {collectionTitle && (
          <span className="-mt-1.5 w-full truncate text-center text-[10px] text-fd-muted-foreground/70">
            {collectionTitle}
          </span>
        )}
      </button>
      <button
        type="button"
        tabIndex={-1}
        aria-label={`Copy the import of ${entry.name}`}
        title="Copy the import"
        onClick={() => {
          void navigator.clipboard
            .writeText(importSnippet(entry.name, subpath))
            .then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            });
        }}
        className="absolute top-2 right-2 rounded-md p-1 text-fd-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-fd-accent hover:text-fd-foreground focus-visible:opacity-100"
      >
        {copied ? (
          <Check aria-hidden className="size-3.5" />
        ) : (
          <Copy aria-hidden className="size-3.5" />
        )}
      </button>
    </div>
  );
}
