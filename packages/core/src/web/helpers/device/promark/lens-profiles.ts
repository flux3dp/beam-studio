import { promarkModels } from '@core/app/actions/beambox/constant';
import {
  defaultField,
  defaultGalvoParameters,
  defaultRedLight,
  getDefaultPromarkWorkarea,
  getPromarkWorkareaOptions,
  LaserType,
  UV_INNER_ENGRAVING_WORKAREA,
} from '@core/app/constants/promark-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { isInnerEngravingActive } from '@core/helpers/addOn/innerEngraving';
import type {
  Field,
  GalvoParameters,
  LensProfile,
  LensProfileKey,
  PromarkInfo,
  PromarkStore,
  RedDot,
} from '@core/interfaces/Promark';

import promarkDataStore from './promark-data-store';

/**
 * Which set of saved parameters was picked for a lens:
 * - `exact`: a profile saved for this work area and engraving mode
 * - `default`: the profile marked as the default
 * - `legacy`: the single set saved before profiles existed, which has no work area
 * - `fallback`: nothing saved, factory values
 */
export type LensProfileSource = 'default' | 'exact' | 'fallback' | 'legacy';

export interface LensParameters {
  field?: Field;
  galvoParameters?: GalvoParameters;
  redDot?: RedDot;
}

export type FullLensParameters = Required<LensParameters>;

export interface ResolvedLensProfile extends LensParameters {
  key: LensProfileKey;
  source: LensProfileSource;
}

/** Inner engraving exists only on the 70 mm UV lens, so any other key is a flat one. */
export const normalizeLensProfileKey = (laserType: LaserType, key: LensProfileKey): LensProfileKey => ({
  innerEngraving: key.innerEngraving && laserType === LaserType.UV && key.workarea === UV_INNER_ENGRAVING_WORKAREA,
  workarea: key.workarea,
});

export const isSameLensProfileKey = (a: LensProfileKey, b: LensProfileKey): boolean =>
  a.workarea === b.workarea && a.innerEngraving === b.innerEngraving;

export const getLensProfileId = ({ innerEngraving, workarea }: LensProfileKey): string =>
  `${workarea}-${innerEngraving ? 'inner' : 'flat'}`;

/** Every lens a laser type can have, flat before inner engraving for each work area. */
export const getLensProfileKeys = (laserType: LaserType): LensProfileKey[] =>
  getPromarkWorkareaOptions(laserType).flatMap((workarea) =>
    [false, true]
      .map((innerEngraving) => normalizeLensProfileKey(laserType, { innerEngraving, workarea }))
      .filter((key, i) => i === 0 || key.innerEngraving),
  );

/** The lens the current document asks for; a non-Promark document falls back to the laser type's default. */
export const getDocumentLensProfileKey = (info: PromarkInfo): LensProfileKey => {
  const { workarea } = useDocumentStore.getState();
  const options = getPromarkWorkareaOptions(info.laserType);
  const documentWidth = promarkModels.has(workarea) ? getWorkarea(workarea).width : undefined;
  const width = documentWidth && options.includes(documentWidth) ? documentWidth : getDefaultPromarkWorkarea(info);

  return normalizeLensProfileKey(info.laserType, { innerEngraving: isInnerEngravingActive(), workarea: width });
};

const hasLegacyParameters = ({ field, galvoParameters, redDot }: LensParameters): boolean =>
  Boolean(field || galvoParameters || redDot);

const pickParameters = ({ field, galvoParameters, redDot }: LensParameters): LensParameters => ({
  field,
  galvoParameters,
  redDot,
});

const findProfile = (profiles: LensProfile[] | undefined, key: LensProfileKey): LensProfile | undefined =>
  profiles?.find((p) => isSameLensProfileKey(p, key));

/** Picks the parameters for `key`: an exact profile, the default profile, the legacy set, then nothing. */
export const resolveLensProfile = (store: PromarkStore, key: LensProfileKey): ResolvedLensProfile => {
  const profile = findProfile(store.lensProfiles, key);

  if (profile) return { ...pickParameters(profile), key, source: 'exact' };

  const defaultProfile = store.defaultLensProfile && findProfile(store.lensProfiles, store.defaultLensProfile);

  if (defaultProfile) return { ...pickParameters(defaultProfile), key, source: 'default' };

  if (hasLegacyParameters(store)) return { ...pickParameters(store), key, source: 'legacy' };

  return { key, source: 'fallback' };
};

/** Fills what a profile leaves out with factory values. */
export const withDefaultParameters = ({ field, galvoParameters, redDot }: LensParameters): FullLensParameters => ({
  field: { ...defaultField, ...field },
  galvoParameters: {
    x: { ...defaultGalvoParameters.x, ...galvoParameters?.x },
    y: { ...defaultGalvoParameters.y, ...galvoParameters?.y },
  },
  redDot: { ...defaultRedLight, ...redDot },
});

const isSameRecord = (a: object, b: object): boolean => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);

  return [...keys].every((key) => a[key as keyof typeof a] === b[key as keyof typeof b]);
};

/** Compares every parameter, whatever order the fields were stored in. */
export const isSameLensParameters = (a: LensParameters, b: LensParameters): boolean => {
  const fullA = withDefaultParameters(a);
  const fullB = withDefaultParameters(b);

  return (
    isSameRecord(fullA.field, fullB.field) &&
    isSameRecord(fullA.galvoParameters.x, fullB.galvoParameters.x) &&
    isSameRecord(fullA.galvoParameters.y, fullB.galvoParameters.y) &&
    isSameRecord(fullA.redDot, fullB.redDot)
  );
};

/** The parameters saved for `serial` and `key`. */
export const getLensProfile = (serial: string, key: LensProfileKey): ResolvedLensProfile =>
  resolveLensProfile(promarkDataStore.get(serial), key);

/** The parameters to apply to `serial` for the current document. */
export const getDocumentLensProfile = (serial: string, info?: PromarkInfo): ResolvedLensProfile => {
  const store = promarkDataStore.get(serial);
  const promarkInfo = info ?? store.info ?? { laserType: LaserType.Desktop, watt: 20 };

  return resolveLensProfile(store, getDocumentLensProfileKey(promarkInfo));
};

/**
 * Merges `profiles` into `store`, replacing those with the same key, and marks `defaultKey` as the
 * default. The legacy set becomes a copy of the default profile, which is what older versions read.
 */
export const mergeLensProfiles = (
  store: PromarkStore,
  profiles: LensProfile[],
  defaultKey: LensProfileKey,
): PromarkStore => {
  const lensProfiles = [
    ...(store.lensProfiles ?? []).filter((p) => !profiles.some((saved) => isSameLensProfileKey(p, saved))),
    ...profiles,
  ];
  const defaultProfile = findProfile(lensProfiles, defaultKey);
  const legacy = defaultProfile ? withDefaultParameters(defaultProfile) : pickParameters(store);

  return { ...store, ...legacy, defaultLensProfile: defaultKey, lensProfiles };
};

/** Saves `profiles` for `serial` (see `mergeLensProfiles`) and returns the updated store. */
export const saveLensProfiles = (serial: string, profiles: LensProfile[], defaultKey: LensProfileKey): PromarkStore => {
  const store = mergeLensProfiles(promarkDataStore.get(serial), profiles, defaultKey);
  const { defaultLensProfile, field, galvoParameters, lensProfiles, redDot } = store;

  promarkDataStore.update(serial, { defaultLensProfile, field, galvoParameters, lensProfiles, redDot });

  return store;
};
