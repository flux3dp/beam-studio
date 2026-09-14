import type { TaskProgress } from '@core/app/actions/beambox/export-funcs';
import exportFuncs from '@core/app/actions/beambox/export-funcs';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import workareaManager from '@core/app/svgedit/workarea';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import { attributeMap } from '@core/helpers/layer/layer-config-helper';
import { getDefaultModule } from '@core/helpers/layer-module/layer-module-helper';

import type { BBox } from '../store';
import type { RigidTransform } from '../utils/rigidTransform';
import { applyRigidTransform } from '../utils/rigidTransform';

import { getScaleSegments } from './layout';

export interface ScratchParams {
  /** % */
  power: number;
  /** mm/s */
  speed: number;
}

// ponytail: placeholder values; tune per machine once the scratch pass is hardware-tested
const DEFAULT_SCRATCH_PARAMS: Partial<Record<WorkAreaModel, ScratchParams>> = {
  ado1: { power: 10, speed: 20 },
  fbb1b: { power: 5, speed: 20 },
  fbb1p: { power: 5, speed: 20 },
  fbb2: { power: 1, speed: 20 },
  fbm1: { power: 5, speed: 20 },
  fbm2: { power: 5, speed: 20 },
  fhexa1: { power: 3, speed: 20 },
  fhx2rf: { power: 1, speed: 20 },
};

/** Light-pass parameters that just mark the paper without cutting it, per machine model */
export const getDefaultScratchParams = (model: WorkAreaModel): ScratchParams =>
  DEFAULT_SCRATCH_PARAMS[model] ?? { power: 10, speed: 20 };

/**
 * The vernier combs as a stand-alone scene for the task parser: one laser
 * layer of line paths at their aligned positions. Workarea, engrave dpi and
 * document flags travel as parser arguments, so the svg itself stays bare.
 */
export const buildScratchSvg = (bbox: BBox, transform: RigidTransform, { power, speed }: ScratchParams): string => {
  const { height, minY, model, width } = workareaManager;
  const paths = getScaleSegments(bbox, 'scratch')
    .map(({ from, to }) => {
      const a = applyRigidTransform(from, transform);
      const b = applyRigidTransform(to, transform);

      return `<path d="M${a.x} ${a.y}L${b.x} ${b.y}" fill="none" stroke="#000"/>`;
    })
    .join('');
  const layerAttrs = [
    `${attributeMap.module}="${getDefaultModule(model)}"`,
    `${attributeMap.power}="${power}"`,
    `${attributeMap.speed}="${speed}"`,
    `${attributeMap.repeat}="1"`,
  ].join(' ');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<g class="layer" ${layerAttrs}><title>scratch</title><g transform="translate(0, ${-minY})">${paths}</g></g></svg>`
  );
};

/** Longest side of the task thumbnail, in px (the regular export uses 500) */
const THUMBNAIL_PX = 500;

/**
 * Rasterize the scene into a png data url for the task's thumbnail, cropped
 * to the aligned sheet with the strokes thickened so the lines survive the downscale
 */
export const buildScratchThumbnail = async (svg: string, bbox: BBox, transform: RigidTransform): Promise<string> => {
  // the combs are drawn at their aligned positions, so crop to the transformed box
  const corners = [
    { x: bbox.x, y: bbox.y },
    { x: bbox.x + bbox.width, y: bbox.y },
    { x: bbox.x, y: bbox.y + bbox.height },
    { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
  ].map((p) => applyRigidTransform(p, transform));
  const xs = corners.map(({ x }) => x);
  const ys = corners.map(({ y }) => y);
  // the combs sit in the expanded frame, see buildScratchSvg
  const crop = { height: 0, width: 0, x: Math.min(...xs), y: Math.min(...ys) - workareaManager.minY };

  crop.width = Math.max(...xs) - crop.x;
  crop.height = Math.max(...ys) - crop.y;

  const scale = THUMBNAIL_PX / Math.max(crop.width, crop.height);
  const width = Math.round(crop.width * scale);
  const height = Math.round(crop.height * scale);
  // width/height must match the crop's aspect, or the browser letterboxes the viewBox inside the old workarea size
  const preview = svg
    .replace(
      /<svg[^>]*>/,
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${crop.x} ${crop.y} ${crop.width} ${crop.height}">`,
    )
    .replaceAll('stroke="#000"', `stroke="#000" stroke-width="${2 / scale}"`);
  const img = new Image();

  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(preview)}`;
  await img.decode();

  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL();
};

/**
 * Scratch the vernier combs onto the aligned sheet: the combs are exported as
 * a generated scene, so the document is never touched, then run on the
 * selected machine.
 * @param onProgress task computation, then the machine run; shown in the dialog instead of the progress popups
 * @param isStopped the user pressed Stop: checked before the upload, so a stop during the computation never runs the task
 * (a stop during the run aborts the machine, which rejects the wait)
 * @returns whether the task ran
 */
export const runScratchTask = async (
  bbox: BBox,
  transform: RigidTransform,
  params: ScratchParams,
  onProgress: (progress: TaskProgress) => void,
  isStopped: () => boolean = () => false,
): Promise<boolean> => {
  const svg = buildScratchSvg(bbox, transform, params);

  const thumbnail = await buildScratchThumbnail(svg, bbox, transform);
  const fcodeBlob = await exportFuncs.getFcodeFromSvgString(svg, 'pnc-scratch', { onProgress, thumbnail });

  if (!fcodeBlob || isStopped()) return false;

  const message = i18n.lang.calibration.drawing_calibration_image;

  onProgress({ message, percentage: 0 });
  await deviceMaster.doCalibration({
    blob: fcodeBlob,
    onProgress: (progress) => onProgress({ message, percentage: Math.round(progress * 100) }),
  });

  return true;
};
