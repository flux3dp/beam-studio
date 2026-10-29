import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import deviceMaster from '@core/helpers/device-master';

import type { GalvoConfig, GalvoModule } from '../galvoConfig';
import { buildCouponPaths, buildLFrameMarks, COUPON_LEAD_MM } from '../galvoCoupon';
import type { GalvoPoint } from '../galvoExec';
import { awaitGalvoResult, galvoFrame, galvoPaths, mainboardLine } from '../galvoExec';
import { getGalvoHeadConnectedFeedrate } from '../galvoHeadConnection';
import { connectGalvoHead, ensureGalvoHeadDisconnected } from '../galvoLaserMode';
import { getGantryTravelRange } from '../gantryTravelRange';

import { approachPoints } from './backlash';

/**
 * The marking half of the field-lens calibration: the galvo's coupon, the nozzle's L-frame ruler
 * around it, and the three-square stitch test that checks the end result. Each one couples or
 * parks the head itself, so the buttons can be pressed in any order.
 *
 * `center` is where the lens centre lands on the bed, in bed mm. The gantry station that puts it
 * there is `center` less the head's module offset, the same number module calibration measures.
 */

export interface MarkSite {
  /** Where the lens centre lands, bed mm. */
  center: GalvoPoint;
  fixBacklash: boolean;
  model: WorkAreaModel;
  /** The head's module offset (toolhead_shift), bed mm. */
  offsets: GalvoPoint;
}

/** Progress text for the dialog; the steps are slow enough to be worth naming. */
export type OnStep = (step: string) => void;

const round3 = (value: number): number => Math.round(value * 1000) / 1000;

/** Where the gantry parks the nozzle so that the lens centre lands on `center`. */
export const stationFor = (center: GalvoPoint, offsets: GalvoPoint): GalvoPoint => ({
  x: round3(center.x - offsets.x),
  y: round3(center.y - offsets.y),
});

/** Why a station cannot be used, or null when the gantry can get there. */
export const stationProblem = (model: WorkAreaModel, station: GalvoPoint): null | string => {
  const { maxX, maxY, minX, minY } = getGantryTravelRange(model);

  if (station.x < minX || station.x > maxX || station.y < minY || station.y > maxY) {
    return `Gantry station (${station.x}, ${station.y}) is outside the travel X ${minX}–${maxX}, Y ${minY}–${maxY}`;
  }

  return null;
};

const gcodeMove = ({ x, y }: GalvoPoint, feedrate: number): string => `G1F${feedrate}X${round3(x)}Y${round3(y)}`;

/**
 * Move the gantry while the control task holds the machine (raw mode is not available then).
 * Each leg is followed by M137P0, which the board answers only once the move has finished, so
 * the galvo never fires before the gantry has stopped.
 */
const moveGantry = async (
  target: GalvoPoint,
  { fixBacklash, from, model }: { fixBacklash: boolean; from?: GalvoPoint; model: WorkAreaModel },
): Promise<void> => {
  const feedrate = getGalvoHeadConnectedFeedrate();
  const { minX, minY } = getGantryTravelRange(model);

  for (const point of approachPoints(target, { fix: fixBacklash, from, min: { x: minX, y: minY } })) {
    await mainboardLine(gcodeMove(point, feedrate), 'Move gantry');
    await mainboardLine('M137P0', 'Move gantry');
  }
};

/**
 * Air assist for the galvo: route the valve to the galvo head and run the pump; afterwards open
 * both routes and stop the pump. The laser-mode sequences on the machine do neither, and the
 * factory notes that switching the valve without the pump is no air at all.
 * Whether paper needs it is open (PRD §11 decision 3); on by default.
 */
export const COUPON_AIR_ASSIST = true;

const AIR_ON = ['M136P312Q2', 'M136P3Q1000'];
const AIR_OFF = ['M136P4', 'M136P312Q3'];

const setAir = async (on: boolean): Promise<void> => {
  if (!COUPON_AIR_ASSIST) return;

  for (const line of on ? AIR_ON : AIR_OFF) await mainboardLine(line, 'Air assist');
};

/**
 * The enclosed-laser authorisation is what let the list fire; if it is gone now, it may have
 * gone part way through, and the sheet cannot be trusted. The board reports
 * `Open laser: …, Enclosed laser: …`.
 */
const assertStillAuthorised = async (): Promise<void> => {
  const report = await mainboardLine('M136P311', 'Read laser authorisation');
  const enclosed = /enclosed laser:\s*([^,|]+)/i.exec(report)?.[1].trim();

  if (!enclosed || !/^(1|on|en|true|high)/i.test(enclosed)) {
    throw new Error(
      `Enclosed laser authorisation was lost during the mark (${report || 'no report'}); discard this sheet`,
    );
  }
};

/**
 * Mark the coupon with the settings on screen. The head stays coupled and the gantry stays at the
 * station afterwards, so the L frame can follow.
 */
export const markCoupon = async ({
  center,
  config,
  fixBacklash,
  model,
  module,
  offsets,
  onStep,
  power,
  speed,
}: MarkSite & {
  config: GalvoConfig;
  module: GalvoModule;
  onStep?: OnStep;
  power: number;
  speed: number;
}): Promise<void> => {
  const station = stationFor(center, offsets);
  const problem = stationProblem(model, station);

  if (problem) throw new Error(problem);

  onStep?.('Coupling the galvo head');
  await connectGalvoHead(module);
  onStep?.('Moving the gantry to the station');
  await moveGantry(station, { fixBacklash, model });
  await setAir(true);

  try {
    onStep?.('Marking the coupon');
    await galvoPaths({ config, leadMm: COUPON_LEAD_MM, module, paths: buildCouponPaths(), power, speed });
    await awaitGalvoResult('Mark coupon');
    await assertStillAuthorised();
  } finally {
    await setAir(false).catch((error) => console.warn('Galvo calibration: air assist off failed', error));
  }
};

/**
 * What the CO2 beam needs before it will come out of the nozzle, in the order the player sends
 * them at the start of every CO2 job (BeamOS transient_cmd_list.cpp): 24 V on, CO2 the active
 * module, laser control to the STM, enclosed laser enabled. The control task's default_mode sends
 * the last three too, but it is skipped when the head is already parked, and leaving the task
 * resets the board anyway, so raw mode starts from nothing either way. Confirmed with firmware.
 */
const CO2_WORK_ON = ['M136P173', 'M136P259Q15', 'M136P310Q0', 'M136P311Q1'];
/** The player's tail: enclosed laser off, 24 V off. */
const CO2_WORK_OFF = ['M136P311Q0', 'M136P174'];

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const sendCo2WorkOn = async (): Promise<void> => {
  for (const line of CO2_WORK_ON) {
    const reply = await deviceMaster.rawGcode(line);

    console.log(`Galvo calibration: ${line} -> ${reply.trim()}`);
  }
};

/**
 * What the board says about the enclosed laser enable, read back in raw mode: true, false, or
 * null when the reply carried no `Enclosed laser:` field to read.
 */
const readCo2Enabled = async (): Promise<boolean | null> => {
  const report = await deviceMaster.rawGcode('M136P311');

  console.log(`Galvo calibration: M136P311 -> ${report.trim()}`);

  const enclosed = /enclosed laser:\s*([^,|\r\n]+)/i.exec(report)?.[1].trim();

  if (!enclosed) return null;

  return /^(1|on|en|true|high)/i.test(enclosed);
};

/**
 * Enable the CO2 laser and make sure it took. The second L frame of a session has moved without
 * cutting: its 24 V was switched off at the end of the first, and the enable that follows the
 * switch-on straight away may land before the rail is up. So the enable goes out before homing
 * (as in a job, where the transient list precedes everything) to give it that time, is read back
 * afterwards, and is sent once more after a pause when the board says it is still off.
 */
const enableCo2 = async (home: () => Promise<unknown>, onStep?: OnStep): Promise<void> => {
  onStep?.('Enabling the CO2 laser');
  await sendCo2WorkOn();
  onStep?.('Homing');
  await home();

  let enabled = await readCo2Enabled();

  if (enabled === false) {
    onStep?.('The CO2 laser did not enable, trying again');
    await delay(1000);
    await sendCo2WorkOn();
    enabled = await readCo2Enabled();
  }

  if (enabled === false) {
    throw new Error('The CO2 laser did not enable (M136P311 still reports it off), so the frame would not cut');
  }

  if (enabled === null) console.warn('Galvo calibration: M136P311 gave nothing to read the CO2 enable from');
};

/** Feed rates for the nozzle's L frame, mm/min: travel between marks, and marking by default. */
const L_FRAME_TRAVEL_FEEDRATE = 6000;

export const L_FRAME_MARK_FEEDRATE = 3000;

/**
 * Each L stroke starts this far beyond the tip of its first arm and ends this far beyond the tip
 * of its second, so that the beam switches on and off there: the controller stops the gantry to
 * change the laser power, and the beam dwelling on the sheet meanwhile burns a 3 to 4 mm blob.
 * Off the arms, the blob does not change what the solver measures (it samples the arms 2 to
 * 6.5 mm from the vertex).
 */
const L_FRAME_LEAD_MM = 4;
/**
 * A stroke cut at the L power before the first L, outside the solver's ring (Chebyshev 82 of the
 * centre) but on a 180 mm sheet: the first marks of the first frame on the machine came out as
 * wide, faint smears while the rest were crisp, which is a beam that has not settled yet. Back
 * and forth, so the tube runs for L_FRAME_WARM_UP_MM * 2 / 1200 mm/min before anything that
 * counts.
 */
const L_FRAME_WARM_UP_MM = 30;
const L_FRAME_WARM_UP_FROM_CENTRE_MM = { x: -85, y: -86 };

/**
 * The S word at 100% power. It is the controller's $30, which Beam Studio has no way to read;
 * 1000 is assumed until measured (PRD §11 decision 2).
 */
export const L_FRAME_S_AT_FULL_POWER = 1000;

/** Where the warm-up stroke runs, bed mm: along the top edge of the ring, left of the frame. */
export const warmUpStroke = (center: GalvoPoint): { from: GalvoPoint; to: GalvoPoint } => {
  const from = {
    x: round3(center.x + L_FRAME_WARM_UP_FROM_CENTRE_MM.x),
    y: round3(center.y + L_FRAME_WARM_UP_FROM_CENTRE_MM.y),
  };

  return { from, to: { x: round3(from.x + L_FRAME_WARM_UP_MM), y: from.y } };
};

/**
 * Cut the 8 L marks with the nozzle, in raw mode with the galvo head parked. `passes` repeats the
 * whole frame, homing before each pass. One pass is the default: on the machine a second pass
 * landed 1 to 3 mm beside the first and only added a ghost of every L.
 */
/** A point `lead` mm beyond `tip`, away from `vertex`, along the arm. */
const beyond = (vertex: GalvoPoint, tip: GalvoPoint, lead: number): GalvoPoint => {
  const length = Math.hypot(tip.x - vertex.x, tip.y - vertex.y) || 1;

  return {
    x: round3(tip.x + ((tip.x - vertex.x) / length) * lead),
    y: round3(tip.y + ((tip.y - vertex.y) / length) * lead),
  };
};

export const markLFrame = async ({
  center,
  feedrate = L_FRAME_MARK_FEEDRATE,
  fixBacklash,
  model,
  onStep,
  passes,
  power,
}: Omit<MarkSite, 'offsets'> & {
  /** Marking feed rate, mm/min. */
  feedrate?: number;
  onStep?: OnStep;
  passes: number;
  power: number;
}): Promise<void> => {
  const { minX, minY } = getGantryTravelRange(model);
  const marks = buildLFrameMarks(center).map((mark) => ({
    ...mark,
    leadIn: beyond(mark.vertex, mark.start, L_FRAME_LEAD_MM),
    leadOut: beyond(mark.vertex, mark.end, L_FRAME_LEAD_MM),
  }));
  const warmUp = warmUpStroke(center);
  const unreachable = [
    warmUp.from,
    warmUp.to,
    ...marks.flatMap(({ end, leadIn, leadOut, start, vertex }) => [leadIn, start, vertex, end, leadOut]),
  ].find((p) => stationProblem(model, p));

  if (unreachable) throw new Error(stationProblem(model, unreachable)!);

  await ensureGalvoHeadDisconnected(model, { onSlow: () => onStep?.('Parking the galvo head') });

  const s = Math.round((power / 100) * L_FRAME_S_AT_FULL_POWER);
  let lineCheck = false;
  let laserMode = false;
  let pump = false;

  try {
    await deviceMaster.enterRawMode();
    await deviceMaster.rawStartLineCheckMode();
    lineCheck = true;
    laserMode = true;
    await enableCo2(() => deviceMaster.rawHome(), onStep);
    await deviceMaster.rawSetAirPump(true);
    pump = true;
    await deviceMaster.rawSetLaser({ on: true, s: 0 });

    for (let pass = 0; pass < passes; pass += 1) {
      onStep?.(`Cutting the L frame, pass ${pass + 1}/${passes}`);

      if (pass > 0) await deviceMaster.rawHome();

      let from: GalvoPoint = { x: 0, y: 0 };

      if (pass === 0) {
        onStep?.('Warming the laser up');

        for (const point of approachPoints(warmUp.from, { fix: fixBacklash, from, min: { x: minX, y: minY } })) {
          await deviceMaster.rawMove({ f: L_FRAME_TRAVEL_FEEDRATE, s: 0, x: point.x, y: point.y });
        }

        await deviceMaster.rawMove({ f: feedrate, s, x: warmUp.to.x, y: warmUp.to.y });
        await deviceMaster.rawMove({ f: feedrate, s, x: warmUp.from.x, y: warmUp.from.y });
        from = warmUp.from;
        onStep?.(`Cutting the L frame, pass ${pass + 1}/${passes}`);
      }

      for (const { end, leadIn, leadOut, start, vertex } of marks) {
        for (const point of approachPoints(leadIn, { fix: fixBacklash, from, min: { x: minX, y: minY } })) {
          await deviceMaster.rawMove({ f: L_FRAME_TRAVEL_FEEDRATE, s: 0, x: point.x, y: point.y });
        }

        // one stroke, lead-in to lead-out: the beam comes on and goes off beyond the arms
        for (const point of [start, vertex, end, leadOut]) {
          await deviceMaster.rawMove({ f: feedrate, s, x: point.x, y: point.y });
        }

        from = leadOut;
      }
    }
  } finally {
    const tidy = async (step: () => Promise<unknown>) => {
      try {
        await step();
      } catch (error) {
        console.warn('Galvo calibration: L frame tidy-up step failed', error);
      }
    };

    if (deviceMaster.currentControlMode === 'raw') {
      await tidy(() => deviceMaster.rawSetLaser({ on: false }));

      if (laserMode) for (const line of CO2_WORK_OFF) await tidy(() => deviceMaster.rawGcode(line));

      if (pump) await tidy(() => deviceMaster.rawSetAirPump(false));

      if (lineCheck) await tidy(() => deviceMaster.rawEndLineCheckMode());

      await tidy(() => deviceMaster.rawLooseMotor());
      await tidy(() => deviceMaster.endSubTask());
    }
  }
};

/** Side of each square in the stitch test, and the gantry step between them. */
export const STITCH_SQUARE_MM = 100;

/**
 * Three 100 mm squares: one at the station, one 100 mm to the right, one 100 mm below that.
 * Their shared edges should be collinear once the field is calibrated -- the whole point of it.
 */
export const stitchStations = (center: GalvoPoint, offsets: GalvoPoint): GalvoPoint[] => {
  const base = stationFor(center, offsets);

  return [
    base,
    { x: round3(base.x + STITCH_SQUARE_MM), y: base.y },
    { x: round3(base.x + STITCH_SQUARE_MM), y: round3(base.y + STITCH_SQUARE_MM) },
  ];
};

export const stitchTest = async ({
  center,
  config,
  fixBacklash,
  model,
  module,
  offsets,
  onStep,
  power,
  speed,
}: MarkSite & {
  config: GalvoConfig;
  module: GalvoModule;
  onStep?: OnStep;
  power: number;
  speed: number;
}): Promise<void> => {
  const stations = stitchStations(center, offsets);
  const problem = stations.map((station) => stationProblem(model, station)).find(Boolean);

  if (problem) throw new Error(problem);

  onStep?.('Coupling the galvo head');
  await connectGalvoHead(module);
  await setAir(true);

  try {
    let from: GalvoPoint | undefined;

    for (const [i, station] of stations.entries()) {
      onStep?.(`Square ${i + 1}/${stations.length}: moving the gantry`);
      await moveGantry(station, { fixBacklash, from, model });
      from = station;
      onStep?.(`Square ${i + 1}/${stations.length}: marking`);
      await galvoFrame({ config, module, power, size: STITCH_SQUARE_MM, speed });
      await awaitGalvoResult('Stitch test');
    }

    await assertStillAuthorised();
  } finally {
    await setAir(false).catch((error) => console.warn('Galvo calibration: air assist off failed', error));
  }
};
