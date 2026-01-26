/* global EventListener */
import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import alertConstants from '@core/app/constants/alert-constants';
import NS from '@core/app/constants/namespaces';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { useLayerStore } from '@core/app/stores/layer/layerStore';
import updateElementColor from '@core/helpers/color/updateElementColor';
import i18n from '@core/helpers/i18n';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import symbolMaker from '@core/helpers/symbol-helper/symbolMaker';
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

function hasValidClipPaths(root: SVGElement): boolean {
  const elementsWithClipPath = root.querySelectorAll('[clip-path]');

  for (let i = 0; i < elementsWithClipPath.length; i++) {
    const element = elementsWithClipPath[i] as SVGElement;
    const clipPathAttr = element.getAttribute('clip-path');

    if (!clipPathAttr) continue;

    const match = clipPathAttr.match(/url\(#(.+?)\)/);

    if (match) {
      const id = match[1];
      const clipPath = root.querySelector(`clipPath[id="${id}"]`);

      if (clipPath) return true;
    } else {
      element.removeAttribute('clip-path');
    }
  }

  return false;
}

// TODO: add unit test
export const disassembleUse = async (
  elems: null | SVGElement[] = null,
  {
    addToHistory = true,
    parentCmd,
    showProgress = true,
    skipConfirm = false,
  }: { addToHistory?: boolean; parentCmd?: IBatchCommand; showProgress?: boolean; skipConfirm?: boolean } = {},
): Promise<BatchCommand | void> => {
  const {
    lang: { beambox: t },
  } = i18n;

  if (!elems) elems = [...svgCanvas.getSelectedElems()] as SVGElement[];

  if (!skipConfirm) {
    const confirm = await new Promise((resolve) => {
      alertCaller.popUp({
        buttonType: alertConstants.YES_NO,
        message: t.popup.disassemble_use.execute_time_warning,
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
  const progressId = 'disassemble-use';
  let isSomeWithClipPath = false;

  if (showProgress) {
    progressCaller.openSteppingProgress({
      id: progressId,
      message: `${t.right_panel.object_panel.actions_panel.disassembling} - 0%`,
    });
    // Wait for progress update
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  for (let i = 0; i < elems.length; ++i) {
    const elem = elems[i];
    const allElementPercentage = Math.round((100 * i) / elems.length);

    if (showProgress) {
      progressCaller.update(progressId, {
        message: `${t.right_panel.object_panel.actions_panel.ungrouping} - ${allElementPercentage}%`,
        percentage: allElementPercentage,
      });

      // Wait for progress update
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    if (!elem || elem.tagName !== 'use') continue;

    const isFromNP = elem.getAttribute('data-np') === '1';
    const ratioFixed = elem.getAttribute('data-ratiofixed');
    const cmd = symbolMaker.switchImageSymbol(elem as SVGUseElement, false);

    if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);

    const { elem: layer, title: layerTitle } = getObjectLayer(elem)!;

    useLayerStore.getState().setSelectedLayers([layerTitle]);

    const color = (useGlobalPreferenceStore.getState().use_layer_color ? getData(layer, 'color') : '#000') ?? '#000';
    const drawing = svgCanvas.getCurrentDrawing();
    const wireframe = elem.getAttribute('data-wireframe') === 'true';

    let transform = elem.getAttribute('transform') || '';
    const x = Number.parseFloat(elem.getAttribute('x') || '0');
    const y = Number.parseFloat(elem.getAttribute('y') || '0');
    const translate = `translate(${x},${y})`;

    transform = `${transform} ${translate}`;

    const href = getHref(elem);

    if (!href) continue;

    const svg = document.querySelector<SVGElement>(href);

    if (!svg) continue;

    if (hasValidClipPaths(svg)) {
      isSomeWithClipPath = true;
      continue;
    }

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

    let currentElementPercentage = 0;

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
        const elementPercentage = Math.round((100 * j) / nodeNumbers);

        if (elementPercentage > currentElementPercentage) {
          const percentage = Math.round(allElementPercentage + (0.9 * elementPercentage) / elems.length);

          progressCaller.update(progressId, {
            message: `${t.right_panel.object_panel.actions_panel.disassembling} - ${percentage}%`,
            percentage,
          });

          // Wait for progress update
          await new Promise((resolve) => setTimeout(resolve, 10));
          currentElementPercentage = elementPercentage;
        }
      }
    }
    layer.appendChild(g);

    if (showProgress) {
      const percentage = Math.round(allElementPercentage + 90 / elems.length);

      progressCaller.update(progressId, {
        message: `${t.right_panel.object_panel.actions_panel.ungrouping} - ${percentage}%`,
        percentage,
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

    svgCanvas.tempGroupSelectedElements();
    currentFileManager.setHasUnsavedChanges(true);
  }

  if (showProgress) {
    progressCaller.update(progressId, {
      message: `${t.right_panel.object_panel.actions_panel.ungrouping} - 100%`,
      percentage: 100,
    });
    progressCaller.popById(progressId);
  }

  if (isSomeWithClipPath) {
    alertCaller.popUp({
      message: t.popup.disassemble_use.clip_path_warning,
      type: alertConstants.SHOW_POPUP_WARNING,
    });
  }

  if (batchCmd && !batchCmd.isEmpty()) {
    if (parentCmd) parentCmd.addSubCommand(batchCmd);
    else if (addToHistory) undoManager.addCommandToHistory(batchCmd);
  }

  return batchCmd;
};

export default disassembleUse;
