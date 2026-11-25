# @soundor/icons

Lucide, Tabler, Phosphor, Heroicons and Material Symbols as React components,
for [Soundor](https://soundor.dev/) plugins and the browser. Soundor builds get
native SVG from `@soundor/react/svg`; every other bundler gets React DOM
`<svg>`. The import is the same.

```sh
pnpm add @soundor/icons
```

```tsx
import { Play } from '@soundor/icons/lucide';
import { Gear } from '@soundor/icons/phosphor/bold';
import { PlayerPlay } from '@soundor/icons/tabler';

<Play size={24} color="#ffffff" />;
```

It needs React 19.3, and `@soundor/react` 0.21 in a Soundor plugin.

- [Gallery](https://icons.soundor.dev): search and copy icons
- [Documentation](https://icons.soundor.dev/docs)
- [Collections and subpaths](https://icons.soundor.dev/docs/collections)
- [Icon props](https://icons.soundor.dev/docs/props)

The icons are under their upstream licenses (ISC, MIT and Apache-2.0), in
[`licenses/`](licenses/) with [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
The package's own code is MIT.
