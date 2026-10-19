/**
 * Snap to object center: detect the objects in the camera preview once a preview batch has landed
 * and hand them to autoAlign as snap targets. Any tile stamped during a batch (region sweep, single
 * shot, full area) marks the preview dirty; when the batch ends (cameraPreview.isDrawing -> false,
 * outside live mode) the whole preview canvas is re-detected and the list replaced. The model
 * rescales every input to the same size, so a full pass costs the same as a crop (§7).
 * Batches landing during a run are drained by the same loop.
 * ONNX only (decided 2026-10-16): the OpenCV engine was too unstable for silent snapping, so the
 * feature is off whenever Swiftray is unavailable (web, old Swiftray, socket down); the next
 * preview batch after it reconnects detects as usual.
 * Design: docs/prd/onnx-contour-detection.md §5.5.
 */
import previewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import NS from '@core/app/constants/namespaces';
import { useCameraPreviewStore } from '@core/app/stores/cameraPreview';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { swiftrayClient } from '@core/helpers/api/swiftray-client';
import { detectWithOnnx, isOnnxAvailable } from '@core/helpers/contour/detectContours';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';

import workareaManager from '../workarea';

import { getMinAreaRect, type MinAreaRect } from './utils/getMinAreaRect';

/** An object detected in the camera preview; all coordinates in workarea canvas px (10 px/mm). */
export interface ImageContour {
  bbox: [number, number, number, number];
  /** mask centroid */
  center: [number, number];
  contour: Array<[number, number]>;
  id: string;
  /** minimum-area rect of `contour`, computed here so both engines are treated alike */
  rect: MinAreaRect;
}

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');
const MESSAGE_KEY = 'snap-to-object-center';
const OVERLAY_ID = 'imageContourOverlay';
/** An object spanning nearly the whole bed in one direction is a rail or a sheet of material, not a part. */
const MAX_SPAN_RATIO = 0.9;

const renderOverlay = (contours: ImageContour[]): void => {
  document.getElementById(OVERLAY_ID)?.remove();

  if (window?.localStorage?.getItem('dev-image-contour') !== 'true') return;

  const previewSvg = document.getElementById('previewSvg');

  if (!previewSvg || !contours.length) return;

  const g = document.createElementNS(NS.SVG, 'g');

  g.setAttribute('id', OVERLAY_ID);
  g.setAttribute('pointer-events', 'none');
  g.innerHTML = contours
    .map(
      ({ center: [cx, cy], contour }) =>
        `<path d="M ${contour.map(([x, y]) => `${x} ${y}`).join(' L ')} Z" fill="none" stroke="#F707F0" stroke-width="1" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>` +
        `<circle cx="${cx}" cy="${cy}" r="3" fill="#F707F0"/>`,
    )
    .join('');
  previewSvg.appendChild(g);
};

export class ImageContourDetector {
  /** objects currently known in the preview; read by autoAlign while dragging */
  contours: ImageContour[] = [];

  /** a preview tile landed since the last run */
  private dirty = false;

  private running = false;

  private errorShown = false;

  /** bumped by clear(); a detection that started under an older generation is discarded */
  private generation = 0;

  init = (): void => {
    canvasEventEmitter.on('preview-background-updated', this.onBackgroundUpdated);
    canvasEventEmitter.on('model-changed', this.clear);
    useCameraPreviewStore.subscribe((state) => state.isDrawing, this.onBatchEnded);
    useCameraPreviewStore.subscribe((state) => state.isLiveMode, this.onBatchEnded);
    useCameraPreviewStore.subscribe(
      (state) => state.isClean,
      (isClean) => {
        if (isClean) this.clear();
      },
    );
    useGlobalPreferenceStore.subscribe(
      (state) => state.snap_to_object_center,
      (active) => {
        if (active) this.redetect();
        else this.clear();
      },
    );
    // a request in flight or sent while down is rejected by the client; run()'s catch releases the lock
    swiftrayClient.on('disconnected', this.clear);
  };

  /** A preview is already on the canvas and no tile will land to mark it dirty: detect it now. */
  redetect = (): void => {
    if (useCameraPreviewStore.getState().isClean) return;

    this.dirty = true;
    this.onBatchEnded();
  };

  clear = (): void => {
    this.generation += 1;
    this.dirty = false;
    this.errorShown = false;
    this.contours = [];
    renderOverlay([]);
    MessageCaller.closeMessage(MESSAGE_KEY);
  };

  /** Preference on and the ONNX host reachable; checked live, so snapping stops the moment Swiftray drops. */
  isEnabled = (): boolean => useGlobalPreferenceStore.getState().snap_to_object_center && isOnnxAvailable();

  private onBackgroundUpdated = (): void => {
    this.dirty = true;
  };

  /** A batch is over when the controller stops drawing; live mode re-draws every second, so wait for it to stop. */
  private onBatchEnded = (): void => {
    const { isDrawing, isLiveMode } = useCameraPreviewStore.getState();

    if (this.dirty && !isDrawing && !isLiveMode) this.run();
  };

  private run = async (): Promise<void> => {
    if (this.running || !this.isEnabled()) return;

    this.running = true;
    MessageCaller.openMessage({
      content: i18n.lang.message.detecting_objects,
      duration: 0,
      key: MESSAGE_KEY,
      level: MessageLevel.LOADING,
    });

    try {
      let applied = false;

      while (this.dirty && this.isEnabled()) {
        this.dirty = false;
        applied = await this.detectAll();
      }

      // clear() mid-run already closed the loading toast; don't re-open one for an image that is gone
      if (!applied) return;

      // silent on zero results: "detected" would mislead on an empty bed
      if (!this.contours.length) {
        MessageCaller.closeMessage(MESSAGE_KEY);

        return;
      }

      MessageCaller.openMessage({
        content: i18n.lang.message.objects_detected,
        duration: 2,
        key: MESSAGE_KEY,
        level: MessageLevel.SUCCESS,
      });
    } catch (error) {
      console.warn('[snapToObjectCenter] detection failed', error);

      // a disconnect mid-run already shows the swiftray_disconnected toast
      if (!this.errorShown && this.isEnabled()) {
        this.errorShown = true;
        MessageCaller.openMessage({
          content: i18n.lang.message.object_detection_failed,
          duration: 3,
          key: MESSAGE_KEY,
          level: MessageLevel.WARNING,
        });
      }
    } finally {
      this.running = false;
    }
  };

  /** Re-detect the whole preview canvas and replace the list. Returns false when the result was discarded. */
  private detectAll = async (): Promise<boolean> => {
    const { modelHeight, width } = workareaManager;
    const generation = this.generation;
    const crop = await previewModeBackgroundDrawer.getCanvasCrop(0, 0, width, modelHeight);

    if (!crop) return false;

    const k = 1 / crop.ratio; // canvasRatio < 1 only on iOS
    const detected = await detectWithOnnx(crop.blob, {
      // decoder progress only: the encoder runs first with no events, so the toast sits at the plain text for a while
      onProgress: (done, total) => {
        if (generation !== this.generation) return; // cleared mid-run: the toast is closed, keep it closed

        MessageCaller.openMessage({
          content: `${i18n.lang.message.detecting_objects} ${Math.round((done / total) * 100)}%`,
          duration: 0,
          key: MESSAGE_KEY,
          level: MessageLevel.LOADING,
        });
      },
    });

    // the preview was cleared (or the feature turned off) while the model ran: the result describes
    // an image that is gone, and the empty list from clear() must stand
    if (generation !== this.generation) return false;

    this.contours = detected
      .filter(({ bbox }) => bbox[2] * k < width * MAX_SPAN_RATIO && bbox[3] * k < modelHeight * MAX_SPAN_RATIO)
      .map(({ bbox, center, contour }, i) => {
        const polygon = contour.map(([x, y]) => [x * k, y * k] as [number, number]);

        return {
          bbox: [bbox[0] * k, bbox[1] * k, bbox[2] * k, bbox[3] * k] as ImageContour['bbox'],
          center: [center[0] * k, center[1] * k] as ImageContour['center'],
          contour: polygon,
          id: `${Date.now()}-${i}`,
          rect: getMinAreaRect(polygon),
        };
      })
      .filter(({ contour }) => !previewModeBackgroundDrawer.isPolygonCutByPreviewEdge(contour));
    renderOverlay(this.contours);

    return true;
  };
}

const imageContourDetection = new ImageContourDetector();

export default imageContourDetection;
