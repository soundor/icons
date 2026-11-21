import { createFileRoute, Link } from '@tanstack/react-router';
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
import { ArrowRight, ExternalLink } from 'lucide-react';
import { collections } from 'virtual:icon-collections';

import { Gallery } from '../components/gallery/gallery';
import { codeOptions, tsxHighlighter } from '../components/highlighter';
import { layoutOptions } from '../layout-options';

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

function Home() {
  return (
    <HomeLayout
      {...layoutOptions}
      links={layoutOptions.links.map((link) =>
        link.external
          ? {
              ...link,
              text: (
                <span className="inline-flex items-center gap-1">
                  {link.text}
                  <ExternalLink aria-hidden className="size-3" />
                </span>
              ),
            }
          : link,
      )}
    >
      <main className="relative isolate w-full">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] [background-image:linear-gradient(to_right,var(--color-fd-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-fd-border)_1px,transparent_1px)] [background-size:48px_48px] opacity-50 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]"
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <section className="flex flex-col gap-4 pt-10 pb-4 sm:pt-14 lg:flex-row lg:items-end lg:justify-between">
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
            </div>
            <Install className="w-full max-w-sm text-left" />
          </section>

          <section aria-label="Gallery" className="pb-20">
            <Gallery />
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

          <section className="mb-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {collections.map((collection) => (
              <a
                key={collection.id}
                href={collection.homepage}
                className="rounded-xl border bg-fd-card p-4 transition-colors hover:bg-fd-accent"
              >
                <p className="font-medium">{collection.title}</p>
                <p className="mt-1 text-xs text-fd-muted-foreground">
                  {collection.description}
                </p>
                <p className="mt-3 text-xs text-fd-muted-foreground">
                  {collection.total.toLocaleString('en-US')} icons ·{' '}
                  {collection.license}
                </p>
              </a>
            ))}
          </section>
        </div>
      </main>
    </HomeLayout>
  );
}
