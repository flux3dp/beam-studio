import type { CameraParameters } from '@core/interfaces/Camera';

/**
 * Parse the legacy `camera_offset` / `camera_offset_borderless` device setting
 * (`Y:<y> X:<x> R:<r> S:<s>` or with `SX:`/`SY:` on newer firmware) into mm / rad values.
 * X and Y position the head for a shot (a pure translation); R, SX and SY only rotate and scale the photo.
 */
export const parseCameraOffset = (value: string): CameraParameters => {
  const text = ` ${value}`; // leading space so ` X:` cannot match the tail of `SX:`

  return {
    angle: Number(/R:\s?(-?\d+\.?\d+)/.exec(text)![1]),
    scaleRatioX: Number((/SX:\s?(-?\d+\.?\d+)/.exec(text) || /S:\s?(-?\d+\.?\d+)/.exec(text))![1]),
    scaleRatioY: Number((/SY:\s?(-?\d+\.?\d+)/.exec(text) || /S:\s?(-?\d+\.?\d+)/.exec(text))![1]),
    x: Number(/ X:\s?(-?\d+\.?\d+)/.exec(text)![1]),
    y: Number(/ Y:\s?(-?\d+\.?\d+)/.exec(text)![1]),
  };
};

/** The `F:` flag of the same setting: 1 = the photo must be flipped (upside-down camera). Absent = 0. */
export const parseCameraFlip = (value: string): boolean =>
  Boolean(Number((/F:\s?(-?\d+\.?\d+)/.exec(value) || ['', ''])[1]));
