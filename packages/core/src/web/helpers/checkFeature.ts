import isDev from './is-dev';

export const checkFbb2AutoFeeder = (): boolean => isDev();
export const checkFpm1 = (): boolean => true;
export const checkHxRf = (): boolean => isDev();
