import NS from '@core/app/constants/namespaces';
import findDefs from '@core/app/svgedit/utils/findDef';

import svgStringToCanvas from './svgStringToCanvas';

export type StandaloneSvgOptions = {
  /** Markup to place inside the svg, in order. Elements are serialized with `outerHTML`. */
  content: Array<Element | null | string | undefined>;
  /**
   * The `<defs>` to carry along. Defaults to the canvas defs, which is what content lifted off the
   * canvas references. Pass an element to use a clone or subset, or `false` when the content
   * references nothing.
   */
  defs?: Element | false;
  /** A `<style>` block from `buildWebFontFaceCss`, needed whenever the content has live text. */
  fontFaceCss?: string;
  /** The svg's own width/height, in the same units as `viewBox`. */
  size: { height: number; width: number };
  /** The region of canvas coordinates to draw. */
  viewBox: { height: number; width: number; x: number; y: number };
};

const NAMESPACES = `xmlns:svg="${NS.SVG}" xmlns="${NS.SVG}" xmlns:xlink="${NS.XLINK}"`;

/**
 * Serialize canvas content as a self-contained svg document.
 *
 * Anything rendered outside the app — through an `<img>`, a pdf, a backend request — is an isolated
 * document that resolves nothing from the editor: the defs the content references have to travel
 * with it, and so do the webfonts, or the text falls back to another face. Blob urls do not survive
 * the trip at all, which is why `use` elements have to point at vector symbols first (see
 * `switchSymbolWrapper`).
 */
export const buildStandaloneSvg = ({
  content,
  defs = findDefs(),
  fontFaceCss = '',
  size,
  viewBox,
}: StandaloneSvgOptions): string => {
  const body = content
    .filter((item) => item !== null && item !== undefined && item !== '')
    .map((item) => (typeof item === 'string' ? item : item!.outerHTML))
    .join('');

  return `
    <svg
      width="${size.width}"
      height="${size.height}"
      viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}"
      ${NAMESPACES}
    >
      ${fontFaceCss}
      ${defs === false ? '' : defs.outerHTML}
      ${body}
    </svg>`;
};

/**
 * Build the svg and draw it to a canvas.
 *
 * @param renderSize pixel size of the canvas, when it differs from the svg's own size — the svg is
 *   scaled to fit, so a smaller one renders the same drawing at a lower resolution.
 */
export const rasterizeStandaloneSvg = async (
  options: StandaloneSvgOptions,
  renderSize: { height: number; width: number } = options.size,
): Promise<HTMLCanvasElement> => svgStringToCanvas(buildStandaloneSvg(options), renderSize.width, renderSize.height);
