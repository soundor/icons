import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';

import { BreakingChangeIcon } from './breaking-change-icon';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    BreakingChangeIcon,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
