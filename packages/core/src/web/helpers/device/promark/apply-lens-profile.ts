import { defaultField, defaultGalvoParameters } from '@core/app/constants/promark-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { Field, GalvoParameters } from '@core/interfaces/Promark';

import { getDocumentLensProfile } from './lens-profiles';

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
