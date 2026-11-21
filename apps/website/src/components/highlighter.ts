import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

// TSX and the site's two themes only: the full highlighter would ship every
// language shiki knows.
let highlighter: Promise<HighlighterCore> | undefined;
export const tsxHighlighter = () =>
  (highlighter ??= createHighlighterCore({
    langs: [import('shiki/langs/tsx.mjs')],
    themes: [
      import('shiki/themes/github-light.mjs'),
      import('shiki/themes/github-dark.mjs'),
    ],
    engine: createJavaScriptRegexEngine(),
  }));

export const codeOptions = {
  themes: { light: 'github-light', dark: 'github-dark' },
} as const;
