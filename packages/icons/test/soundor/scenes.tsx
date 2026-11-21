/**
 * Every icon of every variant, rendered by the Soundor implementation in
 * Soundor's test runtime. The runtime validates each native scene as the
 * engine does (path grammar, paints, numbers, limits), and the test compares
 * the scene with the generated model: the geometry Soundor receives is the
 * geometry the generator wrote.
 */

import { View } from '@soundor/react';
import type { TestNode } from '@soundor/test-runtime';
import { render } from '@soundor/testing-library/react';
import type { ComponentType } from 'react';
import { root } from 'soundor:ui';
import { describe, expect, test } from 'vitest';

import { loadNodes, variants } from '../shared/variants';

type Model = readonly [
  string,
  Record<string, string | number>,
  (readonly Model[])?,
];

// The runtime keeps numbers as 32-bit floats, as the native engine does.
const float = (value: string | number) =>
  typeof value === 'number' ? Math.fround(value) : value;

/** The scene @soundor/react/svg makes of a model node. */
function expected([tag, attributes, children]: Model): unknown {
  const geometry: Record<string, unknown> = {};
  const presentation: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(attributes)) {
    if (name === 'points')
      geometry[name] = String(value)
        .split(/[\s,]+/)
        .map((point) => Math.fround(Number(point)));
    else if (
      [
        'd',
        'cx',
        'cy',
        'r',
        'x',
        'y',
        'width',
        'height',
        'rx',
        'ry',
        'x1',
        'y1',
        'x2',
        'y2',
      ].includes(name)
    )
      geometry[name] = float(value);
    else presentation[name] = float(value);
  }
  return {
    type: tag,
    ...geometry,
    ...(Object.keys(presentation).length > 0 && { presentation }),
    ...(children && { children: children.map(expected) }),
  };
}

const BATCH = 400;

/**
 * Tests one collection's variants. Each collection has a test file of its
 * own, so Vitest releases one collection's modules before loading the next.
 */
export function testScenes(collection: string): void {
  describe.each(
    variants.filter((variant) => variant.collection === collection),
  )('$subpath', ({ subpath, icons }) => {
    test(`renders all ${icons} icons as valid native scenes of the generated geometry`, async () => {
      const module = (await import(`@soundor/icons/${subpath}`)) as Record<
        string,
        ComponentType<{ color?: string }> & { displayName: string }
      >;
      const nodes = await loadNodes(subpath);
      const names = Object.keys(nodes).sort();
      expect(names).toHaveLength(icons);
      for (let start = 0; start < names.length; start += BATCH) {
        const batch = names.slice(start, start + BATCH);
        const { unmount } = await render(
          <View>
            {batch.map((name) => {
              const Icon = module[name]!;
              return <Icon key={name} color="#ff5a1f" />;
            })}
          </View>,
          { container: root },
        );
        const svgs = (root.children[0] as unknown as TestNode).children;
        batch.forEach((name, index) => {
          const svg = svgs[index]!;
          expect(svg.type).toBe('svg');
          expect(module[name]!.displayName).toBe(name);
          const scene = svg.svgScene!;
          expect(scene.presentation?.color).toBe('#ff5a1f');
          expect(scene.children, `${subpath} ${name}`).toEqual(
            nodes[name]!.map((node) => expected(node as Model)),
          );
        });
        await unmount();
      }
    });
  });
}
