import svgEditor from '@core/app/actions/beambox/svg-editor';
import { LayerModule, printingModules } from '@core/app/constants/layer-module/layer-modules';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import layerManager from '@core/app/svgedit/layer/layerManager';
import importSvgString from '@core/app/svgedit/operations/import/importSvgString';
import updateElementColor from '@core/helpers/color/updateElementColor';
import updateLayerColor from '@core/helpers/color/updateLayerColor';
import updateLayerColorFilter from '@core/helpers/color/updateLayerColorFilter';
import imageData from '@core/helpers/image-data';
import { createLayer } from '@core/helpers/layer/layer-helper';
import { writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { getDefaultLaserModule } from '@core/helpers/layer-module/layer-module-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { computeExportLayout, computePuzzleGeometry, type PuzzleGeometry } from './puzzleGeometry';
import { drawShapeClipPath, getShapeMetadata, type ShapeType } from './shapeGenerators';
import type { ImageState, PuzzleState, PuzzleTypeConfig } from './types';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

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

/** Loads an image element from a data URL */
const loadImage = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new window.Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for export'));
    img.src = dataUrl;
  });

/** Computes "center and cover" image placement in centered coordinates (mm) */
const computeImagePlacement = (
  imgW: number,
  imgH: number,
  puzzleW: number,
  puzzleH: number,
  imageState: ImageState,
) => {
  const { bleed, offsetX, offsetY, zoom } = imageState;
  const targetW = puzzleW + bleed * 2;
  const targetH = puzzleH + bleed * 2;
  const coverScale = Math.max(targetW / imgW, targetH / imgH);
  const scale = coverScale * (zoom / 100);
  const drawW = imgW * scale;
  const drawH = imgH * scale;

  return { height: drawH, width: drawW, x: -drawW / 2 + offsetX, y: -drawH / 2 + offsetY };
};

/**
 * Renders the image onto an offscreen canvas, clipped to the puzzle boundary shape.
 * Returns a pre-cropped PNG data URL — no SVG <clipPath> needed on the final element.
 *
 * The canvas uses pixel-per-mm resolution so the output is sharp at export DPI.
 */
const renderCroppedImage = (
  img: HTMLImageElement,
  placement: ReturnType<typeof computeImagePlacement>,
  shapeType: ShapeType,
  clipW: number,
  clipH: number,
  cornerRadius: number,
  pxPerMm: number,
): string => {
  const canvasW = Math.ceil(clipW * pxPerMm);
  const canvasH = Math.ceil(clipH * pxPerMm);
  const canvas = document.createElement('canvas');

  canvas.width = canvasW;
  canvas.height = canvasH;

  const ctx = canvas.getContext('2d')!;

  // Work in mm coordinates: translate to center (in px), then scale so 1 unit = 1 mm
  ctx.translate(canvasW / 2, canvasH / 2);
  ctx.scale(pxPerMm, pxPerMm);

  // Clip to the boundary shape (drawShapeClipPath draws centered at origin in mm)
  drawShapeClipPath(ctx, shapeType, clipW, clipH, cornerRadius);
  ctx.clip();

  // Draw the image (placement coords are in mm, centered at origin)
  ctx.drawImage(img, placement.x, placement.y, placement.width, placement.height);

  return canvas.toDataURL('image/png');
};

/** Processes an image through imageData and returns the display base64 */
const processImageForDisplay = (
  sourceUrl: string,
  width: number,
  height: number,
  isFullColor: boolean,
): Promise<string> =>
  new Promise((resolve) => {
    imageData(sourceUrl, {
      grayscale: isFullColor ? undefined : { is_rgba: true, is_shading: true, is_svg: false, threshold: 254 },
      height,
      isFullResolution: true,
      onComplete: (result: { pngBase64: string }) => resolve(result.pngBase64),
      width,
    });
  });

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
): Promise<void> => {
  const { image } = state;

  if (!image.dataUrl) return;

  const img = await loadImage(image.dataUrl);
  const meta = getShapeMetadata(shapeType, state);

  // Clip dimensions — expand by bleed if set
  const clipW = geo.layout.width + image.bleed * 2;
  const clipH = geo.layout.height + image.bleed * 2;
  const placement = computeImagePlacement(img.naturalWidth, img.naturalHeight, geo.layout.width, geo.layout.height, image);

  // Render image clipped to shape on offscreen canvas (10 px/mm for sharp output)
  const pxPerMm = 10;
  const croppedDataUrl = renderCroppedImage(img, placement, shapeType, clipW, clipH, meta.boundaryCornerRadius, pxPerMm);

  const isPrinting = image.exportAs === 'print';
  const targetModule = isPrinting ? LayerModule.PRINTER : getDefaultLaserModule();

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
  }

  layerManager.setCurrentLayer(finalName);

  // 2. Process cropped image through imageData for proper display
  const croppedImg = await loadImage(croppedDataUrl);
  const origBlobUrl = URL.createObjectURL(await (await fetch(croppedDataUrl)).blob());
  const displayBase64 = await processImageForDisplay(
    origBlobUrl,
    croppedImg.naturalWidth,
    croppedImg.naturalHeight,
    isPrinting,
  );

  // 3. Place image element on canvas — position matches the puzzle center
  const svgDpmm = 10;
  const canvasW = clipW * svgDpmm;
  const canvasH = clipH * svgDpmm;
  const canvasX = (layout.totalWidth / 2 + layout.raisedEdgesOffsetX - clipW / 2) * svgDpmm;
  const canvasY = (layout.totalHeight / 2 - clipH / 2) * svgDpmm;

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
  svgCanvas.addCommandToHistory(batchCmd);
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

  // IMAGE LAYER (top-most — imported last so it appears highest in the layer panel)
  if (state.image.enabled && state.image.dataUrl) {
    await exportImageLayer(state, typeConfig.shapeType, geo, layout);
  }

  // Refresh layer panel to show new layers
  svgEditor.updateContextPanel();
  useLayerStore.getState().forceUpdate();
};
