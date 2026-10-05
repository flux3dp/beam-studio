import { dpmm } from '@core/app/actions/beambox/constant';

import type { BBox } from '../store';
import type { Point, RigidTransform } from '../utils/rigidTransform';
import { applyRigidTransform } from '../utils/rigidTransform';

import type { ScaleAxis } from './layout';
import {
  PRINTED_LINE_MM,
  PRINTED_PITCH_MM,
  READING_MAX,
  READING_STEP_MM,
  SCALE_START_MM,
  SCRATCH_LINE_MM,
  SCRATCH_PITCH_MM,
  toSheetPoint,
} from './layout';

/** Darkness (0 = white / unpainted, 255 = black) at a canvas px point */
export type DarknessSampler = (canvasPoint: Point) => number;

/** Sample darkness from a camera image; `ratio` is image px per canvas px */
export const createDarknessSampler = (image: ImageData, ratio: number): DarknessSampler => {
  const { data, height, width } = image;

  return ({ x, y }) => {
    const px = Math.round(x * ratio);
    const py = Math.round(y * ratio);

    if (px < 0 || py < 0 || px >= width || py >= height) return 0;

    const i = (py * width + px) * 4;
    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

    return ((255 - luminance) * data[i + 3]) / 255;
  };
};

/** A strip of one scale in the sheet frame: lines run perpendicular to `axis`; `fromMm`/`toMm` bound the strip along the other axis, from the box center */
export interface ScaleBand {
  axis: ScaleAxis;
  fromMm: number;
  toMm: number;
}

/** The printed scale band and the scratched comb band of an axis, base line length only so every line weighs the same */
export const getScaleBands = (axis: ScaleAxis): { printed: ScaleBand; scratch: ScaleBand } => ({
  printed: { axis, fromMm: SCALE_START_MM, toMm: SCALE_START_MM + PRINTED_LINE_MM },
  scratch: { axis, fromMm: SCALE_START_MM - SCRATCH_LINE_MM, toMm: SCALE_START_MM },
});

/** Mean darkness across a band, sampled along its axis */
export interface Profile {
  /** Sheet-frame position of `values[0]`, in mm from the scale center along the axis */
  startMm: number;
  stepMm: number;
  values: number[];
}

/** One canvas px */
const SAMPLE_STEP_MM = 1 / dpmm;

/** Profile half-span: one pitch beyond the outermost line */
export const HALF_SPAN_MM = (READING_MAX + 1) * PRINTED_PITCH_MM;

/** Collapse a band to a 1D darkness profile along its axis. Samples are laid out in the sheet frame and mapped through `transform`, so a rotated sheet needs no image rotation. */
export const extractProfile = (
  darkness: DarknessSampler,
  bbox: BBox,
  transform: RigidTransform,
  { axis, fromMm, toMm }: ScaleBand,
): Profile => {
  const uCount = Math.round((2 * HALF_SPAN_MM) / SAMPLE_STEP_MM) + 1;
  const vCount = Math.round((toMm - fromMm) / SAMPLE_STEP_MM) + 1;
  const values: number[] = [];

  for (let ui = 0; ui < uCount; ui += 1) {
    const u = -HALF_SPAN_MM + ui * SAMPLE_STEP_MM;
    let sum = 0;

    for (let vi = 0; vi < vCount; vi += 1) {
      const v = fromMm + vi * SAMPLE_STEP_MM;

      sum += darkness(applyRigidTransform(toSheetPoint(bbox, axis, u, v), transform));
    }

    values.push(sum / vCount);
  }

  return { startMm: -HALF_SPAN_MM, stepMm: SAMPLE_STEP_MM, values };
};

const percentile = (values: number[], fraction: number): number => {
  const sorted = [...values].sort((a, b) => a - b);

  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
};

const mean = (values: number[]): number => values.reduce((sum, v) => sum + v, 0) / values.length;

/** Local-baseline window, in samples: three pitches */
const BASELINE_WINDOW = Math.round((3 * PRINTED_PITCH_MM) / SAMPLE_STEP_MM) + 1;
/** Low, not median: a wide scratch kerf can fill half a window and a median would climb onto the lines */
const BASELINE_PERCENTILE = 0.2;

/** Paper level under each sample: a rolling low percentile, so uneven lighting is flattened before thresholding */
const localBaseline = (values: number[]): number[] => {
  const half = Math.floor(BASELINE_WINDOW / 2);

  return values.map((_, i) => percentile(values.slice(Math.max(0, i - half), i + half + 1), BASELINE_PERCENTILE));
};

/** Threshold window half-width, in samples: five pitches either side */
const THRESHOLD_WINDOW = Math.round((5 * PRINTED_PITCH_MM) / SAMPLE_STEP_MM);
/** Lines cover well under 30 % of the samples, so this percentile sits between paper and line */
const PEAK_PERCENTILE = 0.7;
/** …capped at this fraction of the window's line height, so a train of faint lines is still cut at its own scale */
const PEAK_HEIGHT_FRACTION = 0.35;
const PEAK_HEIGHT_PERCENTILE = 0.95;
/** Darkness a blank band's noise never reaches, so a lineless band yields no runs */
const PEAK_FLOOR = 10;

/**
 * Darkness above the baseline a sample must exceed to belong to a line. Local,
 * because contrast varies along a scale: exposure falls off toward one end, and
 * printed ink on hardware faded to a quarter of its contrast within one scale.
 */
const localThreshold = (signal: number[]): number[] =>
  signal.map((_, i) => {
    const window = signal.slice(Math.max(0, i - THRESHOLD_WINDOW), i + THRESHOLD_WINDOW + 1);

    return Math.max(
      PEAK_FLOOR,
      Math.min(percentile(window, PEAK_PERCENTILE), PEAK_HEIGHT_FRACTION * percentile(window, PEAK_HEIGHT_PERCENTILE)),
    );
  });

/** Two peaks closer than this are one line: the tightest pitch is 0.95 mm */
const MIN_PEAK_SEPARATION = Math.round(0.4 / SAMPLE_STEP_MM);
/** Two detected lines closer than this cannot both be real (tightest pitch 0.95 mm): the weaker is a fleck */
const MIN_LINE_SEPARATION_MM = 0.45;
/** A dip between two peaks of one run splits it when it drops below this fraction of the lower peak */
const SPLIT_VALLEY_RATIO = 0.8;

/** Split a run at the valleys between its peaks: wide printed ink blurs two neighbours into one run that still shows two humps */
const splitRun = (signal: number[], from: number, to: number): Array<[number, number]> => {
  const peaks: number[] = [];

  for (let i = from; i <= to; i += 1) {
    const left = i > from ? signal[i - 1] : -1;
    const right = i < to ? signal[i + 1] : -1;

    if (signal[i] >= left && signal[i] > right) {
      const last = peaks[peaks.length - 1];

      if (last !== undefined && i - last < MIN_PEAK_SEPARATION) {
        if (signal[i] > signal[last]) peaks[peaks.length - 1] = i;
      } else {
        peaks.push(i);
      }
    }
  }

  const parts: Array<[number, number]> = [];
  let start = from;

  for (let p = 1; p < peaks.length; p += 1) {
    let valley = peaks[p - 1];

    for (let i = peaks[p - 1]; i <= peaks[p]; i += 1) if (signal[i] < signal[valley]) valley = i;

    if (signal[valley] < SPLIT_VALLEY_RATIO * Math.min(signal[peaks[p - 1]], signal[peaks[p]])) {
      parts.push([start, valley]);
      start = valley + 1;
    }
  }
  parts.push([start, to]);

  return parts;
};

/** Line centers along a profile, in mm from the scale center: each run above the local threshold, split at its valleys, located at its darkness-weighted centroid */
export const findLinePositionsMm = ({ startMm, stepMm, values }: Profile): number[] => {
  const baseline = localBaseline(values);
  const signal = values.map((value, i) => Math.max(0, value - baseline[i]));
  const threshold = localThreshold(signal);
  const runs: Array<[number, number]> = [];
  let runStart = -1;

  signal.forEach((value, index) => {
    if (value > threshold[index]) {
      if (runStart < 0) runStart = index;
    } else if (runStart >= 0) {
      runs.push([runStart, index - 1]);
      runStart = -1;
    }
  });

  if (runStart >= 0) runs.push([runStart, signal.length - 1]);

  const lines = runs
    .flatMap(([from, to]) => splitRun(signal, from, to))
    .map(([from, to]) => {
      let weight = 0;
      let moment = 0;

      for (let i = from; i <= to; i += 1) {
        weight += signal[i];
        moment += signal[i] * i;
      }

      return { positionMm: startMm + (moment / weight) * stepMm, weight };
    });

  // a burn fleck beside a line is a faint extra run: keep the stronger of two too-close lines
  return lines
    .filter((line, j) =>
      lines.every(
        (other, k) =>
          k === j ||
          Math.abs(other.positionMm - line.positionMm) >= MIN_LINE_SEPARATION_MM ||
          other.weight < line.weight,
      ),
    )
    .map(({ positionMm }) => positionMm);
};

/** Samples of a scratched line the walk must find below threshold in a row to call its end */
const LINE_END_SAMPLES = 3;

/**
 * Length of each scratched line, in mm from the scale start inward. Measured
 * rather than sampled at the designed lengths because burns come out uniformly
 * longer on hardware (≈2.5 mm on beamo II); each line's own interior and the
 * paper beside it set its threshold.
 */
export const measureScratchLengthsMm = (
  darkness: DarknessSampler,
  bbox: BBox,
  transform: RigidTransform,
  axis: ScaleAxis,
  positionsMm: number[],
): number[] => {
  const at = (u: number, v: number) => darkness(applyRigidTransform(toSheetPoint(bbox, axis, u, v), transform));
  // three samples across the line, so a 1 px wobble does not end it early
  const across = (u: number, v: number) => (at(u - SAMPLE_STEP_MM, v) + at(u, v) + at(u + SAMPLE_STEP_MM, v)) / 3;
  const interiorFrom = SCALE_START_MM - SCRATCH_LINE_MM + 1;
  const interiorTo = SCALE_START_MM - 0.5;
  const column = (u: number) => {
    let sum = 0;
    let n = 0;

    for (let v = interiorFrom; v <= interiorTo + 1e-9; v += SAMPLE_STEP_MM) {
      sum += across(u, v);
      n += 1;
    }

    return sum / n;
  };
  const farthest = SCALE_START_MM - 3 * SCRATCH_LINE_MM;

  return positionsMm.map((u) => {
    const line = column(u);
    const paper = (column(u - SCRATCH_PITCH_MM / 2) + column(u + SCRATCH_PITCH_MM / 2)) / 2;
    const threshold = (line + paper) / 2;
    let below = 0;

    for (let v = interiorTo; v >= farthest; v -= SAMPLE_STEP_MM) {
      if (across(u, v) < threshold) {
        below += 1;

        if (below >= LINE_END_SAMPLES) return SCALE_START_MM - (v + LINE_END_SAMPLES * SAMPLE_STEP_MM);
      } else {
        below = 0;
      }
    }

    return SCALE_START_MM - farthest;
  });
};

export interface ReadingEstimate {
  /** Where the scratched comb landed relative to the printed scale, mm along the axis */
  offsetMm: number;
  /** The vernier reading a person would enter: the printed index coinciding with a scratched line */
  reading: number;
  /** How many scratched lines the estimate rests on */
  scratchCount: number;
}

export interface LinePositions {
  /** Lines of the printed scale, mm — may miss a merged pair */
  printedMm: number[];
  /** Length of each scratched line, mm, in `scratchMm` order (see measureScratchLengthsMm) */
  scratchLengthsMm: number[];
  /** Lines of the scratched comb found in its base band — may be sparse (faint burns) */
  scratchMm: number[];
}

/** Fewest printed lines an estimate may rest on */
const MIN_PRINTED_LINES = 30;
/** With an end line missing, the shift whose origin lies within this of the designed position wins: the alignment fit is far better than half a pitch */
const PRINTED_ORIGIN_PRIOR_MM = 0.35;
/** Fewest scratched lines an estimate may rest on */
const MIN_SCRATCH_LINES = 6;
/** A scratched line this much longer than the median is a 5th-line anchor (designed +1.5 mm) */
const LONG_EXTRA_MM = 0.75;
/** A scratched line this much longer than the median is the middle anchor (designed +3 mm) */
const MIDDLE_EXTRA_MM = 2.25;

interface Candidate {
  indices: number[];
  shift: number;
}

/** Index a train of lines with a known pitch: the circular-mean phase fixes the fraction, leaving one candidate per integer `shift` whose indices all fit the scale */
const indexTrain = (positionsMm: number[], pitch: number, originMm: number, shifts: number[]): Candidate[] => {
  const q = positionsMm.map((p) => (p - originMm) / pitch);
  const phase =
    Math.atan2(mean(q.map((v) => Math.sin(2 * Math.PI * v))), mean(q.map((v) => Math.cos(2 * Math.PI * v)))) /
    (2 * Math.PI);
  const rounded = q.map((v) => Math.round(v - phase));

  return shifts
    .map((shift) => ({ indices: rounded.map((m) => m - shift), shift }))
    .filter(({ indices }) => indices.every((i) => Math.abs(i) <= READING_MAX));
};

const trainOrigin = (positionsMm: number[], pitch: number, indices: number[]): number =>
  mean(positionsMm.map((p, j) => p - indices[j] * pitch));

/**
 * Offset of a scratched comb from its printed scale. Either train may miss
 * lines; its integer shift is settled by extent when both end lines are there,
 * else the printed one by its origin prior and the comb by its line lengths (a
 * wrong shift puts a long line off the 5-line grid, the longest off the middle).
 * Both trains are sampled through the same transform, so the alignment error cancels.
 * @returns null when a train is too sparse or its shift cannot be settled
 */
export const estimateReading = ({ printedMm, scratchLengthsMm, scratchMm }: LinePositions): null | ReadingEstimate => {
  if (printedMm.length < MIN_PRINTED_LINES || scratchMm.length < MIN_SCRATCH_LINES) return null;

  const printedCandidates = indexTrain(printedMm, PRINTED_PITCH_MM, 0, [-2, -1, 0, 1, 2]).map((candidate) => ({
    ...candidate,
    origin: trainOrigin(printedMm, PRINTED_PITCH_MM, candidate.indices),
  }));
  // settled by extent (a single shift fits), else by the origin prior
  const printedBest =
    printedCandidates.length === 1
      ? printedCandidates[0]
      : printedCandidates.find(({ origin }) => Math.abs(origin) < PRINTED_ORIGIN_PRIOR_MM);

  if (!printedBest) return null;

  const printedOrigin = printedBest.origin;
  // length anchors, relative to the comb's own median
  const medianLength = percentile(scratchLengthsMm, 0.5);
  const longest = Math.max(...scratchLengthsMm);
  const middleJ = longest >= medianLength + MIDDLE_EXTRA_MM ? scratchLengthsMm.indexOf(longest) : -1;
  const longJs = scratchLengthsMm.flatMap((l, j) => (l >= medianLength + LONG_EXTRA_MM && j !== middleJ ? [j] : []));
  // |offset| ≤ 1 mm ≈ 1 pitch, so the integer part is one of three
  const candidates = indexTrain(scratchMm, SCRATCH_PITCH_MM, printedOrigin, [-1, 0, 1])
    .map((candidate) => {
      let score = 0;

      longJs.forEach((j) => (score += candidate.indices[j] % 5 === 0 ? 1 : -1));

      if (middleJ >= 0) score += candidate.indices[middleJ] === 0 ? 2 : -2;

      return { ...candidate, score };
    })
    .sort((a, b) => b.score - a.score);
  const best = candidates[0];

  // settled by extent or by a clear anchor win
  if (!best || (candidates.length > 1 && (best.score <= 0 || best.score === candidates[1].score))) return null;

  const offsetMm = trainOrigin(scratchMm, SCRATCH_PITCH_MM, best.indices) - printedOrigin;
  const reading = Math.round(offsetMm / READING_STEP_MM);

  if (Math.abs(reading) > READING_MAX) return null;

  return { offsetMm, reading, scratchCount: scratchMm.length };
};
