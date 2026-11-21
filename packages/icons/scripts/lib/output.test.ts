import { describe, expect, test } from 'vitest';

import type { Collection } from '../collections.ts';
import type { LoadedSource } from '../sources/types.ts';
import { buildOutput, type CatalogCollection } from './output.ts';

const stroke = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${body}</svg>`;
const fill = (body: string, viewBox = '0 0 24 24') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="currentColor">${body}</svg>`;

function fixture(variants: LoadedSource['variants']): Collection {
  return {
    id: 'demo',
    title: 'Demo',
    description: 'A fixture.',
    homepage: 'https://example.com',
    repository: 'https://example.com/repo',
    license: 'MIT',
    licenseFile: 'demo.txt',
    variants: [
      {
        id: 'outline',
        title: 'Outline',
        subpath: 'demo',
        size: 24,
        stroke: true,
      },
      {
        id: 'filled',
        title: 'Filled',
        subpath: 'demo/filled',
        size: 24,
        stroke: false,
      },
    ],
    load: () => ({
      version: '1.2.3',
      origin: 'npm:demo@1.2.3',
      license: 'MIT License\n\nCopyright (c) Demo',
      variants,
    }),
  };
}

const demo = fixture({
  outline: [
    {
      name: 'player-play',
      svg: stroke('<path d="M7 4v16l13 -8z"/>'),
      tags: ['start', 'media'],
    },
    {
      name: '24-hours',
      svg: stroke(
        '<g transform="rotate(90 12 12)"><circle cx="12" cy="12" r="9"/></g>',
      ),
    },
  ],
  filled: [
    {
      name: 'player-play',
      svg: fill('<path d="M6 4v16z"/>'),
      tags: ['start', 'media'],
    },
  ],
});

describe('buildOutput', () => {
  test('writes both renderers over one set of nodes, per variant subpath', async () => {
    const { files, errors } = await buildOutput([demo], '/nowhere');
    expect(errors).toEqual([]);
    expect(Object.keys(files).sort()).toEqual([
      'THIRD_PARTY_NOTICES.md',
      'catalog/demo.json',
      'generated/demo/filled/index.d.ts',
      'generated/demo/filled/nodes.js',
      'generated/demo/filled/soundor.js',
      'generated/demo/filled/web.js',
      'generated/demo/index.d.ts',
      'generated/demo/nodes.js',
      'generated/demo/soundor.js',
      'generated/demo/web.js',
      'generated/provenance.json',
      'licenses/demo.txt',
    ]);
    const nodes = files['generated/demo/nodes.js']!;
    expect(nodes).toContain(
      'export const Icon24Hours=[["g",{transform:"rotate(90 12 12)"},[["circle",{cx:12,cy:12,r:9}]]]];\n',
    );
    expect(nodes).toContain(
      'export const PlayerPlay=[["path",{d:"M7 4v16l13 -8z"}]];\n',
    );
    // Sorted by export name.
    expect(nodes.indexOf('Icon24Hours')).toBeLessThan(
      nodes.indexOf('PlayerPlay'),
    );

    const web = files['generated/demo/web.js']!;
    const soundor = files['generated/demo/soundor.js']!;
    expect(web).toContain(
      'import { createIcon as c } from "../../dist/web.js";',
    );
    expect(soundor).toContain(
      'import { createIcon as c } from "../../dist/soundor.js";',
    );
    expect(files['generated/demo/filled/web.js']).toContain(
      'from "../../../dist/web.js"',
    );
    for (const barrel of [web, soundor])
      expect(barrel).toContain(
        'export const PlayerPlay=/* @__PURE__ */c("PlayerPlay",r,n.PlayerPlay);',
      );
    // The barrels differ in their renderer only.
    expect(web.replace('web.js', 'soundor.js')).toBe(soundor);

    expect(files['generated/demo/index.d.ts']).toContain(
      '/** Demo `player-play` */\nexport declare const PlayerPlay: StrokeIcon;',
    );
    expect(files['generated/demo/filled/index.d.ts']).toContain(
      'export declare const PlayerPlay: FillIcon;',
    );
    expect(files['licenses/demo.txt']).toBe(
      'MIT License\n\nCopyright (c) Demo\n',
    );
  });

  test('exports each variant with the soundor condition before the default', async () => {
    const { exports } = await buildOutput([demo], '/nowhere');
    expect(exports).toEqual({
      './demo': {
        types: './generated/demo/index.d.ts',
        soundor: './generated/demo/soundor.js',
        default: './generated/demo/web.js',
      },
      './demo/filled': {
        types: './generated/demo/filled/index.d.ts',
        soundor: './generated/demo/filled/soundor.js',
        default: './generated/demo/filled/web.js',
      },
    });
    expect(Object.keys(exports['./demo'] as object)).toEqual([
      'types',
      'soundor',
      'default',
    ]);
  });

  test('writes a complete catalog: names, variants each icon is in, tags', async () => {
    const { files } = await buildOutput([demo], '/nowhere');
    const catalog = JSON.parse(
      files['catalog/demo.json']!,
    ) as CatalogCollection;
    expect(catalog).toMatchObject({
      id: 'demo',
      version: '1.2.3',
      license: 'MIT',
      variants: [
        { id: 'outline', subpath: 'demo', count: 2, stroke: true },
        { id: 'filled', subpath: 'demo/filled', count: 1, stroke: false },
      ],
    });
    expect(catalog.icons).toEqual([
      { name: 'Icon24Hours', upstream: '24-hours', variants: ['outline'] },
      { name: 'PlayerPlay', upstream: 'player-play', tags: ['start', 'media'] },
    ]);
  });

  test('is deterministic', async () => {
    const first = await buildOutput([demo], '/nowhere');
    const second = await buildOutput([demo], '/nowhere');
    expect(second).toEqual(first);
  });

  test("writes a root shared by most icons once, and an icon's own root inline", async () => {
    const collection = fixture({
      outline: [{ name: 'a', svg: stroke('<path d="M0 0h1"/>') }],
      filled: [
        { name: 'a', svg: fill('<path d="M0 0h1"/>') },
        { name: 'b', svg: fill('<path d="M0 0h1"/>') },
        { name: 'c', svg: fill('<path d="M0 0h1"/>', '0 96 960 960') },
      ],
    });
    const { files } = await buildOutput([collection], '/nowhere');
    const web = files['generated/demo/filled/web.js']!;
    expect(web).toContain(
      'const r={viewBox:"0 0 24 24",size:24,presentation:{fill:"currentColor"}};',
    );
    expect(web).toContain('export const B=/* @__PURE__ */c("B",r,n.B);');
    expect(web).toContain(
      'export const C=/* @__PURE__ */c("C",{viewBox:"0 96 960 960",size:24,presentation:{fill:"currentColor"}},n.C);',
    );
  });

  test('reports every icon it cannot convert, with collection, variant and name', async () => {
    const collection = fixture({
      outline: [
        { name: 'masked', svg: stroke('<mask id="m"/><path d="M0 0h1"/>') },
        { name: 'thick', svg: stroke('<path d="M0 0h1" stroke-width="3"/>') },
      ],
      filled: [
        { name: 'stroked', svg: stroke('<path d="M0 0h1"/>') },
        { name: 'ok', svg: fill('<path d="M0 0h1"/>') },
      ],
    });
    const { errors } = await buildOutput([collection], '/nowhere');
    expect(errors).toEqual([
      'demo/outline masked: <svg>[0] > <mask>: masks are not supported by Soundor SVG',
      'demo/outline thick: an element sets its own stroke width, which the strokeWidth prop would not change',
      'demo/filled stroked: the icon has a stroke width on its root, but its variant is not stroked',
    ]);
  });

  test('fails when the source and the configuration disagree on variants', async () => {
    const collection = fixture({ outline: [] });
    const { errors } = await buildOutput([collection], '/nowhere');
    expect(errors).toEqual([
      'demo: the source has variants outline, the configuration filled, outline',
    ]);
  });
});
