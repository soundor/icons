/**
 * Validates SVG path data against the SVG 1.1 grammar, as Soundor's native
 * parser (Skia's) and browsers read it: commands, argument counts, arc flags
 * (also unseparated, as in `a1 1 0 011 1`). A browser draws a path up to its
 * first error; Soundor rejects the whole path, so the generator must too.
 */

const ARGUMENTS: Readonly<Record<string, number>> = {
  m: 2,
  l: 2,
  h: 1,
  v: 1,
  c: 6,
  s: 4,
  q: 4,
  t: 2,
  a: 7,
  z: 0,
};

const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;

export interface PathDataSummary {
  /** Commands, counting implicit repeats. */
  readonly segments: number;
  /** Numbers in the data. */
  readonly numbers: number;
}

/** Returns a summary, or throws an Error naming the problem and its offset. */
export function validatePathData(d: string): PathDataSummary {
  let at = 0;
  let segments = 0;
  let numbers = 0;
  const fail = (message: string): never => {
    throw new Error(
      `invalid path data at offset ${at}: ${message} in "${d.slice(Math.max(0, at - 12), at + 12)}"`,
    );
  };
  const skip = (comma: boolean) => {
    while (at < d.length && /[\s,]/.test(d[at]!)) {
      if (d[at] === ',' && !comma) fail('unexpected comma');
      at++;
    }
  };
  const number = () => {
    const match = NUMBER.exec(d.slice(at));
    if (match === null) fail('expected a number');
    const value = Number(match![0]);
    if (!Number.isFinite(value) || Math.abs(value) > 1e6)
      fail('number out of range');
    at += match![0].length;
    numbers++;
  };
  const flag = () => {
    if (d[at] !== '0' && d[at] !== '1') fail('expected an arc flag (0 or 1)');
    at++;
    numbers++;
  };
  skip(false);
  if (at < d.length && d[at] !== 'M' && d[at] !== 'm')
    fail('path data must start with a moveto');
  while (at < d.length) {
    const command = d[at]!;
    const count = ARGUMENTS[command.toLowerCase()];
    if (count === undefined) fail(`unknown command "${command}"`);
    at++;
    let repeats = 0;
    do {
      skip(repeats > 0);
      for (let index = 0; index < count!; index++) {
        if (index > 0) skip(true);
        if (command.toLowerCase() === 'a' && (index === 3 || index === 4))
          flag();
        else number();
      }
      repeats++;
      segments++;
      skip(true);
    } while (count! > 0 && at < d.length && /[\d.+-]/.test(d[at]!));
    skip(false);
  }
  if (segments === 0) fail('empty path data');
  return { segments, numbers };
}
