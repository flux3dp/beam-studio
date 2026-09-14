import { getOS } from '@core/helpers/getOS';
import isWeb from '@core/helpers/is-web';

// manage dev mode feature flag here, so we can easily turn it off for production
const isDev = (): boolean => window?.localStorage?.getItem('dev') === 'true';

// Note: This is a dev feature, update UI (entrance icon and position) and display names in ParamsLabelSettings before release
export const isParamsLabelDev = (): boolean => window?.localStorage?.getItem('params-label-dev') === 'true';

export default isDev;

export const isUvDev = (): boolean => window?.localStorage?.getItem('uvDev') === 'true';
// Alpha-only test and demonstration features. Keep separate so they can be removed before release.
export const isUvDev2 = (): boolean => window?.localStorage?.getItem('uvDev') === 'true';
export const supportSwiftray = () => (!isWeb() || isDev()) && getOS() !== 'Linux';
export const mockT = (key: string) => key;
