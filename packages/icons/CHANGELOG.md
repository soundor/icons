# @soundor/icons

## 0.2.0

### Minor Changes

- 331d01a: Update the icons from their upstream sources.

  7 icon(s) added:

  - `@soundor/icons/lucide` `BoxDashed`
  - `@soundor/icons/lucide` `ChocolateBar`
  - `@soundor/icons/lucide` `DiagramSankey`
  - `@soundor/icons/lucide` `FolderNetwork`
  - `@soundor/icons/lucide` `FolderPlusCorner`
  - `@soundor/icons/lucide` `RectangleLandscapePlay`
  - `@soundor/icons/lucide` `UserRoundClock`

### Patch Changes

- acec175: Each subpath's modules now have their collection's license beside them, as `generated/<subpath>/LICENSE`. A tool that takes a file's license from the nearest license file, as Soundor's builds do for the third-party notices they ship, now gives the icons Lucide's, Tabler's, Phosphor's, Heroicons' or Material Symbols' license instead of the package's MIT.

## 0.1.0

### Minor Changes

- c0f9d9d: Release Lucide, Tabler, Phosphor, Heroicons and Material Symbols as React components for Soundor plugins and the browser, one subpath per collection and style. The `soundor` export condition selects native SVG from `@soundor/react/svg` in Soundor builds; every other environment gets React DOM `<svg>`. The upstream licenses are in `licenses/`.
