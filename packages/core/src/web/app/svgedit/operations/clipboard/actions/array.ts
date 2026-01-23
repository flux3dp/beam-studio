import type { BatchCommand } from '@core/app/svgedit/history/history';
import history from '@core/app/svgedit/history/history';
import { moveElements } from '@core/app/svgedit/operations/move';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import undoManager from '../../../history/undoManager';

import { copySelectedElements } from './copy';
import { clearCache, pasteElements } from './paste';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

interface ArrayOptions {
  /** When true, returns the BatchCommand without adding to history (for preview mode) */
  skipHistory?: boolean;
}

export const generateSelectedElementArray = async (
  interval: { dx: number; dy: number },
  { column, row }: { column: number; row: number },
  options: ArrayOptions = {},
): Promise<BatchCommand | null> => {
  const { skipHistory = false } = options;
  const batchCmd = new history.BatchCommand('Grid elements');

  await copySelectedElements();

  const arrayElements = [...svgCanvas.getSelectedWithoutTempGroup()];
  let isCached = false;

  for (let i = 0; i < column; i++) {
    for (let j = 0; j < row; j++) {
      if (i !== 0 || j !== 0) {
        const pasteRes = await pasteElements({
          isSubCmd: true,
          selectElement: false,
          type: 'inPlace',
          useCache: isCached,
        });

        if (!pasteRes) continue;

        isCached = true;

        const { cmd: pasteCmd, elems } = pasteRes;

        arrayElements.push(...(elems as SVGGElement[]));

        elems.forEach((elem) => {
          if (elem.getAttribute('data-vt-offset')) {
            elem.setAttribute('data-vt-offset', `${Number(elem.getAttribute('data-vt-offset')) + i + j * column}`);
          } else {
            const subElems = Array.from(elem.querySelectorAll('[data-vt-offset]'));

            subElems.forEach((subElem) => {
              subElem.setAttribute(
                'data-vt-offset',
                `${Number(subElem.getAttribute('data-vt-offset')) + i + j * column}`,
              );
            });
          }
        });

        if (pasteCmd && !pasteCmd.isEmpty()) {
          batchCmd.addSubCommand(pasteCmd);
        }

        const dx = Array(elems.length).fill(i * interval.dx);
        const dy = Array(elems.length).fill(j * interval.dy);
        const moveCmd = moveElements(dx, dy, elems, false, true);

        if (moveCmd && !moveCmd.isEmpty()) {
          batchCmd.addSubCommand(moveCmd);
        }
      }
    }
  }

  clearCache();

  if (batchCmd.isEmpty()) {
    return null;
  }

  if (skipHistory) {
    return batchCmd;
  }

  undoManager.addCommandToHistory(batchCmd);

  return null;
};
