import { dpmm } from '@core/app/actions/beambox/constant';
import svgEditor from '@core/app/actions/beambox/svg-editor';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import { LayerModule, printingModules } from '@core/app/constants/layer-module/layer-modules';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import importSvgString from '@core/app/svgedit/operations/import/importSvgString';
import updateElementColor from '@core/helpers/color/updateElementColor';
import updateLayerColor from '@core/helpers/color/updateLayerColor';
import updateLayerColorFilter from '@core/helpers/color/updateLayerColorFilter';
import imageData from '@core/helpers/image-data';
import { writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { createLayer } from '@core/helpers/layer/layer-helper';
import { getDefaultModule } from '@core/helpers/layer-module/layer-module-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { COLORS } from '../constants';
import type { PuzzleGeometry, PuzzleState, PuzzleTypeConfig, ShapeType } from '../types';

import { computeImagePlacement, type ImagePlacement } from './imageLayout';
import { computeExportLayout, computePuzzleGeometry } from './puzzleGeometry';
import { drawShapeClipPath } from './shapes';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

const setLayerColor = async (layerName: string, color: string): Promise<void> => {
  const layer = layerManager.getLayerByName(layerName);

  if (!layer) {
    throw new Error(
      `Layer "${layerName}" was not found after import. A layer with this name may already exist — ` +
        'try renaming or removing existing puzzle layers first.',
    );
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

const importLayer = async (
  layerName: string,
  color: string,
  svgOptions: SvgStringOptions,
  parentCmd?: IBatchCommand,
): Promise<void> => {
  await importSvgString(createSvgString(svgOptions), { layerName, parentCmd, type: 'layer' });
  await setLayerColor(layerName, color);
};

const loadImage = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new window.Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for export'));
    img.src = dataUrl;
  });

/**
 * Renders the image onto an offscreen canvas, clipped to the puzzle boundary shape.
 * Returns a pre-cropped PNG data URL — no SVG <clipPath> needed on the final element.
 *
 * The canvas uses pixel-per-mm resolution so the output is sharp at export DPI.
 */
const renderCroppedImage = (
  img: HTMLImageElement,
  placement: ImagePlacement,
  shapeType: ShapeType,
  clipW: number,
  clipH: number,
  cornerRadius: number,
  pxPerMm: number,
  centerYOffset: number = 0,
): string => {
  const canvasW = Math.ceil(clipW * pxPerMm);
  const canvasH = Math.ceil(clipH * pxPerMm);
  const canvas = document.createElement('canvas');

  canvas.width = canvasW;
  canvas.height = canvasH;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error(
      `Failed to create canvas 2D context (canvas size: ${canvasW}x${canvasH}px). ` +
        'Try reducing piece count or piece size.',
    );
  }

  // Set up coordinate system: translate origin to canvas center (in px),
  // then scale so drawing units = 1mm. All subsequent drawing is in mm.
  ctx.translate(canvasW / 2, canvasH / 2);
  ctx.scale(pxPerMm, pxPerMm);

  // Clip to the boundary shape (drawShapeClipPath draws centered at origin in mm)
  drawShapeClipPath(ctx, {
    centerYOffset,
    cornerRadius,
    height: clipH,
    shapeType,
    width: clipW,
  });
  ctx.clip();

  // Draw the image (placement coords are in mm, centered at origin)
  ctx.drawImage(img, placement.x, placement.y, placement.width, placement.height);

  try {
    return canvas.toDataURL('image/png');
  } catch (err) {
    throw new Error(
      `Failed to encode puzzle image as PNG (canvas: ${canvasW}×${canvasH}px). ` +
        'Try reducing piece count or piece size.',
      { cause: err },
    );
  }
};

/** Processes an image through imageData and returns the display base64 */
const processImageForDisplay = async (
  sourceUrl: string,
  width: number,
  height: number,
  isFullColor: boolean,
): Promise<string> => {
  const result = await new Promise<{ pngBase64: string }>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Image processing timed out')), 30000);
    const cleanup = () => clearTimeout(timeout);

    imageData(sourceUrl, {
      grayscale: isFullColor ? undefined : { is_rgba: true, is_shading: true, is_svg: false, threshold: 254 },
      height,
      isFullResolution: true,
      onComplete: (res: { pngBase64: string }) => {
        cleanup();
        resolve(res);
      },
      width,
    }).catch((err: unknown) => {
      cleanup();
      reject(err instanceof Error ? err : new Error('Image processing failed'));
    });
  });

  if (!result?.pngBase64) {
    throw new Error('Image processing completed but produced no output. The image may be corrupted.');
  }

  return result.pngBase64;
};

/**
 * Exports the puzzle image as a pre-cropped `<image>` element on a new canvas layer.
 *
 * The image is rendered onto an offscreen canvas clipped to the puzzle boundary,
 * producing a self-contained PNG with transparent areas outside the shape.
 * This avoids SVG `<clipPath>` so the exported element works with Beam Studio's
 * built-in image editing tools (ImageEditPanel, CropPanel, etc.).
 */
const exportImageLayer = async (
  state: PuzzleState,
  shapeType: ShapeType,
  geo: PuzzleGeometry,
  layout: ReturnType<typeof computeExportLayout>,
  parentCmd?: IBatchCommand,
): Promise<void> => {
  const { image } = state;

  if (!image.dataUrl) return;

  const img = await loadImage(image.dataUrl);
  const { meta } = geo;

  // Clip dimensions — use meta.boundaryHeight (which is vertically stretched for heart shapes
  // to fit the visual bounds to the grid, vs layout.height which is the grid height), expand by bleed
  const clipW = geo.layout.width + image.bleed * 2;
  const clipH = meta.boundaryHeight + image.bleed * 2;
  const placement = computeImagePlacement(img.naturalWidth, img.naturalHeight, geo.layout, image);

  if (!placement) {
    throw new Error(
      'Failed to compute image placement — the uploaded image may be corrupted. Please try re-uploading.',
    );
  }

  // Render image clipped to shape on offscreen canvas
  const croppedDataUrl = renderCroppedImage(
    img,
    placement,
    shapeType,
    clipW,
    clipH,
    meta.boundaryCornerRadius,
    dpmm,
    meta.centerYOffset,
  );

  const isPrinting = image.exportAs === 'print';
  const targetModule = isPrinting ? LayerModule.PRINTER : getDefaultModule();

  // 1. Create a dedicated layer
  const batchCmd = new history.BatchCommand('Import Puzzle Image');
  const { layer: layerElement, name: finalName } = createLayer('Puzzle Image', {
    addToHistory: false,
    initConfig: true,
    parentCmd: batchCmd,
  });

  if (printingModules.has(targetModule)) {
    writeDataLayer(layerElement, 'module', targetModule);
    writeDataLayer(layerElement, 'fullcolor', true);
    presprayArea.togglePresprayArea();
  }

  layerManager.setCurrentLayer(finalName);

  // 2. Process cropped image through imageData for proper display
  const croppedImg = await loadImage(croppedDataUrl);
  // Note: blob URL is intentionally not revoked. It's stored in the `origImage` attribute
  // and must remain valid for the element's lifetime. Beam Studio's image editing tools
  // (ImageEditPanel, CropPanel) require this blob URL to be accessible throughout the session.
  // Revoking it would break the image reference and cause loading failures.
  let origBlobUrl: string;

  try {
    const response = await fetch(croppedDataUrl);
    const blob = await response.blob();

    origBlobUrl = URL.createObjectURL(blob);
  } catch (err) {
    throw new Error('Failed to process cropped image for export. The image may be too large.', { cause: err });
  }

  const displayBase64 = await processImageForDisplay(
    origBlobUrl,
    croppedImg.naturalWidth,
    croppedImg.naturalHeight,
    isPrinting,
  );

  // 3. Place image element on canvas — position matches the puzzle center
  const canvasW = clipW * dpmm;
  const canvasH = clipH * dpmm;
  const canvasX = (layout.totalWidth / 2 + layout.raisedEdgesOffsetX - clipW / 2) * dpmm;
  const canvasY = (layout.totalHeight / 2 - clipH / 2) * dpmm;

  const imageEl = svgCanvas.addSvgElementFromJson({
    attr: {
      'data-ratiofixed': true,
      'data-shading': true,
      'data-threshold': 254,
      height: canvasH,
      id: svgCanvas.getNextId(),
      origImage: origBlobUrl,
      preserveAspectRatio: 'none',
      style: 'pointer-events:inherit',
      width: canvasW,
      x: canvasX,
      y: canvasY,
    },
    element: 'image',
  }) as SVGImageElement;

  svgCanvas.setHref(imageEl, displayBase64);
  updateElementColor(imageEl);
  batchCmd.addSubCommand(new history.InsertElementCommand(imageEl));

  if (parentCmd) parentCmd.addSubCommand(batchCmd);
  else undoManager.addCommandToHistory(batchCmd);
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
  const geo = geometry ?? computePuzzleGeometry(state, typeConfig.id);
  const layout = computeExportLayout(geo, state.border.enabled);

  // Combine horizontal and vertical edge paths into a single SVG path string for laser cutting.
  // filter(Boolean) removes empty strings when a direction has no edges (e.g., hexagon with no vertical cuts).
  const innerCuts = [geo.edges.horizontalEdges, geo.edges.verticalEdges].filter(Boolean).join(' ');
  const clipPath = geo.meta.fillsBoundingBox ? undefined : geo.boundaryPath;
  const baseOpts = { height: layout.totalHeight, width: layout.totalWidth };
  const batchCmd = new history.BatchCommand('Export Puzzle');

  // Export layers in order (bottom to top in layer panel)

  // RIGHT SIDE: Board Base (if border enabled)
  if (layout.hasBorder && geo.boardBasePath) {
    await importLayer(
      'Board Base',
      COLORS.exploded.boardBase,
      {
        ...baseOpts,
        elementOffsetX: layout.boardOffsetX,
        pathData: geo.boardBasePath,
      },
      batchCmd,
    );
  }

  // RIGHT SIDE: Guide Lines on board base (if border and guideLines enabled)
  if (layout.hasBorder && state.border.guideLines && innerCuts) {
    await importLayer(
      'Guide Lines',
      COLORS.exploded.guideLines,
      {
        ...baseOpts,
        clipPathData: clipPath,
        elementOffsetX: layout.boardOffsetX,
        pathData: innerCuts,
      },
      batchCmd,
    );
  }

  // LEFT SIDE: Raised Edges frame (only if border enabled - separate frame layer)
  if (layout.hasBorder && geo.raisedEdgesPath) {
    await importLayer(
      'Raised Edges',
      COLORS.exploded.raisedEdges,
      {
        ...baseOpts,
        elementOffsetX: layout.raisedEdgesOffsetX,
        pathData: geo.raisedEdgesPath,
      },
      batchCmd,
    );
  }

  // LEFT SIDE: Puzzle Pieces (always)
  // When border is disabled, include boundary path with puzzle pieces (the outer edge is part of the puzzle itself).
  // When border is enabled, the boundary path is omitted here because the board base layer provides the outer edge.
  const puzzlePiecesPath = layout.hasBorder ? innerCuts : [geo.boundaryPath, innerCuts].filter(Boolean).join(' ');

  if (puzzlePiecesPath) {
    await importLayer(
      'Puzzle Pieces',
      COLORS.exploded.pieces,
      {
        ...baseOpts,
        clipPathData: clipPath,
        elementOffsetX: layout.raisedEdgesOffsetX,
        pathData: puzzlePiecesPath,
      },
      batchCmd,
    );
  }

  // IMAGE LAYER (top-most — imported last so it appears highest in the layer panel)
  // Skip if exportAs is 'none' — image is only for alignment, not export
  if (state.image.enabled && state.image.dataUrl && state.image.exportAs !== 'none') {
    await exportImageLayer(state, typeConfig.id, geo, layout, batchCmd);
  }

  // Refresh layer panel to show new layers
  svgEditor.updateContextPanel();
  useLayerStore.getState().forceUpdate();

  if (!batchCmd.isEmpty()) undoManager.addCommandToHistory(batchCmd);
};
