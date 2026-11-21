/**
 * Export names: the upstream name in PascalCase (`player-play` → `PlayerPlay`,
 * `play_arrow` → `PlayArrow`). JavaScript names cannot start with a digit, so
 * those take an `Icon` prefix (`24-hours` → `Icon24Hours`, `10k` → `Icon10k`).
 */

const RESERVED = new Set([
  // Types each collection module exports beside its icons.
  'IconProps',
  'StrokeIconProps',
  'IconComponent',
]);

export function exportName(upstream: string): string {
  if (!/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/i.test(upstream))
    throw new Error(`"${upstream}" is not a name of letters, digits, - and _`);
  const pascal = upstream
    .split(/[-_]/)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join('');
  return /^\d/.test(pascal) ? `Icon${pascal}` : pascal;
}

/**
 * Names every upstream icon of a variant, failing on two that would share an
 * export or one that clashes with the module's types.
 */
export function exportNames(upstream: readonly string[]): Map<string, string> {
  const names = new Map<string, string>();
  const owners = new Map<string, string>();
  for (const name of upstream) {
    const exported = exportName(name);
    if (RESERVED.has(exported))
      throw new Error(
        `"${name}" would be exported as ${exported}, a type of the module`,
      );
    const owner = owners.get(exported);
    if (owner !== undefined)
      throw new Error(
        `"${owner}" and "${name}" would both be exported as ${exported}`,
      );
    owners.set(exported, name);
    names.set(name, exported);
  }
  return names;
}
