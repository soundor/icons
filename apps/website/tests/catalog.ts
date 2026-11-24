import { readdirSync, readFileSync } from 'node:fs';

import type { CatalogCollection } from '../../../packages/icons/scripts/lib/output.ts';

// Read the catalog generated before the website build, independently of the UI.
const directory = new URL('../../../packages/icons/catalog/', import.meta.url);
const collections = readdirSync(directory)
  .filter((file) => file.endsWith('.json'))
  .map(
    (file) =>
      JSON.parse(
        readFileSync(new URL(file, directory), 'utf8'),
      ) as CatalogCollection,
  );

export const totalIcons = collections.reduce(
  (total, collection) => total + collection.variants[0]!.count,
  0,
);

export function collectionCount(id: string, variant?: string): number {
  const collection = collections.find((item) => item.id === id);
  const info = variant
    ? collection?.variants.find((item) => item.id === variant)
    : collection?.variants[0];
  if (!info)
    throw new Error(`Missing catalog variant: ${id}/${variant ?? 'default'}`);
  return info.count;
}

export function iconCountLabel(count: number): string {
  return `${count.toLocaleString('en-US')} ${count === 1 ? 'icon' : 'icons'}`;
}
