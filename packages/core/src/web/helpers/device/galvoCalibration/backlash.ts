import storage from '@core/implementations/storage';

import type { GalvoPoint } from '../galvoExec';

/**
 * The gantry does not come back to quite the same place after reversing: a move that ends going
 * -X lands a little short of one that ends going +X. The calibration cares about where the gantry
 * is to better than that, so with this flag on every positioning move is made to finish travelling
 * +X and +Y -- overshoot past the target on the negative side, then come back.
 *
 * Development flag: whether the mechanics need this is still being measured (PRD §11 decision 7).
 * It lives in its own storage key rather than galvo-dev-settings because everything there is sent
 * to swiftray with the job, and this is not a job setting.
 */
const STORAGE_KEY = 'galvo-fix-backlash';

/** How far past the target to go before coming back, mm. */
export const BACKLASH_OVERSHOOT_MM = 5;

export const getFixBacklash = (): boolean => storage.get(STORAGE_KEY) ?? true;

export const setFixBacklash = (value: boolean): void => {
  storage.set(STORAGE_KEY, value);
};

/**
 * The points a positioning move has to visit, in order, so that it arrives at `target` moving +
 * on every axis that would otherwise be approached from +. An axis is overshot when the target is
 * below where the gantry is now, or when that is unknown (`from` omitted) and so has to be assumed.
 * The overshoot never goes below `min`, the near edge of the travel.
 */
export const approachPoints = (
  target: GalvoPoint,
  { fix, from, min = { x: 0, y: 0 } }: { fix: boolean; from?: GalvoPoint; min?: GalvoPoint },
): GalvoPoint[] => {
  if (!fix) return [target];

  const overshoot = (axis: 'x' | 'y'): number => {
    const needed = from === undefined || target[axis] < from[axis];

    return needed ? Math.max(target[axis] - BACKLASH_OVERSHOOT_MM, min[axis]) : target[axis];
  };

  const detour = { x: overshoot('x'), y: overshoot('y') };

  if (detour.x === target.x && detour.y === target.y) return [target];

  return [detour, target];
};
