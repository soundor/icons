/**
 * The Soundor implementation: native vector scenes from `@soundor/react/svg`,
 * for VST3 and the web runtime alike. Selected by the `soundor` export
 * condition, which the Soundor CLI's bundler and `@soundor/vitest` enable.
 */

import {
  Circle,
  Ellipse,
  G,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
  Svg,
  type SvgProps,
} from '@soundor/react/svg';
import { createElement, type ReactElement } from 'react';

import type { IconNode, IconRoot, IconTag } from './model';
import type { IconComponent, StrokeIconProps } from './types';

export type * from './types';

const PRIMITIVES = {
  g: G,
  path: Path,
  circle: Circle,
  rect: Rect,
  ellipse: Ellipse,
  line: Line,
  polygon: Polygon,
  polyline: Polyline,
} satisfies Record<IconTag, unknown>;

function element([tag, attributes, children]: IconNode): ReactElement {
  // The generator only writes props these primitives take.
  const type = PRIMITIVES[tag] as (props: object) => ReactElement;
  return children === undefined
    ? createElement(type, attributes)
    : createElement(type, attributes, ...children.map(element));
}

/** Makes the component of one generated icon. */
export function createIcon(
  name: string,
  root: IconRoot,
  nodes: readonly IconNode[],
): IconComponent<StrokeIconProps> {
  // Built on first render, then shared by every instance: elements are
  // immutable, and an unused icon costs nothing.
  let children: ReactElement[] | undefined;
  const stroked = root.presentation['strokeWidth'] !== undefined;
  function Icon({
    size = root.size,
    width = size,
    height = size,
    color,
    opacity,
    strokeWidth,
    label,
  }: StrokeIconProps): ReactElement {
    children ??= nodes.map(element);
    const props: SvgProps = {
      width,
      height,
      viewBox: root.viewBox,
      ...(root.presentation as SvgProps),
      ...(stroked && strokeWidth !== undefined && { strokeWidth }),
      ...(color !== undefined && { color }),
      ...(opacity !== undefined && { opacity }),
      ...(label !== undefined && {
        accessibilityRole: 'image',
        accessibilityLabel: label,
      }),
    };
    return createElement(Svg, props, ...children);
  }
  Icon.displayName = name;
  return Icon;
}
