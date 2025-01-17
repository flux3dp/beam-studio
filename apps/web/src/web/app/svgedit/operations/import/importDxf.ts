import alertCaller from 'app/actions/alert-caller';
import alertConfig from 'helpers/api/alert-config';
import alertConstants from 'app/constants/alert-constants';
import dialogCaller from 'app/actions/dialog-caller';
import findDefs from 'app/svgedit/utils/findDef';
import HistoryCommandFactory from 'app/svgedit/history/HistoryCommandFactory';
import history from 'app/svgedit/history/history';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import i18n from 'helpers/i18n';
import layerConfigHelper from 'helpers/layer/layer-config-helper';
import NS from 'app/constants/namespaces';
import progressCaller from 'app/actions/progress-caller';
import requirejsHelper from 'helpers/requirejs-helper';
import SymbolMaker from 'helpers/symbol-maker';
import workareaManager from 'app/svgedit/workarea';
import { createLayer, removeDefaultLayerIfEmpty } from 'helpers/layer/layer-helper';
import { getSVGAsync } from 'helpers/svg-editor-helper';

let svgCanvas: ISVGCanvas;
let svgedit;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgedit = globalSVG.Edit;
});

// TODO: add unit test
const importDxf = async (file: Blob): Promise<void> => {
  const lang = i18n.lang.beambox;
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
              id: 'skip_dxf_version_warning',
              message: lang.popup.dxf_version_waring,
              type: alertConstants.SHOW_POPUP_WARNING,
              checkbox: {
                text: lang.popup.dont_show_again,
                callbacks: () => alertConfig.write('skip_dxf_version_warning', true),
              },
            });
          }
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-shadow
      const parsed = Dxf2Svg.parseString(evt.target.result);
      const unit = String(parsed.header?.insunits);
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const defaultDpiValue =
        {
          1: 25.4,
          2: 304.8,
          4: 1,
          5: 10,
          6: 100,
        }[unit] ?? 1;
      resolve({ parsed, defaultDpiValue });
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
    id: 'loading_image',
    // TODO: i18n
    caption: 'Loading image, please wait...',
  });
  const { outputLayers, bbox } = Dxf2Svg.toSVG(parsed, unitLength * 10);
  const { width, height } = workareaManager
  if (
    !alertConfig.read('skip_dxf_oversize_warning') &&
    (bbox.width > width || bbox.height > height)
  ) {
    alertCaller.popUp({
      id: 'dxf_size_over_workarea',
      message: lang.popup.dxf_bounding_box_size_over,
      type: alertConstants.SHOW_POPUP_WARNING,
      checkbox: {
        text: lang.popup.dont_show_again,
        callbacks: () => {
          alertConfig.write('skip_dxf_oversize_warning', true);
        },
      },
    });
  }
  const batchCmd = HistoryCommandFactory.createBatchCommand('Import DXF');
  const svgdoc = document.getElementById('svgcanvas').ownerDocument;
  const layerNames = Object.keys(outputLayers);
  const promises = [];
  for (let i = 0; i < layerNames.length; i += 1) {
    const layerName = layerNames[i];
    const layer = outputLayers[layerName];
    const isLayerExist = svgCanvas.setCurrentLayer(layerName);
    if (!isLayerExist) {
      const { cmd } = createLayer(layerName, layer.rgbCode);
      if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);
      layerConfigHelper.initLayerConfig(layerName);
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
    svgCanvas.getCurrentDrawing().getCurrentLayer().appendChild(useElem);
    batchCmd.addSubCommand(new history.InsertElementCommand(useElem));
    const bb = svgedit.utilities.getBBox(useElem);

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
      // eslint-disable-next-line @typescript-eslint/no-loop-func, no-async-promise-executor
      new Promise<void>(async (resolve) => {
        const imageSymbol = await SymbolMaker.makeImageSymbol(symbol);
        svgedit.utilities.setHref(useElem, `#${imageSymbol.id}`);
        svgCanvas.updateElementColor(useElem);
        resolve();
      })
    );
  }
  await Promise.all(promises);
  const cmd = removeDefaultLayerIfEmpty();
  if (cmd) batchCmd.addSubCommand(cmd);
};

export default importDxf;
