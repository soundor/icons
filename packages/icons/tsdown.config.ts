import { defineConfig } from 'tsdown';

// The two renderers and the shared types. The icons themselves are generated
// as ESM and declarations (scripts/generate.ts) and import these files.
export default defineConfig({
  entry: {
    web: 'src/web.ts',
    soundor: 'src/soundor.ts',
    types: 'src/types.ts',
  },
  platform: 'neutral',
  target: 'es2023',
  format: 'esm',
  sourcemap: true,
  dts: { sourcemap: true },
  tsconfig: './tsconfig.lib.json',
  deps: {
    neverBundle: [/^@soundor\/react/, /^react(?:\/|$)/],
  },
});
