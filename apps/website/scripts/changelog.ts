/** Build the changelog page from Changesets' published history; no second release log to maintain. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const REPOSITORY = 'https://github.com/soundor/icons';
const source = new URL('../../../packages/icons/CHANGELOG.md', import.meta.url);
const output = new URL('../content/docs/changelog.mdx', import.meta.url);

// MDX treats braces and tags in prose as code. Keep fenced and inline code literal.
function mdxSafe(markdown: string): string {
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

/** Changesets' default format starts a note with its commit: `- 36f7b95: …`. */
const COMMIT = /^- ([0-9a-f]{7,40}): /;

/** A release is breaking by its Major Changes or an explicit "Breaking:" note, as on soundor.dev. */
export function isBreaking(release: string): boolean {
  if (/^### Major Changes\s*$/m.test(release)) return true;
  const prose = release
    .replace(/```[\s\S]*?```|`[^`]*`/g, '')
    .replace(/^- [0-9a-f]{7,40}: /gm, '- ');
  return /(?:^|\n| - )\s*(?:-\s*)?(?:\*\*)?Breaking(?: changes?)?(?:\*\*)?:(?:\*\*)?/i.test(
    prose,
  );
}

/** One release: dependency-only bullets and the sections they leave empty are dropped, commits linked. */
function releasePage(release: string): string {
  const [head = '', ...sections] = release.split(/(?=^### )/m);
  const kept = sections.flatMap((section) => {
    const [title = '', ...notes] = section.split(/(?=^- )/m);
    const body = notes
      .filter((note) => !note.startsWith('- Updated dependencies'))
      .map((note) =>
        note.replace(
          COMMIT,
          (_, hash: string) =>
            `- [\`${hash}\`](${REPOSITORY}/commit/${hash}): `,
        ),
      );
    return body.length ? [title + body.join('')] : [];
  });
  const icon = isBreaking(release) ? ' <BreakingChangeIcon />' : '';
  return (
    mdxSafe([head, ...kept].join(''))
      .trim()
      .replace(/^(## \S+)/, `$1${icon}`) + '\n'
  );
}

/** The page: Changesets' file without its package heading. */
export function changelogPage(history: string): string {
  const releases = history
    .replace(/^# .*\n+/, '')
    .split(/(?=^## )/m)
    .filter((release) => release.startsWith('## '));
  return [
    '---',
    'title: Changelog',
    'description: New features, improvements, and fixes in each release.',
    '---',
    '',
    releases.length
      ? releases.map(releasePage).join('\n')
      : 'No published release notes yet.',
    '',
  ].join('\n');
}

if (import.meta.main) {
  mkdirSync(new URL('./', output), { recursive: true });
  writeFileSync(output, changelogPage(readFileSync(source, 'utf8')));
}
