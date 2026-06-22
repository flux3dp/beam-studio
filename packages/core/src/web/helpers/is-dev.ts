import { getOS } from '@core/helpers/getOS';
import isWeb from '@core/helpers/is-web';

// manage dev mode feature flag here, so we can easily turn it off for production
const isDev = (): boolean => window?.localStorage?.getItem('dev') === 'true';

export default isDev;

export const uvModel = 'fpm1uv' as const;
export const isUvDev = (): boolean => window?.localStorage?.getItem('uvDev') === 'true';
export const allowWebSwiftray = (): boolean => true;
export const supportSwiftray = () => (allowWebSwiftray() || !isWeb() || isDev()) && getOS() !== 'Linux';
export const mockT = (key: string) => key;
