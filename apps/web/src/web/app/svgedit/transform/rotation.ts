import ISVGCanvas from 'interfaces/ISVGCanvas';
import undoManager from 'app/svgedit/history/undoManager';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { IBatchCommand } from 'interfaces/IHistory';

import transfromlist from './transfromlist';

let svgCanvas: ISVGCanvas;
let svgedit;
getSVGAsync(({ Canvas, Edit }) => {
  svgCanvas = Canvas;
  svgedit = Edit;
});

const getRotationAngleFromTransformList = (
  tlist: SVGTransformList | null,
  toRad = false
): number => {
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
  const tlist = transfromlist.getTransformList(elem as SVGGraphicsElement);
  return getRotationAngleFromTransformList(tlist, toRad);
};

export const setRotationAngle = (
  elem: SVGElement,
  value: number,
  { parentCmd, addToHistory = false }: { parentCmd?: IBatchCommand; addToHistory?: boolean } = {}
): IBatchCommand => {
  const oldTransform = elem.getAttribute('transform');
  const bbox = svgedit.utilities.getBBox(elem);
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
    const center = svgedit.math.transformPoint(
      cx,
      cy,
      svgedit.math.transformListToTransform(tlist).matrix
    );
    const svgroot = document.getElementById('svgroot') as unknown as SVGSVGElement;
    const rotationNc = svgroot.createSVGTransform();
    rotationNc.setRotate(value, center.x, center.y);
    if (tlist.numberOfItems) {
      tlist.insertItemBefore(rotationNc, 0);
    } else {
      tlist.appendItem(rotationNc);
    }
  } else if (tlist.numberOfItems === 0) {
    elem.removeAttribute('transform');
  }

  let cmd: IBatchCommand | null = null;
  // we need to undo it, then redo it so it can be undo-able! :)
  // TODO: figure out how to make changes to transform list undo-able cross-browser?
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
  return cmd;
};

export default {
  getRotationAngle,
  getRotationAngleFromTransformList,
  setRotationAngle,
};
