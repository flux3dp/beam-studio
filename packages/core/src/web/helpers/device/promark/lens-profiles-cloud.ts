import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { readCloudConfig, updateCloudConfigs } from '@core/helpers/api/flux-id/cloudConfig';
import type { LensProfile, LensProfileKey, PromarkInfo, PromarkStore } from '@core/interfaces/Promark';

import type { LensParameters } from './lens-profiles';
import { isSameLensParameters, isSameLensProfileKey, withDefaultParameters } from './lens-profiles';

/** What the cloud holds for one machine: the profiles, the legacy set older versions write, or both. */
export interface LensCloudData {
  defaultKey?: LensProfileKey;
  legacy?: LensParameters;
  /** undefined when the cloud has no profiles at all, only the legacy set */
  profiles?: LensProfile[];
}

/** Reads both cloud keys without asking; reading needs no login. Resolves null when the cloud has neither. */
export const readLensCloudData = async (hash: string | undefined, serial: string): Promise<LensCloudData | null> => {
  const options = { askUser: false };
  const [profiles, legacy] = await Promise.all([
    readCloudConfig({ hash, key: 'promarkLensProfiles', serialNumber: serial }, undefined, options),
    readCloudConfig({ hash, key: 'promarkLens', serialNumber: serial }, undefined, options),
  ]);

  if (!profiles?.profiles && !legacy) return null;

  return { defaultKey: profiles?.defaultKey, legacy: legacy ?? undefined, profiles: profiles?.profiles };
};

/**
 * The cloud copy of one lens: the profile with the same key, or the legacy set when the cloud has no
 * profiles, since the legacy set applies to every lens.
 */
export const getCloudLensParameters = (cloud: LensCloudData, key: LensProfileKey): LensParameters | undefined => {
  if (!cloud.profiles) return cloud.legacy;

  return cloud.profiles.find((p) => isSameLensProfileKey(p, key));
};

export interface LensCloudDifferences {
  defaultKey: boolean;
  keys: LensProfileKey[];
  legacy: boolean;
}

/**
 * Where the cloud differs from what is saved locally. A lens only saved locally is not a difference,
 * since there is nothing in the cloud to use instead.
 */
export const getLensCloudDifferences = (
  cloud: LensCloudData,
  store: PromarkStore,
  keys: LensProfileKey[],
  getLocal: (key: LensProfileKey) => LensParameters,
): LensCloudDifferences => {
  if (!cloud.profiles) {
    return {
      defaultKey: false,
      keys: [],
      legacy: Boolean(cloud.legacy) && !isSameLensParameters(cloud.legacy!, store),
    };
  }

  const { defaultKey, profiles } = cloud;

  return {
    defaultKey:
      Boolean(defaultKey) && !(store.defaultLensProfile && isSameLensProfileKey(defaultKey!, store.defaultLensProfile)),
    keys: keys.filter((key) => {
      const profile = profiles.find((p) => isSameLensProfileKey(p, key));

      return profile && !isSameLensParameters(profile, getLocal(key));
    }),
    legacy: false,
  };
};

export const hasLensCloudDifferences = ({ defaultKey, keys, legacy }: LensCloudDifferences): boolean =>
  defaultKey || legacy || keys.length > 0;

/**
 * Uploads the profiles and laser source, plus the default profile in the legacy format when
 * `includeLegacy`, after one confirmation. Resolves whether everything was uploaded.
 */
export const uploadLensCloudData = async ({
  hash,
  includeLegacy,
  info,
  model,
  serial,
  store,
}: {
  hash?: string;
  includeLegacy: boolean;
  info: PromarkInfo;
  model: WorkAreaModel;
  serial: string;
  store: PromarkStore;
}): Promise<boolean> => {
  const legacy = withDefaultParameters(store);

  return updateCloudConfigs({
    hash,
    items: [
      {
        data: { defaultKey: store.defaultLensProfile, profiles: store.lensProfiles ?? [] },
        key: 'promarkLensProfiles',
      },
      { data: info, key: 'promarkLaserSource' },
      ...(includeLegacy ? [{ data: legacy, key: 'promarkLens' as const }] : []),
    ],
    model,
    serialNumber: serial,
  });
};
