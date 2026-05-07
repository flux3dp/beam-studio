import type { ComponentType } from 'react';

import ReactDomServer from 'react-dom/server';

import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import importSvgString from '@core/app/svgedit/operations/import/importSvgString';
import postImportElement from '@core/app/svgedit/operations/import/postImportElement';
import selectionManager from '@core/app/svgedit/selection';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getLayerByName } from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const importBuiltInElement = async (IconComponent: ComponentType, jsonMap: any) => {
  if (jsonMap) {
    const newElement = svgCanvas.addSvgElementFromJson({
      ...jsonMap,
      attr: { ...jsonMap.attr, id: svgCanvas.getNextId() },
    });

    undoManager.addCommandToHistory(new history.InsertElementCommand(newElement));
    updateElementColor(newElement);

    selectionManager.selectOnly([newElement]);
  } else {
    const iconString = ReactDomServer.renderToStaticMarkup(<IconComponent />).replace(
      /fill= ?"#(fff(fff)?|FFF(FFF))"/g,
      'fill="none"',
    );
    const layerName = layerManager.getCurrentLayerName();

    if (!layerName) return;

    const layerModule = getData(getLayerByName(layerName)!, 'module') as LayerModuleType;
    const batchCmd = new history.BatchCommand('Import Element SVG');
    const newElements = await importSvgString(iconString, {
      layerName,
      parentCmd: batchCmd,
      targetModule: layerModule,
      type: 'layer',
    });

    console.assert(newElements.length === 1, 'Expected BuiltinElement import to return one element');

    await postImportElement(newElements[0], batchCmd);
    undoManager.addCommandToHistory(batchCmd);
  }
};

export default importBuiltInElement;
