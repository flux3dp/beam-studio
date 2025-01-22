import alertCaller from '@core/app/actions/alert-caller';
import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import progressCaller from '@core/app/actions/progress-caller';
import alertConstants from '@core/app/constants/alert-constants';
import history from '@core/app/svgedit/history/history';
import { fitPath } from '@core/helpers/bezier-fit-curve';
import updateElementColor from '@core/helpers/color/updateElementColor';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import ClipperBase from './clipper';
import getClipperLib from './getClipperLib';

let svgCanvas: ISVGCanvas;
let svgedit;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgedit = globalSVG.Edit;
});

/** Function: offsetElements
 * Create offset of elements
 * @param {number} dir direction 0: inward 1: outward;
 * @param {number} dist offset distance;
 * @param {string} cornerType 'round' or 'sharp';
 * @param {SVGElement[]} elems target, selected if not passed;
 */
const offsetElements = async (
  dir: number,
  dist: number,
  cornerType: 'round' | 'sharp',
  elems?: SVGElement[],
): Promise<void> => {
  progressCaller.openNonstopProgress({
    id: 'offset-path',
    message: i18n.lang.beambox.popup.progress.calculating,
  });
  await new Promise<void>((resolve) => {
    setTimeout(() => resolve(), 100);
  });

  const selectedElements = svgCanvas.getSelectedElems(true);

  elems = elems || selectedElements;

  const batchCmd = new history.BatchCommand('Create Offset Elements');
  let solutionPaths = [];
  const scale = 100;

  if (dir === 0) {
    dist *= -1;
  }

  let isContainNotSupportTag = false;
  const ClipperLib = getClipperLib();
  const co = new ClipperBase('offset', 5, 0.25);

  for (let i = 0; i < elems.length; i += 1) {
    const elem = elems[i];

    if (!elem) {
      return;
    }

    if (['g', 'image', 'text', 'use'].includes(elem.tagName)) {
      isContainNotSupportTag = true;
      console.log(elem.tagName);

      return;
    }

    const dpath = svgedit.utilities.getPathDFromElement(elem);
    const bbox = svgedit.utilities.getBBox(elem);
    const rotation = {
      angle: svgedit.utilities.getRotationAngle(elem),
      cx: bbox.x + bbox.width / 2,
      cy: bbox.y + bbox.height / 2,
    };

    const paths = ClipperLib.dPathtoPointPathsAndScale(dpath, rotation, scale);
    let closed = true;

    for (let j = 0; j < paths.length; j += 1) {
      if (!(paths[j][0].X === paths[j][paths[j].length - 1].X && paths[j][0].Y === paths[j][paths[j].length - 1].Y)) {
        closed = false;
        break;
      }
    }

    if (cornerType === 'round') {
      await co.addPaths(paths, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etOpenRound);
    } else if (cornerType === 'sharp') {
      if (closed) {
        await co.addPaths(paths, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etClosedLine);
      } else {
        await co.addPaths(paths, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etOpenSquare);
      }
    }
  }
  solutionPaths = await co.execute(solutionPaths, Math.abs(dist * scale));
  co.terminate();

  if (dir === 1) {
    if (solutionPaths.length > 0) {
      const clipper = new ClipperBase('clipper');
      let res = [solutionPaths[0]];

      for (let i = 1; i < solutionPaths.length; i += 1) {
        await clipper.addPaths(res, ClipperLib.PolyType.ptSubject, true);
        await clipper.addPaths([solutionPaths[i]], ClipperLib.PolyType.ptClip, true);
        res = await clipper.execute(1, res, 1, 1);
      }
      clipper.terminate();
      solutionPaths = res;
    }
  } else {
    solutionPaths = solutionPaths.slice(1);
  }

  progressCaller.popById('offset-path');

  if (solutionPaths.length === 0 || !solutionPaths[0]) {
    if (isContainNotSupportTag) {
      alertCaller.popUp({
        id: 'Offset',
        message: i18n.lang.beambox.tool_panels._offset.not_support_message,
        type: alertConstants.SHOW_POPUP_WARNING,
      });
    } else {
      alertCaller.popUp({
        id: 'Offset',
        message: i18n.lang.beambox.tool_panels._offset.fail_message,
        type: alertConstants.SHOW_POPUP_WARNING,
      });
    }

    console.log('clipper.co failed');

    return;
  }

  if (isContainNotSupportTag) {
    alertCaller.popUp({
      id: 'Offset',
      message: i18n.lang.beambox.tool_panels._offset.not_support_message,
      type: alertConstants.SHOW_POPUP_WARNING,
    });
  }

  let d = '';

  for (let i = 0; i < solutionPaths.length; i += 1) {
    if (!beamboxPreference.read('simplify_clipper_path')) {
      d += 'M';
      d += solutionPaths[i].map((x) => `${x.X / scale},${x.Y / scale}`).join(' L');
      d += ' Z';
    } else {
      d += 'M';

      const points = solutionPaths[i].map((p) => ({
        x: Math.floor(100 * (p.X / scale)) / 100,
        y: Math.floor(100 * (p.Y / scale)) / 100,
      }));
      // TODO: use simplifyPath
      const segs = fitPath(points);

      for (let j = 0; j < segs.length; j += 1) {
        const seg = segs[j];

        if (j === 0) {
          d += `${seg.points[0].x},${seg.points[0].y}`;
        }

        const pointsString = seg.points
          .slice(1)
          .map((p) => `${p.x},${p.y}`)
          .join(' ');

        d += `${seg.type}${pointsString}`;
      }
      d += 'Z';
    }
  }

  const newElem = svgCanvas.addSvgElementFromJson({
    attr: {
      d,
      fill: 'none',
      'fill-opacity': 0,
      id: svgCanvas.getNextId(),
      stroke: '#000',
    },
    curStyles: false,
    element: 'path',
  });

  svgCanvas.pathActions.fixEnd(newElem);

  batchCmd.addSubCommand(new history.InsertElementCommand(newElem));

  if (svgCanvas.isUsingLayerColor) {
    updateElementColor(newElem);
  }

  svgCanvas.selectOnly([newElem], true);
  svgCanvas.addCommandToHistory(batchCmd);
};

export default offsetElements;
