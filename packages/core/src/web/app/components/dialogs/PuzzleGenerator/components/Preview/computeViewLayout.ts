import { match } from 'ts-pattern';

import { LAYER_GAP, type ViewMode } from '../../constants';
import type { PuzzleGeometry } from '../../types';

export interface ViewLayout {
  boardX: number;
  offsetY: number;
  raisedEdgesX: number;
  scale: number;
  showExploded: boolean;
}

const computeViewLayout = (
  mode: ViewMode,
  containerW: number,
  containerH: number,
  padding: number,
  paddingBottom: number,
  geo: PuzzleGeometry,
  borderEnabled: boolean,
): ViewLayout => {
  const isExploded = mode === 'exploded';
  const showExploded = isExploded && borderEnabled;
  const hasFrameExpansion = geo.frameWidth > geo.layout.width;

  const totalWidth = match({ hasFrameExpansion, showExploded })
    .with({ showExploded: true }, () => geo.frameWidth * 2 + LAYER_GAP)
    .with({ hasFrameExpansion: true }, () => geo.frameWidth)
    .otherwise(() => geo.layout.width);
  const totalHeight = hasFrameExpansion ? geo.frameHeight : geo.layout.height;

  const availW = containerW - padding * 2;
  const availH = containerH - padding - paddingBottom;
  const scale = Math.min(availW / totalWidth, availH / totalHeight) || 1;

  return {
    boardX: showExploded ? totalWidth / 2 - geo.frameWidth / 2 : 0,
    offsetY: (padding - paddingBottom) / 2,
    raisedEdgesX: showExploded ? -totalWidth / 2 + geo.frameWidth / 2 : 0,
    scale,
    showExploded,
  };
};

export default computeViewLayout;
