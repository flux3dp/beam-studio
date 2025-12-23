import isDev from './is-dev';
import isWeb from './is-web';
import localeHelper from './locale-helper';

const enableAllMachines = window?.localStorage?.getItem('enableAllMachines') === 'true';

export const checkFpm1 = (): boolean =>
  (localeHelper.isTwOrHk ||
    localeHelper.isMy ||
    localeHelper.isPs ||
    localeHelper.isJp ||
    localeHelper.isKr ||
    localeHelper.isAu ||
    localeHelper.isAr ||
    enableAllMachines ||
    isDev()) &&
  !isWeb();
export const checkHxRf = (): boolean => enableAllMachines || isDev();
export const checkBM2 = (): boolean => enableAllMachines || isDev() || localeHelper.isTwOrHk;
export const checkBM2UV = (): boolean => isDev();
export const checkBM2CurveEngraving = (): boolean => isDev();
