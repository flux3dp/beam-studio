import selectionManager from '@core/app/svgedit/selection';
import { buildWebFontFaceCss } from '@core/helpers/image/webFontFaceCss';
import { convertAllTextToPath } from '@core/helpers/path/convertToPath';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { Units } from '@core/helpers/units';
import { convertVariableText } from '@core/helpers/variableText';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { switchSymbolWrapper } from './common';
import { checkNounProjectElements, removeNPElementsWrapper } from './nounProject';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

export type CanvasContentOptions = {
  /** Interactive pre-checks. A check the user declines aborts the whole export. */
  checks?: {
    nounProject?: boolean;
  };
  convert?: {
    /**
     * Point `use` back at the original vector symbols. Image symbols reference blob urls that
     * only resolve inside the editing session, so anything serialized while they are active is
     * unreadable outside the app.
     */
    symbol?: boolean;
    /** Convert text to paths, for consumers that cannot resolve fonts. */
    text?: boolean;
    /** Bake variable text down to its current value. */
    variableText?: boolean;
  };
  insert?: {
    /**
     * Inline webfont bytes into the output. For raster targets, which render through an isolated
     * `<img>` that cannot see the app document's fonts. Alternative to `convert.text`, not a
     * companion to it.
     */
    webFontFace?: boolean;
  };
  output?: {
    unit?: Units;
  };
  remove?: {
    /** Strip the scene mask so the output is not clipped to the workarea. */
    clipPath?: boolean;
    /** Drop Noun Project elements nested inside another Noun Project element. */
    npElements?: boolean;
    selection?: boolean;
    unusedDefs?: boolean;
  };
};

/**
 * The fixed option set per export target. Call sites name a target; they never assemble options
 * themselves, so a policy change happens here once instead of in every handler.
 */
export const canvasContentPresets = {
  /** `.bvg` scene file: keeps text and layer structure editable for re-opening in Beam Studio. */
  bvg: {
    checks: { nounProject: true },
    convert: { symbol: true, variableText: true },
    remove: { npElements: true, selection: true, unusedDefs: true },
  },
  /**
   * Raster targets (jpg / png). Text stays as text and the fonts ride along inline, so the render
   * resolves the same faces the canvas does.
   *
   * Note: unlike bvg/svg this runs no Noun Project check and keeps nested Noun Project elements,
   * matching the behavior these targets have always had. Whether that divergence is intended has
   * not been decided.
   */
  image: {
    convert: { symbol: true, variableText: true },
    insert: { webFontFace: true },
    remove: { selection: true, unusedDefs: true },
  },
  /** `.svg` for other software: text as paths, mm units, no scene mask. */
  svg: {
    checks: { nounProject: true },
    convert: { symbol: true, text: true, variableText: true },
    output: { unit: 'mm' },
    remove: { clipPath: true, npElements: true, selection: true, unusedDefs: true },
  },
} as const satisfies Record<string, CanvasContentOptions>;

export type CanvasContentTarget = keyof typeof canvasContentPresets;

/**
 * Detach every layer's clip-path, remembering what each one had. Layers are not required to carry
 * the scene mask, so the revert restores the original value per layer instead of stamping one on.
 */
const detachLayerClipPaths = (): (() => void) => {
  const layers = Array.from(document.querySelectorAll<SVGGElement>('#svgcontent g.layer'));
  const originals = layers.map((layer) => [layer, layer.getAttribute('clip-path')] as const);

  layers.forEach((layer) => layer.removeAttribute('clip-path'));

  return () => {
    originals.forEach(([layer, clipPath]) => {
      if (clipPath === null) layer.removeAttribute('clip-path');
      else layer.setAttribute('clip-path', clipPath);
    });
  };
};

/**
 * Run the target's pre-checks and the clean-up that is not reverted afterwards.
 *
 * Kept separate from `getCanvasContent` because the checks are questions to the user: they belong
 * before the save dialog, while the content itself is only built once a path is chosen.
 *
 * @returns false when the user declined a check, in which case the export must not proceed.
 */
export const prepareCanvasContent = async (target: CanvasContentTarget): Promise<boolean> => {
  const { checks = {}, remove = {} } = canvasContentPresets[target] as CanvasContentOptions;

  if (checks.nounProject && !(await checkNounProjectElements())) return false;

  if (remove.selection) selectionManager.clearSelection();

  if (remove.unusedDefs) svgCanvas.removeUnusedDefs();

  return true;
};

/**
 * Serialize the canvas for an export target. Every change made to the live canvas along the way is
 * reverted before returning, including when the serialization throws.
 *
 * Call `prepareCanvasContent` for the same target first.
 */
export const getCanvasContent = async (target: CanvasContentTarget): Promise<string> => {
  const { convert = {}, insert = {}, output = {}, remove = {} } = canvasContentPresets[target] as CanvasContentOptions;
  const reverts: Array<(() => void) | null | undefined> = [];

  try {
    if (convert.variableText) reverts.push(await convertVariableText());

    if (convert.text) reverts.push((await convertAllTextToPath()).revert);

    if (remove.clipPath) reverts.push(detachLayerClipPaths());

    const serialize = () => svgCanvas.getSvgString({ unit: output.unit });
    const withSymbol = convert.symbol ? () => switchSymbolWrapper(serialize) : serialize;
    const svgString = await (remove.npElements ? removeNPElementsWrapper(withSymbol) : withSymbol());

    if (!insert.webFontFace) return svgString;

    const fontFaceCss = await buildWebFontFaceCss([document.getElementById('svgcontent')!]);

    return svgString.replace(/<svg[^>]*>/, (svgTag) => svgTag + fontFaceCss);
  } finally {
    reverts.toReversed().forEach((revert) => revert?.());
  }
};
