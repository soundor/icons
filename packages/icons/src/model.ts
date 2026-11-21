/**
 * The normalized SVG model the generator writes and both renderers read: one
 * representation of each icon, so Soundor and the browser draw the same
 * geometry. Attribute names are the camelCase props React DOM and
 * `@soundor/react/svg` both take; numbers are numbers.
 */

/** The SVG elements an icon can contain; Soundor's native SVG draws all of them. */
export type IconTag =
  | 'g'
  | 'path'
  | 'circle'
  | 'rect'
  | 'ellipse'
  | 'line'
  | 'polygon'
  | 'polyline';

/** Geometry and presentation of one element. */
export type IconAttributes = Readonly<Record<string, string | number>>;

/** One element: its tag, attributes and, for a group, its children. */
export type IconNode = readonly [
  tag: IconTag,
  attributes: IconAttributes,
  children?: readonly IconNode[],
];

/** The root `<svg>` of an icon: its coordinate system, size and inherited presentation. */
export interface IconRoot {
  /** `minX minY width height`, as the upstream file has it. */
  readonly viewBox: string;
  /** The default width and height in logical pixels. */
  readonly size: number;
  /** Presentation every element inherits (fill, stroke, stroke width...). */
  readonly presentation: IconAttributes;
}
