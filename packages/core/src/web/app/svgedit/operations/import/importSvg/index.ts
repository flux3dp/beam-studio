import { match, P } from 'ts-pattern';

import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { modelsWithModules } from '@core/app/actions/beambox/constant';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import progressCaller from '@core/app/actions/progress-caller';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import history from '@core/app/svgedit/history/history';
import LayerPanelController from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelController';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type { ImportType } from '@core/interfaces/ImportSvg';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { determineImportType } from './utils/determineImportType';
import { determineTargetModule } from './utils/determineTargetModule';
import { handleBitmapImport } from './utils/handleBitmapImport';
import { processOutputData } from './utils/processOutputData';
import { uploadAndDivideSvg } from './utils/uploadAndDivideSvg';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

function finalizeImport(
  elements: SVGUseElement[],
  isFromNounProject: boolean,
  batchCmd: IBatchCommand,
  parentCmd: IBatchCommand | undefined,
): void {
  presprayArea.togglePresprayArea();
  progressCaller.popById('loading_image');

  if (isFromNounProject) {
    elements.forEach((elem) => elem.setAttribute('data-np', '1'));
  }

  LayerPanelController.setSelectedLayers([svgCanvas.getCurrentDrawing().getCurrentLayerName()!]);

  match(elements)
    .with([], () => svgCanvas.clearSelection())
    .with([P._], (element) => svgCanvas.selectOnly(element))
    .otherwise(() => svgCanvas.selectOnly(svgCanvas.tempGroupSelectedElements()));

  if (!parentCmd && !batchCmd.isEmpty()) {
    svgCanvas.addCommandToHistory(batchCmd);
  }
}

const importSvg = async (
  blob: Blob,
  {
    importType,
    isFromNounProject,
    parentCmd,
    skipByLayer = false,
    targetModule = null,
  }: Partial<{
    importType?: ImportType;
    isFromNounProject?: boolean;
    parentCmd?: IBatchCommand;
    skipByLayer: boolean;
    targetModule: LayerModuleType | null;
  }> = {},
): Promise<SVGUseElement[] | undefined> => {
  const { lang } = i18n;
  const batchCmd = parentCmd ?? new history.BatchCommand('Import SVG');
  const hasModule = modelsWithModules.has(beamboxPreference.read('workarea'));

  targetModule = await determineTargetModule(targetModule, hasModule, lang);

  if (!targetModule) return; // Early exit if no module selected

  importType = await determineImportType(importType, targetModule, skipByLayer, lang);

  if (!importType) return; // Early exit if no import type selected

  const outputData = await uploadAndDivideSvg(blob, importType, lang);

  if (!outputData) return; // Early exit if upload and divide failed

  const elementOptions = { parentCmd: batchCmd, targetModule, type: importType };
  const processedElements = await processOutputData(outputData, blob, elementOptions, importType);
  const bitmapElement = await handleBitmapImport(
    outputData,
    targetModule,
    batchCmd,
    processedElements.length > 0,
    lang,
  );

  if (bitmapElement) processedElements.push(bitmapElement);

  finalizeImport(processedElements, Boolean(isFromNounProject), batchCmd, parentCmd);

  return processedElements;
};

export default importSvg;
