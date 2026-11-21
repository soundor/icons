/**
 * Heroicons, from the heroicons package: 24 px outline and solid icons,
 * 20 px solid ("mini") and 16 px solid ("micro"). It publishes no tags.
 */

import { npmPackage, origin } from './npm.ts';
import type { LoadedSource } from './types.ts';

const VARIANTS = {
  outline: '24/outline',
  solid: '24/solid',
  mini: '20/solid',
  micro: '16/solid',
} as const;

export function loadHeroicons(): LoadedSource {
  const pkg = npmPackage('heroicons');
  const variants: Record<string, LoadedSource['variants'][string]> = {};
  for (const [id, dir] of Object.entries(VARIANTS))
    variants[id] = pkg
      .svgNames(dir)
      .map((name) => ({ name, svg: pkg.read(`${dir}/${name}.svg`) }));
  return {
    version: pkg.version,
    origin: origin(pkg),
    license: pkg.read('LICENSE'),
    variants,
  };
}
