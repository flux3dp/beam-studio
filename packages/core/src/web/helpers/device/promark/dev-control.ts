import { controlConfig, getPromarkSourceDefaults, LaserType } from '@core/app/constants/promark-constants';
import { uvPowerToFrequency } from '@core/helpers/layer/uvPowerFrequency';
import type { GalvoParameters, PromarkInfo } from '@core/interfaces/Promark';

export interface PulseParameters {
  /** kHz */
  frequency: number;
  /** % */
  power: number;
  /** ns, MOPA only */
  pulseWidth?: number;
  /** us */
  time: number;
  /** field size the position is given in, mm */
  width: number;
  /** canvas coordinates, mm from the top left corner of the field */
  x: number;
  y: number;
}

/**
 * Frequency and pulse width of a pulse at `power` % on the machine being set up, from its laser source
 * rather than the current document. UV sets its output through the frequency (it ignores the power
 * value, and anything at or below 40kHz is full output), so its frequency follows the power.
 */
export const getPulseLaserSettings = (
  info: PromarkInfo,
  power: number,
): Pick<PulseParameters, 'frequency' | 'pulseWidth'> => {
  const { frequency, pulseWidth } = getPromarkSourceDefaults(info);

  if (info.laserType === LaserType.UV) {
    return { frequency: Number(uvPowerToFrequency(power).toFixed(2)), pulseWidth };
  }

  return { frequency, pulseWidth: info.laserType === LaserType.MOPA ? pulseWidth : undefined };
};

/** mm, see getJumpLines */
const APPROACH_OFFSET = 0.1;

/**
 * Jumps to a point that is a little off the target, then to the target. The board skips a jump to
 * the coordinates it already stands at, even when new lens parameters would put them somewhere else,
 * so a jump straight to the same coordinates would not move the galvo. The approach point is offset
 * towards the field centre to stay inside the field.
 */
const getJumpLines = ({ width, x, y }: Pick<PulseParameters, 'width' | 'x' | 'y'>): string[] => {
  const approach = (value: number) => Number((value + (value < width / 2 ? 1 : -1) * APPROACH_OFFSET).toFixed(3));
  const feedrate = controlConfig.travelSpeed * 60;

  return [`G1F${feedrate}X${approach(x)}Y${approach(y)}S0`, `G1F${feedrate}X${x}Y${y}S0`];
};

/**
 * G-code of a task that fires one pulse at a position, written the way Swiftray's generator writes
 * a dotting section: jump there with S0, then a power-only line that fires for T microseconds.
 */
export const generatePulseTask = ({ frequency, power, pulseWidth, time, width, x, y }: PulseParameters): string =>
  [
    'M104', // not framing: adjustZAxis / adjustAAxis leave the board in red light mode
    'M5',
    'G90',
    `W${width}`,
    'M3S0',
    `Q${frequency}`,
    ...(pulseWidth ? [`P${pulseWidth}`] : []),
    `T${Math.round(time)}`,
    ...getJumpLines({ width, x, y }),
    `S${Math.round(power * 10)}`,
    'T0',
    'M2',
    '',
  ].join('\n');

/**
 * G-code of a task that only jumps the galvo to a position with the red light on. Swiftray turns the
 * red light on or off with the laser mode it sets at every M3 (`lcs_set_laser_mode(type, is_framing)`),
 * and M103 is what sets the framing flag, so this also lights the MOPA red light up after it went off.
 */
export const generateMoveTask = ({ width, x, y }: Pick<PulseParameters, 'width' | 'x' | 'y'>): string =>
  ['M103', 'M5', 'G90', `W${width}`, 'M3S0', ...getJumpLines({ width, x, y }), 'M2', ''].join('\n');

/**
 * New galvo scales from the measured size of a marked frame that should be `width` mm on both sides.
 * `measuredX` / `measuredY` are along the canvas axes. The galvo axes are swapped against the
 * canvas, so the error measured along canvas X corrects the Y scale and vice versa.
 */
export const calculateGalvoScale = (
  galvoParameters: GalvoParameters,
  { measuredX, measuredY, width }: { measuredX: number; measuredY: number; width: number },
): GalvoParameters => {
  const round = (value: number) => Math.round(value * 1000) / 1000;
  const { x, y } = galvoParameters;

  return {
    x: { ...x, scale: measuredY > 0 ? round((x.scale * width) / measuredY) : x.scale },
    y: { ...y, scale: measuredX > 0 ? round((y.scale * width) / measuredX) : y.scale },
  };
};
