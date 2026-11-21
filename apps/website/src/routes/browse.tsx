import { createFileRoute } from '@tanstack/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';

import { Gallery } from '../components/gallery/gallery';
import { navLinks } from '../layout-options';

interface BrowseSearch {
  readonly q?: string;
  readonly c?: string;
  readonly v?: string;
  readonly icon?: string;
}

export const Route = createFileRoute('/browse')({
  // The gallery reads and writes these itself; declared so links can set them.
  validateSearch: (search: Record<string, unknown>): BrowseSearch => {
    const pick = (key: string) =>
      typeof search[key] === 'string' ? search[key] : undefined;
    return { q: pick('q'), c: pick('c'), v: pick('v'), icon: pick('icon') };
  },
  head: () => ({ meta: [{ title: 'Browse icons · Soundor Icons' }] }),
  component: Browse,
});

/** The icon browser, filling the window below the navigation bar. */
function Browse() {
  return (
    <HomeLayout {...navLinks}>
      <div className="h-[calc(100dvh-3.5rem)] w-full overflow-hidden border-t">
        <Gallery />
      </div>
    </HomeLayout>
  );
}
