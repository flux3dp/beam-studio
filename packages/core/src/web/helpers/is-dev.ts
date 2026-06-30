// manage dev mode feature flag here, so we can easily turn it off for production
const isDev = (): boolean => window?.localStorage?.getItem('dev') === 'true';

export default isDev;

// This is for local development, should remove before release
export const isRetailDev = (): boolean => window?.localStorage?.getItem('retailDev') === 'true';
export const useFalse = () => false; // TODO: check this
export const mockT = (key: string): string => key; // TODO: change to real implementation
export const fixme = (str: string) => console.debug(str);
