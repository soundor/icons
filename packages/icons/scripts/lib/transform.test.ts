import { expect, test } from 'vitest';

import { validateTransform } from './transform.ts';

test.each([
  'translate(10 20)',
  'translate(10)',
  'rotate(90) scale(2)',
  'rotate(45, 12, 12)',
  'matrix(1 0 0 1 0 0)',
  'skewX(10),skewY(-5)',
])('accepts %s', (value) => {
  expect(() => validateTransform(value)).not.toThrow();
});

test.each([
  ['', 'empty transform'],
  ['rotate(45deg)', 'invalid arguments to rotate()'],
  ['scale(1 2 3)', 'invalid arguments to scale()'],
  ['perspective(1)', 'unsupported transform function'],
  ['translate(1', 'invalid transform'],
])('rejects %j', (value, message) => {
  expect(() => validateTransform(value)).toThrow(message);
});
