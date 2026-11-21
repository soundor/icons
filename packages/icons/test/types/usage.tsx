// Type-checked twice by test/node/package.test.ts: as a browser app, and as
// a Soundor UI (customConditions: ["soundor"], no DOM). The same imports and
// props must check in both, and the same mistakes must fail.

import {
  AcademicCap,
  type IconComponent,
  type IconProps,
} from '@soundor/icons/heroicons/micro';
import { Play, type StrokeIconProps } from '@soundor/icons/lucide';
import { PlayArrow } from '@soundor/icons/material/rounded/filled';
import { Gear } from '@soundor/icons/phosphor/duotone';
import { PlayerPlay } from '@soundor/icons/tabler';
import { PlayerPlay as PlayerPlayFilled } from '@soundor/icons/tabler/filled';

export const valid = [
  <Play key="1" size={24} color="#ffffff" strokeWidth={1.5} label="Play" />,
  <PlayerPlay key="2" width={20} height={16} opacity={0.5} />,
  <PlayerPlayFilled key="3" size={18} color="currentColor" />,
  <Gear key="4" />,
  <PlayArrow key="5" size={32} />,
  <AcademicCap key="6" />,
];

const props: StrokeIconProps = { strokeWidth: 2 };
const shared: IconProps = { size: 12 };
const component: IconComponent = Gear;
export { component, props, shared };
export const name: string = Play.displayName;

export const invalid = [
  // @ts-expect-error: a filled icon has no stroke width.
  <PlayerPlayFilled key="1" strokeWidth={2} />,
  // @ts-expect-error: Phosphor's weights are not stroked.
  <Gear key="2" strokeWidth={2} />,
  // @ts-expect-error: size is a number of pixels.
  <Play key="3" size="24px" />,
  // @ts-expect-error: DOM-only props are not shared.
  <Play key="4" className="icon" />,
  // @ts-expect-error: renderer-specific props are not shared.
  <Play key="5" style={{ margin: 4 }} />,
  // @ts-expect-error: a color is a string.
  <Play key="6" color={0xffffff} />,
];

// @ts-expect-error: there is no root export merging every collection.
export { Play as Root } from '@soundor/icons';
