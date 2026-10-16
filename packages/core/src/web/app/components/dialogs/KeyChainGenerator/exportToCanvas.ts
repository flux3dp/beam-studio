import paper from 'paper';
import { PaperOffset } from 'paperjs-offset';

import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { exportPathsToSvgCanvas, pathItemToSvgPath } from '@core/helpers/generator/exportPaths';
import { removeDegenerateCurves } from '@core/helpers/generator/removeDegenerateCurves';
import { convertTextsToPath } from '@core/helpers/generator/textToPath';
import i18n from '@core/helpers/i18n';
import { createLayer } from '@core/helpers/layer/layer-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';

import { EXPLODED_GAP_PX, INNER_ALIGN_OFFSET_PX, KEYCHAIN_COLORS } from './constants';
import type { KeyChainShape } from './types';
import useKeychainShapeStore from './useKeychainShapeStore';

const exportBaseLayer = async (shape: KeyChainShape, batchCmd: IBatchCommand, sizeRatio: number): Promise<void> => {
  const { layers: tLayers } = i18n.lang.keychain_generator;
  const { name } = createLayer(tLayers.keychain, { hexCode: KEYCHAIN_COLORS.exploded.base, parentCmd: batchCmd });

  layerManager.setSelectedLayers([name]);

  const paths = [pathItemToSvgPath(shape.resultBasePath)];

  await exportPathsToSvgCanvas(paths, shape.bounds, batchCmd, sizeRatio);
};

const convertSvgElementsToPath = async (
  elements: SVGElement[],
  refPaths: SVGPathElement[] = [],
): Promise<SVGPathElement[]> => {
  const textElements: SVGTextElement[] = [];
  const pathElements: SVGPathElement[] = [];

  for (const element of elements) {
    const clone = element.cloneNode(true) as SVGElement;

    if (clone.tagName.toLowerCase() === 'text') {
      textElements.push(clone as SVGTextElement);
    } else {
      pathElements.push(clone as SVGPathElement);
    }
  }

  const convertedPaths = await convertTextsToPath(textElements, refPaths);

  pathElements.push(...convertedPaths);

  return pathElements;
};

/**
 * Converts SVGElements to Paper.js PathItems.
 * used when need to perform boolean operations on decorations (e.g. unite emboss with inner path)
 */
const convertSvgElementsToPathItems = async (
  elements: SVGElement[],
  refPaths: SVGPathElement[] = [],
): Promise<paper.PathItem[]> => {
  const paths = await convertSvgElementsToPath(elements, refPaths);
  const items: paper.PathItem[] = paths
    .map((path) => {
      const d = path.getAttribute('d');

      return d ? new paper.CompoundPath(d) : null;
    })
    .filter(Boolean);

  return items;
};

const exportEngravingLayer = async (
  shape: KeyChainShape,
  batchCmd: IBatchCommand,
  sizeRatio: number,
): Promise<void> => {
  if (shape.decorations.engraving.length === 0) return;

  const { layers: tLayers } = i18n.lang.keychain_generator;
  const { name } = createLayer(tLayers.keychain_deco_engraving, {
    hexCode: KEYCHAIN_COLORS.exploded.engraving,
    parentCmd: batchCmd,
  });

  layerManager.setSelectedLayers([name]);

  const paths = await convertSvgElementsToPath(shape.decorations.engraving, shape.decorations.refPaths);

  await exportPathsToSvgCanvas(paths, shape.bounds, batchCmd, sizeRatio);
};

/**
 * Exports inner path and emboss decorations.
 * Use paper.js to unite inner path with emboss decorations and then export to in position guide layer and standalone layer.
 */
const exportEmbossLayers = async (shape: KeyChainShape, batchCmd: IBatchCommand, sizeRatio: number): Promise<void> => {
  let combinedInnerPath = shape.innerPath?.clone() ?? null;

  if (shape.decorations.emboss.length > 0) {
    const embossPathItems = await convertSvgElementsToPathItems(shape.decorations.emboss, shape.decorations.refPaths);

    for (const item of embossPathItems) {
      combinedInnerPath = combinedInnerPath ? combinedInnerPath.unite(item) : item;
    }
  }

  if (!combinedInnerPath) return;

  const { layers: tLayers } = i18n.lang.keychain_generator;

  // Position guide layer - inset the combined inner path by `INNER_ALIGN_OFFSET_PX` so it's slightly smaller than the base path,
  const { name: posName } = createLayer(tLayers.keychain_deco_emboss_guide, {
    hexCode: KEYCHAIN_COLORS.exploded.embossAlign,
    parentCmd: batchCmd,
  });

  layerManager.setSelectedLayers([posName]);

  const insetSource = combinedInnerPath.clone() as paper.Path;

  // Strip degenerate curves before offsetting to avoid stack-overflow recursion in paperjs-offset.
  removeDegenerateCurves(insetSource);

  const insetPath = PaperOffset.offset(insetSource, -INNER_ALIGN_OFFSET_PX / sizeRatio, {
    insert: false,
  });

  await exportPathsToSvgCanvas([pathItemToSvgPath(insetPath)], shape.bounds, batchCmd, sizeRatio);

  // Standalone layer — translated below the base by `bounds.height + GAP`.
  const { name: aloneName } = createLayer(tLayers.keychain_deco_emboss, {
    hexCode: KEYCHAIN_COLORS.exploded.emboss,
    parentCmd: batchCmd,
  });

  layerManager.setSelectedLayers([aloneName]);

  const shiftedBounds = new paper.Rectangle(
    shape.bounds.x,
    shape.bounds.y - shape.bounds.height - EXPLODED_GAP_PX / sizeRatio,
    shape.bounds.width,
    shape.bounds.height,
  );

  await exportPathsToSvgCanvas([pathItemToSvgPath(combinedInnerPath)], shiftedBounds, batchCmd, sizeRatio);
};

/**
 * Exports the keychain shape to the Beam Studio canvas as new layers.
 *
 * - Always creates the `Keychain` layer (base cutting path).
 * - When decorations exist, creates `Keychain Engraving` layer (text + element shapes).
 * - When the shape has an inner path, additionally creates `Keychain Inner Position`
 *   (inner path overlaid on the base) and `Keychain Inner` (inner path translated below
 *   the base region by `bounds.height + EXPLODED_GAP_MM`).
 *
 * Reads the already-computed shape from the store; rebuilds it on demand if missing.
 */
export const exportToCanvas = async (): Promise<void> => {
  let { shape } = useKeychainShapeStore.getState();

  if (!shape) {
    const { applyOptions, buildBaseShape, category } = useKeychainShapeStore.getState();

    await buildBaseShape(category);
    shape = await applyOptions();
  }

  const { sizeRatio } = useKeychainShapeStore.getState();
  const batchCmd = new history.BatchCommand('Export Keychain');

  await exportBaseLayer(shape, batchCmd, sizeRatio);
  await exportEngravingLayer(shape, batchCmd, sizeRatio);
  await exportEmbossLayers(shape, batchCmd, sizeRatio);

  if (!batchCmd.isEmpty()) undoManager.addCommandToHistory(batchCmd);
};
