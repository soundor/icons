/**
 * From collections to every file the generator owns: the modules of each
 * variant, the website's catalog, the licenses, the provenance record, the
 * third-party notices and the package's exports.
 */

import type { Collection, Variant } from '../collections.ts';
import type { LoadedSource } from '../sources/types.ts';
import { commonRoot, emitVariant, type EmittedIcon } from './emit.ts';
import { exportNames } from './naming.ts';
import { NOTES, normalizeIcon, type NoteCode } from './normalize.ts';
import { parseSvg } from './svg.ts';

/** One icon of a collection in the website's catalog. */
export interface CatalogIcon {
  /** The export name. */
  readonly name: string;
  /** The upstream name. */
  readonly upstream: string;
  /** The variants that have it, when not all do. */
  readonly variants?: readonly string[];
  readonly tags?: readonly string[];
  readonly categories?: readonly string[];
}

export interface CatalogCollection {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly homepage: string;
  readonly repository: string;
  readonly license: string;
  readonly licenseFile: string;
  readonly version: string;
  readonly variants: readonly {
    readonly id: string;
    readonly title: string;
    readonly subpath: string;
    readonly size: number;
    readonly stroke: boolean;
    /** The default stroke width of a stroked variant. */
    readonly strokeWidth?: number;
    readonly count: number;
  }[];
  readonly icons: readonly CatalogIcon[];
}

export interface ProvenanceVariant {
  readonly subpath: string;
  readonly icons: number;
  /** Normalizations applied, and to how many icons. */
  readonly notes: Readonly<Partial<Record<NoteCode, number>>>;
}

export interface Output {
  /** Paths relative to the package, and their contents. */
  readonly files: Record<string, string>;
  /** The package.json `exports`. */
  readonly exports: Record<string, unknown>;
  /** Every icon that could not be converted, with the reason. */
  readonly errors: readonly string[];
}

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

/** A catalog: readable, with one line per icon so upstream updates diff well. */
function catalogJson(catalog: CatalogCollection): string {
  const { icons, ...rest } = catalog;
  const head = JSON.stringify(rest, null, 2).slice(0, -2);
  return `${head},\n  "icons": [\n${icons.map((icon) => `    ${JSON.stringify(icon)}`).join(',\n')}\n  ]\n}\n`;
}

function header(
  collection: Collection,
  source: LoadedSource,
  variant: Variant,
) {
  return [
    `@soundor/icons: ${collection.title}, ${variant.title} (${source.origin}).`,
    `Converted from the upstream SVG files by scripts/generate.ts: the same`,
    `geometry, as JavaScript. ${collection.license}: see licenses/${collection.licenseFile}.`,
    `Generated: do not edit.`,
  ].join('\n');
}

/** Converts one variant, collecting errors rather than stopping at the first. */
function convertVariant(
  collection: Collection,
  variant: Variant,
  icons: LoadedSource['variants'][string],
  errors: string[],
) {
  const where = (name: string) => `${collection.id}/${variant.id} ${name}`;
  let names: Map<string, string>;
  try {
    names = exportNames(icons.map((icon) => icon.name));
  } catch (error) {
    errors.push(`${collection.id}/${variant.id}: ${(error as Error).message}`);
    return undefined;
  }
  const notes: Partial<Record<NoteCode, number>> = {};
  const emitted: EmittedIcon[] = [];
  for (const icon of icons) {
    try {
      const normalized = normalizeIcon(parseSvg(icon.svg), {
        size: variant.size,
        rootDefaults: variant.rootDefaults,
      });
      const width = normalized.root.presentation['strokeWidth'];
      const stroked =
        width !== undefined &&
        normalized.root.presentation['stroke'] !== 'none';
      if (stroked !== variant.stroke)
        throw new Error(
          variant.stroke
            ? 'the variant is stroked, but the icon sets no stroke width on its root'
            : 'the icon has a stroke width on its root, but its variant is not stroked',
        );
      if (
        variant.stroke &&
        JSON.stringify(normalized.nodes).includes('"strokeWidth"')
      )
        throw new Error(
          'an element sets its own stroke width, which the strokeWidth prop would not change',
        );
      for (const note of normalized.notes) notes[note] = (notes[note] ?? 0) + 1;
      emitted.push({
        name: names.get(icon.name)!,
        upstream: icon.name,
        root: normalized.root,
        nodes: normalized.nodes,
      });
    } catch (error) {
      errors.push(`${where(icon.name)}: ${(error as Error).message}`);
    }
  }
  emitted.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return { emitted, notes };
}

export async function buildOutput(
  collections: readonly Collection[],
  cache: string,
): Promise<Output> {
  const files: Record<string, string> = {};
  const exports: Record<string, unknown> = {};
  const errors: string[] = [];
  const provenance: unknown[] = [];
  const notices: string[] = [];

  for (const collection of collections) {
    const source = await collection.load(cache);
    const configured = collection.variants.map((variant) => variant.id).sort();
    const loaded = Object.keys(source.variants).sort();
    if (configured.join() !== loaded.join()) {
      errors.push(
        `${collection.id}: the source has variants ${loaded.join(', ')}, the configuration ${configured.join(', ')}`,
      );
      continue;
    }

    const licenseText = source.license.endsWith('\n')
      ? source.license
      : `${source.license}\n`;
    const catalog = new Map<
      string,
      { icon: CatalogIcon; variants: string[] }
    >();
    const variants: CatalogCollection['variants'][number][] = [];
    const provenanceVariants: ProvenanceVariant[] = [];
    for (const variant of collection.variants) {
      const icons = source.variants[variant.id]!;
      const converted = convertVariant(collection, variant, icons, errors);
      if (converted === undefined || converted.emitted.length === 0) continue;
      const { emitted, notes } = converted;
      const root = commonRoot(emitted);
      Object.assign(
        files,
        emitVariant(
          {
            header: header(collection, source, variant),
            subpath: variant.subpath,
            root,
            stroke: variant.stroke,
            title: collection.title,
          },
          emitted,
        ),
      );
      // Beside the variant's modules, the license file nearest to them: a
      // bundler that ships a build's notices (Soundor's) gives the icons the
      // collection's license, not the package's MIT.
      files[`generated/${variant.subpath}/LICENSE`] = licenseText;
      const dir = `./generated/${variant.subpath}`;
      exports[`./${variant.subpath}`] = {
        types: `${dir}/index.d.ts`,
        soundor: `${dir}/soundor.js`,
        default: `${dir}/web.js`,
      };
      variants.push({
        id: variant.id,
        title: variant.title,
        subpath: variant.subpath,
        size: variant.size,
        stroke: variant.stroke,
        ...(variant.stroke && {
          strokeWidth: Number(root.presentation['strokeWidth']),
        }),
        count: emitted.length,
      });
      provenanceVariants.push({
        subpath: variant.subpath,
        icons: emitted.length,
        notes: Object.fromEntries(Object.entries(notes).sort()),
      });
      const sourceIcons = new Map(icons.map((icon) => [icon.name, icon]));
      for (const icon of emitted) {
        const upstream = sourceIcons.get(icon.upstream)!;
        const entry = catalog.get(icon.name) ?? {
          icon: {
            name: icon.name,
            upstream: icon.upstream,
            ...(upstream.tags?.length && { tags: [...new Set(upstream.tags)] }),
            ...(upstream.categories?.length && {
              categories: [...new Set(upstream.categories)],
            }),
          },
          variants: [],
        };
        entry.variants.push(variant.id);
        catalog.set(icon.name, entry);
      }
    }

    const icons = [...catalog.values()]
      .sort((a, b) => (a.icon.name < b.icon.name ? -1 : 1))
      .map(({ icon, variants: present }) =>
        present.length === variants.length
          ? icon
          : { ...icon, variants: present },
      );
    files[`catalog/${collection.id}.json`] = catalogJson({
      id: collection.id,
      title: collection.title,
      description: collection.description,
      homepage: collection.homepage,
      repository: collection.repository,
      license: collection.license,
      licenseFile: collection.licenseFile,
      version: source.version,
      variants,
      icons,
    } satisfies CatalogCollection);
    files[`licenses/${collection.licenseFile}`] = licenseText;
    provenance.push({
      id: collection.id,
      title: collection.title,
      origin: source.origin,
      version: source.version,
      license: collection.license,
      licenseFile: `licenses/${collection.licenseFile}`,
      homepage: collection.homepage,
      variants: provenanceVariants,
    });
    notices.push(
      `## ${collection.title}\n\n` +
        `- Source: \`${source.origin}\` (${collection.repository})\n` +
        `- License: ${collection.license}, in [\`licenses/${collection.licenseFile}\`](licenses/${collection.licenseFile})\n` +
        `- Subpaths: ${variants.map((variant) => `\`@soundor/icons/${variant.subpath}\``).join(', ')}\n`,
    );
  }

  files['generated/provenance.json'] = json({
    generator: 'scripts/generate.ts',
    notes: NOTES,
    collections: provenance,
  });
  files['THIRD_PARTY_NOTICES.md'] =
    `# Third-party notices\n\n` +
    `The icons in this package are artwork from the open-source projects below,\n` +
    `converted from their SVG files to JavaScript modules for Soundor and React\n` +
    `DOM. The conversion keeps each icon's geometry and changes its file format.\n` +
    `Each collection stays under its own license, whose full text is in\n` +
    `\`licenses/\`, and beside each subpath's modules as \`generated/<subpath>/LICENSE\`;\n` +
    `the MIT license in \`LICENSE\` covers Soundor Icons' own code (\`dist/\` and\n` +
    `the generator), not the artwork.\n\n` +
    `Exact versions, and the normalizations the conversion applied, are in\n` +
    `\`generated/provenance.json\`.\n\n` +
    notices.join('\n');
  return { files, exports, errors };
}
