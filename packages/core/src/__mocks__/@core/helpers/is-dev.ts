const isDev = () => true;

export const isParamsLabelDev = jest.fn(() => false);

export default isDev;

// Keep in sync with helpers/is-dev.ts so modules can safely call flags at import time.
export const isUvDev = () => true;
export const isUvDev2 = () => true;
export const mockT = (key: string) => key;
