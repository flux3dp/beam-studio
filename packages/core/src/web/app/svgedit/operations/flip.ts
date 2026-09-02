import history from '@core/app/svgedit/history/history';
import selectionManager from '@core/app/svgedit/selection';
import selector from '@core/app/svgedit/selector';
import jimpHelper from '@core/helpers/jimp-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand, ICommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import changeAttribute from '../history/changeAttribute';
import undoManager from '../history/undoManager';
import { recalculateDimensions, setStartTransform } from '../transform/recalculate';
import { getRotationAngle, setRotationAngle } from '../transform/rotation';
import { getTransformList } from '../transform/transformlist';
import { getBBox } from '../utils/getBBox';

import { moveElements } from './move';

const { svgedit } = window;

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

interface Point {
  x: number;
  y: number;
}

/** Each axis is 1 (keep) or -1 (mirror). */
interface FlipParams {
  horizon: number;
  vertical: number;
}

const addSubCommand = (batchCmd: IBatchCommand, cmd?: ICommand | null) => {
  if (!cmd || ('isEmpty' in cmd && (cmd as IBatchCommand).isEmpty())) return;

  batchCmd.addSubCommand(cmd);
};

/** Map a point from a group's parent coordinate system into the group's own. */
const toLocalPoint = ({ x, y }: Point, group: SVGGraphicsElement): Point => {
  const tlist = getTransformList(group);

  if (!tlist || tlist.numberOfItems === 0) return { x, y };

  const inverse = svgedit.math.transformListToTransform(tlist).matrix.inverse();

  return svgedit.math.transformPoint(x, y, inverse);
};

/** Mirror the raster data of an image in place (both the display href and the original source). */
const flipImage = async (image: SVGImageElement, { horizon, vertical }: FlipParams): Promise<IBatchCommand> => {
  const batchCmd = new history.BatchCommand('Flip image');
  const origImage = image.getAttribute('origImage');

  if (origImage) {
    const data = await jimpHelper.urlToImage(origImage);

    data.flip(horizon === -1, vertical === -1);
    addSubCommand(batchCmd, changeAttribute(image, { origImage: await jimpHelper.imageToUrl(data) }));
  }

  const flipCanvas = document.createElement('canvas');
  const ctx = flipCanvas.getContext('2d')!;

  flipCanvas.width = Number(image.getAttribute('width'));
  flipCanvas.height = Number(image.getAttribute('height'));
  ctx.translate(horizon < 0 ? flipCanvas.width : 0, vertical < 0 ? flipCanvas.height : 0);
  ctx.scale(horizon, vertical);
  ctx.drawImage(image, 0, 0, flipCanvas.width, flipCanvas.height);

  addSubCommand(batchCmd, changeAttribute(image, { 'xlink:href': flipCanvas.toDataURL() }));

  return batchCmd;
};

/**
 * Flip a single (non-group) element across `center`, given in the element's parent coordinate system.
 * Does not emit `changed`; callers batch that once for the whole operation.
 */
export const flipElement = async (
  elem: SVGGraphicsElement,
  center: Point,
  params: FlipParams,
): Promise<IBatchCommand> => {
  const { horizon, vertical } = params;
  const batchCmd = new history.BatchCommand('Flip Single Element');
  const angle = getRotationAngle(elem);

  // Mirroring negates rotation: bake the current transform in at 0°, then re-rotate by -angle.
  const oldTransform = elem.getAttribute('transform') ?? '';

  setRotationAngle(elem, 0);
  recalculateDimensions(elem);
  setRotationAngle(elem, -angle);
  addSubCommand(batchCmd, new history.ChangeElementCommand(elem, { transform: oldTransform }));

  const bbox = getBBox(elem);
  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;

  if (elem.tagName === 'image') {
    addSubCommand(batchCmd, await flipImage(elem as SVGImageElement, params));
  } else {
    setStartTransform(elem.getAttribute('transform'));

    const svgroot = document.getElementById('svgroot') as unknown as SVGSVGElement;
    const tlist = getTransformList(elem)!;
    const translateOrigin = svgroot.createSVGTransform();
    const scale = svgroot.createSVGTransform();
    const translateBack = svgroot.createSVGTransform();

    translateOrigin.setTranslate(-cx, -cy);
    scale.setScale(horizon, vertical);
    translateBack.setTranslate(cx, cy);

    // Mirror about the element's own center: [translateBack][scale][translateOrigin].
    if (svgedit.math.hasMatrixTransform(tlist)) {
      const pos = angle ? 1 : 0;

      tlist.insertItemBefore(translateOrigin, pos);
      tlist.insertItemBefore(scale, pos);
      tlist.insertItemBefore(translateBack, pos);
    } else {
      tlist.appendItem(translateBack);
      tlist.appendItem(scale);
      tlist.appendItem(translateOrigin);
    }

    addSubCommand(batchCmd, recalculateDimensions(elem));
  }

  // Then mirror the element's position across the shared center.
  const dx = horizon < 0 ? 2 * (center.x - cx) : 0;
  const dy = vertical < 0 ? 2 * (center.y - cy) : 0;

  addSubCommand(batchCmd, moveElements([dx], [dy], [elem], false, true));

  return batchCmd;
};

/**
 * Flip the selected elements across their own centers.
 * Groups are walked recursively: each leaf is flipped across the top-level center mapped into its own
 * coordinate system, and a rotated group has its rotation negated.
 */
export const flipSelectedElements = async (horizon = 1, vertical = 1): Promise<void> => {
  const selectedElements = selectionManager.getSelectedElements() as SVGGraphicsElement[];
  const batchCmd = new history.BatchCommand('Flip Elements');
  const params = { horizon, vertical };

  for (const elem of selectedElements) {
    const bbox = getBBox(elem);
    const centers: Point[] = [{ x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 }];
    // `exitAngle` marks the second visit of a group, after all its children were flipped.
    const stack: Array<{ elem: SVGGraphicsElement; exitAngle?: number }> = [{ elem }];

    while (stack.length > 0) {
      const { elem: current, exitAngle } = stack.pop()!;

      if (exitAngle !== undefined) {
        centers.pop();

        if (exitAngle !== 0) setRotationAngle(current, -exitAngle, { parentCmd: batchCmd });

        continue;
      }

      if (current.tagName !== 'g') {
        addSubCommand(batchCmd, await flipElement(current, centers[centers.length - 1], params));
        continue;
      }

      const angle = getRotationAngle(current);

      if (angle !== 0) setRotationAngle(current, 0, { parentCmd: batchCmd });

      stack.push({ elem: current, exitAngle: angle });
      centers.push(toLocalPoint(centers[centers.length - 1], current));
      Array.from(current.children).forEach((child) => stack.push({ elem: child as SVGGraphicsElement }));
    }

    const elemSelector = selector.getSelectorManager().requestSelector(elem);

    elemSelector?.resize();
    elemSelector?.show(selectedElements.length === 1);
  }

  undoManager.addCommandToHistory(batchCmd);
  svgCanvas.call('changed', selectedElements);
};

export default { flipElement, flipSelectedElements };
