import { modelsWithModules } from '@core/app/actions/beambox/constant';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import workareaManager from '@core/app/svgedit/workarea';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import readBitmapFile from './readBitmapFile';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

// TODO: add unit test
const importBitmap = async (file: File): Promise<void> => {
  if (modelsWithModules.has(workareaManager.model)) {
    const drawing = svgCanvas.getCurrentDrawing();
    const currentLayer = drawing.getCurrentLayer()!;

    if (printingModules.has(getData(currentLayer, 'module')!) && getData(currentLayer, 'fullcolor')) {
      await readBitmapFile(file, { gray: false });

      return;
    }
  }

  await readBitmapFile(file);
};

export default importBitmap;
