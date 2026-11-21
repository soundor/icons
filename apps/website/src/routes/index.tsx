import {
  AdjustmentsHorizontal,
  MusicalNote,
  SpeakerWave,
} from '@soundor/icons/heroicons';
import {
  type IconComponent,
  AudioLines,
  Disc3,
  Headphones,
  KeyboardMusic,
  Mic,
  Pause,
  Play,
  SlidersHorizontal,
  Volume2,
} from '@soundor/icons/lucide';
import {
  Album,
  Equalizer,
  GraphicEq,
  Headphones as MaterialHeadphones,
  Tune,
} from '@soundor/icons/material';
import {
  Faders,
  Metronome as PhosphorMetronome,
  PianoKeys,
  SpeakerHigh,
  VinylRecord,
  Waveform as PhosphorWaveform,
} from '@soundor/icons/phosphor';
import {
  Adjustments,
  Metronome,
  Microphone,
  Piano,
  PlayerRecord,
  PlayerSkipForward,
  Waveform,
} from '@soundor/icons/tabler';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  CodeBlock,
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
  Pre,
} from 'fumadocs-ui/components/codeblock';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock.core';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { ArrowRight, Search } from 'lucide-react';
import { useState } from 'react';
import { collections } from 'virtual:icon-collections';

import { codeOptions, tsxHighlighter } from '../components/highlighter';
import { navLinks } from '../layout-options';

export const Route = createFileRoute('/')({ component: Home });

const managers = [
  ['pnpm', 'pnpm add @soundor/icons'],
  ['npm', 'npm install @soundor/icons'],
] as const;

const usage = `import { Pause, Play } from '@soundor/icons/lucide';
import { PlayerSkipForward } from '@soundor/icons/tabler';
import { Pressable, View } from '@soundor/react';

interface TransportProps {
  readonly playing: boolean;
  readonly onToggle: () => void;
  readonly onSkip: () => void;
}

export function Transport({ playing, onToggle, onSkip }: TransportProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Pressable onPress={onToggle} accessibilityLabel={playing ? 'Pause' : 'Play'}>
        {playing ? <Pause size={20} color="#f2f4f7" /> : <Play size={20} color="#f2f4f7" />}
      </Pressable>
      <Pressable onPress={onSkip} accessibilityLabel="Next">
        <PlayerSkipForward size={20} color="#f2f4f7" strokeWidth={1.5} />
      </Pressable>
    </View>
  );
}`;

const TOTAL = collections.reduce(
  (sum, collection) => sum + collection.total,
  0,
);

/** A sample from every collection, each opening in the browser. */
const preview: readonly (readonly [string, string, IconComponent])[] = [
  ['lucide', 'Play', Play],
  ['tabler', 'PlayerSkipForward', PlayerSkipForward],
  ['phosphor', 'Waveform', PhosphorWaveform],
  ['material', 'GraphicEq', GraphicEq],
  ['heroicons', 'SpeakerWave', SpeakerWave],
  ['lucide', 'Pause', Pause],
  ['tabler', 'Metronome', Metronome],
  ['phosphor', 'Faders', Faders],
  ['material', 'Tune', Tune],
  ['heroicons', 'MusicalNote', MusicalNote],
  ['lucide', 'Mic', Mic],
  ['tabler', 'Waveform', Waveform],
  ['phosphor', 'PianoKeys', PianoKeys],
  ['material', 'Equalizer', Equalizer],
  ['heroicons', 'AdjustmentsHorizontal', AdjustmentsHorizontal],
  ['lucide', 'AudioLines', AudioLines],
  ['tabler', 'Microphone', Microphone],
  ['phosphor', 'SpeakerHigh', SpeakerHigh],
  ['material', 'Album', Album],
  ['lucide', 'SlidersHorizontal', SlidersHorizontal],
  ['tabler', 'Piano', Piano],
  ['phosphor', 'VinylRecord', VinylRecord],
  ['material', 'Headphones', MaterialHeadphones],
  ['lucide', 'Volume2', Volume2],
  ['tabler', 'PlayerRecord', PlayerRecord],
  ['phosphor', 'Metronome', PhosphorMetronome],
  ['lucide', 'Headphones', Headphones],
  ['tabler', 'Adjustments', Adjustments],
  ['lucide', 'Disc3', Disc3],
  ['lucide', 'KeyboardMusic', KeyboardMusic],
];

const titles: Readonly<Record<string, string>> = Object.fromEntries(
  collections.map((collection) => [collection.id, collection.title]),
);

function Install({ className }: { readonly className?: string }) {
  return (
    <CodeBlockTabs defaultValue="pnpm" className={className}>
      <CodeBlockTabsList>
        {managers.map(([name]) => (
          <CodeBlockTabsTrigger key={name} value={name}>
            {name}
          </CodeBlockTabsTrigger>
        ))}
      </CodeBlockTabsList>
      {managers.map(([name, command]) => (
        <CodeBlockTab key={name} value={name}>
          <CodeBlock>
            <Pre>
              <code>
                <span className="line">
                  <span className="text-fd-muted-foreground select-none">
                    ${' '}
                  </span>
                  {command}
                </span>
              </code>
            </Pre>
          </CodeBlock>
        </CodeBlockTab>
      ))}
    </CodeBlockTabs>
  );
}

function HeroSearch() {
  const [text, setText] = useState('');
  const navigate = useNavigate();
  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const q = text.trim();
        void navigate({ to: '/browse', search: q ? { q } : {} });
      }}
      className="relative mt-6 max-w-xl"
    >
      <label>
        <span className="sr-only">Search icons</span>
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-fd-muted-foreground"
        />
        <input
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Search play, volume, arrow left…"
          autoComplete="off"
          spellCheck={false}
          className="h-12 w-full rounded-xl border bg-fd-card pr-28 pl-12 text-base shadow-sm outline-none placeholder:text-fd-muted-foreground focus-visible:ring-2 focus-visible:ring-fd-primary"
        />
      </label>
      <button
        type="submit"
        className={buttonVariants({
          variant: 'primary',
          className: 'absolute top-1/2 right-1.5 -translate-y-1/2 px-3 py-1.5',
        })}
      >
        Search
      </button>
    </form>
  );
}

function Home() {
  return (
    <HomeLayout {...navLinks}>
      <div className="relative isolate w-full">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] [background-image:linear-gradient(to_right,var(--color-fd-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-fd-border)_1px,transparent_1px)] [background-size:48px_48px] opacity-50 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]"
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <section className="grid gap-10 pt-12 pb-16 sm:pt-20 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
                Icons for{' '}
                <span className="bg-gradient-to-r from-fd-primary to-fd-foreground/60 bg-clip-text text-transparent">
                  Soundor
                </span>
              </h1>
              <p className="mt-3 text-base text-balance text-fd-muted-foreground sm:text-lg">
                {TOTAL.toLocaleString('en-US')} icons from Lucide, Tabler,
                Phosphor, Heroicons and Material Symbols. One import draws with
                Soundor&apos;s native SVG in a plugin and with ordinary SVG in
                the browser.
              </p>
              <HeroSearch />
              <Install className="mt-4 max-w-xl text-left" />
            </div>

            <div className="lg:w-[420px]">
              <ul
                aria-label="A sample of the icons"
                className="grid grid-cols-6 gap-1 rounded-2xl border bg-fd-card/60 p-3 backdrop-blur"
              >
                {preview.map(([collection, name, Icon]) => (
                  <li key={`${collection}:${name}`}>
                    <Link
                      to="/browse"
                      search={{ icon: `${collection}:${name}` }}
                      title={`${name} · ${titles[collection]}`}
                      aria-label={`${name}, ${titles[collection]}`}
                      className="flex aspect-square items-center justify-center rounded-lg text-fd-foreground transition-colors hover:bg-fd-accent"
                    >
                      <Icon size={24} />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to="/browse"
                className={buttonVariants({
                  variant: 'outline',
                  className: 'mt-3 w-full gap-1.5 py-2.5',
                })}
              >
                Browse all {TOTAL.toLocaleString('en-US')} icons
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
          </section>

          <section aria-labelledby="collections" className="border-t py-16">
            <p className="mb-2 font-mono text-xs tracking-wider text-fd-primary uppercase">
              Collections
            </p>
            <h2
              id="collections"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Five sets, every style
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {collections.map((collection) => (
                <Link
                  key={collection.id}
                  to="/browse"
                  search={{ c: collection.id }}
                  className="group rounded-xl border bg-fd-card p-4 transition-colors hover:bg-fd-accent"
                >
                  <p className="flex items-center justify-between font-medium">
                    {collection.title}
                    <ArrowRight
                      aria-hidden
                      className="size-4 opacity-0 transition-opacity group-hover:opacity-60"
                    />
                  </p>
                  <p className="mt-1 text-xs text-fd-muted-foreground">
                    {collection.description}
                  </p>
                  <p className="mt-3 text-xs text-fd-muted-foreground">
                    {collection.total.toLocaleString('en-US')} icons ·{' '}
                    {collection.variants.length}{' '}
                    {collection.variants.length === 1 ? 'style' : 'styles'} ·{' '}
                    {collection.license}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section className="grid gap-10 border-t py-16 lg:grid-cols-[2fr_3fr] lg:items-start">
            <div>
              <p className="mb-2 font-mono text-xs tracking-wider text-fd-primary uppercase">
                Usage
              </p>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Import by collection
              </h2>
              <div className="mt-4 space-y-3 text-fd-muted-foreground">
                <p>
                  Each collection, and each of its styles, is a subpath of{' '}
                  <code>@soundor/icons</code>: <code>/lucide</code>,{' '}
                  <code>/tabler/filled</code>, <code>/phosphor/bold</code>,{' '}
                  <code>/material/rounded</code>. Bundlers keep only the icons
                  you import.
                </p>
                <p>
                  The Soundor CLI picks the native implementation through the{' '}
                  <code>soundor</code> export condition; Vite, webpack and Node
                  pick the browser one. Same names, same props, same geometry.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  className={buttonVariants({
                    variant: 'primary',
                    className: 'gap-1.5 px-4 py-2.5',
                  })}
                  to="/docs/$"
                  params={{ _splat: '' }}
                >
                  Read the docs
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
                <a
                  className={buttonVariants({
                    variant: 'outline',
                    className: 'px-4 py-2.5',
                  })}
                  href="https://components.soundor.dev/"
                >
                  Soundor Components
                </a>
              </div>
            </div>
            <DynamicCodeBlock
              highlighter={tsxHighlighter}
              options={codeOptions}
              lang="tsx"
              code={usage}
              codeblock={{ title: 'transport.tsx', className: 'my-0' }}
            />
          </section>
        </div>
      </div>
      <Footer />
    </HomeLayout>
  );
}

function Footer() {
  return (
    <footer role="contentinfo" className="border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-fd-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          @soundor/icons is MIT licensed. Each icon keeps its collection&apos;s
          license:{' '}
          <Link
            className="underline underline-offset-2 hover:text-fd-foreground"
            to="/docs/$"
            params={{ _splat: 'licensing' }}
          >
            licensing
          </Link>
          .
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link className="hover:text-fd-foreground" to="/browse">
            Browse
          </Link>
          <Link
            className="hover:text-fd-foreground"
            to="/docs/$"
            params={{ _splat: '' }}
          >
            Docs
          </Link>
          <a
            className="hover:text-fd-foreground"
            href="https://github.com/soundor/icons"
          >
            GitHub
          </a>
          <a
            className="hover:text-fd-foreground"
            href="https://components.soundor.dev/"
          >
            Components
          </a>
          <a className="hover:text-fd-foreground" href="https://soundor.dev/">
            Soundor
          </a>
        </nav>
      </div>
    </footer>
  );
}
