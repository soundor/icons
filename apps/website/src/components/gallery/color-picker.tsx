/**
 * A color picker in a popover: a saturation and brightness area, a hue
 * slider, a hex field and swatches. Drawn by the page instead of the system's
 * picker, so it looks the same everywhere and matches the site.
 */

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'fumadocs-ui/components/ui/popover';
import { useState, type KeyboardEvent, type PointerEvent } from 'react';

/** Colors that read on the preview's dark background, the brand's first. */
const SWATCHES = [
  ['#f2f4f7', 'White'],
  ['#9aa0aa', 'Gray'],
  ['#ff5a1f', 'Soundor orange'],
  ['#facc15', 'Yellow'],
  ['#4ade80', 'Green'],
  ['#38bdf8', 'Blue'],
  ['#a78bfa', 'Violet'],
  ['#f472b6', 'Pink'],
] as const;

/** Hue 0–360, saturation and value 0–1. */
interface Hsv {
  readonly h: number;
  readonly s: number;
  readonly v: number;
}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** `f60` → `#ff6600`; undefined when not a hex color. */
export function parseHex(text: string): string | undefined {
  const match = HEX.exec(text.trim());
  if (!match) return undefined;
  const digits = match[1]!.toLowerCase();
  return `#${digits.length === 3 ? [...digits].map((digit) => digit + digit).join('') : digits}`;
}

function hexToHsv(hex: string): Hsv {
  const [r, g, b] = [1, 3, 5].map(
    (start) => parseInt(hex.slice(start, start + 2), 16) / 255,
  ) as [number, number, number];
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
  }
  return {
    h: (h * 60 + 360) % 360,
    s: max === 0 ? 0 : delta / max,
    v: max,
  };
}

function hsvToHex({ h, s, v }: Hsv): string {
  const channel = (n: number) => {
    const k = (n + h / 60) % 6;
    const value = v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(5)}${channel(3)}${channel(1)}`;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Pointer handlers that report the position within the element, 0–1 on each
 * axis, from the press until the release, even outside it.
 */
function useDrag(onMove: (x: number, y: number) => void) {
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    onMove(
      clamp((event.clientX - box.left) / box.width),
      clamp((event.clientY - box.top) / box.height),
    );
  };
  return {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.focus();
      move(event);
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) move(event);
    },
  };
}

/** Arrow keys as a step on each axis: [x, y], y down. Shift steps by 10. */
function arrowStep(event: KeyboardEvent): [number, number] | undefined {
  const step = event.shiftKey ? 10 : 1;
  const steps: Record<string, [number, number]> = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: [0, -step],
    ArrowDown: [0, step],
  };
  return steps[event.key];
}

export function ColorPicker({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  // Hue and saturation are kept apart from the hex: at gray or black the hex
  // loses them, and the area and slider should not jump. The picker is the
  // only thing that changes the color, so the two never disagree.
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const [text, setText] = useState(value.slice(1));

  const setColor = (next: Hsv) => {
    setHsv(next);
    const hex = hsvToHex(next);
    setText(hex.slice(1));
    onChange(hex);
  };
  const setHex = (hex: string) => {
    setHsv(hexToHsv(hex));
    setText(hex.slice(1));
    onChange(hex);
  };

  const area = useDrag((x, y) => setColor({ ...hsv, s: x, v: 1 - y }));
  const hue = useDrag((x) => setColor({ ...hsv, h: x * 360 }));
  const invalid = parseHex(text) === undefined;
  const hueColor = hsvToHex({ h: hsv.h, s: 1, v: 1 });

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span id="color-label">Color</span>
      <Popover>
        <PopoverTrigger
          aria-labelledby="color-label color-value"
          className="flex h-8 items-center gap-2 rounded-md border bg-fd-card px-2 transition-colors outline-none hover:bg-fd-accent focus-visible:ring-2 focus-visible:ring-fd-primary"
        >
          <span
            aria-hidden
            className="size-4 rounded-sm border border-black/10 dark:border-white/15"
            style={{ backgroundColor: value }}
          />
          <code id="color-value" className="text-xs">
            {value}
          </code>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-60 min-w-0 bg-fd-popover p-3"
          aria-label="Color picker"
        >
          <div
            role="slider"
            tabIndex={0}
            aria-label="Saturation and brightness"
            aria-valuetext={`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
            aria-valuenow={Math.round(hsv.s * 100)}
            data-testid="color-area"
            {...area}
            onKeyDown={(event) => {
              const step = arrowStep(event);
              if (!step) return;
              event.preventDefault();
              setColor({
                ...hsv,
                s: clamp(hsv.s + step[0] / 100),
                v: clamp(hsv.v - step[1] / 100),
              });
            }}
            className="relative h-36 cursor-crosshair touch-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-fd-primary"
            style={{
              backgroundColor: hueColor,
              backgroundImage:
                'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)',
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.4)]"
              style={{
                left: `${hsv.s * 100}%`,
                top: `${(1 - hsv.v) * 100}%`,
                backgroundColor: value,
              }}
            />
          </div>

          <div
            role="slider"
            tabIndex={0}
            aria-label="Hue"
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={Math.round(hsv.h)}
            {...hue}
            onKeyDown={(event) => {
              const step = arrowStep(event);
              if (!step) return;
              event.preventDefault();
              const delta = step[0] - step[1];
              setColor({
                ...hsv,
                h: Math.min(360, Math.max(0, hsv.h + delta)),
              });
            }}
            className="relative mt-3 h-3 cursor-pointer touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-fd-primary"
            style={{
              backgroundImage:
                'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.4)]"
              style={{
                left: `${(hsv.h / 360) * 100}%`,
                backgroundColor: hueColor,
              }}
            />
          </div>

          <label className="mt-3 flex h-8 items-center gap-1.5 rounded-md border bg-fd-card px-2 focus-within:ring-2 focus-within:ring-fd-primary">
            <span className="text-fd-muted-foreground">#</span>
            <input
              type="text"
              aria-label="Hex color"
              aria-invalid={invalid}
              value={text}
              maxLength={7}
              spellCheck={false}
              autoComplete="off"
              onChange={(event) => {
                const next = event.target.value.replace(/^#/, '');
                setText(next);
                const color = parseHex(next);
                if (color) {
                  setHsv(hexToHsv(color));
                  onChange(color);
                }
              }}
              onBlur={() => setText(value.slice(1))}
              className={`w-full min-w-0 bg-transparent font-mono text-xs outline-none ${
                invalid ? 'text-red-500' : ''
              }`}
            />
          </label>

          <div className="mt-3 grid grid-cols-8 gap-1.5">
            {SWATCHES.map(([color, name]) => (
              <button
                key={color}
                type="button"
                aria-label={name}
                aria-pressed={value === color}
                title={`${name} ${color}`}
                onClick={() => setHex(color)}
                className={`aspect-square rounded-full border border-black/10 ring-offset-2 ring-offset-fd-popover transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-fd-primary dark:border-white/15 ${
                  value === color ? 'ring-2 ring-fd-primary' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
