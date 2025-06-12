import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import history from '@core/app/svgedit/history/history';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { buildSvgPathD } from './buildSvgPathD';
import type { Path } from './constants';
import { showOffsetAlert } from './showOffSetAlert'; // Corrected import name

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export function createAndApplyOffsetElement(solutionPaths: Path[]): boolean {
  if (solutionPaths.length === 0) {
    showOffsetAlert('failed');
    console.log('Offset operation produced no valid paths (after potential union).');

    return false;
  }

  const pathD = buildSvgPathD(solutionPaths, beamboxPreference.read('simplify_clipper_path'));

  if (!pathD) {
    console.log('Failed to build path string D from solution paths.');
    showOffsetAlert('failed');

    return false;
  }

  const batchCmd = new history.BatchCommand('Create Offset Elements');
  const newElem = svgCanvas.addSvgElementFromJson({
    attr: { d: pathD, fill: 'none', 'fill-opacity': '0', id: svgCanvas.getNextId(), stroke: '#000' },
    curStyles: false,
    element: 'path',
  });

  svgCanvas.pathActions.fixEnd(newElem);
  batchCmd.addSubCommand(new history.InsertElementCommand(newElem));

  if (svgCanvas.isUsingLayerColor) {
    updateElementColor(newElem);
  }

  svgCanvas.selectOnly([newElem], true);
  svgCanvas.addCommandToHistory(batchCmd);

  console.log('Offset element operation completed.');

  return true;
}
