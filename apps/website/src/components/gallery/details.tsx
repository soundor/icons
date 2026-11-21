/**
 * The selected icon: a large preview with size, color and stroke width, its
 * variants, the code to copy (public imports only), and its license and
 * source. A column beside the grid on wide screens, a bottom sheet on narrow
 * ones.
 */

import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock.core';
import { Check, Copy, ExternalLink, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { CollectionInfo, IconModule } from 'virtual:icon-collections';

import { codeOptions, tsxHighlighter } from '../highlighter';
import { ColorPicker } from './color-picker';
import { importSnippet, jsxSnippet, type Entry } from './search';

export function Details({
  entry,
  collection,
  variant,
  onVariant,
  modules,
  load,
  onClose,
}: {
  readonly entry: Entry;
  readonly collection: CollectionInfo;
  readonly variant: number;
  readonly onVariant: (index: number) => void;
  readonly modules: Readonly<Record<string, IconModule>>;
  readonly load: (subpath: string) => void;
  readonly onClose: () => void;
}) {
  const info = collection.variants[variant]!;
  const available = (entry.mask & (1 << variant)) !== 0;
  const [size, setSize] = useState(info.size);
  const [color, setColor] = useState('#f2f4f7');
  const [strokeWidth, setStrokeWidth] = useState(info.strokeWidth ?? 2);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => load(info.subpath), [info.subpath, load]);
  useEffect(() => heading.current?.focus(), []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const Icon = available ? modules[info.subpath]?.[entry.name] : undefined;
  const stroke =
    info.stroke &&
    info.strokeWidth !== undefined &&
    strokeWidth !== info.strokeWidth
      ? strokeWidth
      : undefined;
  const importLine = importSnippet(entry.name, info.subpath);
  const jsx = jsxSnippet(entry.name, { size, color, strokeWidth: stroke });

  return (
    <aside
      aria-labelledby="icon-details"
      data-testid="details"
      className="fixed inset-x-0 bottom-0 z-40 max-h-[80vh] overflow-y-auto rounded-t-2xl border bg-fd-background p-5 shadow-2xl lg:static lg:z-auto lg:max-h-none lg:w-[340px] lg:shrink-0 lg:rounded-none lg:border-0 lg:border-l lg:shadow-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="icon-details"
            ref={heading}
            tabIndex={-1}
            className="truncate text-lg font-semibold outline-none"
          >
            {entry.name}
          </h2>
          <p className="text-sm text-fd-muted-foreground">
            {collection.title} ·{' '}
            <code className="text-xs">{entry.upstream}</code>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the details"
          className="rounded-md p-1.5 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>

      <div
        className="mt-4 flex h-44 items-center justify-center rounded-xl bg-[#0e0f12] [background-image:radial-gradient(#ffffff14_1px,transparent_1px)] [background-size:12px_12px]"
        data-testid="preview"
      >
        {Icon ? (
          <Icon
            size={size}
            color={color}
            label={entry.name}
            {...(info.stroke && { strokeWidth })}
          />
        ) : available ? (
          <span className="size-10 animate-pulse rounded bg-white/10" />
        ) : (
          <p className="px-6 text-center text-sm text-white/60">
            {entry.name} has no {info.title.toLowerCase()} variant.
          </p>
        )}
      </div>

      {collection.variants.length > 1 && (
        <fieldset className="mt-4">
          <legend className="mb-1.5 text-xs font-medium text-fd-muted-foreground">
            Variant
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {collection.variants.map((item, index) => {
              const has = (entry.mask & (1 << index)) !== 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={index === variant}
                  disabled={!has}
                  onClick={() => onVariant(index)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors disabled:opacity-40 ${
                    index === variant
                      ? 'border-fd-primary bg-fd-primary text-fd-primary-foreground'
                      : 'bg-fd-card text-fd-muted-foreground hover:text-fd-foreground'
                  }`}
                >
                  {item.title}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-4 grid gap-3">
        <Range
          label="Size"
          value={size}
          min={12}
          max={128}
          step={1}
          unit="px"
          onChange={setSize}
        />
        {info.stroke && (
          <Range
            label="Stroke width"
            value={strokeWidth}
            min={0.5}
            max={3}
            step={0.25}
            onChange={setStrokeWidth}
          />
        )}
        <ColorPicker value={color} onChange={setColor} />
      </div>

      <div className="mt-4 grid gap-2">
        <CopyButton text={importLine} label="Copy import" />
        <CopyButton text={jsx} label="Copy JSX" />
      </div>
      <DynamicCodeBlock
        highlighter={tsxHighlighter}
        options={codeOptions}
        lang="tsx"
        code={`${importLine}\n\n${jsx}`}
        codeblock={{ className: 'mt-3 mb-0 text-xs' }}
      />

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        <dt className="text-fd-muted-foreground">License</dt>
        <dd>
          {collection.license}{' '}
          <a
            className="underline underline-offset-2"
            href={`https://github.com/soundor/icons/blob/main/packages/icons/licenses/${collection.licenseFile}`}
          >
            (text)
          </a>
        </dd>
        <dt className="text-fd-muted-foreground">Source</dt>
        <dd>
          <a
            className="inline-flex items-center gap-1 underline underline-offset-2"
            href={collection.homepage}
          >
            {collection.title}
            <ExternalLink aria-hidden className="size-3" />
          </a>{' '}
          <span className="text-fd-muted-foreground">
            {/^[0-9a-f]{40}$/.test(collection.version)
              ? `commit ${collection.version.slice(0, 7)}`
              : `v${collection.version}`}
          </span>
        </dd>
      </dl>
      <p className="mt-3 text-xs text-fd-muted-foreground">
        Drawn here by the browser implementation. In a Soundor plugin the same
        import renders the same geometry with Soundor&apos;s native SVG.
      </p>
    </aside>
  );
}

function Range({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  onChange,
}: {
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly unit?: string;
  readonly onChange: (value: number) => void;
}) {
  return (
    <label className="grid grid-cols-[6rem_minmax(0,1fr)_3.5rem] items-center gap-3 text-sm">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-fd-primary"
      />
      <span className="text-right text-xs text-fd-muted-foreground tabular-nums">
        {value}
        {unit}
      </span>
    </label>
  );
}

function CopyButton({
  text,
  label,
}: {
  readonly text: string;
  readonly label: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex items-center justify-center gap-2 rounded-lg border bg-fd-card px-3 py-2 text-sm font-medium transition-colors hover:bg-fd-accent"
    >
      {copied ? (
        <Check aria-hidden className="size-4" />
      ) : (
        <Copy aria-hidden className="size-4" />
      )}
      {copied ? 'Copied' : label}
    </button>
  );
}
