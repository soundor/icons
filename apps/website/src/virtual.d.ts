// The modules plugins/icon-catalog.ts provides.

declare module 'virtual:icon-collections' {
  import type { ComponentType } from 'react';

  export interface VariantInfo {
    readonly id: string;
    readonly title: string;
    readonly subpath: string;
    readonly size: number;
    readonly stroke: boolean;
    readonly strokeWidth?: number;
    readonly count: number;
  }
  export interface CollectionInfo {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly homepage: string;
    readonly repository: string;
    readonly license: string;
    readonly licenseFile: string;
    readonly version: string;
    readonly total: number;
    readonly variants: readonly VariantInfo[];
  }
  export type IconModule = Record<
    string,
    ComponentType<Record<string, unknown>>
  >;
  export const collections: readonly CollectionInfo[];
  export const loaders: Readonly<Record<string, () => Promise<IconModule>>>;
}

declare module 'virtual:icon-index' {
  /** [export name, upstream name, search terms, variants bitmask]. */
  export type IndexIcon = readonly [string, string, string, number];
  export const index: readonly {
    readonly id: string;
    readonly icons: readonly IndexIcon[];
  }[];
}
