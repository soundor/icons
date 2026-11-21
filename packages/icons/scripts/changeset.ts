/**
 * Turns the generator's `--report` into a changeset, for the "Icons
 * changeset" workflow: prints `bump` and `body` in the format of
 * $GITHUB_OUTPUT. Removed or renamed icons are a major change, added icons a
 * minor one, anything else that changed an icon a patch; `none` when no icon
 * changed.
 *
 *   node scripts/changeset.ts <report.json>
 */

import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

interface Report {
  readonly added: readonly string[];
  readonly removed: readonly string[];
  readonly files: number;
  readonly exports: boolean;
}

const MAX_LISTED = 40;

const report = JSON.parse(
  readFileSync(process.argv[2] ?? '', 'utf8'),
) as Report;

/** The `subpath name` pairs of a generated catalog; anything else is dropped. */
const valid = (names: readonly string[]) =>
  names.filter((name) => /^[\w/-]+ [\w-]+$/.test(name));
const added = valid(report.added);
const removed = valid(report.removed);

function listed(names: readonly string[]): string {
  const valid = names.map((name) => {
    const [subpath, icon] = name.split(' ');
    return `- \`@soundor/icons/${subpath}\` \`${icon}\``;
  });
  const more =
    valid.length > MAX_LISTED
      ? [`- and ${valid.length - MAX_LISTED} more`]
      : [];
  return [...valid.slice(0, MAX_LISTED), ...more].join('\n');
}

let bump: 'major' | 'minor' | 'patch' | 'none' = 'none';
if (removed.length > 0) bump = 'major';
else if (added.length > 0) bump = 'minor';
else if (report.files > 0) bump = 'patch';

const sections = [
  'Update the icons from their upstream sources.',
  removed.length > 0 &&
    `${removed.length} icon(s) removed or renamed, a breaking change:\n\n${listed(removed)}`,
  added.length > 0 && `${added.length} icon(s) added:\n\n${listed(added)}`,
].filter(Boolean);

const delimiter = `EOF_${randomUUID()}`;
console.log(`bump=${bump}`);
console.log(`body<<${delimiter}\n${sections.join('\n\n')}\n${delimiter}`);
