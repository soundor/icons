import { describe, expect, test } from 'vitest';

import { validatePathData } from './path-data.ts';

describe('validatePathData', () => {
  test.each([
    ['M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998z', 4, 11],
    // Arc flags without separators, as Lucide writes them.
    ['M10 50A10 10 0 0110 70', 2, 9],
    ['m14 12 4 4 4-4', 3, 6],
    ['M0,0L1,1,2,2Z', 4, 6],
    ['M.5.5h-1e2v1.5e-3', 3, 4],
    ['M1 2C3 4 5 6 7 8S9 10 11 12Q13 14 15 16T17 18', 5, 18],
  ])('accepts %s', (d, segments, numbers) => {
    expect(validatePathData(d)).toEqual({ segments, numbers });
  });

  test.each([
    ['', 'empty path data'],
    ['L1 1', 'must start with a moveto'],
    ['M1', 'expected a number'],
    ['M1 1 X2', 'unknown command "X"'],
    ['M0 0A1 1 0 2 0 3 3', 'expected an arc flag'],
    ['M,1 1', 'unexpected comma'],
    ['M0 0L1e9 0', 'out of range'],
  ])('rejects %j', (d, message) => {
    expect(() => validatePathData(d)).toThrow(message);
  });
});
