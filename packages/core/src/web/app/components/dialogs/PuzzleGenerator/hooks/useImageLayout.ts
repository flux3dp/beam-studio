import { useMemo } from 'react';

import { computeImagePlacement, type ImagePlacement } from '../geometry/imageLayout';
import type { PuzzleGeometry, PuzzleState } from '../types';

/**
 * Computes "center and cover" image layout for the Konva preview.
 *
 * Uses the shared computeImagePlacement utility to ensure preview and export
 * render identically.
 */
const useImageLayout = (
  konvaImage: HTMLImageElement | undefined,
  imageState: PuzzleState['image'],
  puzzleLayout: PuzzleGeometry['layout'],
): ImagePlacement | null =>
  useMemo(() => {
    if (!konvaImage || !imageState.enabled) return null;

    return computeImagePlacement(konvaImage.width, konvaImage.height, puzzleLayout, imageState);
  }, [konvaImage, imageState, puzzleLayout]);

export default useImageLayout;
