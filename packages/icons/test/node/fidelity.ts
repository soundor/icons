/**
 * The browser implementation of every icon, rendered to markup and compared
 * with its upstream SVG file: the same viewBox, elements, geometry and
 * presentation, minus only the documented no-ops (generated/provenance.json).
 *
 * The npm collections are installed with the package's devDependencies.
 * Material Symbols is read from the generator's cache when present (after
 * `pnpm generate`); CI's generated-files check covers it otherwise.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { collections } from '../../scripts/collections';
import { exportNames } from '../../scripts/lib/naming';
import { parseSvg, type SvgElement } from '../../scripts/lib/svg';

const CACHE = join(import.meta.dirname, '../../.cache');
const DROPPED = new Set([
  'class',
  'id',
  'xmlns',
  'clip-rule',
  'aria-hidden',
  'role',
  'focusable',
]);
const RENDERED_ROOT_ONLY = new Set(['width', 'height', 'aria-hidden', 'xmlns']);
const SHAPES = new Set([
  'path',
  'circle',
  'rect',
  'ellipse',
  'line',
  'polygon',
  'polyline',
  'g',
]);

function same(name: string, upstream: string, rendered: string): boolean {
  if (name === 'd') return upstream.trim().replace(/\s+/g, ' ') === rendered;
  if (name === 'fill' || name === 'stroke')
    return upstream.toLowerCase() === rendered.toLowerCase();
  const a = upstream.trim().split(/[\s,]+/);
  const b = rendered.trim().split(/[\s,]+/);
  return (
    a.length === b.length &&
    a.every((value, index) =>
      /^[\d.+-]/.test(value)
        ? Number(value) === Number(b[index])
        : value === b[index],
    )
  );
}

/** Upstream elements that paint, with the paint they inherit. */
function painting(
  element: SvgElement,
  inherited: { fill: string; stroke: string },
): SvgElement[] {
  const result: SvgElement[] = [];
  for (const child of element.children) {
    if (!SHAPES.has(child.name)) continue;
    const paint = {
      fill:
        child.name === 'line'
          ? 'none'
          : (child.attributes.get('fill') ?? inherited.fill),
      stroke: child.attributes.get('stroke') ?? inherited.stroke,
    };
    if (child.name === 'g') {
      const children = painting(child, paint);
      if (children.length > 0) result.push({ ...child, children });
    } else if (paint.fill !== 'none' || paint.stroke !== 'none')
      result.push(child);
  }
  return result;
}

function compare(
  upstream: SvgElement,
  rendered: SvgElement,
  where: string,
): void {
  expect(rendered.name, where).toBe(upstream.name);
  for (const [name, value] of upstream.attributes) {
    if (DROPPED.has(name) || name.startsWith('data-')) continue;
    if (upstream.name === 'svg' && (name === 'width' || name === 'height'))
      continue;
    const actual = rendered.attributes.get(name);
    expect(actual, `${where} ${name}`).toBeDefined();
    expect(
      same(name, value, actual!),
      `${where} ${name}: ${value} → ${actual}`,
    ).toBe(true);
  }
  for (const name of rendered.attributes.keys()) {
    if (upstream.name === 'svg' && RENDERED_ROOT_ONLY.has(name)) continue;
    if (upstream.name === 'svg' && name === 'fill') continue; // A collection's root default.
    if (upstream.name === 'svg' && name === 'viewBox') continue; // Derived when missing.
    expect(upstream.attributes.has(name), `${where} adds ${name}`).toBe(true);
  }
}

/**
 * Checks every icon of one collection. Each collection has a test file of its
 * own, so Vitest releases one collection's modules before loading the next.
 */
export function testCollection(id: string): void {
  const collection = collections.find((item) => item.id === id)!;
  const available =
    id !== 'material' || existsSync(join(CACHE, 'material-design-icons/.git'));
  describe(collection.title, () => {
    test.skipIf(!available)(
      'every icon renders its upstream geometry and presentation',
      async () => {
        const source = await collection.load(CACHE);
        for (const variant of collection.variants) {
          const module = (await import(
            `@soundor/icons/${variant.subpath}`
          )) as Record<string, ComponentType>;
          const icons = source.variants[variant.id]!;
          const names = exportNames(icons.map((icon) => icon.name));
          expect(Object.keys(module).length, variant.subpath).toBe(
            icons.length,
          );
          for (const icon of icons)
            checkIcon(
              variant.subpath,
              icon.name,
              icon.svg,
              module[names.get(icon.name)!]!,
            );
        }
      },
      120_000,
    );
  });
}

function checkIcon(
  subpath: string,
  name: string,
  svg: string,
  Icon: ComponentType,
): void {
  const where = `${subpath} ${name}`;
  const upstream = parseSvg(svg);
  const rendered = parseSvg(renderToStaticMarkup(createElement(Icon)));
  compare(upstream, rendered, where);
  // Upstream without a viewBox draws in its width and height.
  expect(rendered.attributes.get('viewBox'), where).toBe(
    upstream.attributes.has('viewBox')
      ? upstream.attributes
          .get('viewBox')!
          .trim()
          .split(/[\s,]+/)
          .join(' ')
      : `0 0 ${upstream.attributes.get('width')} ${upstream.attributes.get('height')}`,
  );
  const paint = {
    fill: upstream.attributes.get('fill') ?? 'currentColor',
    stroke: upstream.attributes.get('stroke') ?? 'none',
  };
  const walk = (
    a: readonly SvgElement[],
    b: readonly SvgElement[],
    path: string,
  ) => {
    expect(b.length, `${path}: elements`).toBe(a.length);
    a.forEach((element, index) => {
      compare(element, b[index]!, `${path}[${index}]`);
      walk(element.children, b[index]!.children, `${path}[${index}]`);
    });
  };
  walk(painting(upstream, paint), rendered.children, where);
}
