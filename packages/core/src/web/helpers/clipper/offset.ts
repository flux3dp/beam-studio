// Assuming this is used in processElementForOffset

import { match, P } from 'ts-pattern';

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
  | 'inwardFilled' // GAP in single object THINNER (material expands)
  | 'inwardOutline' // Material shrinks
  | 'outwardFilled' // GAP in single object THICKER (material shrinks)
  | 'outwardOutline'; // Material expands

const SCALE_FACTOR = 100; // Scale factor for ClipperLib operations, to handle precision issues
const ROUND_FACTOR = 100; // Used for rounding points in fitPath
const UNSUPPORTED_TAGS = ['g', 'image', 'text', 'use'] as const; // Tags that are not supported for offset operations
const MITER_LIMIT = 1; // Miter limit for ClipperOffset
const ARC_TOLERANCE = 0.25; // Arc tolerance for ClipperOffset

// Helper: Processes a single element to add its paths to a Clipper instance
async function processElementForOffset(
  elem: SVGElement,
  clipperInstance: ClipperBase,
  ClipperLib: any,
  cornerType: 'round' | 'sharp',
): Promise<{ isUnsupported: boolean; success: boolean }> {
  if (!elem) {
    console.warn('Element is null or undefined in processElementForOffset.');

    return { isUnsupported: false, success: false };
  }

  // Check for unsupported tags
  if (UNSUPPORTED_TAGS.includes(elem.tagName as any)) {
    console.log(`Skipping unsupported element: ${elem.tagName}`);

    return { isUnsupported: true, success: true };
  }

  try {
    const dPath = svgedit.utilities.getPathDFromElement(elem);

    if (!dPath) {
      console.warn('Element has no path data:', elem);

      // Treat as unsupported if no path data, or could be an error depending on expectations
      return { isUnsupported: true, success: true };
    }

    const bbox = svgedit.utilities.getBBox(elem);
    const rotation = {
      angle: svgedit.utilities.getRotationAngle(elem),
      cx: bbox.x + bbox.width / 2,
      cy: bbox.y + bbox.height / 2,
    };
    const paths = ClipperLib.dPathToPointPathsAndScale(dPath, rotation, SCALE_FACTOR) as Array<
      Array<{ X: number; Y: number }>
    >;

    if (!paths || paths.length === 0 || paths.some((path) => !path || path.length === 0)) {
      console.warn('No scalable path points found or empty subpath for element:', elem);

      // Not strictly unsupported, but processing failed for this path
      return { isUnsupported: false, success: false };
    }

    // Determine if the path is closed
    let isPathClosed = paths.every((path: Array<{ X: number; Y: number }>) => {
      if (!path || path.length === 0) return false; // An empty subpath cannot be closed in this context

      const firstPoint = path[0];
      const lastPoint = path.at(-1)!;

      return firstPoint.X === lastPoint.X && firstPoint.Y === lastPoint.Y;
    }) as boolean;

    const { endType, joinType } = match({ cornerType, isPathClosed })
      .with({ isPathClosed: true }, ({ cornerType }) => ({
        endType: ClipperLib.EndType.etClosedPolygon,
        joinType: cornerType === 'round' ? ClipperLib.JoinType.jtRound : ClipperLib.JoinType.jtMiter,
      }))
      .with({ cornerType: 'round' }, () => ({
        endType: ClipperLib.EndType.etOpenRound,
        joinType: ClipperLib.JoinType.jtRound,
      }))
      .with({ cornerType: 'sharp' }, () => ({
        endType: ClipperLib.EndType.etOpenSquare,
        joinType: ClipperLib.JoinType.jtSquare,
      }))
      .exhaustive();

    await clipperInstance.addPaths(paths, joinType, endType);

    return { isUnsupported: false, success: true };
  } catch (error) {
    console.error('Error processing element for offset:', elem, error);

    return { isUnsupported: false, success: false };
  }
}

// Helper: Builds the SVG 'd' path string
function buildSvgPathD(scaledPaths: Array<Array<{ X: number; Y: number }>>, simplify: boolean): string {
  return scaledPaths
    .map((path) => {
      if (!path || path.length === 0) return '';

      let pathData = 'M';
      const scaledPoints = path.map(({ X, Y }) => ({
        x: X / SCALE_FACTOR,
        y: Y / SCALE_FACTOR,
      }));

      if (!simplify) {
        pathData += scaledPoints.map(({ x, y }) => `${x},${y}`).join(' L');
      } else {
        const pointsToFit = scaledPoints.map(({ x, y }) => ({
          x: Math.round(x * ROUND_FACTOR) / ROUND_FACTOR,
          y: Math.round(y * ROUND_FACTOR) / ROUND_FACTOR,
        }));
        const segments = fitPath(pointsToFit);

        if (segments.length === 0 && pointsToFit.length > 0) {
          // Fallback: if fitPath yields no segments, draw straight lines
          pathData += `${pointsToFit[0].x},${pointsToFit[0].y}`;
          pathData += pointsToFit
            .slice(1)
            .map(({ x, y }) => `L${x},${y}`)
            .join('');
        } else {
          segments.forEach((segment, index) => {
            if (index === 0) {
              pathData += `${segment.points[0].x},${segment.points[0].y}`;
            }

            const pointsString = segment.points
              .slice(1)
              .map(({ x, y }) => `${x},${y}`)
              .join(' ');

            pathData += `${segment.type}${pointsString}`;
          });
        }
      }

      return pathData + 'Z';
    })
    .join(' ')
    .trim();
}

// Helper: Shows alert messages
function showOffsetAlert(type: 'failed' | 'unsupported') {
  const messages = {
    failed: i18n.lang.beambox.tool_panels._offset.fail_message,
    unsupported: i18n.lang.beambox.tool_panels._offset.not_support_message,
  };

  alertCaller.popUp({ id: `offset-${type}-alert`, message: messages[type], type: alertConstants.SHOW_POPUP_WARNING });
}

const offsetElements = async (
  mode: OffsetMode,
  distance: number,
  cornerType: 'round' | 'sharp',
  elems?: SVGElement[],
): Promise<void> => {
  progressCaller.openNonstopProgress({ id: 'offset-path', message: i18n.lang.beambox.popup.progress.calculating });
  // Brief pause for UI to update
  await new Promise<void>((resolve) => setTimeout(resolve, 50));

  const targetElements = elems || svgCanvas.getSelectedElems(true);

  if (targetElements.length === 0) {
    progressCaller.popById('offset-path');
    console.log('No elements selected or provided for offset.');

    return;
  }

  // For 'Filled' modes, only one element is supported
  if (targetElements.length > 1 && (mode === 'outwardFilled' || mode === 'inwardFilled')) {
    alertCaller.popUp({
      id: 'OffsetMultipleNotSupported',
      message: 'This operation mode currently supports only a single selected element to adjust its internal gaps.',
      type: alertConstants.SHOW_POPUP_WARNING,
    });
    progressCaller.popById('offset-path');

    return;
  }

  const elementToOffset = targetElements[0]; // We'll process one element based on the check above or if only one was provided
  const ClipperLib = getClipperLib();
  const co = new ClipperBase('offset', MITER_LIMIT, ARC_TOLERANCE);

  const delta: number = match(mode)
    .with(P.union('outwardFilled', 'outwardOutline'), () => distance * SCALE_FACTOR)
    .with(P.union('inwardFilled', 'inwardOutline'), () => -distance * SCALE_FACTOR)
    .exhaustive();

  const processResult = await processElementForOffset(elementToOffset, co, ClipperLib, cornerType);

  if (processResult.isUnsupported) {
    showOffsetAlert('unsupported');
    progressCaller.popById('offset-path');
    co.terminate();

    return;
  }

  if (!processResult.success) {
    showOffsetAlert('failed');
    progressCaller.popById('offset-path');
    co.terminate();

    return;
  }

  let solutionPaths: Array<Array<{ X: number; Y: number }>> = [];

  try {
    solutionPaths = await co.execute([], delta);
  } catch (clipperError) {
    console.error('Clipper execution failed:', clipperError);
    showOffsetAlert('failed');
    progressCaller.popById('offset-path');
    co.terminate();

    return;
  } finally {
    // Terminate clipper instance for offset operation, but not for union if needed next
    if (!((mode === 'inwardFilled' || mode === 'outwardOutline') && solutionPaths.length > 1)) {
      co.terminate();
    }
  }

  solutionPaths = solutionPaths.filter((path) => path?.length > 0);

  // Union operation for specific modes if multiple paths result
  if ((mode === 'inwardFilled' || mode === 'outwardOutline') && solutionPaths.length > 1) {
    console.log(`Mode ${mode} resulted in ${solutionPaths.length} paths, attempting to union.`);

    const unionClipper = new ClipperBase('clipper'); // Setup for boolean ops

    try {
      await unionClipper.addPaths(solutionPaths, ClipperLib.PolyType.ptSubject, true); // true for closed paths

      const clipTypeUnion = ClipperLib.ClipType.ctUnion;
      const fillRule = ClipperLib.PolyFillType.pftNonZero; // Or pftEvenOdd, as appropriate
      // Assuming execute for boolean ops returns the resulting paths
      const unionedResultPaths = (await unionClipper.execute(
        clipTypeUnion,
        new ClipperLib.Paths(),
        fillRule,
        fillRule,
      )) as Array<Array<{ X: number; Y: number }>>;

      solutionPaths = unionedResultPaths.filter((path) => path?.length > 0);
    } catch (unionError) {
      console.error('Union operation failed:', unionError);
      // Decide whether to show 'failed' or proceed with un-unioned paths.
      // For now, let's assume failure is critical for these modes.
      showOffsetAlert('failed');
      progressCaller.popById('offset-path');

      return;
    } finally {
      unionClipper.terminate();
      co.terminate(); // ensure original co is also terminated
    }
  } else if (solutionPaths.length > 0) {
    // If union was not needed, the original co should be terminated here.
    // This 'else if' assumes co was not terminated in the 'finally' block of the offset execution
    // if a union operation was potentially next.
    co.terminate();
  }

  progressCaller.popById('offset-path'); // Pop progress after all computations

  if (solutionPaths.length === 0) {
    // This implies either the offset or the union (if attempted) resulted in no paths.
    showOffsetAlert('failed');
    console.log('Offset operation produced no valid paths.');

    return;
  }

  const pathD = buildSvgPathD(solutionPaths, beamboxPreference.read('simplify_clipper_path'));

  if (!pathD) {
    console.log('Failed to build path string D from solution paths.');
    showOffsetAlert('failed');

    return;
  }

  const batchCmd = new history.BatchCommand('Create Offset Elements');
  const newElem = svgCanvas.addSvgElementFromJson({
    attr: {
      d: pathD,
      fill: 'none',
      'fill-opacity': '0',
      id: svgCanvas.getNextId(),
      stroke: '#000',
    },
    curStyles: false,
    element: 'path',
  });

  svgCanvas.pathActions.fixEnd(newElem); // Usually for ensuring path validity or specific endings
  batchCmd.addSubCommand(new history.InsertElementCommand(newElem));

  if (svgCanvas.isUsingLayerColor) {
    updateElementColor(newElem);
  }

  svgCanvas.selectOnly([newElem], true);
  svgCanvas.addCommandToHistory(batchCmd);

  console.log('Offset element operation completed.');
};

export default offsetElements;
