import type { GalvoConfig, GalvoGridCorrection } from '@core/helpers/device/galvoConfig';

import type { CapturedCoupon } from './captureGrid';
import type { CalibrationRound, SolveGrid } from './solve';
import {
  buildSolveParams,
  composeGridCorrection,
  GRID_SIGN,
  gridMaxShift,
  SCALE_X_SLOPE,
  scaleGridCorrection,
  suggestScales,
} from './solve';

const captured: CapturedCoupon = {
  blob: new Blob(),
  heightPx: 3600,
  originMm: { x: 10, y: 10 },
  pxPerMm: 20,
  url: 'blob:captured',
  widthPx: 3600,
};

// Built by hand: galvoConfig pulls in device-master, and all this needs is the two axis flags.
const configWith = (invertX: boolean, invertY: boolean): GalvoConfig => ({
  field: { angle: 0, invertX, invertY, offsetX: 0, offsetY: 0, swapXY: false },
  focusHeight: 0,
  galvoParameters: {
    x: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
    y: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
  },
  redDot: { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 },
  workarea: 110,
});

const round = (sent: CalibrationRound['sent'], scale_x: null | number, scale_y: null | number): CalibrationRound => ({
  measured: { affine_rms: 0.3, scale_x, scale_y, skew_deg: 0.1 },
  sent,
});

describe('galvoCalibration solve', () => {
  describe('buildSolveParams', () => {
    it('describes the pattern and where the field centre is in the picture', () => {
      const params = buildSolveParams(captured, configWith(true, true), {
        center: { x: 100, y: 100 },
      });

      expect(params).toMatchObject({
        annotate: true,
        arm: [2, 4.5],
        expected_center_px: [1800, 1800],
        grid: 9,
        grid_field: 110,
        grid_size: 9,
        identity: [-44, -51],
        identity_r: 0.5,
        invert: [true, true],
        l_frame: { arm: 8, half: 70 },
        node_r: 1.25,
        pitch: 11,
        px_per_mm: 20,
      });
      expect(params.discovery).toHaveLength(12);
      expect(params.validation).toHaveLength(8);
    });

    it("passes the MOPA head's own axis flags", () => {
      const params = buildSolveParams(captured, configWith(false, false), {
        annotate: false,
        center: { x: 50, y: 60 },
      });

      expect(params.invert).toEqual([false, false]);
      expect(params.annotate).toBe(false);
      expect(params.expected_center_px).toEqual([800, 1000]);
    });
  });

  describe('suggestScales', () => {
    it('moves scaleX by the factory slope and borrows it for scaleY on the first round', () => {
      const suggestion = suggestScales(round({ scaleX: 100, scaleY: 100 }, 1.1, 0.95), []);

      expect(suggestion.scaleX).toBeCloseTo(100 - 0.1 / SCALE_X_SLOPE, 2);
      expect(suggestion.scaleY).toBeCloseTo(100 + 0.05 / SCALE_X_SLOPE, 2);
      expect(suggestion.slopeYSource).toBe('borrowed');
    });

    it('uses the secant of the last two rounds for scaleY once there are two', () => {
      const first = round({ scaleX: 100, scaleY: 100 }, 1.1, 1.1);
      const second = round({ scaleX: 87, scaleY: 90 }, 1.0, 1.05);
      const suggestion = suggestScales(second, [first]);

      // 0.05 of scale over 10 of scaleY
      expect(suggestion.slopeY).toBeCloseTo(0.005, 6);
      expect(suggestion.slopeYSource).toBe('secant');
      expect(suggestion.scaleY).toBeCloseTo(90 - 0.05 / 0.005, 2);
      expect(suggestion.scaleX).toBe(87);
    });

    it('falls back to the borrowed slope when the history gives no usable secant', () => {
      const same = round({ scaleX: 100, scaleY: 100 }, 1.0, 1.1);
      const noisy = round({ scaleX: 100, scaleY: 100.001 }, 1.0, 1.05);

      expect(suggestScales(noisy, [same]).slopeYSource).toBe('borrowed');
      expect(suggestScales(round({ scaleX: 100, scaleY: 100 }, 1.0, 1.0), []).slopeYSource).toBe('borrowed');
    });

    it('suggests nothing for a scale the solver could not measure', () => {
      const suggestion = suggestScales(round({ scaleX: 100, scaleY: 100 }, null, null), []);

      expect(suggestion.scaleX).toBeNull();
      expect(suggestion.scaleY).toBeNull();
    });
  });

  describe('composeGridCorrection', () => {
    const measured = (dx: number[], dy: number[], extra: Partial<SolveGrid> = {}): SolveGrid => ({
      dx,
      dy,
      extrapolated: 0,
      field: 110,
      fit_max_mm: 0.02,
      fit_rms_mm: 0.01,
      size: 2,
      ...extra,
    });

    // the CO2 head: mirrored on both axes, manual scales 87.14 / 79 (the 2026-10-30 calibration)
    const co2 = {
      ...configWith(true, true),
      galvoParameters: {
        x: { bulge: 1, scale: 87.14, skew: 1, trapezoid: 1 },
        y: { bulge: 1, scale: 79, skew: 1, trapezoid: 1 },
      },
    };

    it('starts from the manual scales, not the measurement, when the coupon had no table', () => {
      const { fromScales, grid } = composeGridCorrection(undefined, measured([9, 9, 9, 9], [9, 9, 9, 9]), co2, 'T');

      expect(fromScales).toBe(true);
      // 2 x 2 over 110: the corners, -55 and +55 on each axis, X fastest
      expect(grid.dx).toEqual([-55, 55, -55, 55].map((x) => Math.round(x * (100 / 87.14 - 1) * 1e4) / 1e4));
      expect(grid.dy).toEqual([-55, -55, 55, 55].map((y) => Math.round(y * (100 / 79 - 1) * 1e4) / 1e4));
      expect(grid).toMatchObject({ createdAt: 'T', field: 110, invertX: true, invertY: true, size: 2 });
      expect(grid).not.toHaveProperty('flip');
      expect(composeGridCorrection(null, measured([1, 1, 1, 1], [0, 0, 0, 0]), co2, 'T').fromScales).toBe(true);
    });

    it('adds what is left to the table the coupon was marked with', () => {
      const marked: GalvoGridCorrection = { dx: [1, 2, 3, 4], dy: [0, 0, 0, 0], field: 110, size: 2 };
      const { fromScales, grid } = composeGridCorrection(
        marked,
        measured([0.1, 0.1, 0.1, 0.1], [0.05, 0, 0, 0]),
        co2,
        'T',
      );

      expect(fromScales).toBe(false);
      expect(grid.dx).toEqual([1, 2, 3, 4].map((v) => Math.round((v + GRID_SIGN * 0.1) * 1e4) / 1e4));
      expect(grid.dy[0]).toBeCloseTo(GRID_SIGN * 0.05);
      expect(grid.fitRmsMm).toBe(0.01);
      // the flags are the head's, whatever the marked table carried
      expect(grid).toMatchObject({ invertX: true, invertY: true });
    });

    it('starts over from the scales for a table of another size or field', () => {
      const marked: GalvoGridCorrection = { dx: [9, 9, 9, 9], dy: [9, 9, 9, 9], field: 70, size: 2 };

      expect(composeGridCorrection(marked, measured([0, 0, 0, 0], [0, 0, 0, 0]), co2, 'T').fromScales).toBe(true);
    });

    it('makes an identity table from neutral scales', () => {
      expect(scaleGridCorrection(configWith(false, false), 3)).toEqual({
        dx: Array(9).fill(0),
        dy: Array(9).fill(0),
        field: 110,
        size: 3,
      });
    });

    it('measures a table by its largest shift', () => {
      expect(gridMaxShift({ dx: [0.3, 0, -0.6], dy: [0.4, 0.1, 0.8] })).toBeCloseTo(1);
    });
  });
});
