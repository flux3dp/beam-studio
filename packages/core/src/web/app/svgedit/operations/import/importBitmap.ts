import beamboxPreference from 'app/actions/beambox/beambox-preference';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import LayerModule, { modelsWithModules } from 'app/constants/layer-module/layer-modules';
import { getData } from 'helpers/layer/layer-config-helper';
import { getSVGAsync } from 'helpers/svg-editor-helper';

import readBitmapFile from './readBitmapFile';

let svgCanvas: ISVGCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

// TODO: add unit test
const importBitmap = async (file: File): Promise<void> => {
  const workarea = beamboxPreference.read('workarea');

  if (modelsWithModules.has(workarea)) {
    const drawing = svgCanvas.getCurrentDrawing();
    const currentLayer = drawing.getCurrentLayer();
    if (
      getData(currentLayer, 'module') === LayerModule.PRINTER &&
      getData(currentLayer, 'fullcolor')
    ) {
      await readBitmapFile(file, { gray: false });
      return;
    }
  }
  await readBitmapFile(file);
};

export default importBitmap;
