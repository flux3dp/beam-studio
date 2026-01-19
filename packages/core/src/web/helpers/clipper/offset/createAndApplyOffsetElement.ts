import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import history from '@core/app/svgedit/history/history';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { buildSvgPathD } from './buildSvgPathD';
import type { Path } from './constants';
import { showOffsetAlert } from './showOffSetAlert'; // Corrected import name

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

interface CreateOffsetOptions {
  /** When true, returns the BatchCommand without adding to history (for preview mode) */
  skipHistory?: boolean;
}

export function createAndApplyOffsetElement(
  solutionPaths: Path[],
  options: CreateOffsetOptions = {},
): IBatchCommand | null {
  const { skipHistory = false } = options;

  if (solutionPaths.length === 0) {
    showOffsetAlert('failed');
    console.log('Offset operation produced no valid paths (after potential union).');

    return null;
  }

  const pathD = buildSvgPathD(solutionPaths, useGlobalPreferenceStore.getState()['simplify_clipper_path']);

  if (!pathD) {
    console.log('Failed to build path string D from solution paths.');
    showOffsetAlert('failed');

    return null;
  }

  const batchCmd = new history.BatchCommand('Create Offset Elements');
  const newElem = svgCanvas.addSvgElementFromJson({
    attr: { d: pathD, fill: 'none', 'fill-opacity': '0', id: svgCanvas.getNextId(), stroke: '#000' },
    curStyles: false,
    element: 'path',
  });

  svgCanvas.pathActions.fixEnd(newElem);
  batchCmd.addSubCommand(new history.InsertElementCommand(newElem));
  updateElementColor(newElem);

  svgCanvas.selectOnly([newElem], true);

  if (skipHistory) {
    return batchCmd;
  }

  svgCanvas.addCommandToHistory(batchCmd);

  console.log('Offset element operation completed.');

  return batchCmd;
}
