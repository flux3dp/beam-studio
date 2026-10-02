import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { checkMaterialBrowser } from '@core/helpers/checkFeature';

/**
 * Single gate for every old-UI/new-UI branch point: the feature must be rolled out
 * to this user (checkFeature) AND not switched back off in Preferences.
 */
export const isMaterialBrowserActive = (): boolean =>
  checkMaterialBrowser() && useGlobalPreferenceStore.getState()['use-material-browser'];

/** Reactive flavor for components: re-renders when the preference flips */
export const useIsMaterialBrowserActive = (): boolean =>
  useGlobalPreferenceStore((state) => state['use-material-browser']) && checkMaterialBrowser();
