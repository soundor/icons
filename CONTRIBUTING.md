# Contributing to Soundor Icons

Thanks for helping. This file covers working on the repository. Usage is in
the [documentation](https://icons.soundor.dev/docs).

## Setup

Node from `.nvmrc`, pnpm through Corepack:

```sh
corepack enable
pnpm install
pnpm --filter @soundor/icons-website exec playwright install chromium
pnpm check
```

`pnpm check` runs Oxfmt, Oxlint, every build and every test except the Soundor
integration test. `pnpm test:integration` builds `tests/soundor-consumer` with
the Soundor CLI and needs Rust stable with the `wasm32-unknown-unknown`
target.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/),
as in the main Soundor repository: `feat: …`, `fix(generator): …`,
`docs: …`. Add a changeset (`pnpm changeset`) for any change to the published
package.

## How the package is built

```text
upstream SVG files ─▶ scripts/sources/*      (one adapter per collection)
                   ─▶ scripts/lib/svg.ts      (strict XML parsing)
                   ─▶ scripts/lib/normalize.ts (the normalized model, or an error)
                   ─▶ scripts/lib/emit.ts     (nodes.js, soundor.js, web.js, index.d.ts)
                   ─▶ generated/<subpath>/, catalog/, licenses/, package.json exports
```

`src/web.ts` and `src/soundor.ts` are the two renderers, which tsdown builds
into `dist/`. The generated modules import them.

The build generates `generated/`, `catalog/`, `licenses/`,
`THIRD_PARTY_NOTICES.md` and the `exports` of `packages/icons/package.json`
from the pinned sources (`pnpm generate` runs that step alone). Only the
exports are committed: don't edit them by hand. CI fails when the build
changes them.

## Updating an upstream collection

See [Updating upstream icons](https://icons.soundor.dev/docs/guides/updating-upstream):
change the pinned version, run `pnpm generate`, read the icons it reports added
and removed, and add a changeset. A removed or renamed icon is a breaking change.

## Adding a collection

See [Adding a collection](https://icons.soundor.dev/docs/guides/adding-a-collection):
a source adapter in `scripts/sources/` and an entry in `scripts/collections.ts`.
Check the upstream license first, and leave out any source whose
redistribution terms are unclear.

## When an icon fails to convert

The generator fails, naming the collection, style and icon, rather than
dropping or approximating it. Either add a faithful conversion to
`scripts/lib/normalize.ts`, with a test and an entry in `NOTES` explaining why
it is safe, or report the icons as unsupported in the documentation. Never
skip them silently.

## Tests

| Where                                 | What                                                                               |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| `packages/icons/scripts/**/*.test.ts` | The generator: parsing, normalization, naming, output                              |
| `packages/icons/test/node`            | Every web icon against its upstream SVG; exports and resolution; types; boundaries |
| `packages/icons/test/soundor`         | Every icon rendered by the Soundor implementation in Soundor's test runtime        |
| `tests/browser-consumer`              | Vite selects the browser implementation and tree-shakes                            |
| `tests/soundor-consumer`              | The Soundor CLI selects the native implementation and tree-shakes                  |
| `apps/website/tests`                  | The landing page and the icon browser in Chromium, desktop and mobile              |

Update snapshots with `pnpm --filter @soundor/icons test -u` when a change to
the output is intended, and say why in the pull request.
