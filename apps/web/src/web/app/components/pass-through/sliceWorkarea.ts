import beamboxPreference from 'app/actions/beambox/beambox-preference';
import clipboard from 'app/svgedit/operations/clipboard';
import constant from 'app/actions/beambox/constant';
import findDefs from 'app/svgedit/utils/findDef';
import history from 'app/svgedit/history/history';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import i18n from 'helpers/i18n';
import LayerPanelController from 'app/views/beambox/Right-Panels/contexts/LayerPanelController';
import layerConfigHelper, {
  initLayerConfig,
  writeDataLayer,
} from 'helpers/layer/layer-config-helper';
import NS from 'app/constants/namespaces';
import progressCaller from 'app/actions/progress-caller';
import updateElementColor from 'helpers/color/updateElementColor';
import workareaManager from 'app/svgedit/workarea';
import { changeBeamboxPreferenceValue } from 'app/svgedit/history/beamboxPreferenceCommand';
import { createLayer, getLayerName } from 'helpers/layer/layer-helper';
import { deleteUseRef } from 'app/svgedit/operations/delete';
import { GuideMark } from 'interfaces/IPassThrough';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { getWorkarea } from 'app/constants/workarea-constants';
import { IBatchCommand } from 'interfaces/IHistory';

import { PassThroughCanvasManager } from './canvasManager';

let svgCanvas: ISVGCanvas;
let svgedit;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgedit = globalSVG.Edit;
});

const sliceWorkarea = async (
  sliceHeight: number,
  opt: { refLayers?: boolean; guideMark?: GuideMark; parentCmd?: IBatchCommand } = {}
): Promise<void> => {
  const progressId = 'slice-workarea';
  const lang = i18n.lang.pass_through;
  progressCaller.openNonstopProgress({ id: progressId, message: lang.exporting });
  const { refLayers, parentCmd, guideMark = { show: false, x: 0, width: 40 } } = opt;
  const { dpmm } = constant;
  const workarea = beamboxPreference.read('workarea');
  const workareaObj = getWorkarea(workarea);
  const batchCmd = new history.BatchCommand('Slice Workarea');
  const currentDrawing = svgCanvas.getCurrentDrawing();
  const sliceHeightPx = sliceHeight * dpmm;
  const defs = findDefs();
  const { width, height: workareaHeight } = workareaManager;
  const topPadding = (workareaObj.height - sliceHeight) / 2;
  const topPaddingPx = topPadding * dpmm;
  const refImageBase64s = refLayers
    ? await PassThroughCanvasManager.getInstance()?.generateRefImage(topPaddingPx)
    : null;

  const generateGuideMark = () => {
    if (guideMark.show) {
      const { x, width: lineWidth } = guideMark;
      const {
        layer: newLayer,
        name,
        cmd,
      } = createLayer(lang.guide_mark, {
        isSubCmd: true,
        hexCode: '#9745ff',
      });
      initLayerConfig(name);

      const start = document.createElementNS(NS.SVG, 'path') as SVGPathElement;
      const left = ((x - lineWidth / 2) * dpmm).toFixed(2);
      const right = ((x + lineWidth / 2) * dpmm).toFixed(2);
      const halfHeight = (lineWidth / Math.sqrt(3)) * dpmm;
      const startMid = topPaddingPx;
      const startTop = (startMid - halfHeight).toFixed(2);
      const startBottom = (startMid + halfHeight).toFixed(2);
      const endMid = topPaddingPx + sliceHeightPx;
      const endTop = (endMid - halfHeight).toFixed(2);
      const endBottom = (endMid + halfHeight).toFixed(2);
      start.setAttribute(
        'd',
        `M ${left} ${startMid} L ${right} ${startTop} L ${right} ${startBottom} L ${left} ${startMid} Z`
      );
      start.setAttribute('stroke', '#9745ff');
      start.setAttribute('fill', 'none');
      start.setAttribute('vector-effect', 'non-scaling-stroke');
      start.id = svgCanvas.getNextId();
      newLayer.appendChild(start);
      const end = start.cloneNode(true) as SVGPathElement;
      end.setAttribute(
        'd',
        `M ${left} ${endMid} L ${right} ${endTop} L ${right} ${endBottom} L ${left} ${endMid} Z`
      );
      end.id = svgCanvas.getNextId();
      newLayer.appendChild(end);
      updateElementColor(start);
      updateElementColor(end);
      if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);
    }
  };

  const clonedLayers = Array.from(document.querySelectorAll('#svgcontent > .layer')).map(
    (layer) => {
      const name = getLayerName(layer);
      const clonedLayer = layer.cloneNode(true) as SVGGElement;
      clonedLayer.querySelectorAll('title').forEach((el) => el.remove());
      clonedLayer.querySelector('filter')?.remove();
      clonedLayer.id = `passThroughRef_${Date.now()}`;
      defs.appendChild(clonedLayer);
      const bbox = clonedLayer.getBBox();
      if (bbox.height + bbox.y > workareaHeight) bbox.height = workareaHeight - bbox.y;
      if (bbox.y < 0) {
        bbox.height += bbox.y;
        bbox.y = 0;
      }
      clonedLayer.remove();
      return { name, bbox, element: clonedLayer, origLayer: layer, hasNewLayer: false };
    }
  );

  const updateUseElementPromises = [];
  for (let i = Math.ceil(workareaHeight / sliceHeightPx) - 1; i >= 0; i -= 1) {
    const start = i * sliceHeightPx;
    const end = Math.min((i + 1) * sliceHeightPx, workareaHeight);
    let anyLayer = false;
    for (let j = 0; j < clonedLayers.length; j += 1) {
      const { name, bbox, element } = clonedLayers[j];
      const { y, width: bboxW, height } = bbox;
      // eslint-disable-next-line no-continue
      if (bboxW === 0 || height === 0 || y + height < start || y > end) continue;
      anyLayer = true;
      clonedLayers[j].hasNewLayer = true;

      const {
        layer,
        name: newLayerName,
        cmd,
      } = createLayer(`${name} - ${i + 1}`, {
        isSubCmd: true,
      });
      if (!cmd.isEmpty()) batchCmd.addSubCommand(cmd);
      layerConfigHelper.cloneLayerConfig(newLayerName, name);
      layer.setAttribute('data-lock', 'true');
      if (i > 0) layer.setAttribute('display', 'none');

      const container = document.createElementNS(NS.SVG, 'g') as SVGGElement;
      container.setAttribute('transform', `translate(0, ${topPaddingPx - start})`);
      for (let k = 0; k < element.children.length; k += 1) {
        const child = element.children[k] as SVGGraphicsElement;
        container.appendChild(child.cloneNode(true));
      }
      container.id = svgCanvas.getNextId();
      container.setAttribute('data-pass-through', '1');
      layer.appendChild(container);
      const children = Array.from(container.childNodes);
      for (let k = children.length - 1; k >= 0; k -= 1) {
        const child = children[k] as SVGGraphicsElement;
        if (child.tagName !== 'use' && child.tagName !== 'text' && child.getBBox) {
          const { y: childY, height: childH } = child.getBBox();
          if (childY + childH < start || childY > end) {
            child.remove();
          }
        }
      }
      svgedit.recalculate.recalculateDimensions(container);
      const descendants = Array.from(container.querySelectorAll('*'));
      const refMap = {}; // id changes
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      descendants.forEach(async (el) => {
        if (el.id) {
          const oldId = el.id;
          el.setAttribute('id', svgCanvas.getNextId());
          if (el.tagName.toLowerCase() === 'clippath') {
            refMap[oldId] = el.id;
          }
        }
      });
      updateUseElementPromises.push(clipboard.handlePastedRef(container));
      const clipPath = document.createElementNS(NS.SVG, 'clipPath') as SVGClipPathElement;
      const clipRect = document.createElementNS(NS.SVG, 'rect') as SVGRectElement;
      clipPath.appendChild(clipRect);
      clipRect.setAttribute('x', '0');
      clipRect.setAttribute('y', topPaddingPx.toString());
      clipRect.setAttribute('width', width.toString());
      clipRect.setAttribute('height', (end - start).toString());
      clipPath.id = svgCanvas.getNextId();

      // wrap container with clipPath
      const g = document.createElementNS(NS.SVG, 'g') as SVGGElement;
      g.id = svgCanvas.getNextId();
      g.setAttribute('clip-path', `url(#${clipPath.id})`);
      while (container.firstChild) g.appendChild(container.firstChild);
      container.appendChild(g);
      container.insertBefore(clipPath, container.firstChild);
    }
    if (anyLayer && refImageBase64s?.[i]) {
      const { layer, name, cmd } = createLayer(`${lang.ref_layer_name}-${i + 1}`, {
        isSubCmd: true,
      });
      layer.setAttribute('data-lock', 'true');
      if (i > 0) layer.setAttribute('display', 'none');
      if (!cmd.isEmpty()) batchCmd.addSubCommand(cmd);
      layerConfigHelper.initLayerConfig(name);
      writeDataLayer(layer, 'fullcolor', true);
      writeDataLayer(layer, 'ref', true);
      writeDataLayer(layer, 'repeat', 0);
      const image = document.createElementNS(NS.SVG, 'image') as SVGImageElement;
      image.setAttribute('x', '0');
      image.setAttribute('y', '0');
      image.setAttribute('width', width.toString());
      image.setAttribute('height', topPaddingPx.toString());
      image.setAttributeNS(NS.XLINK, 'xlink:href', refImageBase64s[i]);
      layer.appendChild(image);
    }
  }
  await Promise.allSettled(updateUseElementPromises);
  clonedLayers.forEach(({ hasNewLayer, origLayer }) => {
    if (hasNewLayer) {
      const { nextSibling } = origLayer;
      const parent = origLayer.parentNode;
      origLayer.remove();
      const uses = origLayer.querySelectorAll('use');
      uses.forEach((use) => deleteUseRef(use, { parentCmd: batchCmd }));
      batchCmd.addSubCommand(new history.RemoveElementCommand(origLayer, nextSibling, parent));
    }
  });
  generateGuideMark();
  changeBeamboxPreferenceValue('pass-through', false, { parentCmd: batchCmd });
  const onAfter = () => {
    currentDrawing.identifyLayers();
    LayerPanelController.setSelectedLayers([]);
    workareaManager.setWorkarea(workarea);
    workareaManager.resetView();
  };
  onAfter();
  if (parentCmd) parentCmd.addSubCommand(batchCmd);
  else svgCanvas.undoMgr.addCommandToHistory(batchCmd);
  batchCmd.onAfter = onAfter;
  progressCaller.popById(progressId);
};

export default sliceWorkarea;
