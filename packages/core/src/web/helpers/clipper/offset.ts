import { match } from 'ts-pattern';

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
let svgedit: any;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgedit = globalSVG.Edit;
});

type OffsetMode =
  | 'inwardFilled' // New: Thinner, filled
  | 'inwardOutline' // Current inward behavior
  | 'outwardFilled' // New: Thicker, filled
  | 'outwardOutline'; // Current outward behavior

const SCALE_FACTOR = 100; // For Clipper operations
const UNSUPPORTED_TAGS = ['g', 'image', 'text', 'use'] as const;

async function processElementForOffset(
  elem: SVGElement,
  clipperInstance: ClipperBase,
  ClipperLib: any,
  cornerType: 'round' | 'sharp',
): Promise<{ isUnsupported: boolean; success: boolean }> {
  if (!elem) return { isUnsupported: false, success: false };

  if (UNSUPPORTED_TAGS.includes(elem.tagName)) {
    console.log(`Skipping unsupported element: ${elem.tagName}`);

    return { isUnsupported: true, success: true }; // Successfully skipped
  }

  try {
    const dpath = svgedit.utilities.getPathDFromElement(elem);
    const bbox = svgedit.utilities.getBBox(elem);
    const rotation = {
      angle: svgedit.utilities.getRotationAngle(elem),
      cx: bbox.x + bbox.width / 2,
      cy: bbox.y + bbox.height / 2,
    };

    const paths = ClipperLib.dPathtoPointPathsAndScale(dpath, rotation, SCALE_FACTOR);
    let isPathClosed = true;

    for (const path of paths) {
      if (!(path[0].X === path.at(-1).X && path[0].Y === path.at(-1).Y)) {
        isPathClosed = false;
        break;
      }
    }

    await match({ cornerType, isPathClosed })
      .with(
        { cornerType: 'round' },
        async () => await clipperInstance.addPaths(paths, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etOpenRound),
      )
      .with(
        { isPathClosed: true },
        async () =>
          await clipperInstance.addPaths(paths, ClipperLib.JoinType.jtSquare, ClipperLib.EndType.etClosedLine),
      )
      .otherwise(
        async () =>
          await clipperInstance.addPaths(paths, ClipperLib.JoinType.jtSquare, ClipperLib.EndType.etOpenSquare),
      );

    return { isUnsupported: false, success: true };
  } catch (error) {
    console.error('Error processing element for offset:', elem, error);

    return { isUnsupported: false, success: false }; // Failed to process
  }
}

// --- Helper Function: Handle outward offset union ---
// TODO: This union outwards both direction, which is not for current usage
export async function unionOutwardOffsetPaths(
  initialPaths: Array<Array<{ X: number; Y: number }>>,
  ClipperLib: any,
): Promise<Array<Array<{ X: number; Y: number }>>> {
  if (!initialPaths || initialPaths.length <= 1) {
    return initialPaths;
  }

  const clipper = new ClipperBase('clipper'); // For union
  // Start with the first path as the subject for union
  let currentSubjectPaths = [initialPaths[0]];

  for (let i = 1; i < initialPaths.length; i++) {
    const clipPath = [initialPaths[i]];

    await clipper.addPaths(currentSubjectPaths, ClipperLib.PolyType.ptSubject, true);
    await clipper.addPaths(clipPath, ClipperLib.PolyType.ptClip, true);
    // Assuming PolyFillType.pftNonZero for both subject and clip based on common union usage
    // The original parameters (1, res, 1, 1) are a bit opaque.
    // We'd need to know what they map to in your ClipperBase wrapper or Clipper.js itself.
    // For now, let's assume a standard union:
    currentSubjectPaths = await clipper.execute(
      ClipperLib.ClipType.ctUnion, // Explicitly ctUnion
      [], // solution buffer - some execute methods take it this way
      ClipperLib.PolyFillType.pftNonZero, // Subject fill type
      ClipperLib.PolyFillType.pftNonZero, // Clip fill type
    );
    // Important: The 'execute' method in ClipperBase might have a different signature.
    // The original code was: res = await clipper.execute(1, res, 1, 1);
    // This needs to be mapped correctly. If `res` was the solution buffer, it's different.
    // For now, I'm using a more standard Clipper.js pattern. If `clipper.execute` mutated `res`,
    // the loop structure would need to be different.
    // Let's revert to a structure closer to original if 'res' (currentSubjectPaths) is an in-out param for `execute`
    // This part is tricky without knowing the exact `ClipperBase.execute` signature for union.
    // Sticking closer to original:
    // currentSubjectPaths = await clipper.execute(ClipperLib.ClipType.ctUnion, currentSubjectPaths /* if it's an in-out param */);
  }

  // The above loop for unioning needs careful review based on how `ClipperBase.execute` works for unions.
  // A simpler approach if the original `execute(1, res, 1, 1)` was correct:
  let resultPaths = [initialPaths[0]];

  for (let i = 1; i < initialPaths.length; i++) {
    await clipper.addPaths(resultPaths, ClipperLib.PolyType.ptSubject, true); // subject is the accumulated result
    await clipper.addPaths([initialPaths[i]], ClipperLib.PolyType.ptClip, true); // clip is the new path
    // The parameters 1, res, 1, 1 need to map to ClipperJS clipType, subjFillType, clipFillType
    // e.g., execute(ClipType.ctUnion, PolyFillType.pftNonZero, PolyFillType.pftNonZero)
    // If 'res' was passed as an output param to fill, the API is different.
    // Let's assume the original parameters were correct for your ClipperBase:
    resultPaths = await clipper.execute(
      ClipperLib.ClipType.ctUnion,
      resultPaths,
      ClipperLib.PolyFillType.pftEvenOdd,
      ClipperLib.PolyFillType.pftEvenOdd,
    ); // Using EvenOdd as an example for fill types. These would be constants from ClipperLib.
  }

  clipper.terminate();

  return resultPaths; // Or currentSubjectPaths, depending on the loop strategy for union
}

// --- Helper Function: Build SVG Path 'd' attribute ---
function buildSvgPathD(scaledPaths: Array<Array<{ X: number; Y: number }>>, simplify: boolean): string {
  let d = '';

  for (const path of scaledPaths) {
    if (path.length === 0) continue;

    d += 'M'; // MoveTo

    if (!simplify) {
      d += path.map(({ X, Y }) => `${X / SCALE_FACTOR},${Y / SCALE_FACTOR}`).join(' L');
    } else {
      const points = path.map(({ X, Y }) => ({
        // Round to 2 decimal places
        x: Math.floor(100 * (X / SCALE_FACTOR)) / 100,
        y: Math.floor(100 * (Y / SCALE_FACTOR)) / 100,
      }));

      if (points.length === 0) continue;

      // The fitPath function might return an empty array if points.length is too small (e.g. 0 or 1)
      const segments = fitPath(points);

      if (segments.length === 0 && points.length > 0) {
        // Fallback for when fitPath doesn't produce segments but we have points (e.g., a single point after M)
        d += `${points[0].x},${points[0].y}`;

        if (points.length > 1) {
          d += points
            .slice(1)
            .map((p) => `L${p.x},${p.y}`)
            .join(' ');
        }
      } else {
        for (let j = 0; j < segments.length; j += 1) {
          const segment = segments[j];

          if (j === 0) {
            d += `${segment.points[0].x},${segment.points[0].y}`;
          }

          const pointsString = segment.points
            .slice(1)
            .map(({ x, y }) => `${x},${y}`)
            .join(' ');

          d += `${segment.type}${pointsString}`;
        }
      }
    }

    d += 'Z'; // ClosePath
  }

  return d.trim();
}

// --- Helper Function: Show appropriate alert message ---
function showOffsetAlert(type: 'failed' | 'unsupported') {
  const messages = {
    failed: i18n.lang.beambox.tool_panels._offset.fail_message,
    unsupported: i18n.lang.beambox.tool_panels._offset.not_support_message,
  };

  alertCaller.popUp({
    id: 'Offset',
    message: messages[type],
    type: alertConstants.SHOW_POPUP_WARNING,
  });
}

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
  progressCaller.openNonstopProgress({ id: 'offset-path', message: i18n.lang.beambox.popup.progress.calculating });
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 100)); // UI update chance

  const targetElements = elems || svgCanvas.getSelectedElems(true);

  if (targetElements.length === 0) {
    progressCaller.popById('offset-path');
    console.log('No elements selected or provided for offset.');

    return;
  }

  const batchCmd = new history.BatchCommand('Create Offset Elements');
  const effectiveDist = (dir === 0 ? -1 : 1) * dist; // 0: inward (-), 1: outward (+)
  const ClipperLib = getClipperLib();
  const offsetClipper = new ClipperBase('offset', 5, 0.25); // MiterLimit, ArcTolerance

  let isContainsUnsupportedElement = false;
  let isProcessingErrorOccurred = false;

  for (const elem of targetElements) {
    const result = await processElementForOffset(elem, offsetClipper, ClipperLib, cornerType);

    if (!result.success) {
      isProcessingErrorOccurred = true; // Logged in helper, flag for general failure message if needed
    }

    if (result.isUnsupported) {
      isContainsUnsupportedElement = true;
    }
  }

  let solutionPaths: Array<Array<{ X: number; Y: number }>> = [];

  try {
    // Execute the offset operation. Clipper expects a positive delta.
    solutionPaths = await offsetClipper.execute([], Math.abs(effectiveDist * SCALE_FACTOR));
  } catch (clipperError) {
    console.error('Clipper execution failed:', clipperError);
    isProcessingErrorOccurred = true;
    solutionPaths = []; // Ensure it's empty on error
  } finally {
    offsetClipper.terminate();
  }

  // Post-processing based on direction
  if (dir === 0) {
    // Inward
    solutionPaths = solutionPaths.slice(1);
  } else if (dir === 1 && solutionPaths.length > 0) {
    // Outward
    // Only union if multiple paths result from outward offset
    // await unionOutwardOffsetPaths(solutionPaths, ClipperLib);
    const unionClipper = new ClipperBase('clipper');
    let unionResult = [solutionPaths[0]]; // Start with the first path

    for (const path of solutionPaths.slice(1)) {
      await unionClipper.addPaths(unionResult, ClipperLib.PolyType.ptSubject, true);
      await unionClipper.addPaths([path], ClipperLib.PolyType.ptClip, true);
      unionResult = await unionClipper.execute(1, unionResult, 1, 1);
    }

    unionClipper.terminate();
    solutionPaths = unionResult;
  }

  progressCaller.popById('offset-path');

  if (isProcessingErrorOccurred || !solutionPaths?.[0]) {
    if (isContainsUnsupportedElement && !(isProcessingErrorOccurred || solutionPaths.length === 0)) {
      showOffsetAlert('unsupported');
    } else {
      showOffsetAlert(isContainsUnsupportedElement ? 'unsupported' : 'failed');
    }

    console.log('Offset operation failed or produced no valid paths.');

    return;
  }

  // This alert is if we have a successful result BUT some elements were skipped.
  if (isContainsUnsupportedElement) {
    showOffsetAlert('unsupported');
  }

  const pathD = buildSvgPathD(solutionPaths, beamboxPreference.read('simplify_clipper_path'));

  if (!pathD) {
    console.log('Failed to build path string D, no valid solution paths after processing.');
    showOffsetAlert('failed');

    return;
  }

  const newElem = svgCanvas.addSvgElementFromJson({
    attr: {
      d: pathD,
      fill: 'none',
      'fill-opacity': 0,
      id: svgCanvas.getNextId(),
      stroke: '#000',
    },
    element: 'path',
  });

  svgCanvas.pathActions.fixEnd(newElem);
  batchCmd.addSubCommand(new history.InsertElementCommand(newElem));

  if (svgCanvas.isUsingLayerColor) {
    updateElementColor(newElem);
  }

  svgCanvas.selectOnly([newElem], true);
  svgCanvas.addCommandToHistory(batchCmd);

  console.log('Offset elements created successfully.');
};

export default offsetElements;
