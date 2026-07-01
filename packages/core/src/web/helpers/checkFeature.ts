import isDev from './is-dev';
import isWeb from './is-web';
import localeHelper from './locale-helper';

const enableAllMachines = window?.localStorage?.getItem('enableAllMachines') === 'true';

export const checkFpm1 = (): boolean => !isWeb();
export const checkHxRf = (): boolean => {
  if (enableAllMachines || isDev() || localeHelper.isTwOrHk) return true;

  const now = Date.now();

  // Staged rollout: EU from 2026/8/4, USA from 2026/8/15, all users from 2026/9/1
  if (now >= new Date('2026/9/1').valueOf()) return true;

  if (localeHelper.isEu && now >= new Date('2026/8/4').valueOf()) return true;

  if (localeHelper.isNorthAmerica && now >= new Date('2026/8/15').valueOf()) return true;

  return false;
};
export const checkBM2 = (): boolean =>
  enableAllMachines || isDev() || localeHelper.isTwOrHk || localeHelper.isJp || localeHelper.isPs || localeHelper.isIl;
// TODO: Can be removed after we move all testing machine to fuv1
export const checkBM2UV = (): boolean => isDev();
export const checkBM2CurveEngraving = (): boolean => isDev();
export const checkFUV1 = (): boolean => enableAllMachines || isDev();
