import type LayerModule from '@core/app/constants/layer-module/layer-modules';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import NS from '@core/app/constants/namespaces';
import history from '@core/app/svgedit/history/history';
import rgbToHex from '@core/helpers/color/rgbToHex';
import i18n from '@core/helpers/i18n';
import layerConfigHelper, { getData, writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { createLayer, getLayerByName } from '@core/helpers/layer/layer-helper';
import layerModuleHelper from '@core/helpers/layer-module/layer-module-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import storage from '@core/implementations/storage';
import type { ICommand } from '@core/interfaces/IHistory';
import type { ImportType } from '@core/interfaces/ImportSvg';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const checkLayerModule = (layer: Element, targetModule: LayerModule): boolean => {
  if (!layer) return false;

  const currentModule = getData(layer, 'module') as LayerModule;
  const isCurrentPrinting = printingModules.has(currentModule);
  const isTargetPrinting = printingModules.has(targetModule);

  if (isCurrentPrinting !== isTargetPrinting) return false;

  return true;
};

const appendUseElement = (
  symbol: null | SVGSymbolElement,
  args: { layerName?: string; targetModule?: LayerModule; type: ImportType },
): null | {
  command: ICommand;
  element: SVGUseElement;
} => {
  // create a use element
  if (!symbol) {
    return null;
  }

  const batchCmd = new history.BatchCommand('Append Use Element');
  const { layerName, targetModule = layerModuleHelper.getDefaultLaserModule(), type } = args;
  const useEl = document.createElementNS(NS.SVG, 'use');

  useEl.id = svgCanvas.getNextId();
  useEl.setAttributeNS(NS.XLINK, 'xlink:href', `#${symbol.id}`);

  // switch currentLayer, and create layer if necessary
  let targetLayerName = layerName;
  const currentDrawing = svgCanvas.getCurrentDrawing();

  if (
    (type === 'layer' && layerName) ||
    (type === 'color' && symbol.getAttribute('data-color')) ||
    type === 'image-trace'
  ) {
    const color = symbol.getAttribute('data-color');

    if (type === 'image-trace') {
      targetLayerName = 'Traced Path';
    } else if (type === 'color') {
      targetLayerName = rgbToHex(color);
    }

    const targetLayer = getLayerByName(targetLayerName);

    if (!checkLayerModule(targetLayer, targetModule)) {
      const { cmd, layer: newLayer, name: newLayerName } = createLayer(targetLayerName, { isSubCmd: true });

      if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);

      layerConfigHelper.initLayerConfig(newLayerName);

      if (type === 'layer' && targetLayerName) {
        const matchPara = targetLayerName.match(/#([-SP0-9.]*\b)/i);

        if (matchPara) {
          const matchPower = matchPara[1].match(/P([-0-9.]*)/i);
          const matchSpeed = matchPara[1].match(/S([-0-9.]*)/i);
          let parsePower = matchPower ? Number.parseFloat(matchPower[1]) : Number.NaN;
          let parseSpeed = matchSpeed ? Number.parseFloat(matchSpeed[1]) : Number.NaN;
          const laserConst = i18n.lang.beambox.right_panel.laser_panel;

          if (!Number.isNaN(parsePower)) {
            parsePower = Math.round(parsePower * 10) / 10;
            parsePower = Math.max(Math.min(parsePower, laserConst.power.max), laserConst.power.min);
            writeDataLayer(newLayer, 'power', parsePower);
          }

          if (!Number.isNaN(parseSpeed)) {
            parseSpeed = Math.round(parseSpeed * 10) / 10;
            parseSpeed = Math.max(Math.min(parseSpeed, laserConst.laser_speed.max), laserConst.laser_speed.min);
            writeDataLayer(newLayer, 'speed', parseSpeed);
          }
        }
      } else if (type === 'color') {
        const layerColorConfig = storage.get('layer-color-config') || {};
        const index = layerColorConfig.dict ? layerColorConfig.dict[layerName] : undefined;
        const laserConst = i18n.lang.beambox.right_panel.laser_panel;

        if (index !== undefined) {
          writeDataLayer(
            newLayer,
            'power',
            Math.max(Math.min(layerColorConfig.array[index].power, laserConst.power.max), laserConst.power.min),
          );
          writeDataLayer(
            newLayer,
            'speed',
            Math.max(
              Math.min(layerColorConfig.array[index].speed, laserConst.laser_speed.max),
              laserConst.laser_speed.min,
            ),
          );
          writeDataLayer(newLayer, 'repeat', layerColorConfig.array[index].repeat);
        }
      }

      if (printingModules.has(targetModule)) {
        // TODO: make sure if the targetModule is always suitable for workarea
        writeDataLayer(newLayer, 'module', targetModule);
        writeDataLayer(newLayer, 'fullcolor', true);
      }
    } else if (currentDrawing.getCurrentLayer() !== targetLayer) {
      svgCanvas.setCurrentLayer(targetLayerName);
    }
  } else {
    let targetLayer = currentDrawing.getCurrentLayer();

    if (!checkLayerModule(targetLayer, targetModule)) {
      const {
        cmd,
        layer,
        name: newLayerName,
      } = createLayer(
        printingModules.has(targetModule) ? i18n.lang.layer_module.printing : i18n.lang.layer_module.general_laser,
        { isSubCmd: true },
      );

      targetLayer = layer;

      if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);

      layerConfigHelper.initLayerConfig(newLayerName);
      svgCanvas.setCurrentLayer(newLayerName);
    }

    if (printingModules.has(targetModule)) {
      // TODO: make sure if the targetModule is always suitable for workarea
      writeDataLayer(targetLayer, 'module', targetModule);
      writeDataLayer(targetLayer, 'fullcolor', true);
    }
  }

  currentDrawing.getCurrentLayer()!.appendChild(useEl);

  useEl.setAttribute('data-svg', 'true');
  useEl.setAttribute('data-ratiofixed', 'true');

  if (type === 'nolayer' && !printingModules.has(targetModule)) {
    useEl.setAttribute('data-wireframe', 'true');

    const iterationStack = [symbol] as Element[];

    while (iterationStack.length > 0) {
      const node = iterationStack.pop();

      if (node?.nodeType === 1 && node.tagName !== 'STYLE') {
        if (!['g', 'tspan'].includes(node.tagName)) {
          node.setAttribute('data-wireframe', 'true');
          node.setAttribute('stroke', '#000');
          node.setAttribute('fill-opacity', '0');
          node.setAttribute('fill', 'none');
        }

        iterationStack.push(...(Array.from(node.childNodes) as Element[]));
      }
    }
  }

  batchCmd.addSubCommand(new history.InsertElementCommand(useEl));

  return { command: batchCmd, element: useEl as SVGUseElement };
};

export default appendUseElement;
