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

import { getDesignLayers } from './designLayers';

interface BBox {
  height: number;
  width: number;
  x: number;
  y: number;
}

/**
 * Offset closed contour polygons outward by `delta` (scaled units) with round
 * joins, filling concavities narrower than 2 × `delta` and unioning overlaps.
 * Uses etClosedLine (not etClosedPolygon) to avoid spike artifacts at small
 * deltas; the resulting band is filtered to outer boundaries only, matching the
 * backend's RETR_EXTERNAL silhouettes. Returns null on failure.
 */
const offsetContourPaths = async (paths: Path[], delta: number): Promise<null | Path[]> => {
  const ClipperLib = getClipperLib();

  try {
    // normalize orientation so a positive delta offsets outward, and drop
    // duplicate / near-collinear vertices before offsetting
    const simplified = ClipperLib.Clipper.SimplifyPolygons(paths, ClipperLib.PolyFillType.pftNonZero) as Path[];
    let result = ClipperLib.Clipper.CleanPolygons(simplified, 0.05 * SCALE_FACTOR) as Path[];
    const clipper = new ClipperBase('offset', MITER_LIMIT, ARC_TOLERANCE);

    try {
      await clipper.addPaths(result, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedLine);
      result = (await clipper.execute([], delta)) as Path[];
    } finally {
      clipper.terminate();
    }

    // inner band sides and holes have the opposite winding to outer boundaries
    result = result.filter((path) => ClipperLib.Clipper.Orientation(path) as boolean);
    // the offset leaves micro-edges at integer resolution; clean them off
    result = ClipperLib.Clipper.CleanPolygons(result, 0.05 * SCALE_FACTOR) as Path[];
    result = result.filter((path) => path.length > 2);

    return result.length > 0 ? result : null;
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
 * Render all visible layers into one raster of the design bounding box on a
 * transparent background, at canvas resolution (1 raster px == 1 canvas unit).
 */
const rasterizeDesign = async (designBBox: BBox): Promise<Blob | null> => {
  const width = Math.max(1, Math.ceil(designBBox.width));
  const height = Math.max(1, Math.ceil(designBBox.height));
  // serialization must happen inside switchSymbolWrapper: image symbols use blob
  // urls that cannot load in a standalone svg string, so uses are switched to the
  // original vector symbols while the string is built
  const canvas = await switchSymbolWrapper(() => {
    const layersHtml = getDesignLayers()
      .map((layerGroup) => {
        const clone = layerGroup.cloneNode(true) as SVGGElement;

        clone.removeAttribute('clip-path');

        return clone.outerHTML;
      })
      .join('');
    const svgString = `
    <svg
      width="${width}"
      height="${height}"
      viewBox="${designBBox.x} ${designBBox.y} ${width} ${height}"
      xmlns:svg="http://www.w3.org/2000/svg"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      ${findDefs().outerHTML}
      ${layersHtml}
    </svg>`;

    return svgStringToCanvas(svgString, width, height);
  });

  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
};

/** Rasterize the design and trace its silhouette; empty result signals a fallback */
const traceDesignContours = async (designBBox: BBox): Promise<Array<Array<[number, number]>>> => {
  const blob = await rasterizeDesign(designBBox);

  if (!blob) return [];

  // without dilation thin strokes trace to tiny silhouettes, so the backend's
  // default min_area (100 px²) would drop them; epsilon keeps its default (1)
  const { contours } = await getOpenCV().imageContour(blob, { min_area: 1 });

  return contours;
};

/** Round-cornered rectangle around the design bbox, used when the backend is unavailable */
const fallbackRectD = (designBBox: BBox, distancePx: number): string => {
  const { height, width, x, y } = designBBox;
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
export const computeCutPathD = async (designBBox: BBox | null, distanceMm: number): Promise<null | string> => {
  if (!designBBox || designBBox.width === 0 || designBBox.height === 0) return null;

  const distancePx = Math.max(1, Math.round(distanceMm * dpmm));

  try {
    if (!cachedContours) {
      const promise = traceDesignContours(designBBox);

      cachedContours = { promise };
      // a failed request must not stick: the next call retries
      promise.catch(() => {
        if (cachedContours?.promise === promise) cachedContours = null;
      });
    }

    const contours = await cachedContours.promise;

    if (contours.length === 0) return fallbackRectD(designBBox, distancePx);

    const solutionPaths: Path[] = contours.map((contour) =>
      contour.map(([px, py]) => ({
        X: Math.round((designBBox.x + px) * SCALE_FACTOR),
        Y: Math.round((designBBox.y + py) * SCALE_FACTOR),
      })),
    );
    const offsetPaths = await offsetContourPaths(solutionPaths, Math.round(distanceMm * dpmm * SCALE_FACTOR));

    if (!offsetPaths) return fallbackRectD(designBBox, distancePx);

    return buildSvgPathD(offsetPaths, useGlobalPreferenceStore.getState()['simplify_clipper_path']) || null;
  } catch (error) {
    console.warn('Failed to compute design contour, falling back to bounding box', error);

    return fallbackRectD(designBBox, distancePx);
  }
};
