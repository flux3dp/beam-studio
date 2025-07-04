import isDev from './is-dev';
import isWeb from './is-web';
import localeHelper from './locale-helper';

export const checkFpm1 = (): boolean =>
  (localeHelper.isTwOrHk ||
    localeHelper.isMy ||
    localeHelper.isPs ||
    localeHelper.isJp ||
    localeHelper.isKr ||
    isDev()) &&
  !isWeb();
export const checkHxRf = (): boolean => isDev();
export const checkBM2 = (): boolean => isDev(); // TODO: release to kol
export const checkBM2UV = (): boolean => isDev();
