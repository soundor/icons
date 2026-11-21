/**
 * Tabler Icons, from @tabler/icons: outline icons, and filled versions of
 * some of them. `icons.json` has every icon's styles, category and tags.
 */

import { npmPackage, origin } from './npm.ts';
import type { LoadedSource, SourceIcon } from './types.ts';

interface TablerIcon {
  readonly name: string;
  readonly category?: string;
  readonly tags?: readonly (string | number)[];
  readonly styles: Partial<Record<'outline' | 'filled', unknown>>;
}

export function loadTabler(): LoadedSource {
  const pkg = npmPackage('@tabler/icons');
  const index = Object.values(
    JSON.parse(pkg.read('icons.json')) as Record<string, TablerIcon>,
  ).sort((a, b) => (a.name < b.name ? -1 : 1));
  const variant = (style: 'outline' | 'filled'): SourceIcon[] => {
    const icons = index.filter((icon) => icon.styles[style] !== undefined);
    // Every file is listed, and every listed icon has its file.
    const files = pkg.svgNames(`icons/${style}`);
    const listed = icons.map((icon) => icon.name);
    if (files.join() !== listed.join())
      throw new Error(`@tabler/icons: icons/${style} and icons.json disagree`);
    return icons.map((icon) => ({
      name: icon.name,
      svg: pkg.read(`icons/${style}/${icon.name}.svg`),
      tags: (icon.tags ?? []).map(String),
      categories: icon.category ? [icon.category] : [],
    }));
  };
  return {
    version: pkg.version,
    origin: origin(pkg),
    license: pkg.read('LICENSE'),
    variants: { outline: variant('outline'), filled: variant('filled') },
  };
}
