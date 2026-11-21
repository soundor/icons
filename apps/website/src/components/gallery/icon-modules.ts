/**
 * The icon modules the gallery draws with: @soundor/icons' browser
 * implementation, one chunk per variant, imported the first time the gallery
 * shows an icon of that variant.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { loaders, type IconModule } from 'virtual:icon-collections';

export function useIconModules(): {
  readonly modules: Readonly<Record<string, IconModule>>;
  readonly load: (subpath: string) => void;
} {
  const [modules, setModules] = useState<Record<string, IconModule>>({});
  const requested = useRef(new Set<string>());
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );
  const load = useCallback((subpath: string) => {
    if (requested.current.has(subpath)) return;
    const loader = loaders[subpath];
    if (loader === undefined) return;
    requested.current.add(subpath);
    void loader().then((module) => {
      if (mounted.current)
        setModules((current) => ({ ...current, [subpath]: module }));
    });
  }, []);
  return { modules, load };
}
