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

// TODO(rollout): other regions once their catalog content (photography + shop links) is ready
export const checkMaterialBrowser = (): boolean =>
  isDev() || localeHelper.isTwOrHk || window?.localStorage?.getItem('enableMaterialBrowser') === 'true';
