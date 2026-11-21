/** Representative icons as the native scenes Soundor draws, snapshotted. */

import { G, Svg } from '@soundor/react/svg';
import type { TestNode } from '@soundor/test-runtime';
import { render } from '@soundor/testing-library/react';
import type { ComponentType } from 'react';
import { root } from 'soundor:ui';
import { expect, test } from 'vitest';

import { createIcon } from '../../dist/soundor.js';
import { representative } from '../shared/representative';

test.each(representative)('%s %s (%s)', async (subpath, name) => {
  const module = (await import(`@soundor/icons/${subpath}`)) as Record<
    string,
    ComponentType
  >;
  const Icon = module[name]!;
  await render(<Icon />, { container: root });
  expect((root.children[0] as unknown as TestNode).svgScene).toMatchSnapshot();
});

test('groups, transforms and opacity become a nested native scene', async () => {
  const Icon = createIcon(
    'Grouped',
    { viewBox: '0 0 24 24', size: 24, presentation: { fill: 'currentColor' } },
    [
      [
        'g',
        { transform: 'translate(2 2) rotate(45, 10, 10)', opacity: 0.5 },
        [
          ['circle', { cx: 10, cy: 10, r: 4 }],
          ['rect', { x: 2, y: 2, width: 4, height: 4, fillOpacity: 0.2 }],
        ],
      ],
    ],
  );
  await render(<Icon />, { container: root });
  const scene = (root.children[0] as unknown as TestNode).svgScene!;
  const group = scene.children[0]!;
  expect(group).toMatchObject({
    type: 'g',
    presentation: { opacity: 0.5 },
    children: [
      { type: 'circle', cx: 10, cy: 10, r: 4 },
      {
        type: 'rect',
        x: 2,
        y: 2,
        width: 4,
        height: 4,
        presentation: { fillOpacity: Math.fround(0.2) },
      },
    ],
  });
  // The same scene as the primitives written by hand.
  await render(
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor">
      <G transform="translate(2 2) rotate(45, 10, 10)" opacity={0.5}>
        {null}
      </G>
    </Svg>,
    { container: root },
  );
  const handwritten = (root.children[0] as unknown as TestNode).svgScene!;
  expect(
    (handwritten.children[0] as { presentation?: unknown }).presentation,
  ).toEqual((group as { presentation?: unknown }).presentation);
});
