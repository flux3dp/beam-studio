/**
 * Promark UV sets its output through the frequency: the power API has no effect on the source, so
 * the power shown on a UV layer stands for a frequency (docs/prd/promark-uv-inner-engraving.md §6.5).
 *
 * Measured output of the 5W UV source, in W, at each frequency in kHz (2026-10-12). Changing the
 * pulse width did not change the output, so it stays fixed. 40kHz is 100%; 30kHz measured the same
 * 4.5W, and is left out so 100% maps to a single frequency.
 */
const MEASURED_OUTPUT: ReadonlyArray<readonly [frequency: number, watt: number]> = [
  [40, 4.5],
  [50, 4],
  [60, 3.6],
  [80, 2.8],
  [100, 2.2],
  [120, 1.8],
  [150, 1.3],
  [180, 0.9],
  [200, 0.7],
];

const FULL_OUTPUT = MEASURED_OUTPUT[0][1];
/** Sorted by frequency, so power is decreasing. */
const POINTS = MEASURED_OUTPUT.map(([frequency, watt]) => ({ frequency, power: (watt / FULL_OUTPUT) * 100 }));
const FIRST = POINTS[0];
const LAST = POINTS[POINTS.length - 1];

/** The frequency input also accepts 30–40kHz; the power reads 100% there. */
export const UV_FREQUENCY_LIMIT = { max: LAST.frequency, min: 30 } as const;
/** The weakest output is the highest frequency, about 15.6%. */
export const UV_POWER_LIMIT = { max: 100, min: LAST.power } as const;

const interpolate = (x: number, x0: number, x1: number, y0: number, y1: number): number =>
  y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);

/**
 * Power in % to frequency in kHz, by linear interpolation between the measured points.
 *
 * The power is the source of truth. 100% is the one value several frequencies stand for (30–40kHz
 * all measured the full 4.5W), so at 100% a `currentFrequency` already in that range is kept;
 * anything else, or no current value, is 40kHz.
 */
export const uvPowerToFrequency = (power: number, currentFrequency?: number): number => {
  if (power >= FIRST.power) {
    const keepsCurrent =
      currentFrequency !== undefined &&
      currentFrequency >= UV_FREQUENCY_LIMIT.min &&
      currentFrequency <= FIRST.frequency;

    return keepsCurrent ? currentFrequency : FIRST.frequency;
  }

  if (power <= LAST.power) return LAST.frequency;

  for (let i = 1; i < POINTS.length; i += 1) {
    const prev = POINTS[i - 1];
    const next = POINTS[i];

    if (power >= next.power) return interpolate(power, prev.power, next.power, prev.frequency, next.frequency);
  }

  return LAST.frequency;
};

/** Frequency in kHz to power in %. Anything at or below 40kHz is 100%. */
export const uvFrequencyToPower = (frequency: number): number => {
  if (frequency <= FIRST.frequency) return FIRST.power;

  if (frequency >= LAST.frequency) return LAST.power;

  for (let i = 1; i < POINTS.length; i += 1) {
    const prev = POINTS[i - 1];
    const next = POINTS[i];

    if (frequency <= next.frequency) {
      return interpolate(frequency, prev.frequency, next.frequency, prev.power, next.power);
    }
  }

  return LAST.power;
};
