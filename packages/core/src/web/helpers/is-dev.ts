import { getOS } from '@core/helpers/getOS';
import isWeb from '@core/helpers/is-web';

// manage dev mode feature flag here, so we can easily turn it off for production
const isDev = (): boolean => window?.localStorage?.getItem('dev') === 'true';

export default isDev;

export const uvModel = 'fpm1uv' as const;
export const isUvDev = (): boolean => window?.localStorage?.getItem('uvDev') === 'true';
export const showDevMsg = (): boolean => window?.localStorage?.getItem('devMsg') === 'true';
export const allowWebSwiftray = (): boolean => true;
export const supportSwiftray = () => (allowWebSwiftray() || !isWeb() || isDev()) && getOS() !== 'Linux';
export const mockT = (key: string) => key;
export const todo = (msg: string) => console.warn(`TODO: ${msg}`);
// esther ask/TODO: 這種形式的內容在 PR 前要處理掉
// 另外，在 PR 前要移除 /TODO*/md
