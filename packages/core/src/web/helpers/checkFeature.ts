import type { MaterialRegion } from '@core/interfaces/IMaterial';

import isDev from './is-dev';
import isWeb from './is-web';
import localeHelper from './locale-helper';

const enableAllMachines = window?.localStorage?.getItem('enableAllMachines') === 'true';

export const checkFpm1 = (): boolean => !isWeb();
export const checkBM24C = (): boolean => isDev() || localeHelper.isTwOrHk;
// TODO: Can be removed after we move all testing machine to fuv1
export const checkBM2UV = (): boolean => isDev();
export const checkBM2CurveEngraving = (): boolean => isDev();
export const checkFUV1 = (): boolean => enableAllMachines || isDev();

/**
 * Regions the Material Browser is rolled out to. Add a region here once its catalog
 * content (photography + shop links) is ready; the Preferences region picker appears
 * automatically once more than one is listed.
 */
export const materialBrowserRegions: Array<Exclude<MaterialRegion, 'global'>> = ['tw'];

const localeInRegion: Record<Exclude<MaterialRegion, 'global'>, () => boolean> = {
  eu: () => localeHelper.isEu,
  jp: () => localeHelper.isJp,
  tw: () => localeHelper.isTwOrHk,
  us: () => localeHelper.isNorthAmerica,
};

export const checkMaterialBrowser = (): boolean =>
  isDev() ||
  window?.localStorage?.getItem('dev-material-browser') === 'true' ||
  materialBrowserRegions.some((region) => localeInRegion[region]());
