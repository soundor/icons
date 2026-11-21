/** The generated variants, as the generator recorded them. */

import provenance from '../../generated/provenance.json' with { type: 'json' };

export interface VariantInfo {
  readonly collection: string;
  readonly subpath: string;
  readonly icons: number;
}

export const variants: readonly VariantInfo[] = provenance.collections.flatMap(
  (collection) =>
    collection.variants.map((variant) => ({
      collection: collection.id,
      subpath: variant.subpath,
      icons: variant.icons,
    })),
);

export type Nodes = Record<
  string,
  readonly (readonly [string, Record<string, string | number>, unknown?])[]
>;

/** A variant's normalized nodes, the data both renderers draw. */
export function loadNodes(subpath: string): Promise<Nodes> {
  const path = `../../generated/${subpath}/nodes.js`;
  return import(/* @vite-ignore */ path) as Promise<Nodes>;
}
