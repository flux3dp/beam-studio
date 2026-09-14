import previewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import previewModeController from '@core/app/actions/beambox/preview-mode-controller';
import workareaManager from '@core/app/svgedit/workarea';
import isDev from '@core/helpers/is-dev';

import type { BBox } from '../store';
import { logAlign } from '../utils/align/alignLog';
import { endPreviewMode, ensurePreviewMode, ensureRegionPreview } from '../utils/align/previewSession';
import type { RigidTransform } from '../utils/rigidTransform';
import { applyRigidTransform } from '../utils/rigidTransform';

import type { ScaleAxis, ScaleKind } from './layout';
import { PRINTED_LINE_MM, SCALE_START_MM, SCRATCH_LINE_MM, toSheetPoint } from './layout';
import type { LinePositions, Profile, ReadingEstimate } from './scaleProfile';
import {
  createDarknessSampler,
  estimateReading,
  extractProfile,
  findLinePositionsMm,
  getScaleBands,
  HALF_SPAN_MM,
  measureScratchLengthsMm,
} from './scaleProfile';

/** Distance from the box center to the middle of a scale's line pattern, in mm: where the camera is aimed */
const SCALE_MID_MM = SCALE_START_MM + PRINTED_LINE_MM / 2;

const readBackground = async (): Promise<{ image: ImageData; ratio: number }> => {
  const url = await previewModeBackgroundDrawer.getCameraCanvasUrl({ useCache: false });
  const bitmap = await createImageBitmap(await (await fetch(url)).blob());
  const canvas = document.createElement('canvas');

  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(bitmap, 0, 0);

  return { image: ctx.getImageData(0, 0, bitmap.width, bitmap.height), ratio: bitmap.width / workareaManager.width };
};

/**
 * Dev only: render a full-resolution crop of one scale into the devtools
 * console with the detected lines overlaid — printed centers green, each scratched
 * line's measured extent red with a blue mark at its inner end — so a
 * miscount or a wrong length anchor can be seen at a glance.
 */
const logDebugCrop = (
  image: ImageData,
  ratio: number,
  bbox: BBox,
  transform: RigidTransform,
  axis: ScaleAxis,
  { printedMm, scratchLengthsMm, scratchMm }: LinePositions,
): void => {
  // sheet-frame (u along the scale, v across it) → image px
  const toImage = (uMm: number, vMm: number) => {
    const p = applyRigidTransform(toSheetPoint(bbox, axis, uMm, vMm), transform);

    return { x: p.x * ratio, y: p.y * ratio };
  };
  const uRange = [-HALF_SPAN_MM - 2, HALF_SPAN_MM + 2];
  const vRange = [SCALE_START_MM - SCRATCH_LINE_MM * 3, SCALE_START_MM + PRINTED_LINE_MM * 1.5 + 3];
  const corners = uRange.flatMap((u) => vRange.map((v) => toImage(u, v)));
  const left = Math.max(0, Math.floor(Math.min(...corners.map(({ x }) => x))));
  const top = Math.max(0, Math.floor(Math.min(...corners.map(({ y }) => y))));
  const right = Math.min(image.width, Math.ceil(Math.max(...corners.map(({ x }) => x))));
  const bottom = Math.min(image.height, Math.ceil(Math.max(...corners.map(({ y }) => y))));

  if (right - left < 1 || bottom - top < 1) return;

  const full = document.createElement('canvas');

  full.width = image.width;
  full.height = image.height;
  full.getContext('2d')!.putImageData(image, 0, 0);

  const crop = document.createElement('canvas');

  crop.width = right - left;
  crop.height = bottom - top;

  const ctx = crop.getContext('2d')!;

  ctx.drawImage(full, left, top, crop.width, crop.height, 0, 0, crop.width, crop.height);

  ctx.lineWidth = 1;

  const tick = (uMm: number, vFrom: number, vTo: number, color: string) => {
    const a = toImage(uMm, vFrom);
    const b = toImage(uMm, vTo);

    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(a.x - left, a.y - top);
    ctx.lineTo(b.x - left, b.y - top);
    ctx.stroke();
  };

  printedMm.forEach((u) => tick(u, SCALE_START_MM + PRINTED_LINE_MM, SCALE_START_MM + PRINTED_LINE_MM * 1.5, '#0c0'));
  scratchMm.forEach((u, j) => {
    const end = SCALE_START_MM - scratchLengthsMm[j];

    // drawn 0.3 mm beside the burn so its real edges stay visible next to the printed line
    tick(u + 0.3, end, SCALE_START_MM - 0.5, '#f00');
    tick(u, end - 1, end, '#00f');
  });

  const url = crop.toDataURL();
  const shown = Math.min(1, 900 / crop.width);

  console.log(
    `print-and-cut read-scales ${axis} crop (${crop.width}×${crop.height} image px) %c `,
    `font-size:1px; padding:${(crop.height * shown) / 2}px ${(crop.width * shown) / 2}px; background:url(${url}) no-repeat; background-size:contain`,
  );
};

/**
 * Read both vernier scales with the camera: the sheet is captured (region
 * previews centered on each scale where the machine supports them, else the
 * one-shot full-area photo), each scale's two bands are collapsed to line
 * positions, the scratched lines' lengths are measured, and the offset is
 * estimated per axis.
 * @returns per-axis estimates; an axis is null when its lines could not be indexed
 */
export const measureReading = async (
  bbox: BBox,
  transform: RigidTransform,
): Promise<{ x: null | ReadingEstimate; y: null | ReadingEstimate }> => {
  const targets = {
    x: applyRigidTransform(toSheetPoint(bbox, 'x', 0, SCALE_MID_MM), transform),
    y: applyRigidTransform(toSheetPoint(bbox, 'y', 0, SCALE_MID_MM), transform),
  };

  try {
    if (!(await ensurePreviewMode())) {
      logAlign('read-scales', { error: 'preview mode not started' });

      return { x: null, y: null };
    }

    const isRegion = await ensureRegionPreview();

    if (isRegion) {
      for (const { x, y } of Object.values(targets)) await previewModeController.preview(x, y, { silent: true });
    }

    const { image, ratio } = await readBackground();
    const darkness = createDarknessSampler(image, ratio);
    const read = (axis: ScaleAxis) => {
      const bands = getScaleBands(axis);
      const profiles: Record<ScaleKind, Profile> = {
        printed: extractProfile(darkness, bbox, transform, bands.printed),
        scratch: extractProfile(darkness, bbox, transform, bands.scratch),
      };

      const scratchMm = findLinePositionsMm(profiles.scratch);
      const lines: LinePositions = {
        printedMm: findLinePositionsMm(profiles.printed),
        scratchLengthsMm: measureScratchLengthsMm(darkness, bbox, transform, axis, scratchMm),
        scratchMm,
      };
      const estimate = estimateReading(lines);
      const rounded = (values: number[]) => values.map((v) => Number(v.toFixed(2)));

      // diagnostics: printed ≥ 30 lines, scratch ≥ 6 with a long/middle anchor (lengths above the median)
      logAlign('read-scales', {
        axis,
        estimate,
        printedCount: lines.printedMm.length,
        printedMm: rounded(lines.printedMm),
        scratchCount: lines.scratchMm.length,
        scratchLengthsMm: rounded(lines.scratchLengthsMm),
        scratchMm: rounded(lines.scratchMm),
      });

      if (isDev()) {
        console.log(`print-and-cut read-scales ${axis}`, { estimate, lines, profiles });
        logDebugCrop(image, ratio, bbox, transform, axis, lines);
      }

      return estimate;
    };
    const result = { x: read('x'), y: read('y') };

    logAlign('read-scales', { imageWidth: image.width, isRegion, ratio, targetsMm: targets });

    return result;
  } finally {
    await endPreviewMode();
  }
};
