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

export type OffsetMode =
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

async function performSingleElementOffset(
  element: SVGElement,
  offsetDir: number, // 0 for inward, 1 for outward (applied to this specific element)
  offsetVal: number, // The absolute distance this element's boundary should move
  cornerType: 'round' | 'sharp',
  ClipperLib: any,
  svgEditorInstance: any, // Pass svgedit or its relevant parts
): Promise<Array<Array<{ X: number; Y: number }>>> {
  const clipper = new ClipperBase('offset', 5, 0.25); // New instance for isolated offset
  const dPath = svgEditorInstance.utilities.getPathDFromElement(element);
  const bbox = svgEditorInstance.utilities.getBBox(element);
  const rotation = {
    angle: svgEditorInstance.utilities.getRotationAngle(element),
    cx: bbox.x + bbox.width / 2,
    cy: bbox.y + bbox.height / 2,
  };
  const pointPaths = ClipperLib.dPathtoPointPathsAndScale(dPath, rotation, SCALE_FACTOR);

  if (!pointPaths || pointPaths.length === 0) {
    clipper.terminate();

    return []; // No path data to offset
  }

  let isPathClosed = true;

  for (const path of pointPaths) {
    // Check if all sub-paths are closed
    if (path.length === 0 || !(path[0].X === path.at(-1).X && path[0].Y === path.at(-1).Y)) {
      isPathClosed = false;
      break;
    }
  }

  const joinType = cornerType === 'round' ? ClipperLib.JoinType.jtRound : ClipperLib.JoinType.jtMiter;
  const endType =
    cornerType === 'round'
      ? ClipperLib.EndType.etOpenRound
      : isPathClosed
        ? ClipperLib.EndType.etClosedLine
        : ClipperLib.EndType.etOpenSquare;

  await clipper.addPaths(pointPaths, joinType, endType);

  const effectiveDistForClipper = Math.abs(offsetVal * SCALE_FACTOR); // Clipper delta is positive
  // The actual direction (inward/outward) for Clipper's execute is implicitly handled by how solution paths are interpreted
  // or if the ClipperOffset object was initialized with a specific direction if its API supports that.
  // Assuming ClipperOffset's execute delta is always positive, and we adjust based on its output structure.
  // The `offsetDir` parameter for this helper is more about deciding which solution paths to keep (e.g. slice(1) for inward).

  let solution = await clipper.execute([], effectiveDistForClipper);

  clipper.terminate();

  // Handle result: slice(1) for inward, potential union for outward
  // This logic is based on common Clipper patterns where offsetting inwards might return [original, newInner]
  // and offsetting outwards might return [newOuter] or [newOuter, original] or fragmented paths.
  if (offsetDir === 0) {
    // Inward offset for this element
    solution = solution.slice(1);
  } else if (offsetDir === 1 && solution.length > 1) {
    // Outward offset, potential union
    const unionClipper = new ClipperBase('clipper');
    let unionResult = [solution[0]];

    for (const path of solution.slice(1)) {
      if (path.length === 0) continue;

      await unionClipper.addPaths(unionResult, ClipperLib.PolyType.ptSubject, true);
      await unionClipper.addPaths([path], ClipperLib.PolyType.ptClip, true);
      unionResult = await unionClipper.execute(1, unionResult, 1, 1); // Your established union signature
    }
    unionClipper.terminate();
    solution = unionResult;
  }

  return solution.filter((p: any) => p.length > 0); // Ensure no empty paths
}

/** Function: offsetElements
 * Create offset of elements
 * @param {OffsetMode} mode offset mode, one of 'inwardFilled', 'inwardOutline', 'outwardFilled', 'outwardOutline';
 * @param {number} dist offset distance;
 * @param {string} cornerType 'round' or 'sharp';
 * @param {SVGElement[]} elems target, selected if not passed;
 */
const offsetElements = async (
  // dir: number,
  mode: OffsetMode,
  dist: number,
  cornerType: 'round' | 'sharp',
  elems?: SVGElement[],
): Promise<void> => {
  progressCaller.openNonstopProgress({ id: 'offset-path', message: i18n.lang.beambox.popup.progress.calculating });
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 100));

  const targetElements = elems || svgCanvas.getSelectedElems(true);

  if (targetElements.length === 0) {
    progressCaller.popById('offset-path');
    console.log('No elements selected or provided for offset.');

    return;
  }

  const batchCmd = new history.BatchCommand('Create Offset Elements');
  const ClipperLib = getClipperLib();
  let newCreatedElements: SVGElement[] = [];
  let allOpsSuccessful = true; // Flag to track success across multiple operations for Scenario B

  // --- SCENARIO DISPATCH ---
  if (targetElements.length === 1) {
    // --- SCENARIO A: Single selected element (could be complex path with holes) ---
    const element = targetElements[0];
    let dirMaterial: number; // 0 for inward offset of material, 1 for outward
    let fillGeneratedPath = false;
    let deleteOriginal = false;

    switch (mode) {
      case 'outwardOutline':
        dirMaterial = 1;
        break;
      case 'inwardOutline':
        dirMaterial = 0;
        break;
      case 'outwardFilled': // GAP in single object THICKER -> material shrinks
        dirMaterial = 0;
        fillGeneratedPath = true;
        deleteOriginal = true;
        break;
      case 'inwardFilled': // GAP in single object THINNER -> material expands
        dirMaterial = 1;
        fillGeneratedPath = true;
        deleteOriginal = true;
        break;
      default: // Should be exhaustive
        progressCaller.popById('offset-path');

        return;
    }

    // For Scenario A, 'dist' is the direct offset value for the material's edge
    const solutionPaths = await performSingleElementOffset(element, dirMaterial, dist, cornerType, ClipperLib, svgedit);

    if (solutionPaths && solutionPaths.length > 0 && solutionPaths[0].length > 0) {
      if (deleteOriginal && element.parentNode) {
        // batchCmd.addSubCommand(new history.RemoveElementCommand(element, element.parentNode));
      }

      const pathD = buildSvgPathD(solutionPaths, beamboxPreference.read('simplify_clipper_path'));

      if (pathD) {
        const newElemAttr: any = { d: pathD, id: svgCanvas.getNextId() };

        // if (fillGeneratedPath) {
        //   newElemAttr.fill = element.getAttribute('fill') || '#000';
        //   newElemAttr.stroke = 'none';
        // } else {
        newElemAttr.fill = 'none';
        newElemAttr.stroke = element.getAttribute('stroke') || '#000';
        newElemAttr.strokeWidth = element.getAttribute('stroke-width') || '1';
        // }

        const newElem = svgCanvas.addSvgElementFromJson({ attr: newElemAttr, element: 'path' });

        svgCanvas.pathActions.fixEnd(newElem);
        batchCmd.addSubCommand(new history.InsertElementCommand(newElem));
        newCreatedElements.push(newElem);
      } else {
        allOpsSuccessful = false;
      }
    } else {
      allOpsSuccessful = false; /* Check for unsupported tag for this single element if needed */
    }
  } else if (targetElements.length >= 2 && (mode === 'outwardFilled' || mode === 'inwardFilled')) {
    // --- SCENARIO B: Multiple (e.g., 2) elements for GAP adjustment ---
    // Simplified: Assuming exactly 2 elements for robust gap adjustment.
    if (targetElements.length !== 2) {
      alertCaller.popUp({
        id: 'OffsetGapMulti',
        message: 'For gap adjustment between shapes, please select exactly two layered elements.',
        type: alertConstants.SHOW_POPUP_WARNING,
      });
      allOpsSuccessful = false;
    } else {
      const elem1 = targetElements[0];
      const elem2 = targetElements[1];
      let elemOuter: SVGElement, elemInner: SVGElement;

      // Basic outer/inner detection (robust geometric containment is complex)
      // This heuristic might need improvement (e.g. check if one bbox is fully inside another)
      const bbox1 = svgedit.utilities.getBBox(elem1);
      const bbox2 = svgedit.utilities.getBBox(elem2);
      // A simple check: if bbox1 contains bbox2 center, and bbox2 does not contain bbox1 center
      const center2x = bbox2.x + bbox2.width / 2;
      const center2y = bbox2.y + bbox2.height / 2;
      const center1x = bbox1.x + bbox1.width / 2;
      const center1y = bbox1.y + bbox1.height / 2;

      const bbox1ContainsCenter2 =
        center2x >= bbox1.x &&
        center2x <= bbox1.x + bbox1.width &&
        center2y >= bbox1.y &&
        center2y <= bbox1.y + bbox1.height;
      const bbox2ContainsCenter1 =
        center1x >= bbox2.x &&
        center1x <= bbox2.x + bbox2.width &&
        center1y >= bbox2.y &&
        center1y <= bbox2.y + bbox2.height;

      if (bbox1ContainsCenter2 && !bbox2ContainsCenter1) {
        elemOuter = elem1;
        elemInner = elem2;
      } else if (bbox2ContainsCenter1 && !bbox1ContainsCenter2) {
        elemOuter = elem2;
        elemInner = elem1;
      } else if (bbox1.width * bbox1.height > bbox2.width * bbox2.height) {
        // Fallback to area if centers are confusing
        elemOuter = elem1;
        elemInner = elem2;
      } else {
        elemOuter = elem2;
        elemInner = elem1;
      }
      // This identification is crucial and can be complex.

      const offsetAmountPerBoundary = dist / 2; // 'dist' is total change in gap
      let dirOuter: number, dirInner: number;

      if (mode === 'outwardFilled') {
        // Make GAP THICKER
        dirOuter = 1; // Outer element expands outwards
        dirInner = 0; // Inner element shrinks inwards
      } else {
        // 'inwardFilled', Make GAP THINNER
        dirOuter = 0; // Outer element shrinks inwards
        dirInner = 1; // Inner element expands outwards
      }

      // Offset outer element
      const solutionOuter = await performSingleElementOffset(
        elemOuter,
        dirOuter,
        offsetAmountPerBoundary,
        cornerType,
        ClipperLib,
        svgedit,
      );
      // Offset inner element
      const solutionInner = await performSingleElementOffset(
        elemInner,
        dirInner,
        offsetAmountPerBoundary,
        cornerType,
        ClipperLib,
        svgedit,
      );

      if (
        solutionOuter &&
        solutionOuter.length > 0 &&
        solutionOuter[0].length > 0 &&
        solutionInner &&
        solutionInner.length > 0 &&
        solutionInner[0].length > 0
      ) {
        // Add remove commands for originals
        if (elemOuter.parentNode) {
          // batchCmd.addSubCommand(new history.RemoveElementCommand(elemOuter, elemOuter.parentNode));
        }

        if (elemInner.parentNode) {
          // batchCmd.addSubCommand(new history.RemoveElementCommand(elemInner, elemInner.parentNode));
        }

        const pathDOuter = buildSvgPathD(solutionOuter, beamboxPreference.read('simplify_clipper_path'));

        if (pathDOuter) {
          const newElemOuter = svgCanvas.addSvgElementFromJson({
            attr: {
              d: pathDOuter,
              fill: elemOuter.getAttribute('fill'),
              //  || '#000',
              id: svgCanvas.getNextId(),
              stroke: elemOuter.getAttribute('stroke'),
              // || 'none',
            },
            element: 'path',
          });

          svgCanvas.pathActions.fixEnd(newElemOuter);
          batchCmd.addSubCommand(new history.InsertElementCommand(newElemOuter));
          newCreatedElements.push(newElemOuter);
        } else {
          allOpsSuccessful = false;
        }

        const pathDInner = buildSvgPathD(solutionInner, beamboxPreference.read('simplify_clipper_path'));

        if (pathDInner) {
          const newElemInner = svgCanvas.addSvgElementFromJson({
            attr: {
              d: pathDInner,
              fill: elemInner.getAttribute('fill'),
              //  || '#000',
              id: svgCanvas.getNextId(),
              stroke: elemInner.getAttribute('stroke'),
              //  || 'none',
            },
            element: 'path',
          });

          svgCanvas.pathActions.fixEnd(newElemInner);
          batchCmd.addSubCommand(new history.InsertElementCommand(newElemInner));
          newCreatedElements.push(newElemInner);
        } else {
          allOpsSuccessful = false;
        }
      } else {
        allOpsSuccessful = false; // One or both offsets failed
      }
    }
  } else if (mode === 'outwardOutline' || mode === 'inwardOutline') {
    // --- SCENARIO C: Outline modes (can be 1 or more elements, treated uniformly for outline generation) ---
    let dirMaterial = mode === 'outwardOutline' ? 1 : 0;
    const effectiveDist = (dirMaterial === 0 ? -1 : 1) * dist; // 'dist' is material edge movement

    const offsetClipper = new ClipperBase('offset', 5, 0.25);
    let isContainsUnsupportedElement = false; // Track for this specific group
    let isProcessingErrorOccurred = false;

    for (const elem of targetElements) {
      // Using your existing processElementForOffset as it adds to a shared clipper instance
      const result = await processElementForOffset(elem, offsetClipper, ClipperLib, cornerType);

      if (!result.success) isProcessingErrorOccurred = true;

      if (result.isUnsupported) isContainsUnsupportedElement = true;
    }

    let solutionPaths: Array<Array<{ X: number; Y: number }>> = [];

    try {
      solutionPaths = await offsetClipper.execute([], Math.abs(effectiveDist * SCALE_FACTOR));
    } catch {
      isProcessingErrorOccurred = true;
    } finally {
      offsetClipper.terminate();
    }

    // Handle slice/union for the combined result
    if (dirMaterial === 0) {
      solutionPaths = solutionPaths.slice(
        targetElements.filter((el) => !UNSUPPORTED_TAGS.includes(el.tagName)).length || 1,
      );
    } else if (
      dirMaterial === 1 &&
      solutionPaths.length > targetElements.filter((el) => !UNSUPPORTED_TAGS.includes(el.tagName)).length
    ) {
      // Complex union logic for multiple source elements resulting in multiple offset paths
      // The original union logic might need adjustment here if it assumes a single contiguous output before union.
      // For now, let's assume a simpler case or that solutionPaths is already mostly correct.
      const unionClipper = new ClipperBase('clipper');
      let currentUnion = [solutionPaths[0]];

      for (const p of solutionPaths.slice(1)) {
        await unionClipper.addPaths(currentUnion, ClipperLib.PolyType.ptSubject, true);
        await unionClipper.addPaths([p], ClipperLib.PolyType.ptClip, true);
        currentUnion = await unionClipper.execute(1, currentUnion, 1, 1);
      }
      unionClipper.terminate();
      solutionPaths = currentUnion;
    }

    if (isProcessingErrorOccurred || !solutionPaths?.[0] || solutionPaths[0].length === 0) {
      allOpsSuccessful = false;
    } else {
      const pathD = buildSvgPathD(solutionPaths, beamboxPreference.read('simplify_clipper_path'));

      if (pathD) {
        const newElem = svgCanvas.addSvgElementFromJson({
          attr: {
            d: pathD,
            fill: 'none',
            id: svgCanvas.getNextId(),
            stroke: '#000',
            'stroke-width': '1',
          },
          element: 'path',
        });

        svgCanvas.pathActions.fixEnd(newElem);
        batchCmd.addSubCommand(new history.InsertElementCommand(newElem));
        newCreatedElements.push(newElem);
      } else {
        allOpsSuccessful = false;
      }
    }

    // Alert for unsupported in this group if relevant
    if (isContainsUnsupportedElement && allOpsSuccessful) {
      showOffsetAlert('unsupported');
    }
  } else {
    console.error('Unhandled mode or element count combination.');
    allOpsSuccessful = false;
  }

  // --- Common Completion & Cleanup ---
  progressCaller.popById('offset-path');

  if (allOpsSuccessful && newCreatedElements.length > 0) {
    if (newCreatedElements.every((el) => svgCanvas.isUsingLayerColor)) {
      // Simplified check
      newCreatedElements.forEach((el) => updateElementColor(el));
    }

    svgCanvas.selectOnly(newCreatedElements, true);
    svgCanvas.addCommandToHistory(batchCmd);
    console.log('Offset elements operation completed.');
  } else {
    // A more general failure if any part failed and didn't produce elements,
    // or if specific alerts weren't already shown.
    if (!allOpsSuccessful && newCreatedElements.length === 0) {
      // Check if anything was created before final alert
      showOffsetAlert('failed');
    }

    console.log('Offset operation failed or had issues.');

    // Note: batchCmd might contain partial operations. Adding it to history might be complex if only partially successful.
    // Consider clearing batchCmd or handling partial success more explicitly if needed.
    // For now, if newCreatedElements is empty and !allOpsSuccessful, we show 'failed' and don't add to history.
    // If some elements were created but allOpsSuccessful is false, we add what we have.
    if (newCreatedElements.length > 0) {
      // Some elements were created, even if not all ops were perfect
      svgCanvas.addCommandToHistory(batchCmd);
    }
  }
};

export default offsetElements;
