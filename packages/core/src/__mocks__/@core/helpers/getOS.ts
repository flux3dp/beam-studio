import type { OSName } from '@core/helpers/getOS';

let mockOS: OSName = 'others';

export const __setMockOS = (os: OSName) => {
  mockOS = os;
};

export const getOS = (): OSName => mockOS;

export default {
  getOS,
};
