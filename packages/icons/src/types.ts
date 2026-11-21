/**
 * The API every icon shares, whichever implementation the package resolves
 * to: Soundor's native SVG (`@soundor/react/svg`) or React DOM's `<svg>`.
 * Only props both renderers implement the same way are here.
 */

import type { ReactElement } from 'react';

/** Props of every icon. */
export interface IconProps {
  /**
   * Width and height in logical pixels. Defaults to the size the collection
   * draws at: 24, or 20 and 16 for Heroicons' mini and micro sets.
   */
  readonly size?: number;
  /** Width in logical pixels, instead of `size`. */
  readonly width?: number;
  /** Height in logical pixels, instead of `size`. */
  readonly height?: number;
  /**
   * The color the icon is painted with, such as `'#ffffff'` or
   * `'rgb(255 90 31)'`. In a browser it defaults to the CSS `color` around
   * the icon. Soundor has no CSS inheritance: there it defaults to black, so
   * pass a color.
   */
  readonly color?: string;
  /** Opacity of the whole icon, from 0 to 1. */
  readonly opacity?: number;
  /**
   * What assistive technology announces. An icon with a label is an image
   * with that name; one without is decorative and hidden from it.
   */
  readonly label?: string;
}

/** Props of an icon drawn with strokes (Lucide, Tabler, Heroicons outline). */
export interface StrokeIconProps extends IconProps {
  /**
   * Stroke width in the icon's own units (its 24-unit grid for most), which
   * scale with `size`. Defaults to the collection's: 2 for Lucide and Tabler,
   * 1.5 for Heroicons outline.
   */
  readonly strokeWidth?: number;
}

/** An icon component. */
export type IconComponent<P extends IconProps = IconProps> = ((
  props: P,
) => ReactElement) & {
  /** The export's name, such as `'PlayerPlay'`. */
  readonly displayName: string;
};

/** An icon whose shapes are filled: its stroke width is not adjustable. */
export type FillIcon = IconComponent<IconProps>;

/** An icon drawn with strokes, whose width is adjustable. */
export type StrokeIcon = IconComponent<StrokeIconProps>;
