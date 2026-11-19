import deviceConstants from '@core/app/constants/device-constants';
import { defaultField, defaultGalvoParameters } from '@core/app/constants/promark-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { Field, GalvoParameters } from '@core/interfaces/Promark';

import { getDocumentLensProfile } from './lens-profiles';

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

/** Applies the lens parameters the current document asks for, picked by `getDocumentLensProfile`. */
export const applyDocumentLensProfile = async (
  target: LensTarget,
  { model, serial }: Pick<IDeviceInfo, 'model' | 'serial'>,
): Promise<void> => {
  const {
    field = defaultField,
    galvoParameters = defaultGalvoParameters,
    key,
    source,
  } = getDocumentLensProfile(serial);
  const { width } = getWorkarea(model);

  // Always sent, defaults included: the backend keeps whatever the previous machine set, and the
  // correction also carries the laser source it is for, so a machine without local calibration
  // data would otherwise run with another machine's lens and source.
  await target.setField(width, field);
  console.log('Applying lens profile', key, source, galvoParameters);
  await target.setGalvoParameters(galvoParameters);
};
