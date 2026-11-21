/** What a source adapter reads from an upstream collection. */

export interface SourceIcon {
  /** The upstream name, such as `player-play` or `play_arrow`. */
  readonly name: string;
  /** The SVG file's text. */
  readonly svg: string;
  /** Search terms the upstream project publishes. */
  readonly tags?: readonly string[];
  readonly categories?: readonly string[];
}

export interface LoadedSource {
  /** The upstream version: a package version or a commit. */
  readonly version: string;
  /** Where the files came from, pinned: `npm:<package>@<version>` or `git:<url>#<commit>`. */
  readonly origin: string;
  /** The upstream license file, verbatim. */
  readonly license: string;
  /** Icons by variant id. */
  readonly variants: Readonly<Record<string, readonly SourceIcon[]>>;
}
