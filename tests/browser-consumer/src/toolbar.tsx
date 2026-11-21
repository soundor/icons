// The same file in tests/browser-consumer and tests/soundor-consumer: the
// same imports select a different implementation in each.

import { Play as PlaySolid } from '@soundor/icons/heroicons/solid';
import { Pause, Play } from '@soundor/icons/lucide';
import { VolumeUp } from '@soundor/icons/material/rounded';
import { Gear } from '@soundor/icons/phosphor';
import { PlayerPlay } from '@soundor/icons/tabler';

export function Toolbar({ color }: { readonly color: string }) {
  return (
    <>
      <Play size={24} color={color} />
      <Pause size={20} color={color} />
      <PlayerPlay strokeWidth={1.5} color={color} />
      <Gear label="Settings" color={color} />
      <PlaySolid color={color} />
      <VolumeUp color={color} />
    </>
  );
}
