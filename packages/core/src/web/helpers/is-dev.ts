// manage dev mode feature flag here, so we can easily turn it off for production
const isDev = (): boolean => window?.localStorage?.getItem('dev') === 'true';

// Note: This is a dev feature, update UI (entrance icon and disabled options) and i18n before release
// export const isTaskConfigDev = (): boolean => window?.localStorage?.getItem('task-config-dev') === 'true';
export const isTaskConfigDev = (): boolean => true;

export default isDev;
