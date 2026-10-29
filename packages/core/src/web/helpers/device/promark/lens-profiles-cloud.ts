import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { readCloudConfigs, updateCloudConfigs } from '@core/helpers/api/flux-id/cloudConfig';
import type { LensProfile, LensProfileKey, PromarkInfo, PromarkStore } from '@core/interfaces/Promark';

import type { LensParameters, ResolvedLensProfile } from './lens-profiles';
import { isSameLensParameters, isSameLensProfileKey } from './lens-profiles';

/**
 * What the cloud holds for one machine. `profiles` is written by this version only; `legacy` is
 * written by versions before lens profiles only, and matters here only to upgrade a computer that
 * has no profile yet.
 */
export interface LensCloudData {
  defaultKey?: LensProfileKey;
  legacy?: LensParameters;
  /** undefined when the cloud has no profiles at all */
  profiles?: LensProfile[];
}

/** Reads both keys in one request without asking; reading needs no login. Resolves null when the cloud has neither. */
export const readLensCloudData = async (hash: string | undefined, serial: string): Promise<LensCloudData | null> => {
  const configs = await readCloudConfigs({
    hash,
    keys: ['promarkLensProfiles', 'promarkLens'],
    serialNumber: serial,
  });
  const profiles = configs?.promarkLensProfiles;
  const legacy = configs?.promarkLens;

  if (!profiles?.profiles && !legacy) return null;

  return { defaultKey: profiles?.defaultKey, legacy, profiles: profiles?.profiles };
};

/** Whether the cloud data takes part in comparing: profiles always, the legacy set only while nothing local has profiles. */
const usesLegacy = (cloud: LensCloudData, store: PromarkStore): boolean =>
  !cloud.profiles && Boolean(cloud.legacy) && !store.lensProfiles?.length;

/**
 * The cloud copy of one lens: the profile with the same key; or, when the cloud has no profiles and
 * neither does `store`, the legacy set, which applies to every lens.
 */
export const getCloudLensParameters = (
  cloud: LensCloudData,
  store: PromarkStore,
  key: LensProfileKey,
): LensParameters | undefined => {
  if (cloud.profiles) return cloud.profiles.find((p) => isSameLensProfileKey(p, key));

  return usesLegacy(cloud, store) ? cloud.legacy : undefined;
};

export interface LensCloudDifferences {
  defaultKey: boolean;
  keys: LensProfileKey[];
  legacy: boolean;
}

/**
 * Where the cloud differs from what is saved locally. A lens only saved locally is not a difference,
 * since there is nothing in the cloud to use instead. A lens only saved in the cloud is one even
 * when its values match what this computer falls back to: saved here, it stops following the default.
 */
export const getLensCloudDifferences = (
  cloud: LensCloudData,
  store: PromarkStore,
  keys: LensProfileKey[],
  getLocal: (key: LensProfileKey) => ResolvedLensProfile,
): LensCloudDifferences => {
  if (!cloud.profiles) {
    return {
      defaultKey: false,
      keys: [],
      legacy: usesLegacy(cloud, store) && !isSameLensParameters(cloud.legacy!, store),
    };
  }

  const { defaultKey, profiles } = cloud;
  // a default saved under another laser type counts as no default, on either side
  const isAvailable = (key?: LensProfileKey): key is LensProfileKey =>
    Boolean(key) && keys.some((k) => isSameLensProfileKey(k, key!));
  const localDefault = isAvailable(store.defaultLensProfile) ? store.defaultLensProfile : undefined;

  return {
    defaultKey: isAvailable(defaultKey) && !(localDefault && isSameLensProfileKey(defaultKey, localDefault)),
    keys: keys.filter((key) => {
      const profile = profiles.find((p) => isSameLensProfileKey(p, key));

      if (!profile) return false;

      const local = getLocal(key);

      return local.source !== 'exact' || !isSameLensParameters(profile, local);
    }),
    legacy: false,
  };
};

export const hasLensCloudDifferences = ({ defaultKey, keys, legacy }: LensCloudDifferences): boolean =>
  defaultKey || legacy || keys.length > 0;

/**
 * Uploads the profiles and laser source in one request after one confirmation. The cloud legacy set
 * belongs to older versions and is not touched. Resolves whether it succeeded.
 */
export const uploadLensCloudData = async ({
  hash,
  info,
  model,
  serial,
  store,
}: {
  hash?: string;
  info: PromarkInfo;
  model: WorkAreaModel;
  serial: string;
  store: PromarkStore;
}): Promise<boolean> =>
  updateCloudConfigs({
    configs: {
      promarkLaserSource: info,
      promarkLensProfiles: { defaultKey: store.defaultLensProfile, profiles: store.lensProfiles ?? [] },
    },
    hash,
    model,
    serialNumber: serial,
  });
