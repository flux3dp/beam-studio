import alertCaller from '@core/app/actions/alert-caller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import workareaManager from '@core/app/svgedit/workarea';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';

import { usePrintAndCutStore } from '../../store';
import type { Point, RigidTransform } from '../rigidTransform';
import { centroid, fitRigidTransform, getMatchTolerance } from '../rigidTransform';

import { fitSummary, logAlign, logAlignError, mm, pointMm, saveFailureImage } from './alignLog';
import { reportAlignProgress } from './alignProgress';
import { captureWorkareaImage } from './capture';
import { detectFromBackground } from './detectMarks';
import { endPreviewMode } from './previewSession';
import { refineMarkPatches } from './refineMarkPatches';

/** Log the fitted alignment for the bug report; the user only sees a success message */
const logAlignmentResult = (expected: Point[], transform: RigidTransform): void => {
  const { angle, tx, ty } = transform;
  // mean mark displacement: R·centroid(expected) + t − centroid(expected)
  const c = centroid(expected);
  const dx = Math.cos(angle) * c.x - Math.sin(angle) * c.y + tx - c.x;
  const dy = Math.sin(angle) * c.x + Math.cos(angle) * c.y + ty - c.y;

  logAlign('aligned', { ...fitSummary(transform), movedMm: [mm(dx), mm(dy)] });
};

/** Everything a failed run needs to be diagnosed from the bug report */
const logRunContext = (expected: Point[]): void => {
  const {
    contourSource,
    fullBBox,
    gridColumns,
    gridGapMm,
    gridRows,
    offsetDistance,
    orientation,
    paperKey,
    whiteMarkBase,
  } = usePrintAndCutStore.getState();
  const device = deviceMaster.currentDevice?.info;
  const tolerance = getMatchTolerance(expected);

  logAlign('run', {
    device: device && { model: device.model, serial: device.serial, version: device.version },
    expectedMarksMm: expected.map(pointMm),
    fullBBoxMm: fullBBox && [mm(fullBBox.x), mm(fullBBox.y), mm(fullBBox.width), mm(fullBBox.height)],
    sheet: { contourSource, gridColumns, gridGapMm, gridRows, offsetDistance, orientation, paperKey, whiteMarkBase },
    toleranceMm: pointMm(tolerance),
    workareaMm: [mm(workareaManager.width), mm(workareaManager.modelHeight)],
  });
};

/**
 * The whole camera alignment: capture the sheet and locate its marks, refine
 * each mark with a centered retake, redetect, and fit the rigid transform
 * mapping the designed mark positions onto the printed ones. Handles arbitrary
 * placement (shift + rotation); the sheet is assumed face up in roughly its
 * printed orientation (the mark rectangle cannot distinguish a 180° flip).
 * Publishes the camera image, the located marks and the fit to the dialog
 * store as it goes; ends preview mode. Nothing on the canvas is modified — the
 * caller applies the transform.
 * @returns the fitted transform, or null when the flow failed or was stopped
 */
export const alignByCamera = async (): Promise<null | RigidTransform> => {
  const t = i18n.lang.print_and_cut.alignment;
  const { markPositions, setAlignmentFit, setCameraImageUrl, setDetectedMarkCenters } = usePrintAndCutStore.getState();
  const expected: Point[] = markPositions.map(({ cx, cy }) => ({ x: cx, y: cy }));

  if (expected.length === 0) return null;

  logRunContext(expected);

  try {
    // 1. capture + locate: the sweep is shown progressively while it runs
    const capture = await captureWorkareaImage({ expectedMarks: expected, onProgress: setCameraImageUrl });

    if (!capture) return null;

    setCameraImageUrl(capture.url);

    if (capture.stopped) return null;

    // Fit info displayed in StepAlign
    setAlignmentFit(capture.closestFit);

    if (!capture.detectedMarks) {
      logAlign('detect-failed', { closestFit: capture.closestFit && fitSummary(capture.closestFit) });
      await saveFailureImage();
      alertCaller.popUpError({ message: t.detect_failed });

      return null;
    }

    const markCenters = capture.detectedMarks;

    // Zoom to marks in canvas
    setDetectedMarkCenters(markCenters);

    // 2. refine each mark up close, then redetect on the patched image
    let transform: null | RigidTransform = null;

    if (await refineMarkPatches(markCenters, setCameraImageUrl)) {
      // reported after `refine` so the tail phases stay in ascending order
      reportAlignProgress('completing');

      const refined = await detectFromBackground(expected, 'refined');

      setCameraImageUrl(refined.url);
      transform = refined.transform;

      if (!transform) logAlign('refined-detect-failed', { closestFit: refined.closest && fitSummary(refined.closest) });
    }

    // 3. fit: the redetected marks, else the located ones as they are
    transform ??= fitRigidTransform(expected, markCenters);
    setAlignmentFit(transform);

    logAlignmentResult(expected, transform);
    MessageCaller.openMessage({ content: t.success, duration: 3, level: MessageLevel.SUCCESS });

    return transform;
  } catch (error) {
    logAlignError('align', error);
    await saveFailureImage();
    alertCaller.popUpError({ message: t.detect_failed });

    return null;
  } finally {
    // alignment is the end of the camera flow: close the mode here (covers
    // early returns too), waited for so the caller only resumes device access
    // (e.g. reading exposure settings) once teardown has fully finished
    await endPreviewMode();
  }
};
