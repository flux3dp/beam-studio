import type { GalvoConfig, GalvoModule } from '@core/helpers/device/galvoConfig';
import deviceMaster from '@core/helpers/device-master';

/**
 * Driving the galvo card directly, with no fcode and no player: trace a rectangle, move the
 * mirrors, burn dots. For calibrating, and for trying a setting before it is saved.
 *
 * Coordinates are galvo field mm with the lens centre as origin, so a 110 mm field spans ±55.
 * Where that lands on the work is gantry position + galvo position, and these commands move no
 * gantry.
 */

/** A point of the field, in mm from the lens centre. */
export interface GalvoPoint {
  x: number;
  y: number;
}

/**
 * The card's own flat parameter names, which are not Beam Studio's nested ones.
 *
 * All fifteen go together or none do: the card applies every optical field whenever it is given
 * any one of them, filling the rest from whatever it happens to hold. A half set is not "leave the
 * others alone", it is a mixture -- and the ones that would have to be guessed are each machine's
 * own calibration, so guessing falsifies the very thing being calibrated. The machine refuses an
 * incomplete set outright (`fail GALVO_OPTICS_INCOMPLETE`).
 */
export const toGalvoOptics = ({ field, galvoParameters: { x, y }, workarea }: GalvoConfig) => ({
  angle: field.angle,
  // bucket / bulge / barrel are one thing under three names, one per repo
  cor_bucket_x: x.bulge,
  cor_bucket_y: y.bulge,
  cor_parallel_x: x.skew,
  cor_parallel_y: y.skew,
  cor_scale_x: x.scale,
  cor_scale_y: y.scale,
  cor_trapezoid_x: x.trapezoid,
  cor_trapezoid_y: y.trapezoid,
  field_size: workarea,
  invert_x: field.invertX ? 1 : 0,
  invert_y: field.invertY ? 1 : 0,
  offset_x: field.offsetX,
  offset_y: field.offsetY,
  swap_xy: field.swapXY ? 1 : 0,
});

/**
 * What a preview looks like to the eye. All four are preview-only: a real pass goes round once at
 * the marking speed, and the card restores its own jump timing when the next operation starts, so
 * a slow preview cannot leave a slow mark behind.
 *
 * Only what was actually set is sent. An absent key leaves the machine on its own default, which is
 * deliberately not repeated here: the numbers belong to the firmware and have already changed once.
 */
export interface GalvoPreviewTuning {
  /** Rest at the end of each step, us, 0-65535. The same for every step whatever its length. */
  jumpDelayUs?: number;
  /** How fast the dot travels a step, mm/s. */
  jumpSpeed?: number;
  /** Times the outline is walked per list. Fewer round trips, so fewer visible hitches. */
  previewRounds?: number;
  /**
   * Step length, mm. This is what makes the correction visible: one long jump is a straight line
   * in scanner space, while the same span in steps bows the way the coefficients say it should.
   */
  previewStepMm?: number;
}

const previewArgs = ({ jumpDelayUs, jumpSpeed, previewRounds, previewStepMm }: GalvoPreviewTuning) => ({
  ...(jumpDelayUs === undefined ? {} : { jump_delay_us: jumpDelayUs }),
  ...(jumpSpeed === undefined ? {} : { jump_speed: jumpSpeed }),
  ...(previewRounds === undefined ? {} : { preview_rounds: previewRounds }),
  ...(previewStepMm === undefined ? {} : { preview_step_mm: previewStepMm }),
});

const POLL_INTERVAL = 300;
const POLL_TIMEOUT = 120000;

/** `fail <code>` is an answer, not a transport error, so it has to be turned into one. */
const expectOk = (answer: string | undefined, action: string): void => {
  if (!answer?.startsWith('ok')) throw new Error(`${action}: ${answer ?? 'no response'}`);
};

const exec = async (payload: Record<string, unknown>, action: string): Promise<void> =>
  expectOk(await deviceMaster.galvoExec(payload), action);

/**
 * Wait for the last operation to finish. Never call this after starting a preview: that loops
 * until it is stopped, so `wait` is all it will ever answer.
 */
export const awaitGalvoResult = async (action: string): Promise<void> => {
  const deadline = Date.now() + POLL_TIMEOUT;

  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));

    const answer = await deviceMaster.getControlTaskResult();

    if (answer?.startsWith('ok')) return;

    if (!answer?.startsWith('wait')) throw new Error(`${action}: ${answer ?? 'no response'}`);

    if (Date.now() > deadline) {
      await deviceMaster.galvoStop().catch(() => {});
      throw new Error(`${action} timed out`);
    }
  }
};

/**
 * Trace the field's outline.
 *
 * With `preview` the card never arms: the path becomes red-light jumps cut into 10 mm pieces so
 * each is corrected separately -- one long jump is straight in scanner angle space and would hide
 * the very distortion being looked for -- and it repeats until stopGalvo. Power and speed are
 * ignored there, so they are only sent for a real mark.
 */
export const galvoFrame = async ({
  config,
  module,
  power,
  preview = false,
  speed,
  tuning = {},
}: {
  config: GalvoConfig;
  module: GalvoModule;
  power: number;
  preview?: boolean;
  speed: number;
  tuning?: GalvoPreviewTuning;
}): Promise<void> => {
  const size = config.workarea;
  const half = size / 2;

  await exec(
    {
      head: module,
      op: 'frame',
      optics: toGalvoOptics(config),
      rect: { h: size, w: size, x: -half, y: -half },
      ...(preview ? { power: 0, preview: true, ...previewArgs(tuning) } : { power, speed }),
    },
    preview ? 'Preview' : 'Mark',
  );
};

/**
 * How far to step aside when the same point is asked for twice. Small enough not to matter on the
 * work, large enough that no rounding can swallow it.
 */
const NUDGE_MM = 0.1;

/** Where the mirrors were last sent, so a repeat can be recognised. */
let lastGoto: GalvoPoint | null = null;

/** Forget the tracked position; a new session starts with the card wherever it left off. */
export const resetGalvoGoto = (): void => {
  lastGoto = null;
};

/**
 * Point the mirrors somewhere. The card is left unarmed, so this cannot fire.
 *
 * The card skips a jump to where it thinks the mirrors already are, and it thinks in the
 * coordinate it was given rather than where the beam lands. Change the optics and the same
 * coordinate becomes a different physical spot -- but the jump is skipped, so nothing moves and
 * the change cannot be seen. When the same point is asked for twice, step aside and come back, so
 * the second command is a move the card will honour.
 *
 * The step is only skipped when the point differs, never on a guess about whether the optics
 * changed: an unnecessary 0.1 mm jog costs nothing, while a missed one looks like the setting did
 * nothing at all.
 */
export const galvoGoto = async ({
  config,
  module,
  x,
  y,
}: {
  config: GalvoConfig;
  module: GalvoModule;
  x: number;
  y: number;
}): Promise<void> => {
  const optics = toGalvoOptics(config);
  const send = (px: number, py: number) => exec({ head: module, op: 'goto', optics, x: px, y: py }, 'Move');

  if (lastGoto?.x === x && lastGoto.y === y) {
    const reach = config.workarea / 2;
    // Away from the edge rather than past it, so the detour stays inside the field.
    const nudged = x + NUDGE_MM <= reach ? x + NUDGE_MM : x - NUDGE_MM;

    await send(nudged, y);
    // The card refuses a command while the last one runs, so the detour has to land first.
    await awaitGalvoResult('Move');
  }

  lastGoto = { x, y };
  await send(x, y);
};

/** Burn one dot per point, dwelling on each. */
export const galvoDot = async ({
  config,
  durationUs,
  module,
  points,
  power,
}: {
  config: GalvoConfig;
  durationUs: number;
  module: GalvoModule;
  points: GalvoPoint[];
  power: number;
}): Promise<void> =>
  exec(
    {
      duration_us: durationUs,
      head: module,
      op: 'dot',
      optics: toGalvoOptics(config),
      points: points.map(({ x, y }) => [x, y]),
      power,
    },
    'Dot',
  );

/** End a preview loop and release the card. Always answers ok; leaves the red light on. */
export const stopGalvo = async (): Promise<void> => {
  await deviceMaster.galvoStop();
};
