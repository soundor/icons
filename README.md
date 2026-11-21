<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/brand/soundor-icons-logo-dark-bg.svg">
  <img alt="Soundor Icons" src="assets/brand/soundor-icons-logo.svg" height="64">
</picture>

Lucide, Tabler, Phosphor, Heroicons and Material Symbols for
[Soundor](https://soundor.dev/) audio plugin UIs and the browser: 43,938
icons in 19 collection styles, from one package.

Each icon has two implementations behind the same import. A plugin built with
the Soundor CLI draws it with Soundor's native SVG (`@soundor/react/svg`), for
VST3 and the web runtime. Any other bundler gets React DOM `<svg>`. The
package's `soundor` export condition makes the choice at build time, and both
draw the same generated geometry.

```tsx
import { Pause, Play } from '@soundor/icons/lucide';
import { Gear } from '@soundor/icons/phosphor';
import { render, View } from '@soundor/react';

render(
  <View style={{ flexDirection: 'row', gap: 8, backgroundColor: '#0e0f12' }}>
    <Play size={24} color="#f2f4f7" />
    <Pause size={24} color="#f2f4f7" />
    <Gear size={24} color="#f2f4f7" label="Settings" />
  </View>,
);
```

Browse, search and copy icons at [icons.soundor.dev](https://icons.soundor.dev).

## Install

In a [Soundor project](https://soundor.dev/docs/getting-started) or a browser
app, with pnpm or npm (Yarn and bun are not supported):

```sh
pnpm add @soundor/icons
```

It needs React 19.3, and `@soundor/react` 0.19 in a Soundor plugin.

## Collections

| Collection       | Subpaths                                                                                | License    |
| ---------------- | --------------------------------------------------------------------------------------- | ---------- |
| Lucide           | `lucide`                                                                                | ISC, MIT   |
| Tabler           | `tabler`, `tabler/filled`                                                               | MIT        |
| Phosphor         | `phosphor`, `phosphor/thin`, `/light`, `/bold`, `/fill`, `/duotone`                     | MIT        |
| Heroicons        | `heroicons`, `heroicons/solid`, `/mini`, `/micro`                                       | MIT        |
| Material Symbols | `material`, `material/filled`, `/rounded`, `/rounded/filled`, `/sharp`, `/sharp/filled` | Apache-2.0 |

Names are the upstream names in PascalCase (`player-play` → `PlayerPlay`), the
same in every style of a collection. Every icon takes `size`, `width`,
`height`, `color`, `opacity` and `label`, and stroked styles take
`strokeWidth`. See the [documentation](https://icons.soundor.dev/docs).

## Documentation

On [icons.soundor.dev/docs](https://icons.soundor.dev/docs), from
`apps/website/content/docs/`:

- [Getting started](https://icons.soundor.dev/docs)
- [Collections](https://icons.soundor.dev/docs/collections): subpaths, styles, names, and what is not included
- [Icon props](https://icons.soundor.dev/docs/props)
- [Soundor and the browser](https://icons.soundor.dev/docs/renderers): resolution, what Soundor draws, what is tested
- [Bundle size](https://icons.soundor.dev/docs/tree-shaking)
- [Licensing](https://icons.soundor.dev/docs/licensing)

## Work on Soundor Icons

Use Node from `.nvmrc` and pnpm via Corepack:

```sh
corepack enable
pnpm install
pnpm dev        # the gallery and docs, on the URL Vite prints (port 5173)
pnpm check      # format, lint, build, and every test but the Soundor integration
```

The website's tests run in Chromium. Install it once with
`pnpm --filter @soundor/icons-website exec playwright install chromium`.
Nothing here needs Soundor's engine, a C++ toolchain or Rust, except
`pnpm test:integration`, which builds a plugin with the Soundor CLI and needs
Rust stable with the `wasm32-unknown-unknown` target.

The repository has four parts:

- [`packages/icons`](packages/icons): `@soundor/icons`, with its two renderers (`src/`), the generator (`scripts/`), the generated icons (`generated/`) and their licenses (`licenses/`).
- [`apps/website`](apps/website): the gallery and documentation, built with Fumadocs on TanStack Start and Vite.
- [`tests/soundor-consumer`](tests/soundor-consumer) and [`tests/browser-consumer`](tests/browser-consumer): the same imports built with `soundor build web` and with Vite. Each bundle must hold its own implementation, and only the imported icons.
- [`assets/brand`](assets/brand): the logo.

### Generating icons

```sh
pnpm generate           # regenerate from the pinned upstream sources
pnpm generate --check   # fail if the committed output is out of date
```

Generated code is committed, so builds never fetch icon sources. The npm
collections are pinned exactly in `pnpm-workspace.yaml`'s catalog. Material
Symbols is fetched from Google's repository, at the commit in
`packages/icons/scripts/sources/material.ts`, into `packages/icons/.cache/`.
CI checks that the committed output matches the sources. See
[CONTRIBUTING.md](CONTRIBUTING.md) to update a collection or add one.

### Releases and the website

Add a changeset (`pnpm changeset`) with a package change. On `main`, the
**Release** workflow opens a version PR; merging it publishes to npm from the
`npm-production` environment and deploys the website. A website-only change
deploys with `gh workflow run website.yml -f ref=main`.

## License

Soundor Icons' own code is [MIT licensed](LICENSE). The icons stay under their
upstream licenses: ISC and MIT (Lucide), MIT (Tabler, Phosphor, Heroicons) and
Apache-2.0 (Material Symbols). The full texts are in
[`packages/icons/licenses/`](packages/icons/licenses), and published with the
package. See [Licensing](https://icons.soundor.dev/docs/licensing).
