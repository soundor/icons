/**
 * Validates an SVG transform list in the grammar `@soundor/react/svg` parses
 * (matrix, translate, scale, rotate, skewX, skewY; angles in degrees, no
 * units), which browsers accept too.
 */

const ARGUMENTS: Readonly<Record<string, readonly number[]>> = {
  matrix: [6],
  translate: [1, 2],
  scale: [1, 2],
  rotate: [1, 3],
  skewX: [1],
  skewY: [1],
};
const NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

export function validateTransform(value: string): void {
  let rest = value.trim();
  if (rest === '') throw new Error('empty transform');
  while (rest !== '') {
    const match = /^([a-zA-Z]+)\s*\(([^()]*)\)\s*,?\s*/.exec(rest);
    if (match === null) throw new Error(`invalid transform "${value}"`);
    const [, name, list] = match;
    const counts = ARGUMENTS[name!];
    if (counts === undefined)
      throw new Error(`unsupported transform function "${name}"`);
    const args = list!
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean);
    if (!counts.includes(args.length) || !args.every((arg) => NUMBER.test(arg)))
      throw new Error(`invalid arguments to ${name}() in "${value}"`);
    rest = rest.slice(match[0].length);
  }
}
