/**
 * Generates the package's icons from the pinned upstream sources: generated/,
 * catalog/, licenses/, THIRD_PARTY_NOTICES.md and package.json's exports. The
 * package's build runs it; only the exports are committed.
 *
 * Against the previous output on disk, it reports the icons added and
 * removed: a removed or renamed icon is a breaking change.
 *
 * The npm sources are the package's devDependencies, at the exact versions in
 * pnpm-workspace.yaml's catalog. Material Symbols is fetched from Git at the
 * commit in sources/material.ts, into .cache/. An icon that cannot be
 * converted faithfully fails the run, with its collection, variant and name.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';

import { collections } from './collections.ts';
import { buildOutput, type CatalogCollection } from './lib/output.ts';

const PACKAGE = join(import.meta.dirname, '..');
/** What the generator owns: anything else in these is deleted. */
const OWNED_DIRS = ['generated', 'catalog', 'licenses'];

function filesIn(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(PACKAGE, join(entry.parentPath, entry.name)));
}

const started = performance.now();
const output = await buildOutput(collections, join(PACKAGE, '.cache'));
if (output.errors.length > 0) {
  console.error(`${output.errors.length} icon(s) could not be converted:`);
  for (const error of output.errors) console.error(`  ${error}`);
  process.exit(1);
}

// package.json: only `exports` is the generator's.
const manifestPath = join(PACKAGE, 'package.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<
  string,
  unknown
>;
manifest['exports'] = { ...output.exports, './package.json': './package.json' };
const files = {
  ...output.files,
  'package.json': `${JSON.stringify(manifest, null, 2)}\n`,
};

const stale = OWNED_DIRS.flatMap((dir) => filesIn(join(PACKAGE, dir))).filter(
  (path) => !(path in files),
);
const changed = Object.entries(files).filter(([path, contents]) => {
  const absolute = join(PACKAGE, path);
  return !existsSync(absolute) || readFileSync(absolute, 'utf8') !== contents;
});

/** Every `subpath name` a catalog file exports. */
function exportsOf(json: string): Set<string> {
  const catalog = JSON.parse(json) as CatalogCollection;
  const subpaths = Object.fromEntries(
    catalog.variants.map((variant) => [variant.id, variant.subpath]),
  );
  const all = catalog.variants.map((variant) => variant.id);
  return new Set(
    catalog.icons.flatMap((icon) =>
      (icon.variants ?? all).map((id) => `${subpaths[id]} ${icon.name}`),
    ),
  );
}

// What changed for importers, against the previous output: none on a first
// run, or when the catalog is unchanged.
const added: string[] = [];
const removed: string[] = [];
for (const [path, contents] of changed) {
  if (!path.startsWith('catalog/')) continue;
  const previous = join(PACKAGE, path);
  const before = existsSync(previous)
    ? exportsOf(readFileSync(previous, 'utf8'))
    : undefined;
  if (before === undefined) continue;
  const after = exportsOf(contents);
  for (const name of after) if (!before.has(name)) added.push(name);
  for (const name of before) if (!after.has(name)) removed.push(name);
}

for (const [path, contents] of changed) {
  mkdirSync(dirname(join(PACKAGE, path)), { recursive: true });
  writeFileSync(join(PACKAGE, path), contents);
}
for (const path of stale) rmSync(join(PACKAGE, path));

const icons = Object.keys(output.exports).length;
console.log(
  `Generated ${icons} subpaths: ${changed.length} file(s) written, ${stale.length} removed, in ${Math.round(performance.now() - started)} ms.`,
);
const list = (names: readonly string[]) =>
  [...names]
    .sort()
    .map((name) => {
      const [subpath, icon] = name.split(' ');
      return `  @soundor/icons/${subpath} ${icon}`;
    })
    .join('\n');
if (added.length > 0)
  console.log(`${added.length} icon(s) added:\n${list(added)}`);
if (removed.length > 0)
  console.warn(
    `${removed.length} icon(s) removed or renamed, a breaking change:\n${list(removed)}`,
  );
if (changed.some(([path]) => path === 'package.json'))
  console.warn('package.json exports changed: commit them.');
