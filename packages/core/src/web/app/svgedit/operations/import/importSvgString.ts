import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import history from '@core/app/svgedit/history/history';
import appendUseElement from '@core/app/svgedit/operations/import/appendUseElement';
import parseSvg from '@core/app/svgedit/operations/parseSvg';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { removeDefaultLayerIfEmpty } from '@core/helpers/layer/deleteLayer';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';
import { getDefaultLaserModule } from '@core/helpers/layer-module/layer-module-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import symbolMaker from '@core/helpers/symbol-helper/symbolMaker';
import type { IBatchCommand, ICommand } from '@core/interfaces/IHistory';
import type { ImportType } from '@core/interfaces/ImportSvg';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgedit: any;
let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgedit = globalSVG.Edit;
});

const importSvgString = async (
  xmlString: string,
  {
    hidden = false,
    layerName,
    parentCmd,
    removeDefaultLayer = true,
    targetModule = getDefaultLaserModule(),
    type = 'nolayer',
  }: {
    hidden?: boolean;
    layerName?: string;
    parentCmd?: IBatchCommand;
    removeDefaultLayer?: boolean;
    targetModule?: LayerModuleType;
    type?: ImportType;
  },
): Promise<SVGUseElement[]> => {
  const batchCmd = new history.BatchCommand('Import Image');

  function setDataXform(use_el: SVGUseElement, isImageTrace: boolean) {
    const bb = svgedit.utilities.getBBox(use_el);
    let dataXform = '';

    if (isImageTrace) {
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
      symbols.map(async (symbol) => appendUseElement(symbol, { hidden, layerName, targetModule, type })),
    )
  ).filter((res) => res?.element) as Array<{ command: ICommand; element: SVGUseElement }>;

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

      if (imageSymbol) {
        svgCanvas.setHref(element, `#${imageSymbol.id}`);
        updateElementColor(element);
      }
    }),
  );

  if (useElements.length > 0 && removeDefaultLayer) {
    removeDefaultLayerIfEmpty({ parentCmd: batchCmd });
  }

  if (!batchCmd.isEmpty()) {
    if (parentCmd) {
      parentCmd.addSubCommand(batchCmd);
    } else {
      svgCanvas.addCommandToHistory(batchCmd);
    }
  }

  if (!hidden) {
    svgCanvas.call('changed', [document.getElementById('svgcontent')]);
  }

  return useElements;
};

export default importSvgString;
