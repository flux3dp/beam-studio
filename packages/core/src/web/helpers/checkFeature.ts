import isDev from './is-dev';
import isWeb from './is-web';
import localeHelper from './locale-helper';

const enableAllMachines = window?.localStorage?.getItem('enableAllMachines') === 'true';

export const checkFpm1 = (): boolean => !isWeb();

/** Promark UV opens in every region on this day, local time; Taiwan and Palestine have it before. */
const FPM1_UV_RELEASE = new Date(2027, 0, 1);

export const checkFpm1UV = (): boolean =>
  !isWeb() &&
  (enableAllMachines || isDev() || localeHelper.isTw || localeHelper.isPs || Date.now() >= FPM1_UV_RELEASE.getTime());
export const checkBM24C = (): boolean => isDev() || localeHelper.isTwOrHk;
// TODO: Can be removed after we move all testing machine to fuv1
export const checkBM2UV = (): boolean => isDev();
export const checkBM2CurveEngraving = (): boolean => isDev();
export const checkFUV1 = (): boolean => enableAllMachines || isDev();
