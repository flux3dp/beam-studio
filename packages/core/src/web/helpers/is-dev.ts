// manage dev mode feature flag here, so we can easily turn it off for production
const isDev = (): boolean => window?.localStorage?.getItem('dev') === 'true';

// Note: This is a dev feature, update UI (entrance icon and position) and display names in ParamsLabelSettings before release
export const isParamsLabelDev = (): boolean => window?.localStorage?.getItem('params-label-dev') === 'true';

export default isDev;
