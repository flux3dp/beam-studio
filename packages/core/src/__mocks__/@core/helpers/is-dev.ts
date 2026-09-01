const isDev = () => true;

export const isParamsLabelDev = jest.fn(() => false);

export default isDev;

// keep in sync with helpers/is-dev.ts: modules call these at import time (e.g. `todo()` in
// svgedit/stl/constants.ts), so a missing export breaks the whole spec file rather than one test
export const isUvDev = () => true;
export const showDevMsg = () => false;
export const allowWebSwiftray = () => true;
export const supportSwiftray = () => true;
export const mockT = (key: string) => key;
export const todo = () => {};
