import { defineConfig } from 'vitest/config';

// Reads the CLI's build; the UI itself is not run here.
export default defineConfig({ test: { include: ['bundle.test.ts'] } });
