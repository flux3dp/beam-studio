import isDev from './is-dev';
import isWeb from './is-web';
import localeHelper from './locale-helper';

export const checkFbb2 = (): boolean => localeHelper.isTwOrHk || localeHelper.isJp || isDev();
export const checkFbb2AutoFeeder = (): boolean => isDev();
export const checkFpm1 = (): boolean => (localeHelper.isTwOrHk || isDev()) && !isWeb();
export const checkChuckRotary = (): boolean => localeHelper.isTwOrHk || isDev();
