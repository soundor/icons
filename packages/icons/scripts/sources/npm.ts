/** Reading the pinned upstream npm packages (the package's devDependencies). */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);

export interface NpmPackage {
  readonly dir: string;
  readonly name: string;
  readonly version: string;
  read(path: string): string;
  /** The names of the `.svg` files in a directory, without the extension, sorted. */
  svgNames(path: string): string[];
}

export function npmPackage(name: string): NpmPackage {
  // Not require.resolve(`${name}/package.json`): a package's exports may
  // not include it.
  const dir = (require.resolve.paths(name) ?? [])
    .map((base) => join(base, name))
    .find((candidate) => existsSync(join(candidate, 'package.json')));
  if (dir === undefined) throw new Error(`${name} is not installed`);
  const manifest = JSON.parse(
    readFileSync(join(dir, 'package.json'), 'utf8'),
  ) as {
    version: string;
  };
  return {
    dir,
    name,
    version: manifest.version,
    read: (path) => readFileSync(join(dir, path), 'utf8'),
    svgNames: (path) =>
      readdirSync(join(dir, path))
        .filter((file) => file.endsWith('.svg'))
        .map((file) => file.slice(0, -4))
        .sort(),
  };
}

export function origin(pkg: NpmPackage): string {
  return `npm:${pkg.name}@${pkg.version}`;
}
