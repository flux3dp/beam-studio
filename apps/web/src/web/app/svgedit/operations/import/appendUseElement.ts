import history from 'app/svgedit/history/history';
import i18n from 'helpers/i18n';
import LayerModule from 'app/constants/layer-module/layer-modules';
import layerConfigHelper, { getData, writeDataLayer } from 'helpers/layer/layer-config-helper';
import layerModuleHelper from 'helpers/layer-module/layer-module-helper';
import NS from 'app/constants/namespaces';
import rgbToHex from 'helpers/color/rgbToHex';
import storage from 'implementations/storage';
import { createLayer, getLayerByName } from 'helpers/layer/layer-helper';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { ICommand } from 'interfaces/IHistory';
import { ImportType } from 'interfaces/ImportSvg';

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const checkLayerModule = (layer: Element, targetModule: LayerModule): boolean => {
  if (!layer) return false;
  const currentModule = getData(layer, 'module') as LayerModule;
  if (currentModule === LayerModule.PRINTER && targetModule !== LayerModule.PRINTER) return false;
  if (currentModule !== LayerModule.PRINTER && targetModule === LayerModule.PRINTER) return false;
  return true;
};

const appendUseElement = (
  symbol: SVGSymbolElement | null,
  args: { type: ImportType; layerName?: string; targetModule?: LayerModule }
): {
  element: SVGUseElement;
  command: ICommand;
} => {
  // create a use element
  if (!symbol) {
    return null;
  }
  const batchCmd = new history.BatchCommand('Append Use Element');
  const { type, layerName, targetModule = layerModuleHelper.getDefaultLaserModule() } = args;
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
      const {
        layer: newLayer,
        name: newLayerName,
        cmd,
      } = createLayer(targetLayerName, { isSubCmd: true });
      if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);
      layerConfigHelper.initLayerConfig(newLayerName);

      if (type === 'layer' && targetLayerName) {
        const matchPara = targetLayerName.match(/#([-SP0-9.]*\b)/i);
        if (matchPara) {
          const matchPower = matchPara[1].match(/P([-0-9.]*)/i);
          const matchSpeed = matchPara[1].match(/S([-0-9.]*)/i);
          let parsePower = matchPower ? parseFloat(matchPower[1]) : NaN;
          let parseSpeed = matchSpeed ? parseFloat(matchSpeed[1]) : NaN;
          const laserConst = i18n.lang.beambox.right_panel.laser_panel;
          if (!Number.isNaN(parsePower)) {
            parsePower = Math.round(parsePower * 10) / 10;
            parsePower = Math.max(Math.min(parsePower, laserConst.power.max), laserConst.power.min);
            writeDataLayer(newLayer, 'power', parsePower);
          }
          if (!Number.isNaN(parseSpeed)) {
            parseSpeed = Math.round(parseSpeed * 10) / 10;
            parseSpeed = Math.max(
              Math.min(parseSpeed, laserConst.laser_speed.max),
              laserConst.laser_speed.min
            );
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
            Math.max(
              Math.min(layerColorConfig.array[index].power, laserConst.power.max),
              laserConst.power.min
            )
          );
          writeDataLayer(
            newLayer,
            'speed',
            Math.max(
              Math.min(layerColorConfig.array[index].speed, laserConst.laser_speed.max),
              laserConst.laser_speed.min
            )
          );
          writeDataLayer(newLayer, 'repeat', layerColorConfig.array[index].repeat);
        }
      }
      if (targetModule === LayerModule.PRINTER) {
        writeDataLayer(newLayer, 'module', LayerModule.PRINTER);
        writeDataLayer(newLayer, 'fullcolor', true);
      }
    } else if (currentDrawing.getCurrentLayer() !== targetLayer) {
      svgCanvas.setCurrentLayer(targetLayerName);
    }
  } else {
    let targetLayer = currentDrawing.getCurrentLayer();
    if (!checkLayerModule(targetLayer, targetModule)) {
      const {
        layer,
        name: newLayerName,
        cmd,
      } = createLayer(
        targetModule === LayerModule.PRINTER
          ? i18n.lang.layer_module.printing
          : i18n.lang.layer_module.general_laser,
        { isSubCmd: true }
      );
      targetLayer = layer;
      if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);
      layerConfigHelper.initLayerConfig(newLayerName);
      svgCanvas.setCurrentLayer(newLayerName);
    }
    if (targetModule === LayerModule.PRINTER) {
      writeDataLayer(targetLayer, 'module', LayerModule.PRINTER);
      writeDataLayer(targetLayer, 'fullcolor', true);
    }
  }

  currentDrawing.getCurrentLayer().appendChild(useEl);

  useEl.setAttribute('data-svg', 'true');
  useEl.setAttribute('data-ratiofixed', 'true');

  if (type === 'nolayer' && targetModule !== LayerModule.PRINTER) {
    useEl.setAttribute('data-wireframe', 'true');
    const iterationStack = [symbol] as Element[];
    while (iterationStack.length > 0) {
      const node = iterationStack.pop();
      if (node.nodeType === 1 && node.tagName !== 'STYLE') {
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
  return { element: useEl as SVGUseElement, command: batchCmd };
};

export default appendUseElement;
