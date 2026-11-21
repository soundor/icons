import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Vite's defaults: no resolver configuration for @soundor/icons.
export default defineConfig({
  plugins: [react()],
  build: { minify: true },
  test: { include: ['bundle.test.ts'] },
});
