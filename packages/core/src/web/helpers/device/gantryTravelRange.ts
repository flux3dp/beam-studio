import { galvoModules } from '@core/app/constants/layer-module/layer-modules';
import { getModuleBoundary } from '@core/app/constants/layer-module/module-boundary';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getSupportedModules, getWorkarea } from '@core/app/constants/workarea-constants';
import type { TBoundary } from '@core/helpers/boundary-helper';

/**
 * A machine with galvo heads parked on it. HEXA II today; HEXA RF and the Promark have none.
 *
 * Lives here rather than beside the rest of the galvo head helpers because it answers from the model
 * alone: anything that talks to the machine to answer would put a control socket in the import graph
 * of the canvas, which draws the boundary long before a machine is chosen.
 */
export const isGalvoHeadMachine = (model: WorkAreaModel): boolean =>
  Boolean(getWorkarea(model).supportedModules?.some((module) => galvoModules.has(module)));

/**
 * What the heads parked on this machine cost the gantry, in mm per edge, before any module offset or
 * galvo reach is added back. Unioned over the modules the document supports, because a parked head
 * takes that travel away whatever this job happens to use -- which is also why it follows the Mopa
 * switch and nothing else.
 *
 * The one definition of that union: the canvas boundary, the exporter's galvo_boundary and the
 * clamps below all read it here, and a fourth reading of it would be a fourth chance to disagree.
 */
export const getGantryTravelBoundary = (model: WorkAreaModel): TBoundary =>
  getSupportedModules(model).reduce(
    (acc, module) => {
      const { bottom, left, right, top } = getModuleBoundary(model, module);

      return {
        bottom: Math.max(acc.bottom, bottom),
        left: Math.max(acc.left, left),
        right: Math.max(acc.right, right),
        top: Math.max(acc.top, top),
      };
    },
    { bottom: 0, left: 0, right: 0, top: 0 },
  );

/**
 * Where the gantry itself may be sent, in mm of canvas space. HEXA II is the machine this matters
 * on: its right edge can be a wide strip of parked modules, and a move that reads perfectly well as
 * a canvas coordinate can be somewhere the carriage cannot go.
 *
 * Only machines that park a head are narrowed. Elsewhere a module boundary says where a *module* may
 * work, not where the gantry may travel -- the print head of a Beambox II reaches the whole bed --
 * so narrowing camera and framing moves by it would be wrong.
 */
export const getGantryTravelRange = (
  model: WorkAreaModel,
): { maxX: number; maxY: number; minX: number; minY: number } => {
  const { displayHeight, height, width } = getWorkarea(model);
  const bedHeight = displayHeight ?? height;

  if (!isGalvoHeadMachine(model)) return { maxX: width, maxY: bedHeight, minX: 0, minY: 0 };

  const { bottom, left, right, top } = getGantryTravelBoundary(model);

  return { maxX: width - right, maxY: bedHeight - bottom, minX: left, minY: top };
};

/** Clamps a gantry target, and says whether it had to move -- the caller usually has to say so. */
export const clampToGantryTravelRange = (
  model: WorkAreaModel,
  x: number,
  y: number,
): { clamped: boolean; x: number; y: number } => {
  const { maxX, maxY, minX, minY } = getGantryTravelRange(model);
  const clampedX = Math.min(Math.max(x, minX), maxX);
  const clampedY = Math.min(Math.max(y, minY), maxY);

  return { clamped: clampedX !== x || clampedY !== y, x: clampedX, y: clampedY };
};
