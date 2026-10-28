import type { GalvoConfig } from '@core/helpers/device/galvoConfig';

import type { CapturedCoupon } from './captureGrid';
import type { CalibrationRound } from './solve';
import { buildSolveParams, SCALE_X_SLOPE, suggestScales } from './solve';

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
});
