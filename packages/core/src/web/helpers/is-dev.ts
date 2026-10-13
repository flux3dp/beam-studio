// manage dev mode feature flag here, so we can easily turn it off for production
const isDev = (): boolean => window?.localStorage?.getItem('dev') === 'true';

// Note: This is a dev feature, update UI (entrance icon and position) and display names in ParamsLabelSettings before release
export const isParamsLabelDev = (): boolean => window?.localStorage?.getItem('params-label-dev') === 'true';

export default isDev;

// Promark UV tuning and in-development 3D tools, kept out of the general dev mode that already unlocks UV itself
export const isUvDev = (): boolean => window?.localStorage?.getItem('uvDev') === 'true';
export const mockT = (key: string) => key;
