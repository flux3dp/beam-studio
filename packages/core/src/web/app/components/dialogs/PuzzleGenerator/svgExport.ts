import svgEditor from '@core/app/actions/beambox/svg-editor';
import useLayerStore from '@core/app/stores/layer/layerStore';
import layerManager from '@core/app/svgedit/layer/layerManager';
import importSvgString from '@core/app/svgedit/operations/import/importSvgString';
import updateLayerColor from '@core/helpers/color/updateLayerColor';
import updateLayerColorFilter from '@core/helpers/color/updateLayerColorFilter';

import { computeExportLayout, computePuzzleGeometry, type PuzzleGeometry } from './puzzleGeometry';
import { getShapeMetadata } from './shapeGenerators';
import type { PuzzleState, PuzzleTypeConfig } from './types';

// Colors matching the exploded view preview
const EXPORT_COLORS = {
  boardBase: '#8bc34a', // Green - border color in exploded view
  outlines: '#ffc107', // Amber - outline color in exploded view
  pieces: '#f44336', // Red - inner color in exploded view
  raisedEdges: '#3f51b5', // Blue - boundary color in exploded view
} as const;

/** Sets the color of a layer after import */
const setLayerColor = async (layerName: string, color: string): Promise<void> => {
  const layer = layerManager.getLayerByName(layerName);

  if (!layer) {
    console.warn(`setLayerColor: Layer "${layerName}" not found after import`);

    return;
  }

  layer.setColor(color);

  const layerElement = layer.getGroup();

  updateLayerColorFilter(layerElement);
  await updateLayerColor(layerElement);
};

interface SvgStringOptions {
  clipPathData?: string;
  elementOffsetX?: number;
  height: number;
  pathData: string;
  width: number;
}

/** Unified SVG string generator with optional clipping */
const createSvgString = ({ clipPathData, elementOffsetX = 0, height, pathData, width }: SvgStringOptions): string => {
  const [tx, ty] = [width / 2 + elementOffsetX, height / 2];
  const clipAttr = clipPathData ? 'clip-path="url(#boundaryClip)"' : '';
  const defs = clipPathData ? `<defs><clipPath id="boundaryClip"><path d="${clipPathData}"/></clipPath></defs>` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}">
    ${defs}
    <g transform="translate(${tx}, ${ty})">
      <g ${clipAttr}>
        <path d="${pathData}" fill="none" stroke="#000000" stroke-width="0.1"/>
      </g>
    </g>
  </svg>`;
};

/** Helper to import a layer with color */
const importLayer = async (layerName: string, color: string, svgOptions: SvgStringOptions): Promise<void> => {
  await importSvgString(createSvgString(svgOptions), { layerName, type: 'layer' });
  await setLayerColor(layerName, color);
};

/**
 * Exports the puzzle to the Beam Studio canvas.
 *
 * @param state - Current puzzle state
 * @param typeConfig - Puzzle type configuration
 * @param geometry - Optional pre-computed geometry (from Preview). If not provided, computes fresh.
 */
export const exportToCanvas = async (
  state: PuzzleState,
  typeConfig: PuzzleTypeConfig,
  geometry?: PuzzleGeometry,
): Promise<void> => {
  // Use provided geometry or compute fresh
  const geo = geometry ?? computePuzzleGeometry(state, typeConfig.shapeType);
  const layout = computeExportLayout(geo, state.border.enabled);

  // Combine edge paths for cutting
  const innerCuts = [geo.edges.horizontalEdges, geo.edges.verticalEdges].filter(Boolean).join(' ');
  const meta = getShapeMetadata(typeConfig.shapeType, state);
  const clipPath = meta.fillsBoundingBox ? undefined : geo.boundaryPath;
  const baseOpts = { height: layout.totalHeight, width: layout.totalWidth };

  // Export layers in order (bottom to top in layer panel)

  // RIGHT SIDE: Board Base (if border enabled)
  if (layout.hasBorder && geo.boardBasePath) {
    await importLayer('Board Base', EXPORT_COLORS.boardBase, {
      ...baseOpts,
      elementOffsetX: layout.boardOffsetX,
      pathData: geo.boardBasePath,
    });
  }

  // RIGHT SIDE: Outlines on board base (if border enabled)
  if (layout.hasBorder && innerCuts) {
    await importLayer('Outlines', EXPORT_COLORS.outlines, {
      ...baseOpts,
      clipPathData: clipPath,
      elementOffsetX: layout.boardOffsetX,
      pathData: innerCuts,
    });
  }

  // LEFT SIDE: Raised Edges frame (if border enabled)
  if (layout.hasBorder && geo.raisedEdgesPath) {
    await importLayer('Raised Edges', EXPORT_COLORS.raisedEdges, {
      ...baseOpts,
      elementOffsetX: layout.raisedEdgesOffsetX,
      pathData: geo.raisedEdgesPath,
    });
  }

  // LEFT SIDE: Puzzle Pieces (always)
  if (innerCuts) {
    await importLayer('Puzzle Pieces', EXPORT_COLORS.pieces, {
      ...baseOpts,
      clipPathData: clipPath,
      elementOffsetX: layout.raisedEdgesOffsetX,
      pathData: innerCuts,
    });
  }

  // Refresh layer panel to show new layers
  svgEditor.updateContextPanel();
  useLayerStore.getState().forceUpdate();
};
