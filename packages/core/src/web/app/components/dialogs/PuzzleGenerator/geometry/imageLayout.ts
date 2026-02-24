/**
 * Image layout utilities for "center and cover" placement.
 *
 * This module provides shared image placement logic used by both:
 * - Preview (via direct call in Preview/index.tsx)
 * - Export (via svgExport)
 *
 * All coordinates are in mm, centered at origin (0, 0).
 */

import type { ImageState, PuzzleLayout } from '../types';

export interface ImagePlacement {
  height: number;
  width: number;
  x: number;
  y: number;
}

/**
 * Computes "center and cover" image placement in centered coordinates (mm).
 *
 * The image is scaled to cover the target area (puzzle dimensions + bleed),
 * then adjusted by zoom factor and percentage-based offsets.
 *
 * @param imgWidth - Natural width of the image in pixels
 * @param imgHeight - Natural height of the image in pixels
 * @param puzzleLayout - Puzzle dimensions { width, height } in mm
 * @param imageState - Image settings (bleed, zoom, offsets)
 * @returns Placement { x, y, width, height } in mm, centered at origin, or null if invalid
 */
export const computeImagePlacement = (
  imgWidth: number,
  imgHeight: number,
  puzzleLayout: Pick<PuzzleLayout, 'height' | 'width'>,
  imageState: Pick<ImageState, 'bleed' | 'offsetX' | 'offsetY' | 'zoom'>,
): ImagePlacement | null => {
  // Early return for zero-dimension images to prevent NaN/Infinity
  if (imgWidth === 0 || imgHeight === 0) {
    console.warn('Cannot compute image placement for zero-dimension image');

    return null;
  }

  const { bleed, offsetX, offsetY, zoom } = imageState;
  const { height: puzzleH, width: puzzleW } = puzzleLayout;

  // Target area includes bleed on all sides
  const targetW = puzzleW + bleed * 2;
  const targetH = puzzleH + bleed * 2;

  // "Cover" scale: image fills target area (may overflow)
  const coverScale = Math.max(targetW / imgWidth, targetH / imgHeight);
  const scale = coverScale * (zoom / 100);

  const drawW = imgWidth * scale;
  const drawH = imgHeight * scale;

  // Convert percentage offset to mm: X based on puzzle width, Y based on puzzle height
  const offsetXMm = (offsetX / 100) * puzzleW;
  const offsetYMm = (offsetY / 100) * puzzleH;

  return {
    height: drawH,
    width: drawW,
    x: -drawW / 2 + offsetXMm,
    y: -drawH / 2 + offsetYMm,
  };
};
