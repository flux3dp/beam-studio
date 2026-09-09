import alertCaller from '@core/app/actions/alert-caller';
import { dpmm } from '@core/app/actions/beambox/constant';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import i18n from '@core/helpers/i18n';

import { usePrintAndCutStore } from '../../store';
import type { Point, RigidTransform } from '../rigidTransform';
import { centroid, fitRigidTransform } from '../rigidTransform';

import { reportAlignProgress } from './alignProgress';
import { captureWorkareaImage } from './capture';
import { detectFromBackground } from './detectMarks';
import { endPreviewMode } from './previewSession';
import { refineMarkPatches } from './refineMarkPatches';

/** Log the fitted alignment for debugging; the user only sees a success message */
const logAlignmentResult = (expected: Point[], transform: RigidTransform): void => {
  const { angle, errors, residual, residualX, residualY, scale, tx, ty } = transform;
  // mean mark displacement: R·centroid(expected) + t − centroid(expected)
  const c = centroid(expected);
  const dx = Math.cos(angle) * c.x - Math.sin(angle) * c.y + tx - c.x;
  const dy = Math.sin(angle) * c.x + Math.cos(angle) * c.y + ty - c.y;

  console.log('print-and-cut align', {
    // per mark, sheet frame, in markPositions order: TL, TR, BL, BR
    markErrorsMm: errors.map(({ x, y }) => [Number((x / dpmm).toFixed(3)), Number((y / dpmm).toFixed(3))]),
    movedXMm: Number((dx / dpmm).toFixed(2)),
    movedYMm: Number((dy / dpmm).toFixed(2)),
    residualMm: Number((residual / dpmm).toFixed(3)),
    residualXMm: Number((residualX / dpmm).toFixed(3)),
    residualYMm: Number((residualY / dpmm).toFixed(3)),
    rotationDeg: Number(((angle * 180) / Math.PI).toFixed(3)),
    scale: Number(scale.toFixed(4)),
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

  try {
    // 1. capture + locate: the sweep is shown progressively while it runs
    const capture = await captureWorkareaImage({ expectedMarks: expected, onProgress: setCameraImageUrl });

    if (!capture) return null;

    setCameraImageUrl(capture.url);

    if (capture.stopped) return null;

    // Fit info displayed in StepAlign
    setAlignmentFit(capture.closestFit);

    if (!capture.detectedMarks) {
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

      const refined = await detectFromBackground(expected);

      setCameraImageUrl(refined.url);
      transform = refined.transform;

      if (!transform) console.warn('print-and-cut align: refined detection failed, falling back to the located marks');
    }

    // 3. fit: the redetected marks, else the located ones as they are
    transform ??= fitRigidTransform(expected, markCenters);
    setAlignmentFit(transform);

    logAlignmentResult(expected, transform);
    MessageCaller.openMessage({ content: t.success, duration: 3, level: MessageLevel.SUCCESS });

    return transform;
  } catch (error) {
    console.error('Failed to align print and cut by camera', error);
    alertCaller.popUpError({ message: t.detect_failed });

    return null;
  } finally {
    // alignment is the end of the camera flow: close the mode here (covers
    // early returns too), waited for so the caller only resumes device access
    // (e.g. reading exposure settings) once teardown has fully finished
    await endPreviewMode();
  }
};
