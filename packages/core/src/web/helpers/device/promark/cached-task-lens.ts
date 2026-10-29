import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import { describeLensProfileKey } from '@core/app/components/dialogs/promark/useLensProfiles';
import { LaserType } from '@core/app/constants/promark-constants';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import type { LensProfileKey } from '@core/interfaces/Promark';

import { getDocumentLensProfileKey, isSameLensProfileKey, resolveLensProfile } from './lens-profiles';
import promarkDataStore from './promark-data-store';

/**
 * Before the dashboard reruns the cached task: `select` has applied the current document's lens, but
 * the task was generated for `cachedKey`. When they differ, asks which lens to apply and applies the
 * cached one if picked. Resolves false when the user cancels.
 */
export const confirmCachedTaskLensProfile = async (serial: string, cachedKey?: LensProfileKey): Promise<boolean> => {
  if (!cachedKey) return true;

  const store = promarkDataStore.get(serial);
  const info = store.info ?? { laserType: LaserType.Desktop, watt: 20 };
  const documentKey = getDocumentLensProfileKey(info);

  if (isSameLensProfileKey(cachedKey, documentKey)) return true;

  const t = i18n.lang.promark_settings;
  const choice = await new Promise<'cached' | 'cancel' | 'document'>((resolve) => {
    alertCaller.popUp({
      buttonLabels: [t.use_cached_lens_parameters, t.use_document_lens_parameters, i18n.lang.alert.cancel],
      callbacks: [() => resolve('cached'), () => resolve('document'), () => resolve('cancel')],
      id: 'cached-task-lens-mismatch',
      message: sprintf(
        t.cached_task_lens_mismatch,
        describeLensProfileKey(cachedKey, info.laserType, t),
        describeLensProfileKey(documentKey, info.laserType, t),
      ),
      messageIcon: 'warning',
      onClose: () => resolve('cancel'),
      primaryButtonIndex: 0,
    });
  });

  if (choice === 'cancel') return false;

  if (choice === 'cached') {
    const { field, galvoParameters, source } = resolveLensProfile(store, cachedKey, info.laserType);

    console.log('Applying lens profile of the cached task', cachedKey, source);
    await deviceMaster.setField(cachedKey.workarea, field);

    if (galvoParameters) await deviceMaster.setGalvoParameters(galvoParameters);
  }

  return true;
};
