/**
 * The UI bundle the Soundor CLI wrote (`soundor build web`, with its own
 * bundler and the soundor condition): native SVG primitives for the imported
 * icons, and nothing else from @soundor/icons.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

const bundle = readFileSync(
  join(import.meta.dirname, '.soundor/ui/production/bundle.mjs'),
  'utf8',
);

const IMPORTED = ['Play', 'Pause', 'PlayerPlay', 'Gear', 'VolumeUp'];
const UNUSED = ['SkipForward', 'PlayerPause', 'GearSix', 'VolumeOff', 'Rewind'];

test('the Soundor implementation is selected', () => {
  expect(bundle.includes('soundor-svg-path')).toBe(true);
  // The browser implementation's root: absent.
  expect(bundle.includes('http://www.w3.org/2000/svg')).toBe(false);
});

test('only the imported icons are bundled', () => {
  const has = (name: string) => new RegExp(`["'\`]${name}["'\`]`).test(bundle);
  for (const name of IMPORTED) expect(has(name), name).toBe(true);
  for (const name of UNUSED) expect(has(name), name).toBe(false);
  expect(bundle.length).toBeLessThan(220_000);
});
