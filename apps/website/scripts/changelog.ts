/** Build the changelog page from Changesets' published history; no second release log to maintain. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const source = new URL('../../../packages/icons/CHANGELOG.md', import.meta.url);
const output = new URL('../content/docs/changelog.md', import.meta.url);

// MDX treats braces and tags in prose as code. Keep fenced and inline code literal.
export function mdxSafe(markdown: string): string {
  return markdown
    .split(/(```[\s\S]*?```|`[^`]*`)/g)
    .map((part, index) =>
      index % 2
        ? part
        : part
            .replaceAll('{', '&#123;')
            .replaceAll('}', '&#125;')
            .replaceAll('<', '&lt;'),
    )
    .join('');
}

/** The page: Changesets' file without its package heading or dependency-only bullets. */
export function changelogPage(history: string): string {
  const body = history
    .replace(/^# .*\n+/, '')
    .split(/(?=^- )/m)
    .filter((block) => !block.startsWith('- Updated dependencies'))
    .join('')
    .trim();
  return [
    '---',
    'title: Changelog',
    'description: New features, improvements, and fixes in each release.',
    '---',
    '',
    body ? mdxSafe(body) : 'No published release notes yet.',
    '',
  ].join('\n');
}

if (import.meta.main) {
  mkdirSync(new URL('./', output), { recursive: true });
  writeFileSync(output, changelogPage(readFileSync(source, 'utf8')));
}
