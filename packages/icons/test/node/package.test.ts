/**
 * The published package: its exports resolve to the right implementation in
 * each environment, the implementations stay on their side of the line, and
 * the declarations type-check for a browser app and a Soundor UI alike.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test } from 'vitest';

import { collections } from '../../scripts/collections';
import { variants } from '../shared/variants';

const PACKAGE = join(import.meta.dirname, '../..');
const manifest = JSON.parse(
  readFileSync(join(PACKAGE, 'package.json'), 'utf8'),
) as {
  exports: Record<string, Record<string, string> | string>;
  files: string[];
  sideEffects: boolean;
  type: string;
  peerDependencies: Record<string, string>;
  peerDependenciesMeta: Record<string, { optional?: boolean }>;
};

/** What Node resolves a specifier to, with extra conditions. */
function resolve(specifier: string, conditions: string[] = []): string {
  const output = execFileSync(
    process.execPath,
    [
      ...conditions.map((condition) => `--conditions=${condition}`),
      '--input-type=module',
      '-e',
      `console.log(import.meta.resolve(${JSON.stringify(specifier)}))`,
    ],
    { cwd: PACKAGE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  return relative(PACKAGE, fileURLToPath(output.trim()));
}

/** The module specifiers a file imports or re-exports. */
function imports(path: string): string[] {
  const code = readFileSync(join(PACKAGE, path), 'utf8');
  return [
    ...code.matchAll(/^(?:import|export)\s[^'"]*?from\s+["']([^"']+)["'];?$/gm),
  ]
    .map((match) => match[1]!)
    .sort();
}

describe('exports', () => {
  test('every variant of every collection is a subpath, and there is no root export', () => {
    expect(Object.keys(manifest.exports)).toEqual([
      ...collections.flatMap((collection) =>
        collection.variants.map((variant) => `./${variant.subpath}`),
      ),
      './package.json',
    ]);
    expect(manifest.exports['.']).toBeUndefined();
  });

  test.each(variants.map((variant) => variant.subpath))(
    '%s: types, then the soundor condition, then the default',
    (subpath) => {
      const entry = manifest.exports[`./${subpath}`] as Record<string, string>;
      expect(Object.keys(entry)).toEqual(['types', 'soundor', 'default']);
      for (const file of Object.values(entry))
        expect(existsSync(join(PACKAGE, file))).toBe(true);
    },
  );

  test('Node resolves the browser implementation by default', () => {
    expect(resolve('@soundor/icons/lucide')).toBe('generated/lucide/web.js');
    expect(resolve('@soundor/icons/material/rounded/filled')).toBe(
      'generated/material/rounded/filled/web.js',
    );
  });

  test('with the soundor condition, as the Soundor CLI resolves, the Soundor implementation', () => {
    expect(resolve('@soundor/icons/lucide', ['soundor'])).toBe(
      'generated/lucide/soundor.js',
    );
    expect(resolve('@soundor/icons/phosphor/duotone', ['soundor'])).toBe(
      'generated/phosphor/duotone/soundor.js',
    );
  });

  test('browser bundlers, which add the browser condition, still get the browser implementation', () => {
    expect(resolve('@soundor/icons/tabler', ['browser'])).toBe(
      'generated/tabler/web.js',
    );
  });

  test('there is no root export and no deep import into generated files', () => {
    expect(() => resolve('@soundor/icons')).toThrow(
      /ERR_PACKAGE_PATH_NOT_EXPORTED/,
    );
    expect(() => resolve('@soundor/icons/generated/lucide/nodes.js')).toThrow(
      /ERR_PACKAGE_PATH_NOT_EXPORTED/,
    );
  });
});

describe('the boundary between the implementations', () => {
  test('the Soundor renderer imports React and @soundor/react/svg, and no DOM', () => {
    expect(imports('dist/soundor.js')).toEqual(['@soundor/react/svg', 'react']);
    const code = readFileSync(join(PACKAGE, 'dist/soundor.js'), 'utf8');
    expect(code).not.toMatch(/\b(?:document|window|HTMLElement|SVGElement)\b/);
    expect(code).not.toMatch(/createElement\(["']svg["']/);
  });

  test('the browser renderer imports React only', () => {
    expect(imports('dist/web.js')).toEqual(['react']);
    expect(readFileSync(join(PACKAGE, 'dist/web.js'), 'utf8')).not.toContain(
      'soundor',
    );
  });

  test.each(variants.map((variant) => variant.subpath))(
    '%s: each barrel imports its renderer and the shared nodes, and the nodes import nothing',
    (subpath) => {
      const dist = `${'../'.repeat(subpath.split('/').length + 1)}dist`;
      const dir = `generated/${subpath}`;
      expect(imports(`${dir}/soundor.js`)).toEqual([
        `${dist}/soundor.js`,
        './nodes.js',
      ]);
      expect(imports(`${dir}/web.js`)).toEqual([
        `${dist}/web.js`,
        './nodes.js',
      ]);
      expect(imports(`${dir}/nodes.js`)).toEqual([]);
      expect(imports(`${dir}/index.d.ts`)).toEqual([
        `${dist}/types.js`,
        `${dist}/types.js`,
      ]);
    },
  );
});

describe('the package', () => {
  test('is ESM without side effects; @soundor/react is an optional peer, for Soundor only', () => {
    expect(manifest.type).toBe('module');
    expect(manifest.sideEffects).toBe(false);
    expect(manifest.peerDependencies).toEqual({
      '@soundor/react': '^0.21.0',
      react: '^19.3.0',
    });
    expect(manifest.peerDependenciesMeta['@soundor/react']?.optional).toBe(
      true,
    );
  });

  test("publishes every collection's license, the notices and the provenance", () => {
    expect(manifest.files).toEqual(
      expect.arrayContaining([
        'dist',
        'generated',
        'licenses',
        'THIRD_PARTY_NOTICES.md',
      ]),
    );
    const notices = readFileSync(
      join(PACKAGE, 'THIRD_PARTY_NOTICES.md'),
      'utf8',
    );
    for (const collection of collections) {
      const license = readFileSync(
        join(PACKAGE, 'licenses', collection.licenseFile),
        'utf8',
      );
      expect(license.length).toBeGreaterThan(500);
      expect(notices).toContain(`licenses/${collection.licenseFile}`);
    }
    expect(
      readFileSync(join(PACKAGE, 'licenses/lucide.txt'), 'utf8'),
    ).toContain('Feather');
    expect(
      readFileSync(join(PACKAGE, 'licenses/material-symbols.txt'), 'utf8'),
    ).toContain('Apache License');
  });

  test('every generated module names its source and license', () => {
    for (const { subpath } of variants)
      for (const file of ['nodes.js', 'web.js', 'soundor.js', 'index.d.ts']) {
        const head = readFileSync(
          join(PACKAGE, 'generated', subpath, file),
          'utf8',
        ).slice(0, 600);
        expect(head, `${subpath}/${file}`).toMatch(/\((?:npm|git):[^)]+\)/);
        expect(head, `${subpath}/${file}`).toMatch(/see licenses\/[\w-]+\.txt/);
      }
  });
});

describe('types', () => {
  const tsc = (project: string) =>
    execFileSync(
      process.execPath,
      [join(PACKAGE, 'node_modules/typescript/bin/tsc'), '-p', project],
      {
        cwd: PACKAGE,
        encoding: 'utf8',
      },
    );

  test.each(['tsconfig.web.json', 'tsconfig.soundor.json'])(
    'the same imports and props check, and the same mistakes fail, in %s',
    (project) => {
      expect(() => tsc(join('test/types', project))).not.toThrow();
    },
    60_000,
  );

  test("every subpath's declarations check, for a browser app and a Soundor UI", () => {
    const dir = join(PACKAGE, 'node_modules/.tmp/types-all');
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, 'all.ts'),
      variants
        .map(
          ({ subpath }, index) =>
            `export * as v${index} from '@soundor/icons/${subpath}';\n`,
        )
        .join(''),
    );
    for (const conditions of [[], ['soundor']]) {
      writeFileSync(
        join(dir, 'tsconfig.json'),
        JSON.stringify({
          extends: '../../../../../tsconfig.base.json',
          compilerOptions: {
            lib: ['es2023'],
            types: conditions.length ? ['@soundor/environment'] : [],
            customConditions: conditions,
            skipLibCheck: false,
          },
          files: ['all.ts'],
        }),
      );
      expect(() => tsc(join(dir, 'tsconfig.json'))).not.toThrow();
    }
  }, 120_000);
});
