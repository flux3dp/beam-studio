import deviceConstants from '@core/app/constants/device-constants';
import { defaultField, defaultGalvoParameters } from '@core/app/constants/promark-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { Field, GalvoParameters, LensProfileKey } from '@core/interfaces/Promark';

import applyRedDot from './apply-red-dot';
import { getDocumentLensProfile, getLensProfile } from './lens-profiles';

const { status } = deviceConstants;

/**
 * Statuses in which the machine is carrying out a job (framing included). Swiftray writes a new lens
 * to the board at once, and the rest of a running job is converted with it, so a lens applied now
 * would distort the job from that point on (e.g. a new tab with another work area connecting to the
 * machine mid-job). The job was started with the lens it needs; the next job brings its own.
 */
const JOB_IN_PROGRESS_STATUSES: ReadonlySet<number> = new Set([
  status.INIT, // Swiftray: running, the first list still being prepared
  status.STARTING,
  status.RESUME_TO_STARTING,
  status.RUNNING,
  status.RESUME_TO_RUNNING,
  status.PAUSED,
  status.PAUSED_FROM_STARTING,
  status.PAUSING_FROM_STARTING,
  status.PAUSED_FROM_RUNNING,
  status.PAUSING_FROM_RUNNING,
  status.COMPLETING,
  status.RECONNECTING,
]);

export const isJobInProgress = (statusId: number): boolean => JOB_IN_PROGRESS_STATUSES.has(statusId);

interface LensTarget {
  setField: (worksize: number, field?: Field) => Promise<unknown>;
  setGalvoParameters: (data: GalvoParameters) => Promise<unknown>;
}

export interface ApplyLensOptions {
  /** the lens a task was generated for; the current document's lens when left out */
  key?: LensProfileKey;
  /** red light: adds the red dot correction, so the light lands where the laser will mark */
  redDot?: boolean;
}

/**
 * Sends the lens parameters of one lens to the machine. Whatever moves the galvo calls this right
 * before it starts (a job, a red light preview, a test mark) instead of relying on what is on the
 * machine: the backend keeps the lens of the last sender, which can be another tab, another lens of
 * the same document, or a red light preview that added its red dot correction.
 */
export const applyLensProfile = async (
  target: LensTarget,
  { model, serial }: Pick<IDeviceInfo, 'model' | 'serial'>,
  { key, redDot = false }: ApplyLensOptions = {},
): Promise<void> => {
  const profile = key ? getLensProfile(serial, key) : getDocumentLensProfile(serial);
  const width = key ? key.workarea : getWorkarea(model).width;
  let { field = defaultField, galvoParameters = defaultGalvoParameters } = profile;

  if (redDot && profile.redDot) {
    ({ field, galvoParameters } = applyRedDot(profile.redDot, field, galvoParameters));
  }

  // Always sent, defaults included: the backend keeps whatever the previous machine set, and the
  // correction also carries the laser source it is for, so a machine without local calibration
  // data would otherwise run with another machine's lens and source.
  await target.setField(width, field);
  console.log('Applying lens profile', profile.key, profile.source, redDot ? 'with red dot' : '', galvoParameters);
  await target.setGalvoParameters(galvoParameters);
};

/** Applies the lens parameters the current document asks for, picked by `getDocumentLensProfile`. */
export const applyDocumentLensProfile = (
  target: LensTarget,
  device: Pick<IDeviceInfo, 'model' | 'serial'>,
): Promise<void> => applyLensProfile(target, device);
