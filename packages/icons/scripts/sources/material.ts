/**
 * Material Symbols, from Google's repository (google/material-design-icons)
 * at a pinned commit: Google publishes no npm package of the SVG files.
 *
 * The repository holds every combination of style, fill, weight, grade and
 * optical size (gigabytes). The adapter fetches only what the package ships:
 * weight 400, grade 0, optical size 24, unfilled and filled, in each style,
 * `symbols/web/<name>/materialsymbols<style>/<name>[_fill1]_24px.svg`. It
 * makes a shallow, blob-less clone of the commit in `.cache/` and fetches
 * those blobs in one request, about 20 seconds the first time.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import type { LoadedSource, SourceIcon } from './types.ts';

export const MATERIAL_REPOSITORY =
  'https://github.com/google/material-design-icons.git';
/** "Update Symbols", 2026-10-23. */
export const MATERIAL_COMMIT = '10ecc14790612ca8fd164e3f4ffe9c16fc50d5b7';

const STYLES = ['outlined', 'rounded', 'sharp'] as const;

function git(dir: string, args: string[], input?: string): Buffer {
  return execFileSync('git', args, {
    cwd: dir,
    input,
    maxBuffer: 1024 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'inherit'],
  });
}

/** A clone of the pinned commit, without file contents. */
function checkout(cache: string): string {
  const dir = join(cache, 'material-design-icons');
  if (!existsSync(join(dir, '.git'))) {
    mkdirSync(dir, { recursive: true });
    git(dir, ['init', '--quiet']);
    git(dir, ['remote', 'add', 'origin', MATERIAL_REPOSITORY]);
    git(dir, ['config', 'remote.origin.promisor', 'true']);
    git(dir, ['config', 'remote.origin.partialclonefilter', 'blob:none']);
  }
  const head = (() => {
    try {
      return git(dir, ['rev-parse', '--verify', '--quiet', 'HEAD'])
        .toString()
        .trim();
    } catch {
      return undefined;
    }
  })();
  if (head !== MATERIAL_COMMIT) {
    console.log(`Fetching ${MATERIAL_REPOSITORY} at ${MATERIAL_COMMIT}…`);
    git(dir, [
      'fetch',
      '--quiet',
      '--depth=1',
      '--filter=blob:none',
      '--no-tags',
      'origin',
      MATERIAL_COMMIT,
    ]);
    git(dir, ['update-ref', 'HEAD', MATERIAL_COMMIT]);
  }
  return dir;
}

/** The contents of blobs, fetched together first if missing. */
function readBlobs(dir: string, ids: readonly string[]): Map<string, Buffer> {
  // How git itself fetches the blobs of a partial clone, but in one batch.
  git(
    dir,
    [
      '-c',
      'fetch.negotiationAlgorithm=noop',
      'fetch',
      '--quiet',
      'origin',
      '--no-tags',
      '--no-write-fetch-head',
      '--recurse-submodules=no',
      '--filter=blob:none',
      '--stdin',
    ],
    `${[...new Set(ids)].join('\n')}\n`,
  );
  const output = git(dir, ['cat-file', '--batch'], `${ids.join('\n')}\n`);
  const blobs = new Map<string, Buffer>();
  let at = 0;
  while (at < output.length) {
    const end = output.indexOf(10, at);
    const [id, type, size] = output.subarray(at, end).toString().split(' ');
    if (type !== 'blob')
      throw new Error(`material-design-icons: ${id} is ${type}`);
    const start = end + 1;
    blobs.set(id!, output.subarray(start, start + Number(size)));
    at = start + Number(size) + 1;
  }
  return blobs;
}

export function loadMaterial(cache: string): LoadedSource {
  const dir = checkout(cache);
  const files = new Map<string, string>();
  const tree = git(dir, ['ls-tree', '-r', 'HEAD', 'symbols/web', 'LICENSE'])
    .toString()
    .split('\n');
  for (const line of tree) {
    const match = /^\d+ blob ([0-9a-f]+)\t(.+)$/.exec(line);
    if (match) files.set(match[2]!, match[1]!);
  }
  const wanted = new Map<string, { variant: string; name: string }>();
  for (const path of files.keys()) {
    const match =
      /^symbols\/web\/([^/]+)\/materialsymbols(outlined|rounded|sharp)\/([^/]+)$/.exec(
        path,
      );
    if (!match) continue;
    const [, name, style, file] = match;
    if (file === `${name}_24px.svg`)
      wanted.set(path, { variant: style!, name: name! });
    else if (file === `${name}_fill1_24px.svg`)
      wanted.set(path, { variant: `${style}-filled`, name: name! });
  }
  const license = files.get('LICENSE');
  if (license === undefined)
    throw new Error('material-design-icons: no LICENSE');
  const blobs = readBlobs(dir, [
    license,
    ...[...wanted.keys()].map((path) => files.get(path)!),
  ]);

  const variants: Record<string, SourceIcon[]> = {};
  for (const style of STYLES) {
    variants[style] = [];
    variants[`${style}-filled`] = [];
  }
  for (const [path, { variant, name }] of [...wanted].sort(([a], [b]) =>
    a < b ? -1 : 1,
  ))
    variants[variant]!.push({
      name,
      svg: blobs.get(files.get(path)!)!.toString('utf8'),
    });
  return {
    version: MATERIAL_COMMIT,
    origin: `git:${MATERIAL_REPOSITORY}#${MATERIAL_COMMIT}`,
    license: blobs.get(license)!.toString('utf8'),
    variants,
  };
}
