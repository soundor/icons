import { soundor } from '@soundor/vitest';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The fidelity and scene tests load whole collections: two workers keep
    // the peak near 1.5 GB, for CI runners and small machines.
    maxWorkers: 2,
    projects: [
      {
        // The generator, the generated modules and the browser
        // implementation, in Node.
        test: {
          name: 'node',
          include: ['scripts/**/*.test.ts', 'test/node/**/*.test.{ts,tsx}'],
          environment: 'node',
          // Node loads the generated modules and the renderers as they are
          // published, without Vite transforming megabytes of icons.
          server: {
            deps: { external: [/\/generated\/.*\.js$/, /\/dist\/.*\.js$/] },
          },
        },
      },
      {
        // The Soundor implementation, in Soundor's test runtime: imports of
        // @soundor/icons resolve with the soundor condition, as in a plugin.
        plugins: [soundor({ config: false })],
        test: {
          name: 'soundor',
          include: ['test/soundor/**/*.test.tsx'],
          environment: 'soundor',
        },
      },
    ],
  },
});
