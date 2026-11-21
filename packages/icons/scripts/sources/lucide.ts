/**
 * Lucide, from lucide-static: one SVG per icon. `icon-nodes.json` lists the
 * current icons; the other files in `icons/` are deprecated aliases of them,
 * which are not exported.
 */

import { npmPackage, origin } from './npm.ts';
import type { LoadedSource } from './types.ts';

export function loadLucide(): LoadedSource {
  const pkg = npmPackage('lucide-static');
  const names = Object.keys(
    JSON.parse(pkg.read('icon-nodes.json')) as Record<string, unknown>,
  ).sort();
  const tags = JSON.parse(pkg.read('tags.json')) as Record<string, string[]>;
  return {
    version: pkg.version,
    origin: origin(pkg),
    license: pkg.read('LICENSE'),
    variants: {
      default: names.map((name) => ({
        name,
        svg: pkg.read(`icons/${name}.svg`),
        tags: tags[name] ?? [],
      })),
    },
  };
}
