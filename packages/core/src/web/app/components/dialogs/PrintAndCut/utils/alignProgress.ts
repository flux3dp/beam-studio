import { usePrintAndCutStore } from '../store';

/**
 * Percentage range covered by each phase of the align step's camera flow, in
 * the order they normally run. The ranges are rough by nature: how many tiles
 * the sweep needs is not known in advance, so they only have to keep the bar
 * moving in the right direction.
 */
const PHASE_RANGES = {
  capture: [10, 55],
  completing: [97, 99],
  detect: [70, 80],
  locate: [55, 70],
  preparing: [0, 10],
  refine: [80, 97],
} as const satisfies Record<string, readonly [number, number]>;

export type AlignPhase = keyof typeof PHASE_RANGES;

export interface AlignProgress {
  /** Progress within the phase; undefined when it has no countable steps */
  current?: number;
  percentage: number;
  /** What the camera is doing — the view derives the label and the layout from it */
  phase: AlignPhase;
  /**
   * Estimated seconds left in the current phase, null while the phase has no countable
   * steps or the pace is not measurable yet. During the smart sweep this is a worst case
   * (the full serpentine), which normally finishes early.
   */
  remainingSeconds: null | number;
  /** Whether ESC stops the current phase (the capture shortcut is registered) */
  stoppable: boolean;
  /** Total steps of the phase; undefined when it has no countable steps */
  total?: number;
}

/**
 * Start of the currently reported phase: the pace is the average duration per
 * step since then. Per phase — a sweep tile, a targeted capture and a refine
 * retake all take different times, so pace never carries across phases.
 */
let paceTracker: null | { phase: AlignPhase; startCurrent: number; startTime: number } = null;

const estimateRemainingSeconds = (phase: AlignPhase, current?: number, total?: number): null | number => {
  if (current === undefined || !total) {
    paceTracker = null;

    return null;
  }

  // a new phase (or a restarted count) starts a fresh measurement
  if (!paceTracker || paceTracker.phase !== phase || current < paceTracker.startCurrent) {
    paceTracker = { phase, startCurrent: current, startTime: Date.now() };

    return null;
  }

  const doneSteps = current - paceTracker.startCurrent;

  // the phase's first report only marks the start; measuring a duration needs a second one
  if (doneSteps <= 0) return null;

  const msPerStep = (Date.now() - paceTracker.startTime) / doneSteps;

  return Math.max(1, Math.round(((total - current) * msPerStep) / 1000));
};

/**
 * Report what the align step is doing to the in-dialog progress. Written
 * straight to the store rather than threaded through callbacks: the camera flow
 * spans the capture, the mark sweep and the alignment, and all of them already
 * belong to this dialog.
 * @param current - progress within the phase, shown next to the phase label
 * @param stoppable - override for phases that normally register the ESC
 * shortcut but do not here (a one-shot full-area capture cannot be stopped)
 * @param total - omit when the phase has no countable steps
 */
export const reportAlignProgress = (
  phase: AlignPhase,
  {
    current,
    stoppable = phase === 'capture' || phase === 'locate',
    total,
  }: { current?: number; stoppable?: boolean; total?: number } = {},
): void => {
  const [start, end] = PHASE_RANGES[phase];
  const ratio = total ? Math.min(Math.max(current ?? 0, 0), total) / total : 0;

  usePrintAndCutStore.getState().setAlignProgress({
    current,
    percentage: Math.round(start + ratio * (end - start)),
    phase,
    remainingSeconds: estimateRemainingSeconds(phase, current, total),
    stoppable,
    total,
  });
};

export const clearAlignProgress = (): void => {
  paceTracker = null;
  usePrintAndCutStore.getState().setAlignProgress(null);
};
