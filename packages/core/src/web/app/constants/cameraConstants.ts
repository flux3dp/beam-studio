export const STEP_ASK_READJUST = Symbol('STEP_ASK_READJUST');
export const STEP_REFOCUS = Symbol('STEP_REFOCUS');
export const STEP_PUT_PAPER = Symbol('STEP_PUT_PAPER');
export const STEP_BEFORE_ANALYZE_PICTURE = Symbol('STEP_BEFORE_ANALYZE_PICTURE');
export const STEP_FINISH = Symbol('STEP_FINISH');

export const DEFAULT_CAMERA_OFFSET = {
  R: 0,
  SX: 1.625,
  SY: 1.625,
  X: 15,
  Y: 30,
};

export const CALIBRATION_PARAMS = {
  centerX: 90, // mm
  centerY: 90, // mm
  idealOffsetX: 20, // mm
  idealOffsetY: 30, // mm
  idealScaleRatio: (585 / 720) * 2, // pixel on studio / pixel on beambox machine; 與焦距成正比
  size: 25, // mm
};

/* eslint-disable perfectionist/sort-enums */
export const enum PreviewMode {
  REGION = 1,
  FULL_AREA = 2,
}
/* eslint-enable perfectionist/sort-enums */
