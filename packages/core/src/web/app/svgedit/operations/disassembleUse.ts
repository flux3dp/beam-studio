/* global EventListener */
import alertCaller from '@core/app/actions/alert-caller';
import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import progressCaller from '@core/app/actions/progress-caller';
import alertConstants from '@core/app/constants/alert-constants';
import NS from '@core/app/constants/namespaces';
import LayerPanelController from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelController';
import updateElementColor from '@core/helpers/color/updateElementColor';
import i18n from '@core/helpers/i18n';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import symbolMaker from '@core/helpers/symbol-maker';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import currentFileManager from '../currentFileManager';
import ungroupElement from '../group/ungroup';
import type { BatchCommand } from '../history/history';
import history from '../history/history';
import undoManager from '../history/undoManager';
import { getRotationAngle, setRotationAngle } from '../transform/rotation';
import { getHref } from '../utils/href';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

const { svgedit } = window;

export const disassembleUse = async (
  elems: null | SVGElement[] = null,
  {
    addToHistory = true,
    parentCmd,
    showProgress = true,
    skipConfirm = false,
  }: {
    addToHistory?: boolean;
    parentCmd?: IBatchCommand;
    showProgress?: boolean;
    skipConfirm?: boolean;
  } = {},
): Promise<BatchCommand | void> => {
  if (!elems) elems = svgCanvas.getSelectedElems() as SVGElement[];

  const useLayerColor = beamboxPreference.read('use_layer_color');

  const {
    lang: { beambox: t },
  } = i18n;

  if (!skipConfirm) {
    const confirm = await new Promise((resolve) => {
      alertCaller.popUp({
        buttonType: alertConstants.YES_NO,
        message: t.popup.ungroup_use,
        onNo: () => resolve(false),
        onYes: () => resolve(true),
        type: alertConstants.SHOW_POPUP_WARNING,
      });
    });

    if (!confirm) return;

    // Wait for alert close
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  const batchCmd = new history.BatchCommand('Disassemble Use');

  for (let i = 0; i < elems.length; ++i) {
    const elem = elems[i];

    if (!elem || elem.tagName !== 'use') continue;

    if (showProgress) {
      progressCaller.openSteppingProgress({
        id: 'disassemble-use',
        message: `${t.right_panel.object_panel.actions_panel.disassembling} - 0%`,
      });
    }

    const isFromNP = elem.getAttribute('data-np') === '1';
    const ratioFixed = elem.getAttribute('data-ratiofixed');
    const cmd = symbolMaker.switchImageSymbol(elem as SVGUseElement, false);

    if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);

    const { elem: layer, title: layerTitle } = getObjectLayer(elem);

    svgCanvas.setCurrentLayer(layerTitle);
    LayerPanelController.updateLayerPanel();

    const color = (useLayerColor ? getData(layer, 'color') : '#000') ?? '#000';
    const drawing = svgCanvas.getCurrentDrawing();
    const wireframe = elem.getAttribute('data-wireframe') === 'true';

    let transform = elem.getAttribute('transform') || '';
    const x = Number.parseFloat(elem.getAttribute('x') || '0');
    const y = Number.parseFloat(elem.getAttribute('y') || '0');
    const translate = `translate(${x},${y})`;

    transform = `${transform} ${translate}`;

    const href = getHref(elem);

    if (!href) continue;

    const svg = document.querySelector(href);

    if (!svg) continue;

    const children = [...Array.from(svg.childNodes).reverse()];
    let g = document.createElementNS(NS.SVG, 'g');

    g.setAttribute('id', svgCanvas.getNextId());
    g.setAttribute('transform', transform);
    while (children.length > 0) {
      const topChild = children.pop() as Element;
      const copy = drawing.copyElem(topChild);

      if (topChild.tagName !== 'defs') {
        g.appendChild(copy);
      }
    }

    // apply style
    const descendants = Array.from(g.querySelectorAll('*')) as Element[];
    const nodeNumbers = descendants.length;

    if (showProgress) {
      // Wait for progress open
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    let currentProgress = 0;

    for (let j = 0; j < descendants.length; j++) {
      const child = descendants[j];

      if (!['g', 'tspan'].includes(child.tagName) && wireframe) {
        child.setAttribute('stroke', color);
        child.setAttribute('fill', 'none');
        child.setAttribute('fill-opacity', '0');
      }

      if (isFromNP) child.setAttribute('data-np', '1');

      child.setAttribute('id', svgCanvas.getNextId());
      child.setAttribute('vector-effect', 'non-scaling-stroke');
      child.removeAttribute('stroke-width');

      child.addEventListener('mouseover', svgCanvas.handleGenerateSensorArea as EventListener);
      child.addEventListener('mouseleave', svgCanvas.handleGenerateSensorArea as EventListener);
      svgedit.recalculate.recalculateDimensions(child);

      if (showProgress) {
        const progress = Math.round((200 * j) / nodeNumbers) / 2;

        if (progress > currentProgress) {
          progressCaller.update('disassemble-use', {
            message: `${t.right_panel.object_panel.actions_panel.disassembling} - ${
              Math.round((9000 * j) / nodeNumbers) / 100
            }%`,
            percentage: progress * 0.9,
          });
          // Wait for progress update
          await new Promise((resolve) => setTimeout(resolve, 10));
          currentProgress = progress;
        }
      }
    }
    layer.appendChild(g);

    if (showProgress) {
      progressCaller.update('disassemble-use', {
        message: `${t.right_panel.object_panel.actions_panel.ungrouping} - 90%`,
        percentage: 90,
      });
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    batchCmd.addSubCommand(new history.InsertElementCommand(g));
    batchCmd.addSubCommand(new history.RemoveElementCommand(elem, elem.nextSibling!, elem.parentNode!));
    elem.parentNode!.removeChild(elem);

    const angle = getRotationAngle(g);

    if (angle) setRotationAngle(g, 0, { addToHistory: false });

    svgedit.recalculate.recalculateDimensions(g);

    if (angle) setRotationAngle(g, angle, { addToHistory: false });

    // Ungroup until no nested group
    while (g.children.length === 1 && g.children[0].tagName === 'g') {
      const newG = g.children[0] as SVGGElement;

      // in case it has original layer data
      newG.removeAttribute('data-original-layer');

      const res = ungroupElement(g);

      if (res) {
        g = newG;

        const { batchCmd: cmd } = res;

        if (!cmd.isEmpty()) batchCmd.addSubCommand(cmd);
      } else {
        break;
      }
    }
    updateElementColor(g);

    const res = ungroupElement(g);

    if (res) {
      const { batchCmd: cmd, children } = res;

      if (!cmd.isEmpty()) batchCmd.addSubCommand(cmd);

      svgCanvas.selectOnly(children as SVGElement[], true);
    } else {
      svgCanvas.selectOnly([g], true);
    }

    if (ratioFixed) svgCanvas.getSelectedElems().forEach((elem) => elem.setAttribute('data-ratiofixed', ratioFixed));

    if (showProgress) {
      progressCaller.update('disassemble-use', {
        message: `${t.right_panel.object_panel.actions_panel.ungrouping} - 100%`,
        percentage: 100,
      });
      progressCaller.popById('disassemble-use');
    }

    svgCanvas.tempGroupSelectedElements();
    currentFileManager.setHasUnsavedChanges(true);
  }

  if (batchCmd && !batchCmd.isEmpty()) {
    if (parentCmd) parentCmd.addSubCommand(batchCmd);
    else if (addToHistory) undoManager.addCommandToHistory(batchCmd);
  }

  return batchCmd;
};

export default disassembleUse;
