import type { PreviewMode } from '@core/app/constants/cameraConstants';

import type { CameraConfig, CameraParameters } from './Camera';

export interface PreviewManager {
  /**
   * Index of the physical camera used by the current preview mode; camera settings
   * (e.g. exposure) are per-camera. Undefined when the manager only uses one camera.
   */
  currentCameraIndex?: number;

  end(): Promise<void>;

  getCameraOffset?: () => CameraParameters;

  getCameraOffsetStandard?: () => CameraConfig;

  getPhotoAfterMoveTo?: (x: number, y: number) => Promise<string>;

  getPreviewPosition?: (x: number, y: number, opts?: { clipByWorkArea?: boolean }) => { x: number; y: number };

  /**
   * Serpentine capture points covering the region (rows top to bottom, odd
   * rows reversed) — the same points previewRegion would capture
   */
  getRegionPreviewPoints?: (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    opts?: { overlapRatio?: number },
  ) => Array<{ overlapFlag: number; point: [number, number] }>;

  /**
   * The tile rect (canvas px) a preview at the requested point would actually
   * stamp on the background canvas; the point is clamped near edges
   */
  getRegionPreviewTile?: (x: number, y: number) => { centerX: number; centerY: number; height: number; width: number };

  preprocessImage?: (
    imgUrl: string,
    opts?: { overlapFlag?: number; overlapRatio?: number },
  ) => Promise<HTMLCanvasElement>;

  /**
   * preview point
   * @param x x in px
   * @param y y in px
   * @param opts
   */
  preview(x: number, y: number, opts?: { overlapFlag?: number; overlapRatio?: number }): Promise<boolean>;

  previewFullWorkarea?: () => Promise<boolean>;

  previewMode: PreviewMode;

  /**
   * preview region
   * @param x1 point 1 x in px
   * @param y1 point 1 y in px
   * @param x2 point 2 x in px
   * @param y2 point 2 y in px
   * @param opts
   */
  previewRegion(x1: number, y1: number, x2: number, y2: number, opts?: { overlapRatio?: number }): Promise<boolean>;

  reloadLevelingOffset?: () => Promise<void>;

  resetObjectHeight?: () => Promise<boolean>;

  setup(args?: { progressId?: string }): Promise<boolean>;

  supportedPreviewModes: PreviewMode[];

  switchPreviewMode?: (mode: PreviewMode) => Promise<PreviewMode>;
}
