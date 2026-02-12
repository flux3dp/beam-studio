import disassembleUse from '@core/app/svgedit/operations/disassembleUse';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { getBBox } from '../../utils/getBBox';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

/**
 * Resize and reposition, set ratio fix, disassembleUse, and updateElementColor
 */
const postImportElement = async (elem: SVGElement, batchCmd: IBatchCommand) => {
  const { height, width } = getBBox(elem);
  const [newWidth, newHeight] = width > height ? [500, (height * 500) / width] : [(width * 500) / height, 500];

  svgCanvas.selectOnly([elem]);
  [
    svgCanvas.setSvgElemSize('width', newWidth),
    svgCanvas.setSvgElemSize('height', newHeight),
    svgCanvas.setSvgElemPosition('x', 0, elem, false),
    svgCanvas.setSvgElemPosition('y', 0, elem, false),
  ].forEach((cmd) => {
    if (cmd) {
      batchCmd.addSubCommand(cmd);
    }
  });
  elem.setAttribute('data-ratiofixed', 'true');
  await disassembleUse([elem], { parentCmd: batchCmd, skipConfirm: true });

  if (svgCanvas.getSelectedElems()[0].getAttribute('data-tempgroup')) {
    const groupResult = svgCanvas.groupSelectedElements();

    if (groupResult) {
      batchCmd.addSubCommand(groupResult.command);
    }
  }

  updateElementColor(svgCanvas.getSelectedElems()[0]);
};

export default postImportElement;
