import { describe, expect, test } from 'vitest';

import { normalizeIcon, type NormalizeOptions } from './normalize.ts';
import { parseSvg } from './svg.ts';

const normalize = (svg: string, options: Partial<NormalizeOptions> = {}) =>
  normalizeIcon(parseSvg(svg), { size: 24, ...options });

const svg = (body: string, root = 'viewBox="0 0 24 24" fill="currentColor"') =>
  `<svg xmlns="http://www.w3.org/2000/svg" ${root}>${body}</svg>`;

describe('the root', () => {
  test('keeps the viewBox and moves presentation to the root, as numbers and camelCase', () => {
    const icon = normalize(
      `<svg xmlns="http://www.w3.org/2000/svg" class="lucide" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>`,
    );
    expect(icon.root).toEqual({
      viewBox: '0 0 24 24',
      size: 24,
      presentation: {
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
    });
    expect(icon.nodes).toEqual([['path', { d: 'M5 12h14' }]]);
    expect([...icon.notes]).toEqual(['inert-attribute']);
  });

  test('keeps viewBoxes of any origin and size', () => {
    expect(
      normalize(
        svg(
          '<path d="M0 0h1"/>',
          'viewBox="0 -960 960 960" fill="currentColor"',
        ),
      ).root.viewBox,
    ).toBe('0 -960 960 960');
    expect(
      normalize(
        svg('<path d="M0 0h1"/>', 'viewBox="0,0,256,256" fill="currentColor"'),
      ).root.viewBox,
    ).toBe('0 0 256 256');
  });

  test('derives a missing viewBox from width and height, and says so', () => {
    const icon = normalize(
      svg('<path d="M0 0h1"/>', 'width="24" height="24" fill="currentColor"'),
    );
    expect(icon.root.viewBox).toBe('0 0 24 24');
    expect(icon.notes).toContain('derived-viewbox');
  });

  test('fails without a viewBox or a size to derive one from', () => {
    expect(() =>
      normalize(svg('<path d="M0 0h1"/>', 'fill="currentColor"')),
    ).toThrow('no viewBox');
  });

  test('fails when the file is drawn at another size than its variant', () => {
    expect(() =>
      normalize(
        svg(
          '<path d="M0 0h1"/>',
          'width="20" height="20" viewBox="0 0 20 20" fill="currentColor"',
        ),
      ),
    ).toThrow("differs from the variant's size 24");
  });

  test('applies root defaults only where the file sets nothing', () => {
    const icon = normalize(svg('<path d="M0 0h1"/>', 'viewBox="0 0 24 24"'), {
      rootDefaults: { fill: 'currentColor' },
    });
    expect(icon.root.presentation).toEqual({ fill: 'currentColor' });
    expect(icon.notes).toContain('default-fill');
    const kept = normalize(
      svg(
        '<path d="M0 0h1"/>',
        'viewBox="0 0 24 24" fill="none" stroke="currentColor"',
      ),
      {
        rootDefaults: { fill: 'currentColor' },
      },
    );
    expect(kept.root.presentation['fill']).toBe('none');
  });
});

describe('shapes', () => {
  test('converts every primitive with numeric geometry and keeps path data verbatim', () => {
    const icon = normalize(
      svg(
        '<path d="M5 5a2 2 0 0 1 3.008-1.728"/>' +
          '<circle cx="12" cy="12.5" r="3"/>' +
          '<rect x="3" y="3" width="18" height="18" rx="2" ry="1"/>' +
          '<ellipse cx="12" cy="19" rx="9" ry="3"/>' +
          '<line x1="12" x2="12.01" y1="16" y2="16" stroke="currentColor"/>' +
          '<polyline points="22 12 16,12 14 15"/>' +
          '<polygon points="12 2 19 21 12 17"/>',
      ),
    );
    expect(icon.nodes).toEqual([
      ['path', { d: 'M5 5a2 2 0 0 1 3.008-1.728' }],
      ['circle', { cx: 12, cy: 12.5, r: 3 }],
      ['rect', { x: 3, y: 3, width: 18, height: 18, rx: 2, ry: 1 }],
      ['ellipse', { cx: 12, cy: 19, rx: 9, ry: 3 }],
      ['line', { x1: 12, x2: 12.01, y1: 16, y2: 16, stroke: 'currentColor' }],
      ['polyline', { points: '22 12 16 12 14 15' }],
      ['polygon', { points: '12 2 19 21 12 17' }],
    ]);
  });

  test('collapses whitespace in path data, and nothing else', () => {
    const icon = normalize(svg('<path d="\n  M0 0\n  L1   1z "/>'));
    expect(icon.nodes[0]![1]['d']).toBe('M0 0 L1 1z');
  });

  test('keeps fill rules, opacities, dashes and caps on the element', () => {
    const icon = normalize(
      svg(
        '<path d="M0 0h1" fill-rule="evenodd" opacity=".2" fill-opacity="0.5" stroke="currentColor" stroke-opacity="1" stroke-dasharray="2, 3" stroke-dashoffset="1" stroke-linecap="square" stroke-miterlimit="10"/>',
      ),
    );
    expect(icon.nodes[0]![1]).toEqual({
      d: 'M0 0h1',
      fillRule: 'evenodd',
      opacity: 0.2,
      fillOpacity: 0.5,
      stroke: 'currentColor',
      strokeOpacity: 1,
      strokeDasharray: '2 3',
      strokeDashoffset: 1,
      strokeLinecap: 'square',
      strokeMiterlimit: 10,
    });
  });

  test('keeps groups, nested, with their presentation and transforms', () => {
    const icon = normalize(
      svg(
        '<g transform="translate(2 2)" opacity="0.5"><g transform="rotate(45, 12, 12)  scale(0.5)" fill="none" stroke="currentColor"><circle cx="1" cy="1" r="1"/></g></g>',
      ),
    );
    expect(icon.nodes).toEqual([
      [
        'g',
        { transform: 'translate(2 2)', opacity: 0.5 },
        [
          [
            'g',
            {
              transform: 'rotate(45, 12, 12) scale(0.5)',
              fill: 'none',
              stroke: 'currentColor',
            },
            [['circle', { cx: 1, cy: 1, r: 1 }]],
          ],
        ],
      ],
    ]);
  });

  test('normalizes currentColor and accepts none', () => {
    const icon = normalize(
      svg('<path d="M0 0h1" fill="CurrentColor" stroke="none"/>'),
    );
    expect(icon.nodes[0]![1]).toMatchObject({
      fill: 'currentColor',
      stroke: 'none',
    });
  });
});

describe('documented no-ops', () => {
  test("drops an element that paints nothing, such as Tabler's bounding box", () => {
    const icon = normalize(
      svg(
        '<path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 4v16l13 -8z"/>',
        'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"',
      ),
    );
    expect(icon.nodes).toEqual([['path', { d: 'M7 4v16l13 -8z' }]]);
    expect(icon.notes).toContain('invisible-element');
  });

  test('keeps a line that only strokes, and drops one that does not', () => {
    expect(
      normalize(svg('<line x2="1" stroke="currentColor"/>')).nodes,
    ).toHaveLength(1);
    const icon = normalize(svg('<line x2="1"/><path d="M0 0h1"/>'));
    expect(icon.nodes).toEqual([['path', { d: 'M0 0h1' }]]);
  });

  test('drops empty groups, clip-rule outside a clip path, inert attributes and metadata elements', () => {
    const icon = normalize(
      svg(
        '<title>Play</title><desc>An icon</desc><g id="empty"><path d="M0 0" fill="none"/></g><path class="a" data-name="b" d="M0 0h1" clip-rule="evenodd"/>',
      ),
    );
    expect(icon.nodes).toEqual([['path', { d: 'M0 0h1' }]]);
    expect([...icon.notes].sort()).toEqual([
      'clip-rule',
      'empty-group',
      'inert-attribute',
      'invisible-element',
      'non-rendering-element',
    ]);
  });
});

describe('unsupported constructs fail with a diagnostic', () => {
  test.each([
    [
      '<defs><path id="a" d="M0 0h1"/></defs>',
      'definitions (<defs>) are not supported by Soundor SVG',
    ],
    [
      '<clipPath id="c"><rect width="1" height="1"/></clipPath>',
      'clipping paths are not supported',
    ],
    [
      '<mask id="m"><rect width="1" height="1"/></mask>',
      'masks are not supported',
    ],
    ['<linearGradient id="g"/>', 'gradients are not supported'],
    ['<radialGradient id="g"/>', 'gradients are not supported'],
    ['<pattern id="p"/>', 'patterns are not supported'],
    ['<filter id="f"/>', 'filters are not supported'],
    ['<use href="#a"/>', '<use> references are not supported'],
    ['<symbol id="s"/>', '<symbol> is not supported'],
    ['<text>A</text>', 'text content'],
    ['<image href="a.png"/>', 'embedded images are not supported'],
    ['<style>path{fill:red}</style>', 'text content'],
    ['<foo/>', 'unknown element'],
  ])('%s', (body, message) => {
    expect(() => normalize(svg(body))).toThrow(message);
  });

  test.each([
    [
      '<path d="M0 0h1" fill="url(#g)"/>',
      'paint server url(#g) (a gradient or pattern) is not supported',
    ],
    ['<path d="M0 0h1" fill="#ff0000"/>', 'fixed paint "#ff0000"'],
    [
      '<path d="M0 0h1" clip-path="url(#c)"/>',
      'clip-path: unsupported attribute',
    ],
    ['<path d="M0 0h1" mask="url(#m)"/>', 'mask: unsupported attribute'],
    ['<path d="M0 0h1" style="fill:red"/>', 'style: unsupported attribute'],
    ['<path d="M0 0h1" filter="url(#f)"/>', 'filter: unsupported attribute'],
    ['<rect width="50%" height="1"/>', 'is not a number in user units'],
    ['<circle r="-1"/>', 'is negative'],
    ['<path d="M0 0h1" opacity="2"/>', 'is not 0 to 1'],
    [
      '<path d="M0 0h1" stroke-linejoin="arcs"/>',
      'is not one of miter, round, bevel',
    ],
    [
      '<path d="M0 0h1" transform="rotate(45deg)"/>',
      'invalid arguments to rotate()',
    ],
    ['<path d="M0 0 X"/>', 'unknown command'],
    ['<polygon points="0 0 1"/>', 'odd number of coordinates'],
    ['<path/>', 'a path without d'],
    [
      '<path d="M0 0h1"><circle r="1"/></path>',
      'a shape cannot contain elements',
    ],
  ])('%s', (body, message) => {
    expect(() => normalize(svg(body))).toThrow(message);
  });

  test("a shape left with SVG's initial black fill fails: color could not change it", () => {
    expect(() =>
      normalize(svg('<path d="M0 0h1"/>', 'viewBox="0 0 24 24"')),
    ).toThrow('initial black');
  });

  test('a diagnostic names the element', () => {
    expect(() => normalize(svg('<g><g><mask/></g></g>'))).toThrow(
      '<svg>[0] > <g>[0] > <g>[0] > <mask>: masks are not supported by Soundor SVG',
    );
  });

  test('malformed XML, DTDs and an empty icon fail', () => {
    expect(() => normalize('<svg><path d="M0 0h1"></svg>')).toThrow();
    expect(() => normalize('<!DOCTYPE svg><svg/>')).toThrow('DOCTYPE');
    expect(() => normalize(svg(''))).toThrow('draws nothing');
  });

  test("scenes beyond Soundor's limits fail", () => {
    const many = '<path d="M0 0h1"/>'.repeat(4097);
    expect(() => normalize(svg(many))).toThrow('4096 elements');
    const deep = '<g>'.repeat(65) + '<path d="M0 0h1"/>' + '</g>'.repeat(65);
    expect(() => normalize(svg(deep))).toThrow('64 levels');
  });
});
