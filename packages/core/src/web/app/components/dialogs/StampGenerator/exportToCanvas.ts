import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { exportPathsToSvgCanvas, pathItemToSvgPath } from '@core/helpers/generator/exportPaths';
import i18n from '@core/helpers/i18n';
import { createLayer } from '@core/helpers/layer/layer-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';

import { EXPORT_COLORS } from './constants';
import type { StampShape } from './types';
import useStampStore from './useStampStore';

const exportLayer = async (
  name: string,
  hexCode: string,
  paths: SVGPathElement[],
  shape: StampShape,
  sizeRatio: number,
  batchCmd: IBatchCommand,
): Promise<void> => {
  const layer = createLayer(name, { hexCode, parentCmd: batchCmd });

  layerManager.setSelectedLayers([layer.name]);
  await exportPathsToSvgCanvas(paths, shape.bounds, batchCmd, sizeRatio);
};

/**
 * Exports the current stamp to the canvas as two layers aligned at the canvas origin:
 * - engrave: frames + text outlines (filled)
 * - outline: the outer contour of the outermost frame (cut)
 */
export const exportToCanvas = async (): Promise<void> => {
  const { shape, sizeRatio } = useStampStore.getState();

  if (!shape) throw new Error('No template selected');

  const { layers: tLayers } = i18n.lang.stamp_generator;
  const batchCmd = new history.BatchCommand('Export Stamp');

  const engravePaths = shape.engrave.map((item) => {
    const path = pathItemToSvgPath(item);

    path.setAttribute('fill', '#000');
    path.setAttribute('stroke', 'none');

    return path;
  });

  await exportLayer(tLayers.engrave, EXPORT_COLORS.engrave, engravePaths, shape, sizeRatio, batchCmd);
  await exportLayer(tLayers.outline, EXPORT_COLORS.outline, [pathItemToSvgPath(shape.cut)], shape, sizeRatio, batchCmd);

  if (!batchCmd.isEmpty()) undoManager.addCommandToHistory(batchCmd);
};
