import type { Path } from 'fontkit';

/**
 * Single-line (stroke / engraving) fonts draw each stroke as a centreline instead of an outline.
 * Glyph formats have no notion of an open contour (TrueType contours are implicitly closed, CFF
 * `endchar` closes too), so fontkit ends every contour with `closePath`. For a single-line font
 * that adds a stroke the designer never drew: the bottom of an "A" from foot to foot, the chord
 * across a "C".
 *
 * Whether a text uses a single-line font is the user's call, stored on the text element: telling it
 * from the glyphs is a guess, and a wrong guess drops the closing edge of every outline contour.
 * The attribute decides on its own, whether or not the dev gate that shows the switch is on.
 */
export const SINGLE_LINE_FONT_ATTR = 'data-single-line';

/** Gap between a contour's ends, as a fraction of the font size, below which it is meant to be closed. */
export const CLOSE_GAP_RATIO = 0.01;

type Point = [number, number];

export const isSingleLineFont = (elem: Element): boolean => elem.getAttribute(SINGLE_LINE_FONT_ATTR) === 'true';

export const isAllSingleLineFont = (elems: Element[]): boolean => elems.length > 0 && elems.every(isSingleLineFont);

const formatNumber = (value: number) => Math.round(value * 100) / 100;

const SVG_COMMANDS: Record<string, string> = {
  bezierCurveTo: 'C',
  lineTo: 'L',
  moveTo: 'M',
  quadraticCurveTo: 'Q',
};

/**
 * Same output as fontkit's `Path.toSVG()`, except that a contour whose last point does not come back
 * to its first stays open: its `closePath` is dropped. Contours whose ends meet within `closeGap`
 * (single-line fonts leave a hair gap in an "O") keep their `Z`.
 */
export const pathToOpenSvg = (path: Pick<Path, 'commands'>, closeGap: number): string => {
  let start: null | Point = null;
  let last: null | Point = null;

  return path.commands
    .map(({ args, command }) => {
      if (command === 'closePath') {
        const isClosed = start && last && Math.hypot(last[0] - start[0], last[1] - start[1]) <= closeGap;

        start = null;

        return isClosed ? 'Z' : '';
      }

      if (args.length >= 2) last = [args[args.length - 2], args[args.length - 1]];

      if (command === 'moveTo') start = last;

      return `${SVG_COMMANDS[command]}${args.map(formatNumber).join(' ')}`;
    })
    .join('');
};
