/** The shared icon props, as the Soundor implementation applies them. */

import { AcademicCap as MicroCap } from '@soundor/icons/heroicons/micro';
import { Play } from '@soundor/icons/lucide';
import { Gear } from '@soundor/icons/phosphor';
import { PlayerPlay } from '@soundor/icons/tabler';
import { PlayerPlay as PlayerPlayFilled } from '@soundor/icons/tabler/filled';
import type { TestNode } from '@soundor/test-runtime';
import { render } from '@soundor/testing-library/react';
import type { ReactElement } from 'react';
import { root } from 'soundor:ui';
import { expect, test } from 'vitest';

async function mount(element: ReactElement): Promise<TestNode> {
  await render(element, { container: root });
  return root.children[0] as unknown as TestNode;
}

test('an icon is one native svg node at its collection size, with its upstream presentation', async () => {
  const svg = await mount(<Play />);
  expect(svg.type).toBe('svg');
  expect(svg.children).toEqual([]);
  expect(svg.style).toMatchObject({ width: 24, height: 24 });
  expect(svg.svgScene).toMatchObject({
    viewBox: [0, 0, 24, 24],
    presentation: {
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
  });
  // No color: Soundor has no CSS to inherit one from (currentColor is black).
  expect(svg.svgScene?.presentation).not.toHaveProperty('color');
});

test('size, width and height set the layout size; the viewBox keeps the geometry', async () => {
  expect((await mount(<Gear size={48} />)).style).toMatchObject({
    width: 48,
    height: 48,
  });
  const svg = await mount(<Gear size={48} width={32} />);
  expect(svg.style).toMatchObject({ width: 32, height: 48 });
  expect(svg.svgScene?.viewBox).toEqual([0, 0, 256, 256]);
  expect((await mount(<MicroCap />)).style).toMatchObject({
    width: 16,
    height: 16,
  });
});

test('color, strokeWidth and opacity are root presentation', async () => {
  const svg = await mount(
    <PlayerPlay color="#ff5a1f" strokeWidth={1.5} opacity={0.5} />,
  );
  expect(svg.svgScene?.presentation).toMatchObject({
    stroke: 'currentColor',
    color: '#ff5a1f',
    strokeWidth: 1.5,
    opacity: 0.5,
  });
});

test('a filled icon ignores a stroke width its types reject', async () => {
  // @ts-expect-error: filled icons have no strokeWidth.
  const svg = await mount(<PlayerPlayFilled strokeWidth={4} />);
  expect(svg.svgScene?.presentation).toEqual({ fill: 'currentColor' });
});

test('a label makes the icon an image with that name; without one it is not perceived', async () => {
  const labelled = await mount(<Play label="Play" />);
  expect(labelled.accessibility).toMatchObject({
    role: 'image',
    label: 'Play',
  });
  const decorative = await mount(<Play />);
  expect(decorative.accessibility.role).toBeUndefined();
  expect(decorative.accessibility.label).toBeUndefined();
});

test('instances share their elements and re-render with new props', async () => {
  const { rerender } = await render(<Play color="#fff" />, { container: root });
  const svg = root.children[0] as unknown as TestNode;
  await rerender(<Play color="#000" />);
  expect(root.children[0]).toBe(svg);
  expect(svg.svgScene?.presentation?.color).toBe('#000');
});
