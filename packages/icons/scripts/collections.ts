/**
 * The collections the package ships. Adding one is a source adapter in
 * `sources/` and an entry here: the generator, the package's exports, its
 * licenses and the website's catalog follow from it.
 *
 * Each variant is a subpath of its own, and every variant of a collection
 * uses the same export names: switching a style is changing the import path.
 * The first variant is the collection's own subpath.
 */

import type { IconAttributes } from '../src/model.ts';
import { loadHeroicons } from './sources/heroicons.ts';
import { loadLucide } from './sources/lucide.ts';
import {
  loadMaterial,
  MATERIAL_COMMIT,
  MATERIAL_REPOSITORY,
} from './sources/material.ts';
import { loadPhosphor } from './sources/phosphor.ts';
import { loadTabler } from './sources/tabler.ts';
import type { LoadedSource } from './sources/types.ts';

export interface Variant {
  /** The id the source adapter files icons under. */
  readonly id: string;
  readonly title: string;
  /** The package subpath: `@soundor/icons/<subpath>`. */
  readonly subpath: string;
  /** The default width and height, in logical pixels. */
  readonly size: number;
  /**
   * Drawn with strokes whose width the strokeWidth prop sets. The generator
   * checks it against every icon.
   */
  readonly stroke: boolean;
  /** Root presentation for what the files leave unset. */
  readonly rootDefaults?: IconAttributes;
}

export interface Collection {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly homepage: string;
  readonly repository: string;
  /** SPDX expression of the upstream artwork's license. */
  readonly license: string;
  /** The license file in the package's `licenses/`. */
  readonly licenseFile: string;
  readonly variants: readonly Variant[];
  /** Reads the pinned upstream files; `cache` is for downloads. */
  load(cache: string): LoadedSource | Promise<LoadedSource>;
}

export const collections: readonly Collection[] = [
  {
    id: 'lucide',
    title: 'Lucide',
    description:
      'Clean, consistent stroke icons on a 24 px grid, a community fork of Feather.',
    homepage: 'https://lucide.dev',
    repository: 'https://github.com/lucide-icons/lucide',
    // Lucide is ISC; the icons it took from Feather are MIT.
    license: 'ISC AND MIT',
    licenseFile: 'lucide.txt',
    variants: [
      {
        id: 'default',
        title: 'Default',
        subpath: 'lucide',
        size: 24,
        stroke: true,
      },
    ],
    load: loadLucide,
  },
  {
    id: 'tabler',
    title: 'Tabler',
    description:
      'Thousands of 24 px stroke icons, with filled versions of many of them.',
    homepage: 'https://tabler.io/icons',
    repository: 'https://github.com/tabler/tabler-icons',
    license: 'MIT',
    licenseFile: 'tabler.txt',
    variants: [
      {
        id: 'outline',
        title: 'Outline',
        subpath: 'tabler',
        size: 24,
        stroke: true,
      },
      {
        id: 'filled',
        title: 'Filled',
        subpath: 'tabler/filled',
        size: 24,
        stroke: false,
      },
    ],
    load: loadTabler,
  },
  {
    id: 'phosphor',
    title: 'Phosphor',
    description:
      'A flexible family of icons in six weights, on a 256-unit grid.',
    homepage: 'https://phosphoricons.com',
    repository: 'https://github.com/phosphor-icons/core',
    license: 'MIT',
    licenseFile: 'phosphor.txt',
    // The weights are outlines of different thickness: none has a stroke
    // to set.
    variants: [
      {
        id: 'regular',
        title: 'Regular',
        subpath: 'phosphor',
        size: 24,
        stroke: false,
      },
      {
        id: 'thin',
        title: 'Thin',
        subpath: 'phosphor/thin',
        size: 24,
        stroke: false,
      },
      {
        id: 'light',
        title: 'Light',
        subpath: 'phosphor/light',
        size: 24,
        stroke: false,
      },
      {
        id: 'bold',
        title: 'Bold',
        subpath: 'phosphor/bold',
        size: 24,
        stroke: false,
      },
      {
        id: 'fill',
        title: 'Fill',
        subpath: 'phosphor/fill',
        size: 24,
        stroke: false,
      },
      {
        id: 'duotone',
        title: 'Duotone',
        subpath: 'phosphor/duotone',
        size: 24,
        stroke: false,
      },
    ],
    load: loadPhosphor,
  },
  {
    id: 'heroicons',
    title: 'Heroicons',
    description:
      'Hand-crafted icons from the makers of Tailwind CSS: outline, solid, mini and micro.',
    homepage: 'https://heroicons.com',
    repository: 'https://github.com/tailwindlabs/heroicons',
    license: 'MIT',
    licenseFile: 'heroicons.txt',
    variants: [
      {
        id: 'outline',
        title: 'Outline',
        subpath: 'heroicons',
        size: 24,
        stroke: true,
      },
      {
        id: 'solid',
        title: 'Solid',
        subpath: 'heroicons/solid',
        size: 24,
        stroke: false,
      },
      {
        id: 'mini',
        title: 'Mini (20 px)',
        subpath: 'heroicons/mini',
        size: 20,
        stroke: false,
      },
      {
        id: 'micro',
        title: 'Micro (16 px)',
        subpath: 'heroicons/micro',
        size: 16,
        stroke: false,
      },
    ],
    load: loadHeroicons,
  },
  {
    id: 'material',
    title: 'Material Symbols',
    description:
      "Google's Material Symbols in three styles, unfilled and filled, at weight 400.",
    homepage: 'https://fonts.google.com/icons',
    repository: `${MATERIAL_REPOSITORY.replace(/\.git$/, '')}/tree/${MATERIAL_COMMIT}`,
    license: 'Apache-2.0',
    licenseFile: 'material-symbols.txt',
    // Weight 400, grade 0, optical size 24: the other weights, grades and
    // sizes are not shipped (see the documentation).
    variants: [
      ['outlined', 'Outlined', 'material'],
      ['outlined-filled', 'Outlined, filled', 'material/filled'],
      ['rounded', 'Rounded', 'material/rounded'],
      ['rounded-filled', 'Rounded, filled', 'material/rounded/filled'],
      ['sharp', 'Sharp', 'material/sharp'],
      ['sharp-filled', 'Sharp, filled', 'material/sharp/filled'],
    ].map(([id, title, subpath]) => ({
      id: id!,
      title: title!,
      subpath: subpath!,
      size: 24,
      stroke: false,
      // The files leave fill unset, which is black; the icon font they come
      // from takes the text color.
      rootDefaults: { fill: 'currentColor' },
    })),
    load: loadMaterial,
  },
];
