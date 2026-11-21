import { expect, test } from 'vitest';

import { exportName, exportNames } from './naming.ts';

test.each([
  ['play', 'Play'],
  ['player-play', 'PlayerPlay'],
  ['play_arrow', 'PlayArrow'],
  ['a-b-2', 'AB2'],
  ['arrow-left', 'ArrowLeft'],
  ['24-hours', 'Icon24Hours'],
  ['10k', 'Icon10k'],
  ['3d_rotation', 'Icon3dRotation'],
])('%s is exported as %s', (upstream, name) => {
  expect(exportName(upstream)).toBe(name);
});

test('names outside letters, digits, - and _ fail', () => {
  expect(() => exportName('play arrow')).toThrow('not a name');
  expect(() => exportName('-play')).toThrow('not a name');
});

test('two names that would share an export fail, naming both', () => {
  expect(() => exportNames(['arrow-up', 'arrow_up'])).toThrow(
    '"arrow-up" and "arrow_up" would both be exported as ArrowUp',
  );
});

test('a name that would clash with a type of the module fails', () => {
  expect(() => exportNames(['icon-props'])).toThrow('a type of the module');
});
