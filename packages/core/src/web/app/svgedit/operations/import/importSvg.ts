import alertCaller from '@core/app/actions/alert-caller';
import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import dialogCaller from '@core/app/actions/dialog-caller';
import progressCaller from '@core/app/actions/progress-caller';
import alertConstants from '@core/app/constants/alert-constants';
import LayerModule, { modelsWithModules, printingModules } from '@core/app/constants/layer-module/layer-modules';
import history from '@core/app/svgedit/history/history';
import readBitmapFile from '@core/app/svgedit/operations/import/readBitmapFile';
import LayerPanelController from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelController';
import svgLaserParser from '@core/helpers/api/svg-laser-parser';
import awsHelper from '@core/helpers/aws-helper';
import i18n from '@core/helpers/i18n';
import layerConfigHelper, { writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { createLayer, removeDefaultLayerIfEmpty } from '@core/helpers/layer/layer-helper';
import layerModuleHelper from '@core/helpers/layer-module/layer-module-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type { ImportType } from '@core/interfaces/ImportSvg';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import importSvgString from './importSvgString';

const svgWebSocket = svgLaserParser({ type: 'svgeditor' });
let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const getBasename = (path: string) => path.match(/(.+)[/\\].+/)?.[1] ?? '';

const readSVG = (
  blob: Blob | File,
  {
    layerName,
    parentCmd = undefined,
    targetModule = layerModuleHelper.getDefaultLaserModule(),
    type,
  }: {
    layerName?: string;
    parentCmd?: IBatchCommand;
    targetModule?: LayerModule;
    type: ImportType;
  },
) =>
  new Promise<SVGUseElement>((resolve) => {
    const parsedLayerName = layerName === 'nolayer' ? undefined : layerName;
    const reader = new FileReader();

    reader.onloadend = async (e) => {
      let svgString = e.target?.result as string;

      if (!['color', 'layer'].includes(type)) {
        svgString = svgString.replace(/<svg[^>]*>/, (svgTagString) =>
          svgTagString.replace(/"([^"]*)pt"/g, (_, valWithoutPt) => `"${valWithoutPt}"`),
        );
      }

      // @ts-expect-error do not know why, so I just keep it
      if (blob.path) {
        svgString = svgString.replace(
          'xlink:href="../',
          // @ts-expect-error do not know why, so I just keep it
          `xlink:href="${getBasename(blob.path)}/../`,
        );
        // @ts-expect-error do not know why, so I just keep it
        svgString = svgString.replace('xlink:href="./', `xlink:href="${getBasename(blob.path)}/`);
      }

      svgString = svgString.replace(/<!\[CDATA\[([^\]]*)\]\]>/g, (_, p1) => p1);
      svgString = svgString.replace(/<switch[^>]*>[^<]*<[^/]*\/switch>/g, () => '');

      if (!['color', 'layer'].includes(type)) {
        svgString = svgString.replace(/<image[^>]*>[^<]*<[^/]*\/image>/g, () => '');
        svgString = svgString.replace(/<image[^>]*>/g, () => '');
      }

      const modifiedSvgString = svgString
        .replace(/fill(: ?#(fff(fff)?|FFF(FFF)?));/g, 'fill: none;')
        .replace(/fill= ?"#(fff(fff)?|FFF(FFF))"/g, 'fill="none"');
      const newElement = await importSvgString(modifiedSvgString, {
        layerName: parsedLayerName,
        parentCmd,
        targetModule,
        type,
      });

      // Apply style
      svgCanvas.svgToString($('#svgcontent')[0], 0);

      resolve(newElement);
    };

    reader.readAsText(blob);
  });

const importSvg = async (
  file: Blob,
  {
    isFromAI = false,
    isFromNounProject,
    skipByLayer = false,
  }: { isFromAI?: boolean; isFromNounProject?: boolean; skipByLayer?: boolean } = {},
): Promise<void> => {
  const batchCmd = new history.BatchCommand('Import SVG');
  const { lang } = i18n;
  const hasModule = modelsWithModules.has(beamboxPreference.read('workarea'));
  let targetModule: LayerModule;

  if (hasModule) {
    const id = 'import-module';

    targetModule = await dialogCaller.showRadioSelectDialog({
      defaultValue: beamboxPreference.read(id),
      id,
      options: [
        { label: lang.layer_module.general_laser, value: layerModuleHelper.getDefaultLaserModule() },
        // TODO: should this check workarea for 4c?
        { label: lang.layer_module.printing, value: LayerModule.PRINTER },
      ],
      title: lang.beambox.popup.select_import_module,
    });
  } else {
    targetModule = LayerModule.LASER_10W_DIODE;
  }

  if (!targetModule) {
    return;
  }

  const importTypeOptions = Array.of<{ label: string; value: ImportType }>();

  if (!skipByLayer) {
    importTypeOptions.push({ label: lang.beambox.popup.layer_by_layer, value: 'layer' });
  }

  if (!printingModules.has(targetModule)) {
    importTypeOptions.push({ label: lang.beambox.popup.layer_by_color, value: 'color' });
  }

  importTypeOptions.push({ label: lang.beambox.popup.nolayer, value: 'nolayer' });

  const importType: ImportType = await (async () => {
    // use skip-by-layer as a flag to separate the import of .svg and .ai files
    const id = `${targetModule}${skipByLayer ? '-skip-by-layer' : ''}-import-type`;

    if (isFromAI) {
      return 'layer';
    }

    if (importTypeOptions.length === 1) {
      return importTypeOptions[0].value;
    }

    return dialogCaller.showRadioSelectDialog({
      defaultValue: beamboxPreference.read(id as any),
      id,
      options: importTypeOptions,
      title: lang.beambox.popup.select_import_method,
    });
  })();

  if (!importType) {
    return;
  }

  const result = await svgWebSocket.uploadPlainSVG(file);

  if (result !== 'ok') {
    progressCaller.popById('loading_image');

    if (result === 'invalid_path') {
      alertCaller.popUpError({ message: lang.beambox.popup.import_file_contain_invalid_path });
    }

    return;
  }

  const output = await svgWebSocket.divideSVG({ byLayer: importType === 'layer' });

  if (!output.res) {
    alertCaller.popUpError({
      buttonType: alertConstants.YES_NO,
      message: `#809 ${output.data}\n${lang.beambox.popup.import_file_error_ask_for_upload}`,
      onYes: () => {
        const fileReader = new FileReader();

        fileReader.onloadend = (e) => {
          const svgString = e.target?.result;

          awsHelper.uploadToS3(file.name, svgString);
        };

        fileReader.readAsText(file);
      },
    });

    return;
  }

  const { data: outputData } = output;

  const newElements = Array.of<SVGUseElement>();
  const elementOptions = { parentCmd: batchCmd, targetModule, type: importType };

  if (['color', 'nolayer'].includes(importType)) {
    newElements.push(await readSVG(outputData.strokes, elementOptions));
    newElements.push(await readSVG(outputData.colors, elementOptions));
  } else if (importType === 'layer') {
    const keys = Object.keys(outputData).filter((key) => !['bitmap', 'bitmap_offset'].includes(key));

    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];

      newElements.push(
        await readSVG(outputData[key], {
          ...elementOptions,
          layerName: key,
        }),
      );
    }
  } else {
    newElements.push(await readSVG(file, elementOptions));
  }

  const filteredNewElements = newElements.filter(Boolean);

  if (outputData.bitmap.size > 0) {
    const isPrinting = printingModules.has(targetModule);

    if (!isPrinting || !filteredNewElements.length) {
      const layerName = lang.beambox.right_panel.layer_panel.layer_bitmap;
      const { cmd, layer: newLayer, name: newLayerName } = createLayer(layerName);

      if (cmd && !cmd.isEmpty()) {
        batchCmd.addSubCommand(cmd);
      }

      layerConfigHelper.initLayerConfig(newLayerName);

      if (isPrinting) {
        writeDataLayer(newLayer, 'module', targetModule);
        writeDataLayer(newLayer, 'fullcolor', true);
      }
    }

    const img = await readBitmapFile(outputData.bitmap, {
      gray: !isPrinting,
      offset: outputData.bitmapOffset,
      parentCmd: batchCmd,
    });

    filteredNewElements.push(img);

    const cmd = removeDefaultLayerIfEmpty();

    if (cmd) {
      batchCmd.addSubCommand(cmd);
    }
  }

  presprayArea.togglePresprayArea();
  progressCaller.popById('loading_image');

  if (isFromNounProject) {
    for (let i = 0; i < filteredNewElements.length; i += 1) {
      const elem = filteredNewElements[i];

      elem.setAttribute('data-np', '1');
    }
  }

  LayerPanelController.setSelectedLayers([svgCanvas.getCurrentDrawing().getCurrentLayerName()]);

  if (filteredNewElements.length === 0) {
    svgCanvas.clearSelection();
  } else if (filteredNewElements.length === 1) {
    svgCanvas.selectOnly(filteredNewElements);
  } else {
    // no selection until the temp group is created, to prevent the group type is not correct
    svgCanvas.selectOnly(svgCanvas.tempGroupSelectedElements());
  }

  if (!batchCmd.isEmpty()) {
    svgCanvas.addCommandToHistory(batchCmd);
  }
};

export default importSvg;
