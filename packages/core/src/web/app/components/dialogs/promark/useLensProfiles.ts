import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import alertConstants from '@core/app/constants/alert-constants';
import { LaserType } from '@core/app/constants/promark-constants';
import type { FullLensParameters, LensProfileSource } from '@core/helpers/device/promark/lens-profiles';
import {
  getLensProfileId,
  getLensProfileKeys,
  isSameLensParameters,
  isSameLensProfileKey,
  resolveLensProfile,
  saveLensProfiles,
  withDefaultParameters,
} from '@core/helpers/device/promark/lens-profiles';
import type { LensCloudData, LensCloudDifferences } from '@core/helpers/device/promark/lens-profiles-cloud';
import {
  getCloudLensParameters,
  getLensCloudDifferences,
  hasLensCloudDifferences,
  readLensCloudData,
} from '@core/helpers/device/promark/lens-profiles-cloud';
import type { LensParameterIssue, LensParameterIssues } from '@core/helpers/device/promark/validate-lens-parameters';
import {
  getLensParameterWarnings,
  hasLensParameterErrors,
  validateLensParameters,
} from '@core/helpers/device/promark/validate-lens-parameters';
import i18n from '@core/helpers/i18n';
import type { ILang } from '@core/interfaces/ILang';
import type {
  Field,
  GalvoParameters,
  LensProfileKey,
  PromarkInfo,
  PromarkStore,
  RedDot,
} from '@core/interfaces/Promark';

import { formatLensParameterValue, getLensParameterLabel } from './lensParameterLabels';

export type LensProfileStatus =
  | { inherited?: Extract<LensProfileSource, 'default' | 'legacy'>; state: 'saved' }
  | { state: 'edited' }
  | { state: 'unset' };

/** e.g. "70 mm・Flat"; only UV has engraving modes, so other laser types show the work area alone */
export const describeLensProfileKey = (
  { innerEngraving, workarea }: LensProfileKey,
  laserType: LaserType,
  t: ILang['promark_settings'],
): string =>
  laserType === LaserType.UV ? `${workarea} mm・${innerEngraving ? t.inner_engraving : t.flat}` : `${workarea} mm`;

const describeDifferences = (
  { defaultKey, keys, legacy }: LensCloudDifferences,
  laserType: LaserType,
  t: ILang['promark_settings'],
) =>
  [
    ...keys.map((key) => describeLensProfileKey(key, laserType, t)),
    ...(defaultKey ? [t.lens_default_profile] : []),
    ...(legacy ? [t.lens_legacy_parameters] : []),
  ].join('、');

const askUseCloud = (differences: LensCloudDifferences, laserType: LaserType): Promise<boolean> =>
  new Promise((resolve) => {
    const t = i18n.lang.promark_settings;

    alertCaller.popUp({
      buttonType: alertConstants.YES_NO,
      message: sprintf(t.cloud_lens_differs, describeDifferences(differences, laserType, t)),
      onClose: () => resolve(false),
      onNo: () => resolve(false),
      onYes: () => resolve(true),
    });
  });

export interface LensParameterWarning extends LensParameterIssue {
  key: LensProfileKey;
}

/** Lists the warnings once; resolves whether to save anyway. */
export const confirmLensWarnings = (
  warnings: LensParameterWarning[],
  laserType: LaserType,
  isInch: boolean,
): Promise<boolean> => {
  if (warnings.length === 0) return Promise.resolve(true);

  const t = i18n.lang.promark_settings;
  const lines = warnings.map(
    ({ key, path, range, value }) =>
      `${describeLensProfileKey(key, laserType, t)}：${getLensParameterLabel(path, t)} ${formatLensParameterValue(path, value, isInch)}（${sprintf(
        t.range_warning,
        `${formatLensParameterValue(path, range[0], isInch)} ～ ${formatLensParameterValue(path, range[1], isInch)}`,
      )}）`,
  );

  return new Promise((resolve) => {
    alertCaller.popUp({
      buttonType: alertConstants.CONFIRM_CANCEL,
      message: sprintf(t.lens_warning_confirm, lines.join('\n')),
      messageIcon: 'warning',
      onCancel: () => resolve(false),
      onClose: () => resolve(false),
      onConfirm: () => resolve(true),
    });
  });
};

interface UseLensProfilesOptions {
  hashedSerial?: string;
  info: PromarkInfo;
  /** the default when none is saved yet, e.g. the work area picked during machine initialization */
  initialDefaultKey?: LensProfileKey;
  initialKey: LensProfileKey;
  serial: string;
  store: PromarkStore;
}

/**
 * Edits the lens profiles of one machine: the profile on screen, unsaved edits of the others, the
 * default mark, and how each compares with the cloud copy. Nothing is written until `save`.
 */
export const useLensProfiles = ({
  hashedSerial,
  info,
  initialDefaultKey,
  initialKey,
  serial,
  store,
}: UseLensProfilesOptions) => {
  // the saved profiles; the cloud legacy set may replace the legacy part after the dialog opens
  const [base, setBase] = useState<PromarkStore>(store);
  const [lensKey, setLensKey] = useState<LensProfileKey>(initialKey);
  // values shown for each visited lens, keyed by `getLensProfileId`
  const [drafts, setDrafts] = useState<Record<string, FullLensParameters>>({});
  const [defaultKey, setDefaultKey] = useState<LensProfileKey | undefined>(
    initialDefaultKey ?? store.defaultLensProfile,
  );
  const [cloud, setCloud] = useState<LensCloudData | null>(null);
  // true once the cloud copy was read and, if it differed, the user answered
  const [isCloudChecked, setIsCloudChecked] = useState(false);
  const keys = useMemo(() => getLensProfileKeys(info.laserType), [info.laserType]);

  const getSaved = useCallback(
    (key: LensProfileKey): FullLensParameters => withDefaultParameters(resolveLensProfile(base, key)),
    [base],
  );
  const getCurrent = useCallback(
    (key: LensProfileKey): FullLensParameters => drafts[getLensProfileId(key)] ?? getSaved(key),
    [drafts, getSaved],
  );
  const isEdited = useCallback(
    (key: LensProfileKey): boolean => {
      const draft = drafts[getLensProfileId(key)];

      return Boolean(draft) && !isSameLensParameters(draft, getSaved(key));
    },
    [drafts, getSaved],
  );

  useEffect(() => {
    let cancelled = false;

    const checkCloud = async () => {
      const data = await readLensCloudData(hashedSerial, serial);

      if (cancelled) return;

      setCloud(data);

      if (data) {
        const differences = getLensCloudDifferences(data, store, keys, (key) =>
          withDefaultParameters(resolveLensProfile(store, key)),
        );

        if (hasLensCloudDifferences(differences) && (await askUseCloud(differences, info.laserType)) && !cancelled) {
          if (differences.legacy && data.legacy) {
            setBase((prev) => ({ ...prev, ...withDefaultParameters(data.legacy!) }));
          }

          setDrafts((prev) => {
            const next = { ...prev };

            differences.keys.forEach((key) => {
              next[getLensProfileId(key)] = withDefaultParameters(getCloudLensParameters(data, key)!);
            });

            return next;
          });

          if (differences.defaultKey) setDefaultKey(data.defaultKey);
        }
      }

      if (!cancelled) setIsCloudChecked(true);
    };

    checkCloud();

    return () => {
      cancelled = true;
    };
  }, [hashedSerial, keys, serial, store]);

  const updateCurrent = useCallback(
    <K extends keyof FullLensParameters>(name: K, action: SetStateAction<FullLensParameters[K]>) => {
      const id = getLensProfileId(lensKey);

      setDrafts((prev) => {
        const current = prev[id] ?? getSaved(lensKey);
        const value =
          typeof action === 'function'
            ? (action as (prevValue: FullLensParameters[K]) => FullLensParameters[K])(current[name])
            : action;

        return { ...prev, [id]: { ...current, [name]: value } };
      });
    },
    [getSaved, lensKey],
  );

  const setField = useCallback<Dispatch<SetStateAction<Field>>>((a) => updateCurrent('field', a), [updateCurrent]);
  const setGalvoParameters = useCallback<Dispatch<SetStateAction<GalvoParameters>>>(
    (a) => updateCurrent('galvoParameters', a),
    [updateCurrent],
  );
  const setRedDot = useCallback<Dispatch<SetStateAction<RedDot>>>((a) => updateCurrent('redDot', a), [updateCurrent]);

  const effectiveDefaultKey = defaultKey ?? lensKey;

  const getStatus = (key: LensProfileKey): LensProfileStatus => {
    if (isEdited(key)) return { state: 'edited' };

    const { source } = resolveLensProfile(base, key);

    if (source === 'fallback') return { state: 'unset' };

    return { inherited: source === 'exact' ? undefined : source, state: 'saved' };
  };

  const cloudParameters = cloud ? getCloudLensParameters(cloud, lensKey) : undefined;
  const current = getCurrent(lensKey);
  const isSynced = Boolean(cloudParameters) && isSameLensParameters(cloudParameters!, current);

  /** The shown lens, every edited lens, and the default lens when it has no data of its own. */
  const getProfilesToSave = (): Array<FullLensParameters & LensProfileKey> => {
    const toSave = [lensKey];
    const add = (key: LensProfileKey) => {
      if (!toSave.some((k) => isSameLensProfileKey(k, key))) toSave.push(key);
    };

    keys.filter(isEdited).forEach(add);

    if (resolveLensProfile(base, effectiveDefaultKey).source !== 'exact') add(effectiveDefaultKey);

    return toSave.map((key) => ({ ...key, ...getCurrent(key) }));
  };

  const profilesToSave = getProfilesToSave();
  const invalidProfiles = profilesToSave.filter((p) => hasLensParameterErrors(validateLensParameters(p, p.workarea)));
  const issues: LensParameterIssues = validateLensParameters(current, lensKey.workarea);

  /** Every lens that will hold its own values after saving: the ones being saved and those saved before. */
  const getSaveWarnings = (): LensParameterWarning[] =>
    [
      ...profilesToSave,
      ...keys
        .filter(
          (key) =>
            resolveLensProfile(base, key).source === 'exact' &&
            !profilesToSave.some((p) => isSameLensProfileKey(p, key)),
        )
        .map((key) => ({ ...key, ...getCurrent(key) })),
    ]
      .sort(
        (a, b) => keys.findIndex((k) => isSameLensProfileKey(k, a)) - keys.findIndex((k) => isSameLensProfileKey(k, b)),
      )
      .flatMap((p) =>
        getLensParameterWarnings(validateLensParameters(p, p.workarea)).map((issue) => ({
          ...issue,
          key: { innerEngraving: p.innerEngraving, workarea: p.workarea },
        })),
      );

  /** Saves locally; `includeLegacy` tells whether the default profile, kept in the legacy format, changed. */
  const save = (): { includeLegacy: boolean; store: PromarkStore } => {
    const includeLegacy =
      !store.defaultLensProfile ||
      !isSameLensProfileKey(store.defaultLensProfile, effectiveDefaultKey) ||
      profilesToSave.some((p) => isSameLensProfileKey(p, effectiveDefaultKey));

    return { includeLegacy, store: saveLensProfiles(serial, profilesToSave, effectiveDefaultKey) };
  };

  return {
    applyCloudParameters: () => {
      if (cloudParameters) {
        setDrafts((prev) => ({ ...prev, [getLensProfileId(lensKey)]: withDefaultParameters(cloudParameters) }));
      }
    },
    canUseCloud: isCloudChecked && Boolean(cloudParameters) && !isSynced,
    changeLens: setLensKey,
    field: current.field,
    galvoParameters: current.galvoParameters,
    getSaveWarnings,
    invalidProfiles: invalidProfiles.map(({ innerEngraving, workarea }) => ({ innerEngraving, workarea })),
    isDefault: isSameLensProfileKey(effectiveDefaultKey, lensKey),
    issues,
    isSynced,
    lensKey,
    redDot: current.redDot,
    save,
    setAsDefault: () => setDefaultKey(lensKey),
    setField,
    setGalvoParameters,
    setRedDot,
    status: getStatus(lensKey),
  };
};
