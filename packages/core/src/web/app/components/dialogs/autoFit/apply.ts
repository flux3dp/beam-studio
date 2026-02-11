/**
 * Apply auto fit result
 */
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { cloneElements } from '@core/app/svgedit/operations/clipboard';
import { moveElements } from '@core/app/svgedit/operations/move';
import { getRotationAngle, setRotationAngle } from '@core/app/svgedit/transform/rotation';
import { getBBox } from '@core/app/svgedit/utils/getBBox';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { AutoFitContour } from '@core/interfaces/IAutoFit';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import type { ImageDimension } from './AlignModal/dimension';
import { calculateDimensionCenter } from './AlignModal/dimension';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

const apply = async (
  element: SVGElement,
  contours: AutoFitContour[],
  mainIdx: number,
  initDimension: ImageDimension,
  imageDimension: ImageDimension,
): Promise<void> => {
  const { height, rotation, width } = imageDimension;
  const batchCmd = new history.BatchCommand('AutoFit');

  // Scale and rotate element according to konva image dimension
  // TODO: svgCanvas.setSvgElemSize use seletedElement now, though it works now, it may cause problem in the future
  let cmd = svgCanvas.setSvgElemSize('width', width);

  if (cmd && !cmd.isEmpty()) {
    batchCmd.addSubCommand(cmd);
  }

  cmd = svgCanvas.setSvgElemSize('height', height);

  if (cmd && !cmd.isEmpty()) {
    batchCmd.addSubCommand(cmd);
  }

  setRotationAngle(element, rotation, { parentCmd: batchCmd });

  // move the element to the main contour
  const mainContour = contours[mainIdx];
  const [mx, my] = mainContour.center;
  const elemBBox = getBBox(element as SVGElement);
  const ex = elemBBox.x + elemBBox.width / 2;
  const ey = elemBBox.y + elemBBox.height / 2;

  // calculate the offset of konva image center to contour center
  const calculateOffset = () => {
    const { x: centerX, y: centerY } = calculateDimensionCenter(imageDimension);
    const { x: initCenterX, y: initCenterY } = calculateDimensionCenter(initDimension);

    return {
      offsetX: centerX - initCenterX,
      offsetY: centerY - initCenterY,
    };
  };
  const { offsetX, offsetY } = calculateOffset();

  moveElements([mx + offsetX - ex], [my + offsetY - ey], [element], false);

  const elemsToClone = element.getAttribute('data-tempgroup') ? svgCanvas.ungroupTempGroup() : [element];

  for (let i = 0; i < elemsToClone.length; i += 1) {
    const elemToClone = elemsToClone[i];
    const bbox = getBBox(elemToClone as SVGElement);
    const center = [bbox.x + bbox.width / 2, bbox.y + bbox.height / 2];
    const elemDx = center[0] - mainContour.center[0];
    const elemDy = center[1] - mainContour.center[1];
    const elemRotationAngle = getRotationAngle(elemToClone);

    for (let j = 0; j < contours.length; j++) {
      if (j === mainIdx) {
        continue;
      }

      const contour = contours[j];
      const dAngle = contour.angle - mainContour.angle;
      let dx = contour.center[0] - mainContour.center[0];
      let dy = contour.center[1] - mainContour.center[1];

      dx += elemDx * Math.cos(dAngle) - elemDy * Math.sin(dAngle) - elemDx;
      dy += elemDx * Math.sin(dAngle) + elemDy * Math.cos(dAngle) - elemDy;

      const res = await cloneElements([elemToClone], [dx], [dy], {
        callChangOnMove: false,
        parentCmd: batchCmd,
        selectElement: false,
      });

      if (res) {
        const { elems } = res;
        const [newElem] = elems;
        let newAngle = elemRotationAngle + dAngle * (180 / Math.PI);

        newAngle %= 360;

        if (newAngle > 180) {
          newAngle -= 360;
        }

        setRotationAngle(newElem as SVGElement, newAngle);
      }
    }
  }

  if (!batchCmd.isEmpty()) {
    undoManager.addCommandToHistory(batchCmd);
  }
};

export default apply;
