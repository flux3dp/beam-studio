import type { AutoFitContour } from '@core/interfaces/IAutoFit';

interface DataCache {
  data?: AutoFitContour[][];
  removedBgData?: AutoFitContour[][];
  removedBgImageUrl?: string;
  url: string;
}

export const dataCache: DataCache = { url: '' };

export const setDataCache = (newCache: DataCache): void => {
  if (dataCache.removedBgImageUrl && dataCache.removedBgImageUrl !== newCache.removedBgImageUrl) {
    URL.revokeObjectURL(dataCache.removedBgImageUrl);
  }

  Object.assign(dataCache, { data: undefined, removedBgData: undefined, removedBgImageUrl: undefined, ...newCache });
};
