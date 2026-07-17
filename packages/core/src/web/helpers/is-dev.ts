// manage dev mode feature flag here, so we can easily turn it off for production
const isDev = (): boolean => window?.localStorage?.getItem('dev') === 'true';

// export const isTaskConfigDev = (): boolean => window?.localStorage?.getItem('task-config-dev') === 'true';
export const isTaskConfigDev = (): boolean => true;

export default isDev;
