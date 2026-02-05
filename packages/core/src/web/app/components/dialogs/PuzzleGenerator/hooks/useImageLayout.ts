import { useMemo } from 'react';

import type { PuzzleGeometry } from '../geometry';
import type { PuzzleState } from '../types';

const useImageLayout = (
  konvaImage: HTMLImageElement | undefined,
  imageState: PuzzleState['image'],
  puzzleLayout: PuzzleGeometry['layout'],
) =>
  useMemo(() => {
    if (!konvaImage || !imageState.enabled || konvaImage.width === 0 || konvaImage.height === 0) return null;

    const { bleed, offsetX, offsetY, zoom } = imageState;
    const targetW = puzzleLayout.width + bleed * 2;
    const targetH = puzzleLayout.height + bleed * 2;

    const coverScale = Math.max(targetW / konvaImage.width, targetH / konvaImage.height);
    const scale = coverScale * (zoom / 100);
    const drawW = konvaImage.width * scale;
    const drawH = konvaImage.height * scale;

    return { height: drawH, width: drawW, x: -drawW / 2 + offsetX, y: -drawH / 2 + offsetY };
  }, [konvaImage, imageState, puzzleLayout.width, puzzleLayout.height]);

export default useImageLayout;
