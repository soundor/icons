/**
 * Phosphor Icons, from @phosphor-icons/core: six weights of every icon, in
 * `assets/<weight>/<name>[-<weight>].svg`, and the icons' tags and
 * categories in its `icons` export.
 */

import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { npmPackage, origin } from './npm.ts';
import type { LoadedSource } from './types.ts';

const WEIGHTS = [
  'regular',
  'thin',
  'light',
  'bold',
  'fill',
  'duotone',
] as const;

interface PhosphorIcon {
  readonly name: string;
  readonly tags: readonly string[];
  readonly categories: readonly string[];
}

export async function loadPhosphor(): Promise<LoadedSource> {
  const pkg = npmPackage('@phosphor-icons/core');
  const { icons } = (await import(
    pathToFileURL(join(pkg.dir, 'dist/index.mjs')).href
  )) as { icons: readonly PhosphorIcon[] };
  const metadata = new Map(icons.map((icon) => [icon.name, icon]));
  const variants: Record<string, LoadedSource['variants'][string]> = {};
  for (const weight of WEIGHTS) {
    const suffix = weight === 'regular' ? '' : `-${weight}`;
    variants[weight] = pkg.svgNames(`assets/${weight}`).map((file) => {
      if (!file.endsWith(suffix))
        throw new Error(
          `@phosphor-icons/core: unexpected file ${weight}/${file}.svg`,
        );
      const name = file.slice(0, file.length - suffix.length);
      const icon = metadata.get(name);
      if (icon === undefined)
        throw new Error(`@phosphor-icons/core: ${name} has no metadata`);
      return {
        name,
        svg: pkg.read(`assets/${weight}/${file}.svg`),
        // Phosphor's tags include markers such as "*new*".
        tags: icon.tags.filter((tag) => !tag.startsWith('*')),
        categories: icon.categories,
      };
    });
  }
  return {
    version: pkg.version,
    origin: origin(pkg),
    license: pkg.read('LICENSE'),
    variants,
  };
}
