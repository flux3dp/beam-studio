import { dpmm } from '@core/app/actions/beambox/constant';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { findDefs } from '@core/app/svgedit/utils/findDef';
import getOpenCV from '@core/helpers/api/open-cv';
import ClipperBase from '@core/helpers/clipper/clipper';
import getClipperLib from '@core/helpers/clipper/getClipperLib';
import { buildSvgPathD } from '@core/helpers/clipper/offset/buildSvgPathD';
import type { Path } from '@core/helpers/clipper/offset/constants';
import { ARC_TOLERANCE, MITER_LIMIT, SCALE_FACTOR } from '@core/helpers/clipper/offset/constants';
import { switchSymbolWrapper } from '@core/helpers/file/export/utils/common';
import { svgStringToCanvas } from '@core/helpers/image/svgStringToCanvas';
import { buildWebFontFaceCss } from '@core/helpers/image/webFontFaceCss';
import getMaxStrokeWidth from '@core/helpers/symbol-helper/getMaxStrokeWidth';
import { convertVariableText } from '@core/helpers/variableText';

import { getContentsLayers } from './contentsLayers';

interface BBox {
  height: number;
  width: number;
  x: number;
  y: number;
}

/**
 * Offset closed contour polygons by `delta` (scaled units) with round joins.
 * Outward (delta > 0) fills concavities narrower than 2 × `delta` and unions
 * overlaps, using etClosedLine (not etClosedPolygon) to avoid spike artifacts at
 * small deltas; the resulting band is filtered to outer boundaries only, matching
 * the backend's RETR_EXTERNAL silhouettes. Inward (delta <= 0) erodes the
 * silhouettes as polygons, so parts narrower than 2 × |delta| disappear.
 * Returns [] when nothing survives the erosion, null on failure.
 */
const offsetContourPaths = async (paths: Path[], delta: number): Promise<null | Path[]> => {
  const ClipperLib = getClipperLib();

  try {
    let result: Path[];
    const clipper = new ClipperBase('offset', MITER_LIMIT, ARC_TOLERANCE);

    try {
      // a band around a line has no inside, so only a polygon offset can shrink
      const endType = delta > 0 ? ClipperLib.EndType.etClosedLine : ClipperLib.EndType.etClosedPolygon;

      await clipper.addPaths(paths, ClipperLib.JoinType.jtRound, endType);
      result = (await clipper.execute([], delta)) as Path[];
    } finally {
      clipper.terminate();
    }

    // inner band sides and holes have the opposite winding to outer boundaries
    result = result.filter((path) => ClipperLib.Clipper.Orientation(path) as boolean);
    // the offset leaves micro-edges at integer resolution; clean them off
    result = ClipperLib.Clipper.CleanPolygons(result, 0.05 * SCALE_FACTOR) as Path[];
    result = result.filter((path) => path.length > 2);

    return result;
  } catch (error) {
    console.warn('Failed to offset contour with clipper', error);

    return null;
  }
};

/**
 * The design is fixed while the dialog is open, so the backend-traced contours
 * depend only on it: cache them so adjusting the offset distance stays a pure
 * frontend operation. The cache holds the promise, so racing callers share one
 * `image_contour` upload. Cleared when the dialog opens.
 */
let cachedContours: null | { promise: Promise<Array<Array<[number, number]>>> } = null;

export const clearRasterCache = (): void => {
  cachedContours = null;
};

/**
 * Render all visible layers into one raster of `rasterBBox` on a transparent
 * background, at canvas resolution (1 raster px == 1 canvas unit).
 */
const rasterizeDesign = async (rasterBBox: BBox): Promise<Blob | null> => {
  const width = Math.max(1, Math.ceil(rasterBBox.width));
  const height = Math.max(1, Math.ceil(rasterBBox.height));
  // serialization must happen inside switchSymbolWrapper: image symbols use blob
  // urls that cannot load in a standalone svg string, so uses are switched to the
  // original vector symbols while the string is built
  const canvas = await switchSymbolWrapper(async () => {
    const revertVariableText = await convertVariableText();

    try {
      const contentsLayers = getContentsLayers();
      // the traced silhouette becomes the cut path, so the raster has to use the same faces the
      // canvas does: the isolated <img> render cannot see the app document's webfonts
      const fontFaceCss = await buildWebFontFaceCss(contentsLayers);
      const layersHtml = contentsLayers
        .map((layerGroup) => {
          const clone = layerGroup.cloneNode(true) as SVGGElement;

          clone.removeAttribute('clip-path');
          // content layers can be hidden (tagged by Finish)
          clone.removeAttribute('display');

          return clone.outerHTML;
        })
        .join('');
      const svgString = `
      <svg
        width="${width}"
        height="${height}"
        viewBox="${rasterBBox.x} ${rasterBBox.y} ${width} ${height}"
        xmlns:svg="http://www.w3.org/2000/svg"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
      >
        ${fontFaceCss}
        ${findDefs().outerHTML}
        ${layersHtml}
      </svg>`;

      return await svgStringToCanvas(svgString, width, height);
    } finally {
      revertVariableText?.();
    }
  });

  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
};

/**
 * Rasterize the design (bbox padded so edge strokes survive) and trace its silhouette, in canvas
 * coordinates; empty result signals a fallback
 */
const traceDesignContours = async (printingContentsBBox: BBox): Promise<Array<Array<[number, number]>>> => {
  // getBBox ignores strokes, so pad by half the widest one or edge strokes get clipped
  const pad = Math.ceil(Math.max(0, ...getContentsLayers().map(getMaxStrokeWidth)) / 2);
  const rasterBBox = {
    height: printingContentsBBox.height + 2 * pad,
    width: printingContentsBBox.width + 2 * pad,
    x: printingContentsBBox.x - pad,
    y: printingContentsBBox.y - pad,
  };
  const blob = await rasterizeDesign(rasterBBox);

  if (!blob) return [];

  // without dilation thin strokes trace to tiny silhouettes, so the backend's
  // default min_area (100 px²) would drop them; epsilon keeps its default (1)
  const { contours } = await getOpenCV().imageContour(blob, { min_area: 1 });

  // findContours returns boundary pixel indices; pixel i spans [i, i + 1), so its centre is i + 0.5
  return contours.map((contour) => contour.map(([px, py]) => [rasterBBox.x + px + 0.5, rasterBBox.y + py + 0.5]));
};

/**
 * Rectangle around the design bbox, used when the backend is unavailable: round-cornered for an
 * outward offset, a plain inset for an inward one (null when the inset leaves nothing)
 */
const fallbackRectD = (printingContentsBBox: BBox, distancePx: number): null | string => {
  const { height, width, x, y } = printingContentsBBox;

  if (distancePx <= 0) {
    const inset = -distancePx;
    const w = width - 2 * inset;
    const h = height - 2 * inset;

    // a zero-area rectangle has nothing to cut around (thin line at offset 0 included)
    if (w <= 0 || h <= 0) return null;

    return `M${x + inset},${y + inset} h${w} v${h} h-${w} Z`;
  }

  const r = distancePx;

  return (
    `M${x - r},${y} v${height} a${r},${r} 0 0 0 ${r},${r} h${width} a${r},${r} 0 0 0 ${r},-${r} ` +
    `v-${height} a${r},${r} 0 0 0 -${r},-${r} h-${width} a${r},${r} 0 0 0 -${r},${r} Z`
  );
};

/**
 * Compute the outline cut path of the whole design: visible layers are rendered
 * to a bitmap, fluxghost's `image_contour` traces the alpha silhouette, and a
 * round-join ClipperOffset by `distanceMm` offsets and smooths it. Returns the
 * path `d` in canvas coordinates, falling back to a rounded rectangle when the
 * backend or the offset fails.
 */
export const computeContourPathD = async (
  printingContentsBBox: BBox | null,
  distanceMm: number,
): Promise<null | string> => {
  if (!printingContentsBBox || (printingContentsBBox.width === 0 && printingContentsBBox.height === 0)) return null;

  const distancePx = Math.round(distanceMm * dpmm);

  try {
    if (!cachedContours) {
      const promise = traceDesignContours(printingContentsBBox);

      cachedContours = { promise };
      // a failed request must not stick: the next call retries
      promise.catch(() => {
        if (cachedContours?.promise === promise) cachedContours = null;
      });
    }

    const contours = await cachedContours.promise;

    if (contours.length === 0) return fallbackRectD(printingContentsBBox, distancePx);

    const solutionPaths: Path[] = contours.map((contour) =>
      contour.map(([x, y]) => ({ X: Math.round(x * SCALE_FACTOR), Y: Math.round(y * SCALE_FACTOR) })),
    );
    // the traced pixel centres sit half a raster px (1 px = 1 canvas unit) inside the real edge:
    // grow by it so offset 0 cuts on the edge (a 5 mm square otherwise traced to 4.9 mm)
    const offsetPaths = await offsetContourPaths(solutionPaths, Math.round((distanceMm * dpmm + 0.5) * SCALE_FACTOR));

    if (!offsetPaths) return fallbackRectD(printingContentsBBox, distancePx);

    // the inset swallowed the whole design: no cut path, not a fallback rectangle
    if (offsetPaths.length === 0) return null;

    return buildSvgPathD(offsetPaths, useGlobalPreferenceStore.getState()['simplify_clipper_path']) || null;
  } catch (error) {
    console.warn('Failed to compute design contour, falling back to bounding box', error);

    return fallbackRectD(printingContentsBBox, distancePx);
  }
};
