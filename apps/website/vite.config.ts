import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { fumadocsMdx } from 'fumadocs-mdx/vite';
import { defineConfig } from 'vite';

import { iconCatalog } from './plugins/icon-catalog.ts';

const base = process.env.SITE_BASE_PATH || '/';

// The gallery draws icons with @soundor/icons' browser implementation, which
// Vite selects by default (the package's `default` export condition): no
// resolver configuration, and no Soundor runtime.
export default defineConfig({
  base,
  plugins: [
    iconCatalog(),
    fumadocsMdx(),
    tailwindcss(),
    tanstackStart({
      router: { basepath: base },
      pages: [{ path: '/search-index.json' }],
      prerender: {
        enabled: true,
        crawlLinks: true,
        failOnError: true,
        // /browse?c=… and the like are one page: the gallery reads the URL in
        // the browser.
        filter: ({ path }) => !path.includes('?'),
      },
    }),
    react(),
  ],
  build: {
    // Material Symbols' variants are chunks of 1–2 MB, loaded on demand.
    chunkSizeWarningLimit: 2600,
  },
});
