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
 * HEXA II is a machine under development, and the two halves of that are asked separately: whether
 * the model exists at all, and whether the scaffolding built around it while it is measured is on.
 * Neither follows `dev`, so an unrelated dev session is not made to carry a machine being brought up
 * -- a permanent panel, a boundary read from a machine that is not there -- and so the scaffolding
 * can be switched off on a machine that is otherwise fully enabled.
 *
 * Set from the console: `localStorage['fhx2galvo-enable'] = 'true'`.
 */
export const checkHexa2Galvo = (): boolean => window?.localStorage?.getItem('fhx2galvo-enable') === 'true';

/**
 * The development-period extras for HEXA II: panels that write machine settings, the travel range
 * read off the machine, the manual galvo controls. Independent of checkHexa2Galvo on purpose -- the
 * machine can be used without them. `localStorage['fhx2galvo-dev'] = 'true'`.
 */
export const checkHexa2GalvoDev = (): boolean => window?.localStorage?.getItem('fhx2galvo-dev') === 'true';
