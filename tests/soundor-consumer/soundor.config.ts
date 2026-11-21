import { defineSoundorConfig } from '@soundor/config';
import { webRuntime } from '@soundor/web-runtime';

// A minimal plugin whose UI imports @soundor/icons, built by the Soundor CLI
// (`soundor build web`): the test reads the UI bundle the CLI writes.
export default defineSoundorConfig({
  plugin: {
    id: 'dev.soundor.icons.consumer',
    name: 'Soundor Icons consumer',
  },
  runtimes: [webRuntime()],
  parameters: {
    gain: { type: 'float32', label: 'Gain', min: 0, max: 1, default: 1 },
  },
});
