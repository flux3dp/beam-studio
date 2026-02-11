import alertCaller from '@core/app/actions/alert-caller';
import dialogCaller from '@core/app/actions/dialog-caller';
import progressCaller from '@core/app/actions/progress-caller';
import alertConstants from '@core/app/constants/alert-constants';
import NS from '@core/app/constants/namespaces';
import history from '@core/app/svgedit/history/history';
import HistoryCommandFactory from '@core/app/svgedit/history/HistoryCommandFactory';
import layerManager from '@core/app/svgedit/layer/layerManager';
import findDefs from '@core/app/svgedit/utils/findDef';
import workareaManager from '@core/app/svgedit/workarea';
import alertConfig from '@core/helpers/api/alert-config';
import i18n from '@core/helpers/i18n';
import { removeDefaultLayerIfEmpty } from '@core/helpers/layer/deleteLayer';
import { createLayer } from '@core/helpers/layer/layer-helper';
import requirejsHelper from '@core/helpers/requirejs-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import SymbolMaker from '@core/helpers/symbol-helper/symbolMaker';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { getBBox } from '../../utils/getBBox';

let svgCanvas: ISVGCanvas;
let svgedit;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgedit = globalSVG.Edit;
});

// TODO: add unit test
const importDxf = async (file: Blob): Promise<void> => {
  const {
    alert: tAlert,
    beambox: { popup: t },
  } = i18n.lang;
  const Dxf2Svg = await requirejsHelper('dxf2svg');
  const { defaultDpiValue, parsed } = await new Promise<{
    defaultDpiValue: number;
    parsed: string;
  }>((resolve) => {
    const reader = new FileReader();

    reader.onloadend = (evt) => {
      if (!alertConfig.read('skip_dxf_version_warning')) {
        const autoCadVersionMatch = (evt.target.result as string).match(/AC\d+/);

        if (autoCadVersionMatch) {
          const autoCadVersion = autoCadVersionMatch[0].substring(2, autoCadVersionMatch[0].length);

          if (autoCadVersion !== '1027') {
            alertCaller.popUp({
              checkbox: {
                callbacks: () => alertConfig.write('skip_dxf_version_warning', true),
                text: tAlert.dont_show_again,
              },
              id: 'skip_dxf_version_warning',
              message: t.dxf_version_waring,
              type: alertConstants.SHOW_POPUP_WARNING,
            });
          }
        }
      }

      const parsed = Dxf2Svg.parseString(evt.target.result);
      const unit = String(parsed.header?.insunits);

      const defaultDpiValue =
        {
          1: 25.4,
          2: 304.8,
          4: 1,
          5: 10,
          6: 100,
        }[unit] ?? 1;

      resolve({ defaultDpiValue, parsed });
    };
    reader.readAsText(file);
  });

  progressCaller.popById('loading_image');

  if (!parsed) {
    alertCaller.popUp({ message: 'DXF Parsing Error' });

    return;
  }

  const unitLength = await dialogCaller.showDxfDpiSelector(defaultDpiValue);

  if (!unitLength) {
    return;
  }

  progressCaller.openNonstopProgress({
    // TODO: i18n
    caption: 'Loading image, please wait...',
    id: 'loading_image',
  });

  const { bbox, outputLayers } = Dxf2Svg.toSVG(parsed, unitLength * 10);
  const { height, width } = workareaManager;

  if (!alertConfig.read('skip_dxf_oversize_warning') && (bbox.width > width || bbox.height > height)) {
    alertCaller.popUp({
      checkbox: {
        callbacks: () => {
          alertConfig.write('skip_dxf_oversize_warning', true);
        },
        text: tAlert.dont_show_again,
      },
      id: 'dxf_size_over_workarea',
      message: t.dxf_bounding_box_size_over,
      type: alertConstants.SHOW_POPUP_WARNING,
    });
  }

  const batchCmd = HistoryCommandFactory.createBatchCommand('Import DXF');
  const svgdoc = document.getElementById('svgcanvas').ownerDocument;
  const layerNames = Object.keys(outputLayers);
  const promises = [];

  for (let i = 0; i < layerNames.length; i += 1) {
    const layerName = layerNames[i];
    const layer = outputLayers[layerName];
    const isLayerExist = layerManager.setCurrentLayer(layerName);

    if (!isLayerExist) {
      createLayer(layerName, {
        hexCode: layer.rgbCode,
        initConfig: true,
        parentCmd: batchCmd,
      });
    }

    const id = svgCanvas.getNextId();
    const symbol = svgdoc.createElementNS(NS.SVG, 'symbol') as unknown as SVGSymbolElement;

    symbol.setAttribute('overflow', 'visible');
    symbol.id = id;
    findDefs().appendChild(symbol);
    symbol.innerHTML = layer.paths.join('');
    for (let j = symbol.childNodes.length - 1; j >= 0; j -= 1) {
      const child = symbol.childNodes[j] as unknown as SVGElement;

      if (child.tagName === 'path' && !$(child).attr('d')) {
        child.remove();
      } else {
        child.id = svgCanvas.getNextId();
        child.setAttribute('id', svgCanvas.getNextId());
      }
    }

    const useElem = svgdoc.createElementNS(NS.SVG, 'use');

    useElem.id = svgCanvas.getNextId();
    svgedit.utilities.setHref(useElem, `#${symbol.id}`);
    layerManager.getCurrentLayer()!.appendChildren([useElem]);
    batchCmd.addSubCommand(new history.InsertElementCommand(useElem));

    const bb = getBBox(useElem, { ignoreTransform: true });

    const attrs = [];
    const keys = Object.keys(bb);

    for (let j = 0; j < keys.length; j += 1) {
      const key = keys[j];

      attrs.push(`${key}=${bb[key]}`);
    }

    const xform = attrs.join(' ');

    useElem.setAttribute('data-dxf', 'true');
    useElem.setAttribute('data-ratiofixed', 'true');
    useElem.setAttribute('data-xform', xform);

    promises.push(
      // eslint-disable-next-line no-async-promise-executor
      new Promise<void>(async (resolve) => {
        const imageSymbol = await SymbolMaker.makeImageSymbol(symbol);

        if (imageSymbol) {
          svgedit.utilities.setHref(useElem, `#${imageSymbol.id}`);
          svgCanvas.updateElementColor(useElem);
        }

        resolve();
      }),
    );
  }
  await Promise.all(promises);

  removeDefaultLayerIfEmpty({ parentCmd: batchCmd });
};

export default importDxf;
