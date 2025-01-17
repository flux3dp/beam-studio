import { CameraConfig, CameraParameters } from './Camera';
// import { IDeviceInfo } from './IDevice';

export interface PreviewManager {
  isFullScreen: boolean;

  setup(args?: { progressId?: string }): Promise<boolean>;

  end(): Promise<void>;

  /**
   * preview point
   * @param x x in px
   * @param y y in px
   * @param opts
   */
  preview(
    x: number,
    y: number,
    opts?: { overlapRatio?: number; overlapFlag?: number }
  ): Promise<boolean>;

  /**
   * preview region
   * @param x1 point 1 x in px
   * @param y1 point 1 y in px
   * @param x2 point 2 x in px
   * @param y2 point 2 y in px
   * @param opts
   */
  previewRegion(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    opts?: { overlapRatio?: number }
  ): Promise<boolean>;

  previewFullWorkarea?: () => Promise<boolean>;

  reloadLevelingOffset?: () => Promise<void>;

  resetObjectHeight?: () => Promise<boolean>;

  getCameraOffset?: () => CameraParameters;

  getCameraOffsetStandard?: () => CameraConfig;

  getPhotoAfterMoveTo?: (x: number, y: number) => Promise<string>;
}
