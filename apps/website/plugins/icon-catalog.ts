/**
 * The gallery's data, from the catalog the generator writes
 * (packages/icons/catalog/*.json), as two virtual modules:
 *
 * - `virtual:icon-collections`: the collections and their variants, for the
 *   filters and the details panel; small, in the page's bundle.
 * - `virtual:icon-index`: every icon's name and search terms, compact; the
 *   gallery imports it once the page is interactive, as a chunk of its own.
 *
 * The icons themselves are drawn by @soundor/icons' browser implementation,
 * one chunk per variant, loaded when the gallery first shows that variant.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Plugin } from 'vite';

import type { CatalogCollection } from '../../../packages/icons/scripts/lib/output.ts';

const CATALOG = join(import.meta.dirname, '../../../packages/icons/catalog');
const ORDER = ['lucide', 'tabler', 'phosphor', 'heroicons', 'material'];

function read(): CatalogCollection[] {
  return readdirSync(CATALOG)
    .filter((file) => file.endsWith('.json'))
    .map(
      (file) =>
        JSON.parse(
          readFileSync(join(CATALOG, file), 'utf8'),
        ) as CatalogCollection,
    )
    .sort((a, b) => {
      const rank = (id: string) =>
        ORDER.includes(id) ? ORDER.indexOf(id) : ORDER.length;
      return rank(a.id) - rank(b.id) || (a.id < b.id ? -1 : 1);
    });
}

/** `PlayerPlay` → `player play`. */
function words(name: string): string {
  return name
    .replace(/^Icon(?=\d)/, '')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .toLowerCase();
}

export function iconCatalog(): Plugin {
  const ids = {
    collections: 'virtual:icon-collections',
    index: 'virtual:icon-index',
  };
  return {
    name: 'soundor-icons:catalog',
    resolveId(id) {
      return Object.values(ids).includes(id) ? `\0${id}` : null;
    },
    load(id) {
      if (id === `\0${ids.collections}`) {
        const collections = read().map(({ icons, ...collection }) => ({
          ...collection,
          total: icons.length,
        }));
        const loaders = collections
          .flatMap((collection) => collection.variants)
          .map(
            (variant) =>
              `  ${JSON.stringify(variant.subpath)}: () => import(${JSON.stringify(`@soundor/icons/${variant.subpath}`)}),`,
          )
          .join('\n');
        return (
          `export const collections = ${JSON.stringify(collections)};\n` +
          `export const loaders = {\n${loaders}\n};\n`
        );
      }
      if (id === `\0${ids.index}`) {
        // Per collection: [name, upstream, search terms, variants bitmask].
        const index = read().map((collection) => {
          const variants = collection.variants.map((variant) => variant.id);
          const all = (1 << variants.length) - 1;
          return {
            id: collection.id,
            icons: collection.icons.map((icon) => {
              const mask =
                icon.variants === undefined
                  ? all
                  : icon.variants.reduce(
                      (bits, variant) =>
                        bits | (1 << variants.indexOf(variant)),
                      0,
                    );
              const terms = [
                words(icon.name),
                icon.upstream.replace(/[-_]/g, ' '),
                ...(icon.tags ?? []),
                ...(icon.categories ?? []),
              ]
                .join(' ')
                .toLowerCase();
              return [
                icon.name,
                icon.upstream,
                [...new Set(terms.split(/\s+/))].join(' '),
                mask,
              ];
            }),
          };
        });
        return `export const index = ${JSON.stringify(index)};\n`;
      }
      return null;
    },
  };
}
