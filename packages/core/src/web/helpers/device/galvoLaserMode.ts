import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { describeControlSocketError } from '@core/helpers/device/controlSocketError';
import { resetGalvoGoto } from '@core/helpers/device/galvoExec';
import deviceMaster from '@core/helpers/device-master';
import isWeb from '@core/helpers/is-web';
import type { GalvoLaserMode } from '@core/interfaces/IControlSocket';

import type { GalvoModule } from './galvoConfig';

/**
 * Which laser each galvo head is: the head is fed by whichever laser the machine routes to it, and
 * `galvo_mode` is the one that connects the linkage and points the CO2 beam at the galvo.
 * `default_mode` disconnects it and hands the beam back to the gantry.
 */
export const galvoLaserModes = {
  [LayerModule.GALVO_CO2]: 'galvo_mode',
  [LayerModule.GALVO_MOPA]: 'mopa_mode',
} as const satisfies Record<GalvoModule, GalvoLaserMode>;

/** Back to plain gantry cutting, with the galvo parked. */
export const DEFAULT_LASER_MODE: GalvoLaserMode = 'default_mode';

const POLL_INTERVAL = 500;
/** The sequence homes, crosses the bed and throws the linkage; 3 minutes is generous for that. */
const POLL_TIMEOUT = 180000;

/**
 * Put the machine into one laser mode and wait for it to get there.
 *
 * The mode command only acknowledges that the sequence started, so completion is polled with
 * `get_result`. Nothing is pushed when it finishes -- a machine that never answers `ok` would hang
 * here forever, hence the timeout.
 *
 * The caller owns the task mode: enter it once, switch as often as needed, then leave.
 */
export const applyGalvoLaserMode = async (mode: GalvoLaserMode): Promise<void> => {
  const started = await deviceMaster.setGalvoLaserMode(mode);

  if (!started?.startsWith('ok')) throw new Error(`Failed to start ${mode}: ${started ?? 'no response'}`);

  const deadline = Date.now() + POLL_TIMEOUT;

  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));

    const result = await deviceMaster.getControlTaskResult();

    if (result?.startsWith('ok')) return;

    if (result && !result.startsWith('wait')) throw new Error(`${mode} failed: ${result}`);

    if (Date.now() > deadline) {
      // Leaves the machine mid-sequence, but a stuck task rejects everything that follows.
      await deviceMaster.stopControlTask().catch(() => {});
      throw new Error(`${mode} timed out`);
    }
  }
};

/**
 * FLUXGhost answers "Unknown task: control_task" when it is too old to reach the task, which the
 * machine itself already has.
 *
 * FLUXGhost is never named to the operator -- it appears in no translation -- so the message talks
 * about the two things they do recognise: Beam Studio, which carries it on the desktop, and
 * machine firmware, which carries it online. There the online version borrows it from whichever
 * machine is set as the connection point, and that need not be the HEXA II being driven; naming
 * both addresses says which machine is behind without having to explain the arrangement.
 *
 * TODO: dev only, untranslated like the rest of this dialog. Needs i18n before release.
 */
const describeMissingTaskSupport = (message: string): string => {
  const detail = `(${message})`;

  if (!isWeb()) return `This version of Beam Studio cannot connect the galvo head. Please update it. ${detail}`;

  const host = localStorage.getItem('host');
  const deviceIp = deviceMaster.currentDevice?.info.ipaddr;

  if (host && deviceIp && host !== deviceIp) {
    return `The online version reaches machines through ${host}, and that machine's firmware is too old to connect the galvo head. Set the online version up against this machine (${deviceIp}) instead, or use the desktop app. ${detail}`;
  }

  return `This machine's firmware is too old to connect the galvo head. Please update it, or use the desktop app. ${detail}`;
};

/**
 * Connect the given galvo head to the nozzle and route the laser to it, and **stay in the control
 * task mode**, because that is where the galvo commands live.
 *
 * Connecting is a mechanical move of tens of seconds -- home, cross the travel, home again -- so
 * it is deliberately not folded into each galvo command. Enter once, switch once, then drive the
 * card as often as needed; releaseGalvoControl closes it.
 */
/**
 * Hold the control task, entering it only if it is not already held.
 *
 * `task control_task` is not a command the task itself answers, so asking twice falls through
 * unhandled and the wait for a reply runs out. Every button calls this, because any of them may be
 * the first one pressed.
 */
export const enterGalvoControl = async (): Promise<void> => {
  if (deviceMaster.currentControlMode === 'control_task') return;

  try {
    await deviceMaster.enterControlTaskMode();
  } catch (error) {
    const message = describeControlSocketError(error);

    if (message.includes('Unknown task')) throw new Error(describeMissingTaskSupport(message));

    throw new Error(message);
  }
};

/**
 * Connect the given galvo head to the nozzle and route the laser to it.
 *
 * Connecting is a mechanical move of tens of seconds -- home, cross the travel, home again -- but
 * only when the head is not already there: the machine skips the whole of it when the limit
 * switches say the head has arrived, so asking again when it has costs nothing and moves nothing.
 * That is what lets every button ask, rather than making the operator remember to.
 */
export const connectGalvoHead = async (module: GalvoModule): Promise<void> => {
  await enterGalvoControl();
  await applyGalvoLaserMode(galvoLaserModes[module]);
};

/** Park the head again, leaving the control task held. */
export const disconnectGalvoHead = async (): Promise<void> => {
  await enterGalvoControl();
  await applyGalvoLaserMode(DEFAULT_LASER_MODE);
};

/**
 * Leave the control task mode, stopping a preview loop on the way out.
 *
 * The task's own exit puts the red light back the way the machine's setting says, so nothing here
 * has to. Both steps are best effort: this runs while a dialog is closing, and a failure to tidy
 * up must not stop it closing.
 */
export const releaseGalvoControl = async (): Promise<void> => {
  resetGalvoGoto();
  await deviceMaster.galvoStop().catch(() => {});
  await deviceMaster.endSubTask().catch(() => {});
};
