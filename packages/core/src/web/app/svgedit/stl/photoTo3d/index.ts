import { create } from 'zustand';

import alertCaller from '@core/app/actions/alert-caller';
import progress from '@core/app/actions/progress-caller';
import { MM_TO_SCENE } from '@core/app/components/beambox/InnerEngraving/utils/coordinates';
import { getEngravableBox } from '@core/app/components/beambox/InnerEngraving/utils/engravable';
import type { StlObject, StlTransform } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { processImageWithAiJson } from '@core/helpers/api/ai-image-process';
import i18n from '@core/helpers/i18n';
import imageEdit from '@core/helpers/image-edit';
import { isUvDev } from '@core/helpers/is-dev';
import type { IBatchCommand } from '@core/interfaces/IHistory';

import { PHOTO_3D_ATTR, PHOTO_TO_3D_ATTR } from '../constants';
import { getStlEngravingParams } from '../engravingParams';
import { getPhotoTextureUrl } from '../photoPlane';
import { applyPhotoPointCloud } from '../photoPointCloud';
import { loadRasterData } from '../photoPointCloudGenerator';
import { encodePointCloud } from '../pointCloud';

import { DEPTH_SOURCE_FORMAT_VERSION, depthSourceFromApi, encodeDepthSource } from './depthSource';
import type { PhotoTo3dParams, PhotoTo3dSize } from './generate';
import { MAX_PHOTO_TO_3D_CELLS, PhotoTo3dError } from './generate';
import { runPhotoTo3d } from './runPhotoTo3d';

/** AI credits for one conversion; recomputing with other parameters is free. */
export const PHOTO_TO_3D_COST = 0.06;
export const DEFAULT_SHARPEN = { amount: 1, radius: 4 } as const;
export const SHARPEN_AMOUNT_LIMIT = { max: 5, min: 0 } as const;
export const SHARPEN_RADIUS_LIMIT = { max: 20, min: 0.5 } as const;

/**
 * The roll-off is a uvDev option. Under uvDev it starts at 4% of the photo's width: 4 mm, the only
 * value tested, was on a 100 mm photo.
 */
const DEV_EDGE_ROUND_RATIO = 0.04;

export const EDGE_ROUND_LIMIT = { max: 10, min: 0 } as const;

/** The relief's default depth as a share of its width, capped by the engravable height. */
const THICKNESS_RATIO = 0.22;

export type PhotoTo3dSettings = Omit<PhotoTo3dParams, 'pointSpacing'>;

interface PhotoTo3dResponse {
  depth: string;
  height: number;
  /** PNG, base64; only when the background was removed. */
  image: null | string;
  mask: string;
  width: number;
}

/** Ids of the objects whose point cloud is being computed; the options panel shows them as updating. */
export const usePhotoTo3dBusy = create<{ ids: string[] }>(() => ({ ids: [] }));

const setBusy = (id: string, busy: boolean) =>
  usePhotoTo3dBusy.setState(({ ids }) => ({
    ids: busy ? [...ids.filter((value) => value !== id), id] : ids.filter((value) => value !== id),
  }));

export const isPhotoTo3d = (elem: Element): boolean => elem.hasAttribute(PHOTO_TO_3D_ATTR.marker);

const readNumber = (elem: Element, attr: string, fallback: number) => {
  const value = Number(elem.getAttribute(attr));

  return elem.hasAttribute(attr) && Number.isFinite(value) ? value : fallback;
};

export const getPhotoTo3dSettings = (elem: Element): PhotoTo3dSettings => ({
  edgeRoundMm: readNumber(elem, PHOTO_TO_3D_ATTR.edgeRound, 0),
  sharpenAmount: readNumber(elem, PHOTO_TO_3D_ATTR.sharpenAmount, DEFAULT_SHARPEN.amount),
  sharpenRadius: readNumber(elem, PHOTO_TO_3D_ATTR.sharpenRadius, DEFAULT_SHARPEN.radius),
});

/** The relief's world size: the photo's local size and thickness through the object's scale. */
const getWorldSize = (elem: Element, transform: StlTransform, thickness: number): PhotoTo3dSize => {
  const [sx, sy, sz] = transform.scale.map(Math.abs);

  return {
    depth: thickness * sz,
    height: Number(elem.getAttribute(PHOTO_3D_ATTR.height)) * sy,
    width: Number(elem.getAttribute(PHOTO_3D_ATTR.width)) * sx,
  };
};

const getGrid = ({ height, width }: PhotoTo3dSize, pointSpacing: number) =>
  `${Math.max(1, Math.round(width / pointSpacing))},${Math.max(1, Math.round(height / pointSpacing))}`;

/**
 * Whether the point cloud no longer matches its dot grid: the layer's point spacing changed, or the
 * object was resized in X or Y. A Z resize only scales the relief and never needs a recompute.
 */
export const isPhotoTo3dStale = (elem: Element): boolean => {
  const object = useStlStore.getState().objects[elem.id];

  if (!isPhotoTo3d(elem) || !object?.depthSource) return false;

  const thickness = readNumber(elem, PHOTO_TO_3D_ATTR.thickness, 1);
  const size = getWorldSize(elem, object.transform, thickness);

  return elem.getAttribute(PHOTO_TO_3D_ATTR.grid) !== getGrid(size, getStlEngravingParams(elem).pointSpacing);
};

/**
 * Compute the BSPC point cloud of a photo from its depth.
 * @returns the binary and the dot grid it was computed on
 */
const computeCloud = async (
  elem: SVGImageElement,
  depthSource: ArrayBuffer,
  transform: StlTransform,
  thickness: number,
  settings: PhotoTo3dSettings,
  source = getPhotoTextureUrl(elem),
): Promise<{ buffer: ArrayBuffer; grid: string }> => {
  if (!source) throw new Error('Photo has no image source');

  const { pointSpacing } = getStlEngravingParams(elem);
  const size = getWorldSize(elem, transform, thickness);
  const image = await loadRasterData(source);
  const pixels = { data: image.data, height: image.height, width: image.width };

  setBusy(elem.id, true);

  try {
    const points = await runPhotoTo3d(elem.id, {
      depthSource,
      params: { ...settings, pointSpacing },
      pixels,
      size,
    });
    const [sx, sy, sz] = transform.scale.map(Math.abs);

    // world mm → the object's local mm, Z centred on the photo plane's position
    for (let i = 0; i < points.length; i += 3) {
      points[i] /= sx;
      points[i + 1] /= sy;
      points[i + 2] = points[i + 2] / sz - thickness / 2;
    }

    return { buffer: encodePointCloud(points), grid: getGrid(size, pointSpacing) };
  } finally {
    setBusy(elem.id, false);
  }
};

const setAttributes = (batch: IBatchCommand, elem: Element, attrs: Record<string, string>) => {
  const oldValues: Record<string, null | string> = {};

  Object.entries(attrs).forEach(([key, value]) => {
    oldValues[key] = elem.getAttribute(key);
    elem.setAttribute(key, value);
  });
  batch.addSubCommand(new history.ChangeElementCommand(elem, oldValues));
};

const settingAttrs = (settings: PhotoTo3dSettings): Record<string, string> => ({
  [PHOTO_TO_3D_ATTR.edgeRound]: String(settings.edgeRoundMm),
  [PHOTO_TO_3D_ATTR.sharpenAmount]: String(settings.sharpenAmount),
  [PHOTO_TO_3D_ATTR.sharpenRadius]: String(settings.sharpenRadius),
});

export const alertPhotoTo3dError = (error: unknown): void => {
  const t = i18n.lang.inner_engraving_settings;
  const message =
    error instanceof PhotoTo3dError
      ? {
          flat: t.photo_to_3d_flat,
          'no-points': t.photo_to_3d_no_points,
          'too-many-points': t.photo_to_3d_too_many_points,
        }[error.reason]
      : `${t.photo_to_3d_failed}${error instanceof Error ? `: ${error.message}` : ''}`;

  alertCaller.popUpError({ message });
};

/** The dot grid a photo would be dithered on, before charging for it: refuse what can never fit. */
export const checkPhotoTo3dSize = (elem: SVGImageElement): boolean => {
  const object = useStlStore.getState().objects[elem.id];

  if (!object) return false;

  const [columns, rows] = getGrid(getWorldSize(elem, object.transform, 0), getStlEngravingParams(elem).pointSpacing)
    .split(',')
    .map(Number);

  return columns * rows <= MAX_PHOTO_TO_3D_CELLS;
};

/**
 * A depth that was paid for but could not become a point cloud yet (too many points, say), kept for
 * the session so trying again with another point spacing or size does not charge again. Keyed by
 * element id and the image it was computed for.
 */
const unusedDepth = new Map<string, { depthSource: ArrayBuffer; image: null | string; source: string }>();

const fetchDepth = async (
  elem: SVGImageElement,
  removeBackground: boolean,
): Promise<null | { depthSource: ArrayBuffer; image: null | string }> => {
  const source = elem.getAttribute('origImage') || getPhotoTextureUrl(elem);

  if (!source) return null;

  const cached = unusedDepth.get(elem.id);

  if (cached?.source === source && Boolean(cached.image) === removeBackground) return cached;

  const t = i18n.lang.inner_engraving_settings;
  const progressId = 'photo-to-3d';
  // a cold start of the depth model queues for up to two minutes; the bar holds at 95% past that
  const estimateMs = 60_000;
  const startTime = performance.now();

  progress.openSteppingProgress({ caption: t.photo_to_3d, id: progressId, message: t.photo_to_3d_processing });

  const timer = setInterval(() => {
    progress.update(progressId, {
      percentage: Math.min(95, Math.round(((performance.now() - startTime) / estimateMs) * 100)),
    });
  }, 500);

  try {
    const blob = await (await fetch(source)).blob();
    const response = await processImageWithAiJson<PhotoTo3dResponse>(blob, {
      cost: PHOTO_TO_3D_COST,
      endpoint: '/api/photo-to-3d',
      formData: { remove_background: removeBackground ? '1' : '0' },
      // the server allows 5 minutes, a cold start and a background removal fit well inside
      timeout: 1000 * 60 * 4.5,
    });

    if (!response) return null;

    const result = { depthSource: encodeDepthSource(depthSourceFromApi(response)), image: response.image };

    unusedDepth.set(elem.id, { ...result, source });

    return result;
  } finally {
    clearInterval(timer);
    progress.popById(progressId);
  }
};

const toPngUrl = (base64: string): string => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);

  return URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
};

/**
 * Turn a photo plane into a point cloud from its depth, in one undo step.
 *
 * The depth comes from flux-id (charged once; a failure is not charged). With the background
 * removed, the photo itself is replaced by the cut-out first, as the image actions' background
 * removal does, so the dots follow the subject. The relief gets a depth of 22% of its width, capped
 * by the engravable height, and is moved up or down to fit it.
 * @returns whether the photo was converted
 */
export const convertPhotoTo3d = async (
  elem: SVGImageElement,
  {
    removeBackground,
    sharpenAmount,
    sharpenRadius,
  }: { removeBackground: boolean; sharpenAmount: number; sharpenRadius: number },
): Promise<boolean> => {
  const object = useStlStore.getState().objects[elem.id];

  if (!object || object.kind !== 'photo' || isPhotoTo3d(elem)) return false;

  const depth = await fetchDepth(elem, removeBackground);

  if (!depth) return false;

  // everything that can fail runs before the photo is touched
  try {
    let cutOut: null | Record<string, string> = null;

    if (depth.image) {
      const { isFullColor } = imageEdit.getImageAttributes(elem);
      const blobUrl = toPngUrl(depth.image);
      const threshold = 254;
      const base64Img = await imageEdit.generateBase64Image(blobUrl, true, threshold, isFullColor);

      cutOut = {
        'data-no-bg': 'true',
        'data-shading': 'true',
        'data-threshold': String(threshold),
        origImage: blobUrl,
        'xlink:href': base64Img,
      };
    }

    const box = getEngravableBox();
    const widthMm = Number(elem.getAttribute(PHOTO_3D_ATTR.width)) * Math.abs(object.transform.scale[0]);
    const maxThickness = box.isValid ? box.height / MM_TO_SCENE : Infinity;
    const thickness = Math.min(widthMm * THICKNESS_RATIO, maxThickness);
    const [x, y, z] = object.transform.position;
    const half = (thickness * MM_TO_SCENE) / 2;
    const fittedZ = box.isValid
      ? Math.min(Math.max(z, box.center[2] - box.height / 2 + half), box.center[2] + box.height / 2 - half)
      : z;
    const transform: StlTransform = {
      ...object.transform,
      position: [x, y, fittedZ],
      scale: [object.transform.scale[0], object.transform.scale[1], 1],
    };
    const settings: PhotoTo3dSettings = {
      edgeRoundMm: isUvDev() ? Math.round(widthMm * DEV_EDGE_ROUND_RATIO * 10) / 10 : 0,
      sharpenAmount,
      sharpenRadius,
    };
    const { buffer, grid } = await computeCloud(
      elem,
      depth.depthSource,
      transform,
      thickness,
      settings,
      cutOut?.['xlink:href'] ?? getPhotoTextureUrl(elem),
    );
    const batch = new history.BatchCommand('Photo to 3D');

    if (cutOut) setAttributes(batch, elem, cutOut);

    setAttributes(batch, elem, {
      ...settingAttrs(settings),
      [PHOTO_TO_3D_ATTR.grid]: grid,
      [PHOTO_TO_3D_ATTR.marker]: String(DEPTH_SOURCE_FORMAT_VERSION),
      [PHOTO_TO_3D_ATTR.thickness]: String(thickness),
    });
    applyPhotoPointCloud(elem.id, buffer, { depthSource: depth.depthSource, parentCmd: batch, transform });
    undoManager.addCommandToHistory(batch);
    unusedDepth.delete(elem.id);

    return true;
  } catch (error) {
    // the depth stays cached for another try
    alertPhotoTo3dError(error);

    return false;
  }
};

/**
 * Recompute a converted photo's point cloud with changed settings, or for its current point spacing
 * and size when `changes` is empty.
 * @param mode `new` records its own undo step; `append` folds into the latest one (the resize or
 * spacing change that made the cloud stale); `none` records nothing (right before sending a job: the
 * cloud is a function of the settings, the size and the layer, so undo stays consistent)
 */
export const updatePhotoTo3d = async (
  elem: SVGImageElement,
  changes: Partial<PhotoTo3dSettings>,
  mode: 'append' | 'new' | 'none',
): Promise<boolean> => {
  const object: StlObject | undefined = useStlStore.getState().objects[elem.id];

  if (!object?.depthSource || !isPhotoTo3d(elem)) return false;

  const settings = { ...getPhotoTo3dSettings(elem), ...changes };
  const thickness = readNumber(elem, PHOTO_TO_3D_ATTR.thickness, 1);
  const { buffer, grid } = await computeCloud(elem, object.depthSource, object.transform, thickness, settings);
  const batch = new history.BatchCommand('Update photo to 3D');

  setAttributes(batch, elem, { ...settingAttrs(settings), [PHOTO_TO_3D_ATTR.grid]: grid });
  applyPhotoPointCloud(elem.id, buffer, { parentCmd: batch });

  if (mode === 'new') undoManager.addCommandToHistory(batch);
  else if (mode === 'append') undoManager.appendCommandToLast(batch, batch.getText(), elem);

  return true;
};

/** Bring every stale photo-to-3D point cloud up to date, before a job is sent. */
export const refreshStalePhotoTo3d = async (): Promise<void> => {
  const stale = Array.from(
    document.querySelectorAll<SVGImageElement>(`#svgcontent image[${PHOTO_TO_3D_ATTR.marker}]`),
  ).filter(isPhotoTo3dStale);

  for (const elem of stale) {
    try {
      await updatePhotoTo3d(elem, {}, 'none');
    } catch (error) {
      console.error(`Failed to update the point cloud of ${elem.id}`, error);
    }
  }
};
