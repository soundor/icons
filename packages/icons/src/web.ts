/**
 * The browser implementation: React DOM `<svg>` elements. Selected by every
 * resolver except Soundor's (the package's `default` export condition).
 */

import { createElement, type ReactElement } from 'react';

import type { IconNode, IconRoot } from './model';
import type { IconComponent, StrokeIconProps } from './types';

export type * from './types';

function element([tag, attributes, children]: IconNode): ReactElement {
  return children === undefined
    ? createElement(tag, attributes)
    : createElement(tag, attributes, ...children.map(element));
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
    return createElement(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        width,
        height,
        viewBox: root.viewBox,
        ...root.presentation,
        ...(stroked && strokeWidth !== undefined && { strokeWidth }),
        color,
        opacity,
        ...(label === undefined
          ? { 'aria-hidden': true }
          : { role: 'img', 'aria-label': label }),
      },
      ...children,
    );
  }
  Icon.displayName = name;
  return Icon;
}
