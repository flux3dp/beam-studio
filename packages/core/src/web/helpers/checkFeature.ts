import isDev, { isUvDev, supportSwiftray } from './is-dev';
import localeHelper from './locale-helper';

const enableAllMachines = window?.localStorage?.getItem('enableAllMachines') === 'true';

export const checkFpm1 = (): boolean => supportSwiftray();
export const checkFpm1UV = (): boolean => supportSwiftray() && (enableAllMachines || isUvDev());
export const checkHxRf = (): boolean => enableAllMachines || isDev() || localeHelper.isTwOrHk;
export const checkBM2 = (): boolean =>
  enableAllMachines || isDev() || localeHelper.isTwOrHk || localeHelper.isJp || localeHelper.isPs || localeHelper.isIl;
// TODO: Can be removed after we move all testing machine to fuv1
export const checkBM2UV = (): boolean => isDev();
export const checkBM2CurveEngraving = (): boolean => isDev();
export const checkFUV1 = (): boolean => enableAllMachines || isDev();
