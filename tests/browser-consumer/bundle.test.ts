/**
 * The Vite build of src/: React DOM `<svg>` for the imported icons, and
 * nothing else from @soundor/icons.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

const assets = join(import.meta.dirname, 'dist/assets');
const bundle = readdirSync(assets)
  .filter((file) => file.endsWith('.js'))
  .map((file) => readFileSync(join(assets, file), 'utf8'))
  .join('\n');

const IMPORTED = ['Play', 'Pause', 'PlayerPlay', 'Gear', 'VolumeUp'];
// Icons of the same modules that src/ does not import.
const UNUSED = ['SkipForward', 'PlayerPause', 'GearSix', 'VolumeOff', 'Rewind'];

test('the browser implementation is selected', () => {
  expect(bundle.includes('http://www.w3.org/2000/svg')).toBe(true);
  // @soundor/react/svg's host types: the Soundor implementation is absent.
  expect(bundle.includes('soundor-svg')).toBe(false);
  expect(bundle.includes('@soundor/react')).toBe(false);
});

test('only the imported icons are bundled', () => {
  const has = (name: string) => new RegExp(`["'\`]${name}["'\`]`).test(bundle);
  for (const name of IMPORTED) expect(has(name), name).toBe(true);
  for (const name of UNUSED) expect(has(name), name).toBe(false);
  // React DOM is most of it; the icons are a few kilobytes.
  expect(bundle.length).toBeLessThan(260_000);
});

test('uses the same source file as the Soundor consumer', () => {
  expect(
    readFileSync(join(import.meta.dirname, 'src/toolbar.tsx'), 'utf8'),
  ).toBe(
    readFileSync(
      join(import.meta.dirname, '../soundor-consumer/src/toolbar.tsx'),
      'utf8',
    ),
  );
});
