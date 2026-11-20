import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import { describeLensProfileKey } from '@core/app/components/dialogs/promark/useLensProfiles';
import { LaserType } from '@core/app/constants/promark-constants';
import i18n from '@core/helpers/i18n';
import type { LensProfileKey } from '@core/interfaces/Promark';

import { getDocumentLensProfileKey, isSameLensProfileKey } from './lens-profiles';
import promarkDataStore from './promark-data-store';

/**
 * Before the dashboard reruns the cached task: the task was generated for `cachedKey`, which is the
 * lens the monitor sends before it starts the task. When the current document asks for another lens,
 * asks which one to run with.
 *
 * The cached task is never changed: its key is the only record of the lens the task was generated
 * for. The answer is the lens for this run, which the caller hands to the monitor on a copy.
 *
 * @returns false when the user cancels, otherwise the lens to run with (none when the task has none)
 */
export const confirmCachedTaskLensProfile = async (
  serial: string,
  cachedKey?: LensProfileKey,
): Promise<false | { lensProfileKey?: LensProfileKey }> => {
  if (!cachedKey) return {};

  const store = promarkDataStore.get(serial);
  const info = store.info ?? { laserType: LaserType.Desktop, watt: 20 };
  const documentKey = getDocumentLensProfileKey(info);

  if (isSameLensProfileKey(cachedKey, documentKey)) return { lensProfileKey: cachedKey };

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

  return { lensProfileKey: choice === 'document' ? documentKey : cachedKey };
};

/**
 * The cached task as the monitor should run it: a copy carrying the lens picked for this run (see
 * `confirmCachedTaskLensProfile`). The cached task itself keeps the lens it was generated for.
 *
 * @returns false when the user cancels; undefined when there is no cached task to rerun
 */
export const prepareCachedTaskRerun = async <T extends { lensProfileKey?: LensProfileKey }>(
  serial: string,
  cachedTask?: T,
): Promise<false | T | undefined> => {
  const choice = await confirmCachedTaskLensProfile(serial, cachedTask?.lensProfileKey);

  if (!choice) return false;

  return cachedTask && { ...cachedTask, lensProfileKey: choice.lensProfileKey };
};
