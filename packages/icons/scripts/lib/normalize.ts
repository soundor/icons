/**
 * Turns a parsed upstream SVG into the normalized model (src/model.ts) that
 * both renderers draw from, or fails with a diagnostic naming the icon.
 *
 * Only what Soundor's native SVG renders the same as a browser passes
 * through. Everything else is either a documented no-op that is dropped and
 * counted (see NOTES), or an error: nothing is discarded silently, and no
 * shape is approximated.
 */

import type {
  IconAttributes,
  IconNode,
  IconRoot,
  IconTag,
} from '../../src/model.ts';
import { validatePathData } from './path-data.ts';
import type { SvgElement } from './svg.ts';
import { validateTransform } from './transform.ts';

/** What a normalization may drop or add, with the reason it is safe. */
export const NOTES = {
  'invisible-element':
    'An element with neither fill nor stroke paints nothing (Tabler draws one as a bounding box).',
  'clip-rule':
    'clip-rule only applies inside <clipPath>, which these icons do not use.',
  'inert-attribute':
    'class, id and data-* attributes do not render: icons have no stylesheet and nothing references them.',
  'non-rendering-element':
    '<title>, <desc> and <metadata> do not render; the label prop names an icon.',
  'derived-viewbox':
    'The file has no viewBox: its coordinate system is its width and height, so the viewBox is 0 0 width height.',
  'default-fill':
    'The file leaves fill unset (black); the collection sets fill="currentColor" on the root so the color prop applies.',
  'empty-group': 'A group left with no children paints nothing.',
} as const;

export type NoteCode = keyof typeof NOTES;

export interface NormalizeOptions {
  /** The size the variant draws at; a root width or height must match. */
  readonly size: number;
  /** Root presentation for attributes the file leaves unset. */
  readonly rootDefaults?: IconAttributes;
}

export interface NormalizedIcon {
  readonly root: IconRoot;
  readonly nodes: readonly IconNode[];
  readonly notes: ReadonlySet<NoteCode>;
}

export class UnsupportedSvgError extends Error {
  override name = 'UnsupportedSvgError';
}

const SHAPES: Readonly<Record<string, readonly string[]>> = {
  path: ['d'],
  circle: ['cx', 'cy', 'r'],
  rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  line: ['x1', 'y1', 'x2', 'y2'],
  polygon: ['points'],
  polyline: ['points'],
};

const NON_NEGATIVE = new Set(['r', 'width', 'height', 'rx', 'ry']);

/** Why an element cannot be converted, for a useful diagnostic. */
const UNSUPPORTED: Readonly<Record<string, string>> = {
  defs: 'definitions (<defs>) are not supported by Soundor SVG',
  clipPath: 'clipping paths are not supported by Soundor SVG',
  mask: 'masks are not supported by Soundor SVG',
  linearGradient: 'gradients are not supported by Soundor SVG',
  radialGradient: 'gradients are not supported by Soundor SVG',
  pattern: 'patterns are not supported by Soundor SVG',
  filter: 'filters are not supported by Soundor SVG',
  use: '<use> references are not supported by Soundor SVG',
  symbol: '<symbol> is not supported by Soundor SVG',
  marker: 'markers are not supported by Soundor SVG',
  text: 'SVG text is not supported by Soundor SVG',
  image: 'embedded images are not supported by Soundor SVG',
  style: 'stylesheets are not supported by Soundor SVG',
  foreignObject: '<foreignObject> is not supported by Soundor SVG',
};

const NON_RENDERING = new Set(['title', 'desc', 'metadata']);

type Presentation = (value: string) => string | number;

const enumeration =
  (...values: string[]): Presentation =>
  (value) => {
    if (!values.includes(value))
      throw new Error(`"${value}" is not one of ${values.join(', ')}`);
    return value;
  };

const PRESENTATION: Readonly<Record<string, [string, Presentation]>> = {
  fill: ['fill', paint],
  stroke: ['stroke', paint],
  'stroke-width': ['strokeWidth', (value) => length(value, true)],
  'stroke-linecap': ['strokeLinecap', enumeration('butt', 'round', 'square')],
  'stroke-linejoin': ['strokeLinejoin', enumeration('miter', 'round', 'bevel')],
  'stroke-miterlimit': [
    'strokeMiterlimit',
    (value) => {
      const limit = length(value);
      if (limit < 1) throw new Error('stroke-miterlimit below 1');
      return limit;
    },
  ],
  'stroke-dasharray': [
    'strokeDasharray',
    (value) => (value === 'none' ? value : numberList(value, false)),
  ],
  'stroke-dashoffset': ['strokeDashoffset', (value) => length(value)],
  'fill-rule': ['fillRule', enumeration('nonzero', 'evenodd')],
  opacity: ['opacity', opacity],
  'fill-opacity': ['fillOpacity', opacity],
  'stroke-opacity': ['strokeOpacity', opacity],
  transform: [
    'transform',
    (value) => {
      validateTransform(value);
      return value.trim().replace(/\s+/g, ' ');
    },
  ],
};

const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

function length(value: string, nonNegative = false): number {
  const text = value.trim().replace(/px$/, '');
  if (!NUMBER.test(text))
    throw new Error(`"${value}" is not a number in user units`);
  const number = Number(text);
  if (!Number.isFinite(number) || Math.abs(number) > 1e6)
    throw new Error(`"${value}" is out of range`);
  if (nonNegative && number < 0) throw new Error(`"${value}" is negative`);
  return number;
}

function opacity(value: string): number {
  const number = length(value);
  if (number < 0 || number > 1)
    throw new Error(`opacity "${value}" is not 0 to 1`);
  return number;
}

function numberList(value: string, even: boolean): string {
  const items = value.trim().split(/\s*,\s*|\s+/);
  for (const item of items) length(item);
  if (even && items.length % 2 !== 0)
    throw new Error(`"${value}" has an odd number of coordinates`);
  return items.join(' ');
}

function paint(value: string): string {
  const text = value.trim();
  if (text === 'none') return 'none';
  if (text.toLowerCase() === 'currentcolor') return 'currentColor';
  if (text.startsWith('url('))
    throw new Error(
      `paint server ${text} (a gradient or pattern) is not supported by Soundor SVG`,
    );
  throw new Error(
    `fixed paint "${text}": the color prop could not apply to it; only currentColor and none are supported`,
  );
}

function isInert(name: string): boolean {
  return name === 'class' || name === 'id' || name.startsWith('data-');
}

/** Paint as inherited down the tree: what decides whether a shape is visible. */
interface Inherited {
  readonly fill: string;
  readonly stroke: string;
}

export function normalizeIcon(
  svg: SvgElement,
  options: NormalizeOptions,
): NormalizedIcon {
  const notes = new Set<NoteCode>();
  let count = 0;
  if (svg.name !== 'svg')
    throw new UnsupportedSvgError(
      `the root element is <${svg.name}>, not <svg>`,
    );

  const fail = (where: string, message: string): never => {
    throw new UnsupportedSvgError(`${where}: ${message}`);
  };

  // The root: its coordinate system, size and presentation.
  const presentation: Record<string, string | number> = {};
  let viewBox: string | undefined;
  let width: number | undefined;
  let height: number | undefined;
  for (const [name, value] of svg.attributes) {
    try {
      if (name === 'viewBox') {
        const box = numberList(value, true).split(' ').map(Number);
        if (box.length !== 4 || box[2]! <= 0 || box[3]! <= 0)
          throw new Error(
            `viewBox "${value}" needs four numbers and a positive size`,
          );
        viewBox = box.join(' ');
      } else if (name === 'width') width = length(value, true);
      else if (name === 'height') height = length(value, true);
      else if (name === 'xmlns') {
        if (value !== 'http://www.w3.org/2000/svg')
          throw new Error(`unexpected namespace ${value}`);
      } else if (
        name === 'aria-hidden' ||
        name === 'role' ||
        name === 'focusable'
      ) {
        // Accessibility is the label prop's.
      } else if (isInert(name)) notes.add('inert-attribute');
      else if (name === 'clip-rule') notes.add('clip-rule');
      else {
        const known = PRESENTATION[name];
        if (known === undefined) throw new Error('unsupported attribute');
        presentation[known[0]] = known[1](value);
      }
    } catch (error) {
      fail(`<svg ${name}>`, (error as Error).message);
    }
  }
  for (const [axis, value] of [
    ['width', width],
    ['height', height],
  ] as const) {
    if (value !== undefined && value !== options.size)
      fail(
        `<svg ${axis}>`,
        `${value} differs from the variant's size ${options.size}`,
      );
  }
  if (viewBox === undefined) {
    if (width === undefined || height === undefined)
      fail('<svg>', 'no viewBox, and no width and height to derive one from');
    viewBox = `0 0 ${width} ${height}`;
    notes.add('derived-viewbox');
  }
  for (const [name, value] of Object.entries(options.rootDefaults ?? {})) {
    if (presentation[name] === undefined) {
      presentation[name] = value;
      if (name === 'fill') notes.add('default-fill');
    }
  }

  const rootPaint: Inherited = {
    fill: String(presentation['fill'] ?? 'initial'),
    stroke: String(presentation['stroke'] ?? 'none'),
  };

  const convert = (
    element: SvgElement,
    inherited: Inherited,
    path: string,
    depth: number,
  ): IconNode | undefined => {
    const where = `${path} > <${element.name}>`;
    if (NON_RENDERING.has(element.name)) {
      notes.add('non-rendering-element');
      return undefined;
    }
    const reason = UNSUPPORTED[element.name];
    if (reason !== undefined) fail(where, reason);
    const geometry = SHAPES[element.name];
    if (geometry === undefined && element.name !== 'g')
      fail(where, 'unknown element');
    if (depth > 64) fail(where, 'deeper than the 64 levels Soundor SVG allows');
    if (++count > 4096)
      fail(where, 'more than the 4096 elements Soundor SVG allows');

    const attributes: Record<string, string | number> = {};
    for (const [name, value] of element.attributes) {
      try {
        if (geometry?.includes(name)) {
          if (name === 'd') {
            const d = value.trim().replace(/\s+/g, ' ');
            if (d.length > 256 * 1024) throw new Error('longer than 256 KiB');
            validatePathData(d);
            attributes[name] = d;
          } else if (name === 'points')
            attributes[name] = numberList(value, true);
          else attributes[name] = length(value, NON_NEGATIVE.has(name));
        } else if (isInert(name)) notes.add('inert-attribute');
        else if (name === 'clip-rule') notes.add('clip-rule');
        else {
          const known = PRESENTATION[name];
          if (known === undefined) throw new Error('unsupported attribute');
          attributes[known[0]] = known[1](value);
        }
      } catch (error) {
        fail(`${where} ${name}`, (error as Error).message);
      }
    }

    const paint: Inherited = {
      // A line has no interior: only its stroke can draw it.
      fill:
        element.name === 'line'
          ? 'none'
          : String(attributes['fill'] ?? inherited.fill),
      stroke: String(attributes['stroke'] ?? inherited.stroke),
    };
    if (element.name === 'g') {
      const children = element.children
        .map((child, index) =>
          convert(child, paint, `${where}[${index}]`, depth + 1),
        )
        .filter((child) => child !== undefined);
      if (children.length === 0) {
        notes.add('empty-group');
        return undefined;
      }
      return ['g', attributes, children];
    }
    if (element.children.some((child) => !NON_RENDERING.has(child.name)))
      fail(where, 'a shape cannot contain elements');
    if (paint.fill === 'none' && paint.stroke === 'none') {
      notes.add('invisible-element');
      return undefined;
    }
    if (paint.fill === 'initial')
      fail(
        where,
        "the fill is SVG's initial black, which the color prop could not change; set the collection's rootDefaults",
      );
    if (element.name === 'path' && attributes['d'] === undefined)
      fail(where, 'a path without d');
    return [element.name as IconTag, attributes];
  };

  const nodes = svg.children
    .map((child, index) => convert(child, rootPaint, `<svg>[${index}]`, 1))
    .filter((node) => node !== undefined);
  if (nodes.length === 0) fail('<svg>', 'the icon draws nothing');
  return {
    root: { viewBox, size: options.size, presentation },
    nodes,
    notes,
  };
}
