import appendUseElement from '@core/app/svgedit/operations/import/appendUseElement';
import history from '@core/app/svgedit/history/history';
import ISVGCanvas from '@core/interfaces/ISVGCanvas';
import LayerModule from '@core/app/constants/layer-module/layer-modules';
import layerModuleHelper from '@core/helpers/layer-module/layer-module-helper';
import parseSvg from '@core/app/svgedit/operations/parseSvg';
import symbolMaker from '@core/helpers/symbol-maker';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { IBatchCommand } from '@core/interfaces/IHistory';
import { ImportType } from '@core/interfaces/ImportSvg';
import { getObjectLayer, removeDefaultLayerIfEmpty } from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';

let svgedit;
let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgedit = globalSVG.Edit;
});

const importSvgString = async (
  xmlString: string,
  {
    type = 'nolayer',
    layerName,
    parentCmd,
    targetModule = layerModuleHelper.getDefaultLaserModule(),
  }: {
    type?: ImportType;
    layerName?: string;
    parentCmd?: IBatchCommand;
    targetModule?: LayerModule;
  },
): Promise<SVGUseElement> => {
  const batchCmd = new history.BatchCommand('Import Image');

  function setDataXform(use_el, it) {
    const bb = svgedit.utilities.getBBox(use_el);
    let dataXform = '';

    if (it) {
      dataXform = `x=0 y=0 width=${bb.width} height=${bb.height}`;
    } else {
      $.each(bb, (key: string, value) => {
        dataXform = `${dataXform}${key}=${value} `;
      });
    }

    use_el.setAttribute('data-xform', dataXform);
    return use_el;
  }

  const newDoc = svgedit.utilities.text2xml(xmlString);

  svgCanvas.prepareSvg(newDoc);

  const svg = document.adoptNode(newDoc.documentElement);
  const { symbols } = parseSvg(batchCmd, svg, type);

  const results = (
    await Promise.all(
      symbols.map(async (symbol) => appendUseElement(symbol, { type, layerName, targetModule })),
    )
  ).filter((res) => res?.element);

  const commands = results.map(({ command }) => command);

  commands.forEach((cmd) => {
    if (cmd) {
      batchCmd.addSubCommand(cmd);
    }
  });

  const useElements = results.map(({ element }) => element);

  useElements.forEach((elem) => {
    elem.addEventListener('mouseover', svgCanvas.handleGenerateSensorArea);
    elem.addEventListener('mouseleave', svgCanvas.handleGenerateSensorArea);
  });

  useElements.forEach((element) => setDataXform(element, type === 'image-trace'));

  await Promise.all(
    useElements.map(async (element) => {
      const refId = svgCanvas.getHref(element);
      const symbol = document.querySelector(refId) as SVGSymbolElement;
      const layer = getObjectLayer(element as SVGUseElement)?.elem;
      const imageSymbol = await symbolMaker.makeImageSymbol(symbol, {
        fullColor: layer?.getAttribute('data-fullcolor') === '1',
      });

      svgCanvas.setHref(element, `#${imageSymbol.id}`);

      if (svgCanvas.isUsingLayerColor) {
        updateElementColor(element);
      }
    }),
  );

  if (useElements.length > 0) {
    const cmd = removeDefaultLayerIfEmpty();

    if (cmd) {
      batchCmd.addSubCommand(cmd);
    }
  }

  if (!batchCmd.isEmpty()) {
    if (parentCmd) {
      parentCmd.addSubCommand(batchCmd);
    } else {
      svgCanvas.addCommandToHistory(batchCmd);
    }
  }
  svgCanvas.call('changed', [document.getElementById('svgcontent')]);

  return useElements[useElements.length - 1];
};

export default importSvgString;
