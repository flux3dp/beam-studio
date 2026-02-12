import undoManager from '@core/app/svgedit/history/undoManager';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { getBBox } from '../utils/getBBox';

import transformlist from './transformlist';

let svgCanvas: ISVGCanvas;
let svgedit: any;

getSVGAsync(({ Canvas, Edit }) => {
  svgCanvas = Canvas;
  svgedit = Edit;
});

const getRotationAngleFromTransformList = (tlist: null | SVGTransformList, toRad = false): number => {
  if (!tlist) return 0;

  for (let i = 0; i < tlist.numberOfItems; i++) {
    const xform = tlist.getItem(i);

    if (xform.type === SVGTransform.SVG_TRANSFORM_ROTATE) {
      return toRad ? (xform.angle * Math.PI) / 180.0 : xform.angle;
    }
  }

  return 0;
};

export const getRotationAngle = (elem: SVGElement, toRad = false): number => {
  const tlist = transformlist.getTransformList(elem as SVGGraphicsElement);

  return getRotationAngleFromTransformList(tlist, toRad);
};

export const setRotationAngle = (
  elem: SVGElement,
  value: number,
  { addToHistory = false, parentCmd }: { addToHistory?: boolean; parentCmd?: IBatchCommand } = {},
): void => {
  const oldTransform = elem.getAttribute('transform');
  const bbox = getBBox(elem, { ignoreTransform: true });
  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;
  const tlist = svgedit.transformlist.getTransformList(elem);

  // only remove the real rotational transform if present (i.e. at index=0)
  if (tlist.numberOfItems > 0) {
    const xform = tlist.getItem(0);

    if (String(xform.type) === '4') {
      tlist.removeItem(0);
    }
  }

  // find R_nc and insert it
  if (value !== 0) {
    const center = svgedit.math.transformPoint(cx, cy, svgedit.math.transformListToTransform(tlist).matrix);
    const svgroot = document.getElementById('svgroot') as unknown as SVGSVGElement;
    const rotationNc = svgroot.createSVGTransform();

    rotationNc.setRotate(value, center.x, center.y);

    if (tlist.numberOfItems) tlist.insertItemBefore(rotationNc, 0);
    else tlist.appendItem(rotationNc);
  } else if (tlist.numberOfItems === 0) {
    elem.removeAttribute('transform');
  }

  if (parentCmd || addToHistory) {
    let cmd: IBatchCommand | null = null;

    if (elem.getAttribute('data-tempgroup') === 'true') {
      cmd = svgCanvas.pushGroupProperties(elem as SVGGElement, true);
    } else {
      const newTransform = elem.getAttribute('transform') ?? '';

      if (oldTransform) {
        elem.setAttribute('transform', oldTransform);
      } else {
        elem.removeAttribute('transform');
      }

      undoManager.beginUndoableChange('transform', [elem]);
      svgCanvas.changeSelectedAttributeNoUndo('transform', newTransform ?? undefined, [elem]);
      cmd = undoManager.finishUndoableChange();
    }

    if (cmd && !cmd.isEmpty()) {
      if (parentCmd) parentCmd.addSubCommand(cmd);
      else if (addToHistory) undoManager.addCommandToHistory(cmd);
    }
  }
};

export default {
  getRotationAngle,
  getRotationAngleFromTransformList,
  setRotationAngle,
};
