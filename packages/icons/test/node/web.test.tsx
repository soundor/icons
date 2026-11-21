/** The browser implementation: React DOM `<svg>`, rendered to markup. */

import { Play } from '@soundor/icons/lucide';
import { Gear } from '@soundor/icons/phosphor';
import { PlayerPlay as PlayerPlayFilled } from '@soundor/icons/tabler/filled';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { createIcon } from '../../dist/web.js';
import { representative } from '../shared/representative';

describe('representative icons', () => {
  test.each(representative)('%s %s (%s)', async (subpath, name) => {
    const module = (await import(`@soundor/icons/${subpath}`)) as Record<
      string,
      ComponentType
    >;
    expect(module[name], `${subpath} ${name}`).toBeDefined();
    expect(
      renderToStaticMarkup(createElement(module[name]!)),
    ).toMatchSnapshot();
  });
});

test('an icon is an svg at its collection size, with its upstream presentation, hidden from assistive technology', () => {
  expect(renderToStaticMarkup(<Play />)).toBe(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"></path></svg>',
  );
});

test('size, width, height, color, strokeWidth and opacity', () => {
  const markup = renderToStaticMarkup(
    <Play
      size={32}
      height={16}
      color="#ff5a1f"
      strokeWidth={1.5}
      opacity={0.5}
    />,
  );
  expect(markup).toContain('width="32" height="16" viewBox="0 0 24 24"');
  expect(markup).toContain('stroke="currentColor" stroke-width="1.5"');
  expect(markup).toContain('color="#ff5a1f" opacity="0.5"');
});

test('a filled icon ignores a stroke width its types reject', () => {
  // @ts-expect-error: filled icons have no strokeWidth.
  const markup = renderToStaticMarkup(<PlayerPlayFilled strokeWidth={4} />);
  expect(markup).not.toContain('stroke-width');
});

test('a label makes the icon an image with that name', () => {
  expect(renderToStaticMarkup(<Gear label="Settings" />)).toContain(
    'role="img" aria-label="Settings"',
  );
});

test('groups, transforms and opacity render as nested elements', () => {
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
  expect(Icon.displayName).toBe('Grouped');
  expect(renderToStaticMarkup(<Icon />)).toBe(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><g transform="translate(2 2) rotate(45, 10, 10)" opacity="0.5"><circle cx="10" cy="10" r="4"></circle><rect x="2" y="2" width="4" height="4" fill-opacity="0.2"></rect></g></svg>',
  );
});
