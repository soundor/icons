/**
 * Icons that cover what the collections draw: strokes and fills, several
 * elements of each kind, opacity, fill rules, viewBoxes of every size and
 * origin, and every variant. Both renderers are snapshotted on them.
 */

export const representative: readonly (readonly [
  subpath: string,
  name: string,
  why: string,
])[] = [
  ['lucide', 'Play', 'one stroked path'],
  ['lucide', 'Disc3', 'paths and circles'],
  ['lucide', 'Database', 'ellipse and paths'],
  ['lucide', 'Inbox', 'polyline'],
  ['lucide', 'Navigation2', 'polygon'],
  ['lucide', 'BadgeExclamationPoint', 'lines'],
  ['lucide', 'Square', 'rounded rect'],
  ['tabler', 'PlayerPlay', 'stroked, invisible bounding box dropped'],
  ['tabler/filled', 'PlayerPlay', 'filled variant'],
  ['tabler', 'BrandParsinta', 'element opacity'],
  ['phosphor', 'Gear', '256-unit viewBox'],
  ['phosphor/thin', 'Gear', 'weight'],
  ['phosphor/light', 'Gear', 'weight'],
  ['phosphor/bold', 'Gear', 'weight'],
  ['phosphor/fill', 'Gear', 'weight'],
  ['phosphor/duotone', 'Gear', 'duotone: two opacities'],
  ['heroicons', 'Play', 'outline, stroke width 1.5'],
  ['heroicons/solid', 'ArchiveBoxArrowDown', 'evenodd fill rule'],
  ['heroicons/mini', 'Play', '20-unit viewBox'],
  ['heroicons/micro', 'Stop', '16-unit viewBox, rect'],
  ['material', 'PlayArrow', 'viewBox 0 -960 960 960'],
  ['material/filled', 'PlayArrow', 'filled'],
  ['material/rounded', 'PlayArrow', 'style'],
  ['material/rounded/filled', 'PlayArrow', 'style, filled'],
  ['material/sharp', 'PlayArrow', 'style'],
  ['material/sharp/filled', 'PlayArrow', 'style, filled'],
  ['material', 'AmbientScreen', 'viewBox 0 96 960 960'],
  ['material', 'Assistant', 'viewBox derived from width and height'],
];
