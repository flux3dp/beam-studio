import type { AutoFitContour } from '@core/interfaces/IAutoFit';

export let dataCache: {
  data?: AutoFitContour[][];
  removedBgData?: AutoFitContour[][];
  removedBgImageUrl?: string;
  url: string;
} = { url: '' };

export const setDataCache = (newCache: typeof dataCache): void => {
  dataCache = newCache;
};
