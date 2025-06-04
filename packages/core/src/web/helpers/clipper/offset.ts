// Assuming this is used in processElementForOffset

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

const SCALE_FACTOR = 100;
const UNSUPPORTED_TAGS = ['g', 'image', 'text', 'use'] as const;

// Helper: Processes a single element to add its paths to a Clipper instance
// (This is your existing helper, ensure it correctly determines join/end types based on cornerType and path closure)
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
    const dPath = svgedit.utilities.getPathDFromElement(elem);

    if (!dPath) {
      // Element might not be a path or path-convertible (e.g. rect, circle if not converted)
      console.warn('Element has no path data:', elem);

      return { isUnsupported: true, success: true }; // Treat as unsupported if no path data
    }

    const bbox = svgedit.utilities.getBBox(elem);
    const rotation = {
      angle: svgedit.utilities.getRotationAngle(elem),
      cx: bbox.x + bbox.width / 2,
      cy: bbox.y + bbox.height / 2,
    };

    const paths = ClipperLib.dPathtoPointPathsAndScale(dPath, rotation, SCALE_FACTOR);

    if (!paths || paths.length === 0 || paths[0]?.length === 0) {
      console.warn('No scalable path points found for element:', elem);

      return { isUnsupported: false, success: false }; // Not unsupported, but failed to process path
    }

    let isPathClosed = true;

    // Ensure paths and sub-paths are valid before checking .at(-1)
    for (const path of paths) {
      if (path && path.length > 0) {
        if (!(path[0].X === path.at(-1).X && path[0].Y === path.at(-1).Y)) {
          isPathClosed = false;
          break;
        }
      } else {
        // Path with no points or undefined path in paths array
        isPathClosed = false; // Or handle as error/skip
        break;
      }
    }

    // Determine JoinType and EndType more directly
    let joinType: any;
    let endType: any;

    if (isPathClosed) {
      // For any closed path (like a donut's contours), use etClosedPolygon
      endType = ClipperLib.EndType.etClosedPolygon;
      joinType = cornerType === 'round' ? ClipperLib.JoinType.jtRound : ClipperLib.JoinType.jtMiter;
    } else {
      // This branch is for open paths
      if (cornerType === 'round') {
        joinType = ClipperLib.JoinType.jtRound;
        endType = ClipperLib.EndType.etOpenRound;
      } else {
        // 'sharp' corners for an open path
        joinType = ClipperLib.JoinType.jtSquare; // jtSquare is often better than jtMiter for open path ends
        endType = ClipperLib.EndType.etOpenSquare;
      }
    }

    await clipperInstance.addPaths(paths, joinType, endType);

    return { isUnsupported: false, success: true };
  } catch (error) {
    console.error('Error processing element for offset:', elem, error);

    return { isUnsupported: false, success: false }; // Failed to process
  }
}

// Helper: Builds the SVG 'd' path string
// (Your existing helper, remember to consider the FIXME and fallback for empty segments)
function buildSvgPathD(scaledPaths: Array<Array<{ X: number; Y: number }>>, simplify: boolean): string {
  let d = '';

  for (const path of scaledPaths) {
    if (!path || path.length === 0) continue;

    d += 'M';

    if (!simplify) {
      d += path.map(({ X, Y }) => `${X / SCALE_FACTOR},${Y / SCALE_FACTOR}`).join(' L');
    } else {
      const points = path.map(({ X, Y }) => ({
        x: Math.floor(100 * (X / SCALE_FACTOR)) / 100,
        y: Math.floor(100 * (Y / SCALE_FACTOR)) / 100,
      }));

      if (points.length === 0) continue;

      const segments = fitPath(points);

      if (segments.length === 0 && points.length > 0) {
        // Fallback for when fitPath doesn't produce segments but we have points (e.g., a single point after M)
        d += `${points[0].x},${points[0].y}`;

        if (points.length > 1) {
          d += points
            .slice(1)
            .map((p) => `L${p.x},${p.y}`)
            .join('');
        }
      }

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

    d += 'Z'; // Clipper offset paths are typically closed
  }

  return d.trim();
}

// Helper: Shows alert messages
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

type OffsetMode =
  | 'inwardFilled' // GAP in single object THINNER (material expands)
  | 'inwardOutline' // Material shrinks
  | 'outwardFilled' // GAP in single object THICKER (material shrinks)
  | 'outwardOutline'; // Material expands

const offsetElements = async (
  mode: OffsetMode,
  dist: number, // How much the material's edge moves
  cornerType: 'round' | 'sharp',
  elems?: SVGElement[], // Function will now primarily expect one element for new modes
): Promise<void> => {
  progressCaller.openNonstopProgress({ id: 'offset-path', message: i18n.lang.beambox.popup.progress.calculating });
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 100));

  const targetElements = elems || svgCanvas.getSelectedElems(true);

  if (targetElements.length === 0) {
    progressCaller.popById('offset-path');
    console.log('No elements selected or provided for offset.');

    return;
  }

  // For Scenario A, we operate on the first selected element.
  // If multiple are selected, new filled modes might behave unexpectedly or could be disallowed.
  if (targetElements.length > 1 && (mode === 'outwardFilled' || mode === 'inwardFilled')) {
    alertCaller.popUp({
      id: 'OffsetMultipleNotSupported',
      message: 'This operation mode currently supports only a single selected element to adjust its internal gaps.',
      type: alertConstants.SHOW_POPUP_WARNING,
    });
    progressCaller.popById('offset-path');

    return;
  }

  const elementToOffset = targetElements[0]; // Focus on the first element

  const batchCmd = new history.BatchCommand('Create Offset Elements');
  const ClipperLib = getClipperLib();

  let signedDeltaForClipper: number = dist;

  switch (mode) {
    case 'outwardOutline': // Material expands (outline grows)
      signedDeltaForClipper *= SCALE_FACTOR; // Positive for outward
      break;
    case 'inwardOutline': // Material shrinks (outline shrinks)
      signedDeltaForClipper *= -SCALE_FACTOR; // Negative for inward
      break;
    case 'outwardFilled': // GAP THICKER (material shrinks)
      signedDeltaForClipper *= SCALE_FACTOR; // Material offset INWARD
      break;
    case 'inwardFilled': // GAP THINNER (material expands)
      signedDeltaForClipper *= -SCALE_FACTOR; // Material offset OUTWARD
      break;
    default:
      console.error('Unknown offset mode:', mode);
      progressCaller.popById('offset-path');

      return;
  }

  const offsetClipper = new ClipperBase('offset', 1, 0.25); // MiterLimit, ArcTolerance
  let isUnsupportedElement = false;
  let isProcessingError = false;
  const processResult = await processElementForOffset(elementToOffset, offsetClipper, ClipperLib, cornerType);

  if (!processResult.success) {
    isProcessingError = true;
  }

  if (processResult.isUnsupported) {
    isUnsupportedElement = true;
  }

  let solutionPaths: Array<Array<{ X: number; Y: number }>> = [];

  if (!isProcessingError && !isUnsupportedElement) {
    try {
      solutionPaths = await offsetClipper.execute([], signedDeltaForClipper);
    } catch (clipperError) {
      console.error('Clipper execution failed:', clipperError);
      isProcessingError = true;
    }
  }

  offsetClipper.terminate();

  solutionPaths = solutionPaths.filter((path) => path?.length);

  if (!isProcessingError && !isUnsupportedElement && solutionPaths.length > 0) {
    // For modes that expand material outward ('inwardFilled', 'outwardOutline'),
    // if the offset results in multiple disjoint paths, union them.
    if ((mode === 'inwardFilled' || mode === 'outwardOutline') && solutionPaths.length > 1) {
      console.log(`Mode ${mode} resulted in ${solutionPaths.length} paths, attempting to union.`);

      const unionClipper = new ClipperBase('clipper'); // Assuming this sets up for boolean ops

      // Add all current solution paths as subjects for the union operation.
      await unionClipper.addPaths(solutionPaths, ClipperLib.PolyType.ptSubject, true);

      const unionResultPaths = new ClipperLib.Paths(); // Create a new Paths object for the results

      try {
        // Your original union call used: unionClipper.execute(1, currentUnion, 1, 1)
        // Let's assume '1' for ClipType is ctUnion, and '1' for PolyFillType is a valid enum (e.g. pftEvenOdd or pftNonZero)
        // It's safer to use the ClipperLib constants if available.
        const clipTypeUnion = ClipperLib.ClipType.ctUnion; // Or the integer '1' if that's how your wrapper expects it
        const fillRule = ClipperLib.PolyFillType.pftNonZero; // Or pftEvenOdd, or integer '1'

        // The execute signature for boolean operations in Clipper usually involves:
        // ClipType, OutputPaths, SubjectFillRule, ClipFillRule.
        // Since we added all paths as subjects, subjectFillRule is key. ClipFillRule might not be used or set same.
        // This call depends heavily on your `ClipperBase.execute` implementation for boolean ops.
        const tempSolution = await unionClipper.execute(
          clipTypeUnion,
          unionResultPaths, // Output parameter for the union paths
          fillRule,
          fillRule,
        );

        // Check if your execute method returns the paths or modifies unionedResultPaths in place
        if (tempSolution && tempSolution.length !== undefined) {
          // If execute returns the paths directly
          solutionPaths = tempSolution;
        } else {
          // If execute modifies unionResultPaths in place
          solutionPaths = unionResultPaths;
        }
      } catch (unionError) {
        console.error('Union operation failed:', unionError);
        isProcessingError = true; // Or decide to proceed with un-unioned paths
      } finally {
        unionClipper.terminate();
      }
    }
  }

  progressCaller.popById('offset-path'); // Pop progress after computation

  if (isProcessingError || (solutionPaths.length === 0 && !isUnsupportedElement)) {
    showOffsetAlert('failed');
    console.log('Offset operation failed or produced no valid paths.');

    return;
  }

  if (isUnsupportedElement) {
    showOffsetAlert('unsupported');

    return;
  }

  const pathD = buildSvgPathD(solutionPaths, beamboxPreference.read('simplify_clipper_path'));

  if (!pathD) {
    console.log('Failed to build path string D from solution paths.');
    showOffsetAlert('failed'); // Or a more specific error

    // If originals were to be deleted, this might leave the user with nothing.
    // Consider if batchCmd should be cleared or not added to history.
    return;
  }

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

  svgCanvas.pathActions.fixEnd(newElem);
  batchCmd.addSubCommand(new history.InsertElementCommand(newElem));

  if (svgCanvas.isUsingLayerColor) {
    updateElementColor(newElem);
  }

  svgCanvas.selectOnly([newElem], true);
  svgCanvas.addCommandToHistory(batchCmd);

  console.log('Offset element operation completed.');
};

export default offsetElements;
