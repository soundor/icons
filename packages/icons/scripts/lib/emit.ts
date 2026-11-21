/**
 * Writes a variant's normalized icons as the package's modules:
 *
 * - `nodes.js`: each icon's normalized model, shared by both renderers.
 * - `web.js` and `soundor.js`: one component per icon, made by that
 *   renderer's `createIcon` from the same nodes. Every export is a pure call,
 *   so a bundler drops the icons an application does not import, and their
 *   nodes with them.
 * - `index.d.ts`: the declarations both implementations share.
 *
 * Output is plain ESM and declarations rather than TypeScript to compile:
 * the build stays fast with tens of thousands of icons. Icons are sorted by
 * name, one per line, so a new upstream version changes only the lines of
 * the icons it changed.
 */

import type { IconNode, IconRoot } from '../../src/model.ts';

export interface EmittedIcon {
  /** The export name. */
  readonly name: string;
  /** The upstream name. */
  readonly upstream: string;
  readonly root: IconRoot;
  readonly nodes: readonly IconNode[];
}

export interface EmitContext {
  /** The comment at the top of every file. */
  readonly header: string;
  /** The subpath, such as `material/rounded`: where the files go. */
  readonly subpath: string;
  /** The root most of the variant's icons share. */
  readonly root: IconRoot;
  readonly stroke: boolean;
  /** `Lucide`, for the declarations' comments. */
  readonly title: string;
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** A JavaScript literal of a model value, compact and deterministic. */
export function literal(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(literal).join(',')}]`;
  if (value !== null && typeof value === 'object')
    return `{${Object.entries(value)
      .map(
        ([key, item]) =>
          `${IDENTIFIER.test(key) ? key : JSON.stringify(key)}:${literal(item)}`,
      )
      .join(',')}}`;
  if (typeof value === 'number' && !Number.isFinite(value))
    throw new Error(`cannot write ${value}`);
  return JSON.stringify(value);
}

function comment(header: string): string {
  return `${header
    .split('\n')
    .map((line) => `// ${line}`.trimEnd())
    .join('\n')}\n`;
}

function dist(subpath: string, file: string): string {
  return `${'../'.repeat(subpath.split('/').length + 1)}dist/${file}`;
}

function sameRoot(a: IconRoot, b: IconRoot): boolean {
  return literal(a) === literal(b);
}

export function emitVariant(
  context: EmitContext,
  icons: readonly EmittedIcon[],
): Record<string, string> {
  const header = comment(context.header);
  const nodes =
    header +
    icons
      .map((icon) => `export const ${icon.name}=${literal(icon.nodes)};\n`)
      .join('');

  const barrel = (renderer: 'web' | 'soundor') =>
    header +
    `import { createIcon as c } from ${JSON.stringify(dist(context.subpath, `${renderer}.js`))};\n` +
    `import * as n from './nodes.js';\n` +
    `const r=${literal(context.root)};\n` +
    icons
      .map((icon) => {
        const root = sameRoot(icon.root, context.root)
          ? 'r'
          : literal(icon.root);
        return `export const ${icon.name}=/* @__PURE__ */c(${JSON.stringify(icon.name)},${root},n.${icon.name});\n`;
      })
      .join('');

  const type = context.stroke ? 'StrokeIcon' : 'FillIcon';
  const types = dist(context.subpath, 'types.js');
  const declarations =
    header +
    `import type { ${type} } from ${JSON.stringify(types)};\n` +
    `export type { IconComponent, IconProps, StrokeIconProps } from ${JSON.stringify(types)};\n` +
    icons
      .map(
        (icon) =>
          `/** ${context.title} \`${icon.upstream}\` */\nexport declare const ${icon.name}: ${type};\n`,
      )
      .join('');

  const dir = `generated/${context.subpath}`;
  return {
    [`${dir}/nodes.js`]: nodes,
    [`${dir}/web.js`]: barrel('web'),
    [`${dir}/soundor.js`]: barrel('soundor'),
    [`${dir}/index.d.ts`]: declarations,
  };
}

/** The root most icons share, so the barrel writes it once. */
export function commonRoot(icons: readonly EmittedIcon[]): IconRoot {
  const counts = new Map<string, { root: IconRoot; count: number }>();
  for (const icon of icons) {
    const key = literal(icon.root);
    const entry = counts.get(key) ?? { root: icon.root, count: 0 };
    entry.count++;
    counts.set(key, entry);
  }
  let best: { root: IconRoot; count: number } | undefined;
  for (const entry of counts.values())
    if (best === undefined || entry.count > best.count) best = entry;
  return best!.root;
}
